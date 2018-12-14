import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Message, MessagePriority} from "./Message";
import {PushNotificationStatus} from "../PushNotification/PushNotificationReceipt";


@Entity()
export class PushNotification {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pushToken: string;

    @Column({
        type: 'timestamp',
        nullable: true
    })
    sentAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    status: PushNotificationStatus = PushNotificationStatus.SCHEDULED;

    @Column({
        nullable: true,
    })
    receiptId?: string;

    @Column({
        type: 'json',
        nullable: true,
    })
    data?: string;

    @Column({
        type: 'json',
        nullable: true,
    })
    errors?: string;

    @ManyToOne(type => Message, message => message.pushNotifications)
    message: Message;

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
