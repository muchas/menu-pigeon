import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {PushNotification} from "./PushNotification";

export type MessagePriority = 'default' | 'normal' | 'high';

@Entity()
export class Message {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    recipientId: string;

    @Column()
    title: string;

    @Column()
    body: string;

    @Column()
    priority: MessagePriority;

    @Column()
    expirationTime: Date;

    @Column()
    ttl?: number;

    @Column('json')
    data?: string;

    @OneToMany(type => PushNotification, notification => notification.message)
    pushNotifications: PushNotification[];

    get eventIds(): string[] {
        return [];
    }
}
