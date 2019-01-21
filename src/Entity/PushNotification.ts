import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Message, MessagePriority } from "./Message";
import { PushNotificationStatus } from "../PushNotification/PushNotificationReceipt";

@Entity()
export class PushNotification {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public pushToken: string;

    @Column({
        type: "timestamp",
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
    public lockedUntil: Date = null;

    @Column({
        nullable: true,
    })
    public receiptId?: string;

    @Column({
        type: "json",
        nullable: true,
    })
    public data?: object;

    @Column({
        type: "json",
        nullable: true,
    })
    public errors?: string;

    @ManyToOne(type => Message, message => message.pushNotifications)
    public message: Message;

    public get title(): string {
        return this.message.title;
    }

    public get body(): string {
        return this.message.body;
    }

    public get priority(): MessagePriority {
        return this.message.priority;
    }
}
