import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import { expect } from "chai";
import { setup } from "../../utils";
import { ReminderNotifier } from "../../../src/Reminder/ReminderNotifier";
import { PushNotificationSender } from "../../../src/PushNotification/services/PushNotificationSender";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/models/Recipient";
import { RecipientDevice } from "../../../src/Recipient/models/RecipientDevice";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { RecipientMongoRepository } from "../../../src/Recipient/repositories/RecipientMongoRepository";
import { Moment } from "moment-timezone";
import * as moment from "moment-timezone";
import { ReminderMessageFactory } from "../../../src/Reminder/ReminderMessageFactory";

const makeRecipient = (
    id,
    lastNotified,
    createdAt = moment(),
    preference = NotificationLevel.Daily,
): Recipient =>
    new Recipient(
        id,
        `Johny ${id}`,
        [new RecipientDevice(`token-${id}`, lastNotified)],
        new RecipientPreferences(9, 0, preference),
        new Set(["1"]),
        new Map([["topic1", lastNotified]]),
        new Map([["topic1", lastNotified]]),
        lastNotified,
        createdAt,
    );

describe("ReminderNotifierTest", () => {
    let now: Moment;
    let reminderNotifier: ReminderNotifier;
    let recipientRepository: SinonStubbedInstance<RecipientMongoRepository>;
    let pushNotificationSender: SinonStubbedInstance<PushNotificationSender>;

    beforeEach(() => {
        setup();

        now = moment()
            .day(1)
            .hour(11)
            .minutes(30); // Monday

        recipientRepository = sinon.createStubInstance(RecipientMongoRepository);
        pushNotificationSender = sinon.createStubInstance(PushNotificationSender);

        reminderNotifier = new ReminderNotifier(
            recipientRepository as any,
            pushNotificationSender as any,
            new ReminderMessageFactory(),
        );
    });

    it("should notify recipients that did not hear any message for at least 2 weeks", async () => {
        // given
        const monthAgo = moment().subtract(30, "day");
        const twoWeeksAgo = moment(now).subtract(14, "day");

        const justBeforeTwoWeeksAgo = moment(twoWeeksAgo).add(1, "minute");
        const justAfterTwoWeeksAgo = moment(twoWeeksAgo).subtract(1, "minute");

        const recipient1 = makeRecipient("r#1", twoWeeksAgo, monthAgo);
        const recipient2 = makeRecipient("r#2", justBeforeTwoWeeksAgo, monthAgo);
        const recipient3 = makeRecipient("r#3", justAfterTwoWeeksAgo, monthAgo);
        const recipients = [recipient1, recipient2, recipient3];
        recipientRepository.findAndLockAll.resolves(recipients);

        // when
        await reminderNotifier.notifyRareRecipients(now);

        // then
        expect(pushNotificationSender.schedule).to.be.calledOnce;
        const targetRecipients = pushNotificationSender.schedule.getCall(0).args[0];
        expect(targetRecipients.map(r => r.id)).to.deep.equal(["r#1", "r#3"]);
    });

    it("should not notify anyone from Friday to Sunday", async () => {
        // given
        const monthAgo = moment().subtract(30, "day");
        const friday = moment().day(-2);
        const saturday = moment().day(-1);
        const sunday = moment().day(0);
        const days = [friday, saturday, sunday];

        const recipient = makeRecipient("r#1", monthAgo, monthAgo);
        recipientRepository.findAndLockAll.resolves([recipient]);

        // when
        for (const day of days) {
            await reminderNotifier.notifyRareRecipients(day);
        }

        // then
        expect(pushNotificationSender.schedule).to.have.been.not.called;
    });

    it("should notify 2 weeks recipients that did not receive any message at all", async () => {
        // given
        const twoWeeksAgo = moment(now).subtract(14, "day");
        const recipient = new Recipient(
            "r#1",
            "John",
            [new RecipientDevice("token[apwokf]", moment())],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map(),
            undefined,
            twoWeeksAgo,
        );

        recipientRepository.findAndLockAll.resolves([recipient]);

        // when
        await reminderNotifier.notifyRareRecipients(now);

        // then
        const targetRecipients = pushNotificationSender.schedule.getCall(0).args[0];
        expect(targetRecipients.map(r => r.id)).to.deep.equal(["r#1"]);
    });

    it("should not break when no recipients available", async () => {
        // given
        recipientRepository.findAndLockAll.resolves([]);

        // when
        await reminderNotifier.notifyRareRecipients(now);

        // then
        expect(pushNotificationSender.schedule).to.have.been.calledOnceWithExactly([], []);
    });

    it("should not send to recipients with NEVER preference", async () => {
        const monthAgo = moment(now).subtract(30, "day");

        const recipient1 = makeRecipient("r#1", monthAgo, monthAgo, NotificationLevel.Seldom);
        const recipient2 = makeRecipient("r#2", monthAgo, monthAgo, NotificationLevel.Daily);
        const recipient3 = makeRecipient("r#3", monthAgo, monthAgo, NotificationLevel.Often);
        const recipient4 = makeRecipient("r#4", monthAgo, monthAgo, NotificationLevel.Never);
        const recipients = [recipient1, recipient2, recipient3, recipient4];
        recipientRepository.findAndLockAll.resolves(recipients);

        // when
        await reminderNotifier.notifyRareRecipients(now);

        // then
        const targetRecipients = pushNotificationSender.schedule.getCall(0).args[0];
        expect(targetRecipients.map(r => r.id)).to.deep.equal(["r#1", "r#2", "r#3"]);
    });

    it("should not send notifications outside of 11:15-12:00 interval", async () => {
        const monthAgo = moment(now).subtract(30, "day");

        const hours = [
            moment(now)
                .hour(7)
                .minutes(30),
            moment(now)
                .hour(11)
                .minutes(14),
            moment(now)
                .hour(12)
                .minutes(1),
            moment(now)
                .hour(15)
                .minutes(30),
            moment(now)
                .hour(0)
                .minutes(0),
        ];

        const recipient = makeRecipient("r#1", monthAgo, monthAgo, NotificationLevel.Seldom);
        recipientRepository.findAndLockAll.resolves([recipient]);

        // when
        for (const hour of hours) {
            await reminderNotifier.notifyRareRecipients(hour);
        }

        // then
        expect(pushNotificationSender.schedule).to.have.been.not.called;
    });

    it("should send notifications between 11:15-12:00 interval", async () => {
        const monthAgo = moment(now).subtract(30, "day");

        const hours = [
            moment(now)
                .hour(11)
                .minutes(15),
            moment(now)
                .hour(12)
                .minutes(0),
            moment(now)
                .hour(11)
                .minutes(30),
            moment(now)
                .hour(11)
                .minutes(40),
        ];

        const recipient = makeRecipient("r#1", monthAgo, monthAgo, NotificationLevel.Seldom);
        recipientRepository.findAndLockAll.resolves([recipient]);

        // when
        for (const hour of hours) {
            await reminderNotifier.notifyRareRecipients(hour);
        }

        // then
        expect(pushNotificationSender.schedule).to.have.callCount(4);
    });

    it("should not send notification to newly created recipients", async () => {
        // given
        const hour = moment(now)
            .hour(11)
            .minutes(30);

        const twoWeeksAgo = moment(now).subtract(14, "day");
        const justBeforeTwoWeeksAgo = moment(twoWeeksAgo).add(1, "minute");

        const recipients = [
            new Recipient(
                "r#1",
                `Johny`,
                [new RecipientDevice(`token-01`, moment())],
                new RecipientPreferences(9, 0, NotificationLevel.Often),
            ),
            new Recipient(
                "r#2",
                `Johny II`,
                [new RecipientDevice(`token-02`, moment())],
                new RecipientPreferences(9, 0, NotificationLevel.Often),
                new Set(),
                new Map(),
                new Map(),
                undefined,
                justBeforeTwoWeeksAgo,
            ),
        ];
        recipientRepository.findAndLockAll.resolves(recipients);

        // when
        await reminderNotifier.notifyRareRecipients(hour);

        // then
        expect(pushNotificationSender.schedule).to.have.callCount(1);
        const targetRecipients = pushNotificationSender.schedule.getCall(0).args[0];
        expect(targetRecipients.map(r => r.id)).to.deep.equal([]);
    });
});
