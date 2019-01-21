import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithDb, tearDownWithDb } from "../utils";
import { PushNotificationRepository } from "../../src/PushNotification/PushNotificationRepository";
import { Message } from "../../src/Entity/Message";
import { PushNotification } from "../../src/Entity/PushNotification";
import { PushNotificationStatus } from "../../src/PushNotification/PushNotificationReceipt";

const createMessage = (recipientId: string, topics: string[] = [], eventType= "default") => {
    const message = new Message();
    message.recipientId = recipientId;
    message.title = "Hej John, lunch dnia!";
    message.body = "Sprawdź szczegóły";
    message.priority = "default";
    message.expirationTime = new Date();
    message.setTopics(topics);
    message.setEventType(eventType);
    return message;
};

const createPushNotification = (message: Message,
                                token: string,
                                status: number,
                                receiptId?: string): PushNotification => {
    const notification = new PushNotification();
    notification.status = status;
    notification.pushToken = token;
    notification.message = message;
    notification.receiptId = receiptId;
    return notification;
};

describe("RecipientRepository test", () => {
    let container: Container;
    let notificationRepository: PushNotificationRepository;

    beforeEach(async () => {
        container = await setupWithDb();

        notificationRepository = container.get<PushNotificationRepository>(PushNotificationRepository);
    });

    afterEach(async () => {
        await tearDownWithDb(container);
    });

    it("should lock notifications fetched for sending", async () => {
        // given
        const message = createMessage("recipient#1", ["topic-#1"]);
        const notification1 = createPushNotification(message, "12412", PushNotificationStatus.SCHEDULED);
        const notification2 = createPushNotification(message, "12512", PushNotificationStatus.SCHEDULED);
        message.pushNotifications = [notification1, notification2];

        await notificationRepository.storeMessagesToSend([message]);

        // when
        const notifications = await notificationRepository.fetchForSending();
        const notificationsAfterLock = await notificationRepository.fetchForSending();

        // then
        expect(notifications).to.be.lengthOf(2);
        expect(notificationsAfterLock).to.be.lengthOf(0);
    });
});
