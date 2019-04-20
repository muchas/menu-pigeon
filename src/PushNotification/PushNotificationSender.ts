import { PushNotificationTransport } from "../Interfaces/PushNotificationTransport";
import { PushNotificationRepository } from "./PushNotificationRepository";
import { Message } from "../Entity/Message";
import { Recipient } from "../Recipient/Models/Recipient";
import { PushNotification } from "../Entity/PushNotification";
import { injectable } from "inversify";
import * as winston from "winston";
import * as moment from "moment-timezone";

@injectable()
export class PushNotificationSender {
    public constructor(
        private readonly transport: PushNotificationTransport,
        private readonly notificationRepository: PushNotificationRepository,
    ) {}

    public async schedule(recipients: Recipient[], messages: Message[]): Promise<void> {
        const recipientsById = new Map(recipients.map((r): [string, Recipient] => [r.id, r]));

        for (const message of messages) {
            const recipient = recipientsById.get(message.recipientId);
            recipient.lastNotificationTime = moment();

            message.pushNotifications = recipient.pushTokens.map(token => {
                const notification = new PushNotification();
                notification.pushToken = token;
                notification.message = message;
                return notification;
            });
        }

        await this.notificationRepository.storeMessagesToSend(messages);

        if (messages.length > 0) {
            winston.info("Messages scheduled", {
                message_ids: messages.map(message => message.id),
                recipient_ids: messages.map(message => message.recipientId),
            });
        }
    }

    public async sendReady(): Promise<void> {
        const notifications = await this.notificationRepository.fetchForSending();

        if (notifications.length > 0) {
            winston.info("Sending ready push notifications", {
                push_notification_ids: notifications.map(notification => notification.id),
                recipient_ids: notifications.map(notification => notification.message.recipientId),
            });
        }

        for await (const ticket of this.transport.sendMany(notifications)) {
            await this.notificationRepository.setSendingStatus(ticket);
        }
    }
}
