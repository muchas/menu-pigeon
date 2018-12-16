import {PushNotification} from '../Entity/PushNotification';
import {PushNotificationTicket} from './PushNotificationTicket';
import {PushNotificationReceipt, PushNotificationStatus} from './PushNotificationReceipt';
import {Message} from '../Entity/Message';
import {Connection, Repository} from 'typeorm';

export class PushNotificationRepository {
    private connection: Connection;
    private messageRepository: Repository<Message>;
    private notificationRepository: Repository<PushNotification>;

    constructor(connection: Connection) {
        this.connection = connection;
        this.messageRepository = connection.getRepository(Message);
        this.notificationRepository = connection.getRepository(PushNotification);
    }

    public async storeMessagesToSend(messages: Message[]) {
        // TODO: move to MessageRepository?
        await this.messageRepository.save(messages);
        const notifications = messages
            .map((message) => message.pushNotifications)
            .reduce((prev, current) => prev.concat(current), []);

        await this.notificationRepository.save(notifications);
    }

    public async findSentUnconfirmed(): Promise<PushNotification[]> {
        return await this.notificationRepository.find({
            where: {
                status: PushNotificationStatus.SENT,
            },
            relations: ['message'],
        });
    }

    public async findReadyToSend(): Promise<PushNotification[]> {
        return await this.notificationRepository
            .createQueryBuilder('notification')
            .innerJoinAndSelect('notification.message', 'message')
            .where('notification.status = :status', {status: PushNotificationStatus.SCHEDULED})
            .andWhere('notification.sentAt is NULL')
            .andWhere('message.expirationTime <= NOW()')
            .getMany();
    }

    public async setSendingStatus(pushTicket: PushNotificationTicket) {
        const notification = pushTicket.notification;
        if (pushTicket.sentSuccessfully) {
            notification.receiptId = pushTicket.receiptId;
            notification.status = PushNotificationStatus.SENT;
            // notification.data = pushTicket.data;
            await this.notificationRepository.save(notification);
        }
    }

    public async setDeliveryStatus(receipt: PushNotificationReceipt) {
        const notification = receipt.notification;
        if (receipt.fetchedSuccessfully) {
            // TODO: handle errors (removal of push tokens / devices?)
            notification.status =  receipt.status;
            await this.notificationRepository.save(notification);
        }
    }
}
