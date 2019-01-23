import { PushNotification } from "../Entity/PushNotification";
import { PushNotificationTicket } from "./PushNotificationTicket";
import { PushNotificationReceipt, PushNotificationStatus } from "./PushNotificationReceipt";
import { Message } from "../Entity/Message";
import { Connection, EntityManager, Repository } from "typeorm";
import { injectable } from "inversify";
import * as moment from "moment-timezone";

@injectable()
export class PushNotificationRepository {
    private readonly LOCK_TIME_MINUTES: number = 5;

    private readonly connection: Connection;
    private readonly messageRepository: Repository<Message>;
    private readonly notificationRepository: Repository<PushNotification>;

    public constructor(connection: Connection) {
        this.connection = connection;
        this.messageRepository = connection.getRepository(Message);
        this.notificationRepository = connection.getRepository(PushNotification);
    }

    public async storeMessagesToSend(messages: Message[]): Promise<void> {
        // TODO: move to MessageRepository?
        await this.messageRepository.save(messages);
        const notifications = messages
            .map(message => message.pushNotifications)
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

    public async fetchForSending(): Promise<PushNotification[]> {
        let notifications: PushNotification[] = [];

        await this.connection.transaction(async (entityManager: EntityManager) => {
            notifications = await entityManager
                .getRepository(PushNotification)
                .createQueryBuilder("notification")
                .innerJoinAndSelect("notification.message", "message")
                .where("notification.status = :status", { status: PushNotificationStatus.SCHEDULED })
                .andWhere("notification.sentAt is NULL")
                .andWhere("notification.lockedUntil is NULL OR notification.lockedUntil < NOW()")
                .andWhere("message.expirationTime >= NOW()")
                .getMany();

            const locks = notifications.map(async notification => {
                notification.lockedUntil = moment()
                    .add(this.LOCK_TIME_MINUTES, "minute")
                    .toDate();
                return entityManager.save(notification);
            });

            await Promise.all(locks);
        });

        return notifications;
    }

    public async setSendingStatus(pushTicket: PushNotificationTicket): Promise<void> {
        const notification = pushTicket.notification;
        if (pushTicket.sentSuccessfully && pushTicket.receiptId) {
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
            notification.status = receipt.status;
            notification.data = {
                receipt_data: receipt.data,
                ...notification.data,
            };
            await this.notificationRepository.save(notification);
        }
    }
}
