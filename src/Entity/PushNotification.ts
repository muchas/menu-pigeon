import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Message, MessagePriority} from "./Message";


@Entity()
export class PushNotification {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pushToken: string;

    @Column()
    sentAt?: Date;

    @Column()
    createdAt: Date;

    @Column()
    status: number;

    @Column()
    receiptId?: string;

    @Column('json')
    data: string;

    @Column('json')
    errors: string;

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
