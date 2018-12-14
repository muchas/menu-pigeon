import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {PushNotification} from "./PushNotification";

export type MessagePriority = 'default' | 'normal' | 'high';

@Entity()
export class Message {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    recipientId: string;

    @Column()
    title: string;

    @Column()
    body: string;

    @Column()
    priority: MessagePriority;

    @Column('timestamp')
    expirationTime: Date;

    @CreateDateColumn()
    createdAt: Date;

    @Column({
        nullable: true,
    })
    ttl?: number;

    @Column({
        type: 'json',
        nullable: true,
    })
    data?: string;

    @OneToMany(type => PushNotification, notification => notification.message)
    pushNotifications: PushNotification[];

    get eventIds(): string[] {
        return [];
    }
}
