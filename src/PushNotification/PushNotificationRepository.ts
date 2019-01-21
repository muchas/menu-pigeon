import { PushNotification } from "../Entity/PushNotification";
import { PushNotificationTicket } from "./PushNotificationTicket";
import { PushNotificationReceipt, PushNotificationStatus } from "./PushNotificationReceipt";
import { Message } from "../Entity/Message";
import { Connection, Repository } from "typeorm";
import { injectable } from "inversify";

@injectable()
export class PushNotificationRepository {
    private readonly messageRepository: Repository<Message>;
    private readonly notificationRepository: Repository<PushNotification>;

    public constructor(connection: Connection) {
        this.messageRepository = connection.getRepository(Message);
        this.notificationRepository = connection.getRepository(PushNotification);
    }

    public async storeMessagesToSend(messages: Message[]): Promise<void> {
        // TODO: move to MessageRepository?
        await this.messageRepository.save(messages);
        const notifications = messages
            .map((message) => message.pushNotifications)
            .reduce((prev, current) => prev.concat(current), []);

        await this.notificationRepository.save(notifications);
    }

    public async findSentUnconfirmed(): Promise<PushNotification[]> {
        return this.notificationRepository.find({
            where: {
                status: PushNotificationStatus.SENT,
            },
            relations: ["message"],
        });
    }

    public async findReadyToSend(): Promise<PushNotification[]> {
        return this.notificationRepository
            .createQueryBuilder("notification")
            .innerJoinAndSelect("notification.message", "message")
            .where("notification.status = :status", {status: PushNotificationStatus.SCHEDULED})
            .andWhere("notification.sentAt is NULL")
            .andWhere("message.expirationTime >= NOW()")
            .getMany();
    }

    public async setSendingStatus(pushTicket: PushNotificationTicket): Promise<void> {
        const notification = pushTicket.notification;
        if (pushTicket.sentSuccessfully) {
            notification.receiptId = pushTicket.receiptId;
            notification.status = PushNotificationStatus.SENT;
            notification.sentAt = pushTicket.sentAt.toDate();
            notification.data = {
                ticket_data: pushTicket.data,
                ...notification.data,
            };
            await this.notificationRepository.save(notification);
        }
    }

    public async setDeliveryStatus(receipt: PushNotificationReceipt): Promise<void> {
        const notification = receipt.notification;
        if (receipt.fetchedSuccessfully) {
            notification.status =  receipt.status;
            notification.data = {
                receipt_data: receipt.data,
                ...notification.data,
            };
            await this.notificationRepository.save(notification);
        }
    }
}
