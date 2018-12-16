import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Message, MessagePriority} from './Message';
import {PushNotificationStatus} from '../PushNotification/PushNotificationReceipt';

@Entity()
export class PushNotification {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public pushToken: string;

    @Column({
        type: 'timestamp',
        nullable: true,
    })
    public sentAt?: Date;

    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    public status: PushNotificationStatus = PushNotificationStatus.SCHEDULED;

    @Column({
        nullable: true,
    })
    public receiptId?: string;

    @Column({
        type: 'json',
        nullable: true,
    })
    public data?: string;

    @Column({
        type: 'json',
        nullable: true,
    })
    public errors?: string;

    @ManyToOne(type => Message, message => message.pushNotifications)
    public message: Message;

    get title(): string {
        return this.message.title;
    }

    get body(): string {
        return this.message.body;
    }

    get priority(): MessagePriority {
        return this.message.priority;
    }
}
