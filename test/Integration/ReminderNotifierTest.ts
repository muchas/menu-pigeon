import { ReminderNotifier } from "../../src/Reminder/ReminderNotifier";
import { setupWithAllDbs, tearDownWithAllDbs } from "../utils";
import { Container } from "inversify";
import { RecipientRepository } from "../../src/Interfaces/RecipientRepository";
import { Recipient, RecipientPreferences } from "../../src/Recipient/models/Recipient";
import * as moment from "moment-timezone";
import { Moment } from "moment-timezone";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { RecipientDevice } from "../../src/Recipient/models/RecipientDevice";
import { RecipientMongoRepository } from "../../src/Recipient/repositories/RecipientMongoRepository";
import { expect } from "chai";
import * as sinon from "sinon";
import { SinonFakeTimers } from "sinon";

const makeRecipient = (
    id: string,
    lastNotified: Moment,
    preference: NotificationLevel = NotificationLevel.Daily,
    createdAt: Moment = moment(),
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

describe("ReminderNotifier", () => {
    let container: Container;
    let reminderNotifier: ReminderNotifier;
    let recipientRepository: RecipientRepository;
    let now: Moment;
    let clock: SinonFakeTimers;

    beforeEach(async () => {
        container = await setupWithAllDbs();

        now = moment()
            .day(1)
            .hour(11)
            .minutes(30); // Monday

        clock = sinon.useFakeTimers(now.toDate());

        recipientRepository = container.get(RecipientMongoRepository);
        reminderNotifier = container.get(ReminderNotifier);
    });

    afterEach(async () => {
        clock.restore();
        await tearDownWithAllDbs(container);
    });

    it("should update recipient last notification time", async () => {
        // given
        const twoWeeksAgo = moment(now).subtract(14, "day");
        await recipientRepository.add(
            makeRecipient("r#1", twoWeeksAgo, NotificationLevel.Daily, twoWeeksAgo),
        );

        // when
        await reminderNotifier.notifyRareRecipients();

        // then
        const recipient = await recipientRepository.findOne("r#1");
        expect(recipient.lastNotificationTime).not.to.be.undefined;
        expect(recipient.lastNotificationTime.toISOString()).to.be.equal(now.toISOString());
    });
});
