import { PushNotificationSender } from "../../src/PushNotification/PushNotificationSender";
import { setupWithAllDbs, tearDownWithAllDbs } from "../utils";
import { Container } from "inversify";
import { Recipient } from "../../src/Recipient/Models/Recipient";
import * as sinon from "sinon";
import * as moment from "moment-timezone";
import { SinonFakeTimers } from "sinon";
import { Moment } from "moment-timezone";
import { Message } from "../../src/Entity/Message";
import { expect } from "chai";

const createMessage = (recipientId: string) => {
    const message = new Message();
    message.title = "Pretty nice title";
    message.body = "This is message body!";
    message.priority = "high";
    message.recipientId = recipientId;
    message.data = { notificationData: { slugs: ["#slug1"] } };
    message.expirationTime = moment()
        .add(1, "day")
        .toDate();
    return message;
};

describe("PushNotificationSender", () => {
    let sender: PushNotificationSender;
    let container: Container;
    let clock: SinonFakeTimers;
    let now: Moment;

    beforeEach(async () => {
        container = await setupWithAllDbs();
        sender = container.get<PushNotificationSender>(PushNotificationSender);
        now = moment();

        clock = sinon.useFakeTimers(now.toDate());
    });

    afterEach(async () => {
        clock.restore();
        await tearDownWithAllDbs(container);
    });

    it("should update recipient notification time", async () => {
        const device = { pushToken: "Token[1241241xam12]", createdAt: moment() };
        const recipient = new Recipient("#r1", "Alex", [device]);
        const recipients = [recipient];

        const messages = [createMessage(recipient.id)];

        clock.tick(1000);

        // when
        await sender.schedule(recipients, messages);

        // then
        const expected = moment(now)
            .add(1000, "ms")
            .toISOString();
        expect(recipient.lastNotificationTime).not.to.be.undefined;
        expect(recipient.lastNotificationTime.toISOString()).to.equal(expected);
    });
});
