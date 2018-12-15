import {PushNotificationTransport} from "../Interfaces/PushNotificationTransport";
import {PushNotificationRepository} from "./PushNotificationRepository";
import {Message} from "../Entity/Message";
import {Recipient} from "../Recipient/Recipient";
import {PushNotification} from "../Entity/PushNotification";


export class PushNotificationSender {

    constructor(private transport: PushNotificationTransport,
                private notificationRepository: PushNotificationRepository) {}

    public async schedule(recipients: Recipient[], messages: Message[]) {
        const recipientsById = new Map(recipients.map((r): [string, Recipient] => [r.id, r]));

        for (const message of messages) {
            const recipient = recipientsById.get(message.recipientId);

            message.pushNotifications = recipient.pushTokens.map((token) => {
               const notification = new PushNotification();
               notification.pushToken = token;
               notification.message = message;
               return notification;
            });
        }

        await this.notificationRepository.storeMessagesToSend(messages);
    }

    public async sendReady() {
        const notifications = await this.notificationRepository.findReadyToSend();

        for await (const ticket of this.transport.sendMany(notifications)) {
            await this.notificationRepository.setSendingStatus(ticket);
        }
    }
}

