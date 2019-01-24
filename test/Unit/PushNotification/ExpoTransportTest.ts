import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import { expect } from "chai";
import { ExpoTransport } from "../../../src/PushNotification/ExpoTransport";
import { PushNotification } from "../../../src/Entity/PushNotification";
import Expo from "expo-server-sdk";
import { Message } from "../../../src/Entity/Message";
import { toArray } from "../../../src/utils";
import { PushNotificationStatus } from "../../../src/PushNotification/PushNotificationReceipt";
import { setup } from "../../utils";

const createPushNotification = (
    message: Message,
    token: string,
    status: number,
    receiptId?: string,
): PushNotification => {
    const notification = new PushNotification();
    notification.status = status;
    notification.pushToken = token;
    notification.message = message;
    notification.receiptId = receiptId;
    return notification;
};

describe("ExpoTransport", () => {
    let expoClient: SinonStubbedInstance<Expo>;

    beforeEach(() => {
        setup();
        expoClient = sinon.createStubInstance(Expo);
    });

    describe("sending pushes", () => {
        let message: Message;
        let pushNotification: PushNotification;

        beforeEach(() => {
            message = new Message();
            message.title = "Pretty nice title";
            message.body = "This is message body!";
            message.priority = "high";
            message.data = { notificationData: { slugs: ["#slug1"] } };

            pushNotification = createPushNotification(message, "PUSH_TOKEN1", 0);
        });

        it("should send push notification asynchronously", async () => {
            // given
            expoClient.sendPushNotificationsAsync.returns([{ id: "receipt#1" }]);
            const transport = new ExpoTransport(expoClient);

            // when
            const ticket = await transport.send(pushNotification);

            // then
            const expectedExpoPush = {
                to: pushNotification.pushToken,
                title: message.title,
                body: message.body,
                data: message.data.notificationData,
                expiration: null,
                priority: message.priority,
            };

            expect(expoClient.sendPushNotificationsAsync).to.have.been.calledOnceWith([
                expectedExpoPush,
            ]);
            expect(ticket.sentSuccessfully).to.be.true;
            expect(ticket.notification).to.equal(pushNotification);
            expect(ticket.receiptId).to.equal("receipt#1");
        });

        it("should return failed ticket in case of exception", async () => {
            // given
            expoClient.sendPushNotificationsAsync.throws(new Error());

            const transport = new ExpoTransport(expoClient);

            // when
            const ticket = await transport.send(pushNotification);

            // then
            expect(ticket.sentSuccessfully).to.be.false;
            expect(ticket.notification).to.equal(pushNotification);
        });

        it("should send chunks in case of many notifications", async () => {
            // given
            const chunk = [{ to: "PUSH_TOKEN1" }, { to: "PUSH_TOKEN2" }];
            const chunks = [chunk];
            const receiptId = "RECEIPT_ID";

            expoClient.chunkPushNotifications.returns(chunks);
            expoClient.sendPushNotificationsAsync.returns([{ id: receiptId }, { id: receiptId }]);

            const transport = new ExpoTransport(expoClient);

            const notification1 = pushNotification;
            const notification2 = createPushNotification(message, "PUSH_TOKEN2", 0);

            const notifications = [notification1, notification2];

            // when
            const tickets = await toArray(transport.sendMany(notifications));

            // then
            const expectedPush1 = {
                to: notification1.pushToken,
                title: message.title,
                body: message.body,
                data: message.data.notificationData,
                expiration: null,
                priority: message.priority,
            };
            const expectedPush2 = {
                to: notification2.pushToken,
                title: message.title,
                body: message.body,
                data: message.data.notificationData,
                expiration: null,
                priority: message.priority,
            };

            expect(expoClient.chunkPushNotifications).to.have.been.calledWith([
                expectedPush1,
                expectedPush2,
            ]);
            expect(expoClient.sendPushNotificationsAsync).to.have.been.calledOnceWith(chunk);
            expect(tickets.length).to.equal(2);
            expect(tickets.map(t => t.sentSuccessfully)).to.deep.equal([true, true]);
            expect(tickets.map(t => t.receiptId)).to.deep.equal([receiptId, receiptId]);
        });
    });

    describe("confirming push statuses", () => {
        let message: Message;
        let pushNotification: PushNotification;

        beforeEach(() => {
            message = new Message();
            message.title = "Pretty nice title";
            message.body = "This is message body!";
            message.priority = "high";

            pushNotification = createPushNotification(message, "PUSH_TOKEN1", 1, "receipt#1");
        });

        it("should send chunks of receiptIds", async () => {
            // given
            const chunk1 = ["receipt#1", "receipt#2"];
            const chunk2 = ["receipt#3"];
            const chunks = [chunk1, chunk2];
            const returnedReceipts1 = {
                "receipt#1": { status: "ok", details: { time: "xxx" } },
                "receipt#2": { status: "error", details: { error: "yyy" } },
            };
            const returnedReceipts2 = {
                "receipt#3": { status: "ok", details: { time: "zzz" } },
            };
            const returnedReceipts = { ...returnedReceipts1, ...returnedReceipts2 };
            expoClient.chunkPushNotificationReceiptIds.returns(chunks);
            expoClient.getPushNotificationReceiptsAsync.onCall(0).returns(returnedReceipts1);
            expoClient.getPushNotificationReceiptsAsync.onCall(1).returns(returnedReceipts2);

            const transport = new ExpoTransport(expoClient);

            const notification1 = pushNotification;
            const notification2 = createPushNotification(message, "PUSH_TOKEN2", 1, "receipt#2");
            const notification3 = createPushNotification(message, "PUSH_TOKEN3", 1, "receipt#3");
            const notifications = [notification1, notification2, notification3];

            // when
            const receipts = await toArray(transport.confirmStatuses(notifications));

            // then
            expect(expoClient.chunkPushNotificationReceiptIds).to.have.been.calledOnceWith([
                "receipt#1",
                "receipt#2",
                "receipt#3",
            ]);
            expect(expoClient.getPushNotificationReceiptsAsync).to.have.been.calledWith([
                "receipt#1",
                "receipt#2",
            ]);
            expect(expoClient.getPushNotificationReceiptsAsync).to.have.been.calledWith([
                "receipt#3",
            ]);
            expect(receipts).to.be.lengthOf(3);
            expect(receipts.map(r => r.notification)).to.deep.equal(notifications);
            expect(receipts.map(r => r.fetchedSuccessfully)).to.deep.equal([true, true, true]);
            expect(receipts.map(r => r.status)).to.deep.equal([
                PushNotificationStatus.DELIVERED,
                PushNotificationStatus.ERROR,
                PushNotificationStatus.DELIVERED,
            ]);
            expect(receipts.map(r => r.data)).to.deep.equal(Object.values(returnedReceipts));
        });

        it("should return failed receipt in case of exception", async () => {
            // given
            const chunk = [pushNotification.receiptId];
            const chunks = [chunk];
            expoClient.chunkPushNotificationReceiptIds.returns(chunks);
            expoClient.getPushNotificationReceiptsAsync.throws(new Error());

            const transport = new ExpoTransport(expoClient);

            // when
            const receipts = await toArray(transport.confirmStatuses([pushNotification]));

            // then
            expect(receipts).to.be.lengthOf(1);
            expect(receipts[0].fetchedSuccessfully).to.be.false;
            expect(receipts[0].notification).to.deep.equal(pushNotification);
        });
    });
});
