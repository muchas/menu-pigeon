import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {PushNotification} from './PushNotification';

export type MessagePriority = 'default' | 'normal' | 'high';
export interface MessageData {
    eventIds?: string[];
    eventType?: string;
    topics?: string[];
}


@Entity()
export class Message {

    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public recipientId: string;

    @Column()
    public title: string;

    @Column()
    public body: string;

    @Column()
    public priority: MessagePriority;

    @Column('timestamp')
    public expirationTime: Date;

    @CreateDateColumn()
    public createdAt: Date;

    @Column({
        nullable: true,
    })
    public ttl?: number;

    @Column({
        type: 'json',
    })
    public data: MessageData = {};

    @OneToMany(type => PushNotification, notification => notification.message)
    public pushNotifications: PushNotification[];

    get eventIds(): string[] {
        return this.data.eventIds || [];
    }

    get topics(): string[] {
        return this.data.topics || [];
    }

    get eventType(): string {
        return this.data.eventType || '';
    }

    public setTopics(topics: string[]) {
        this.data.topics = topics;
    }

    public setEventIds(eventIds: string[]) {
        this.data.eventIds = eventIds;
    }

    public setEventType(eventType: string) {
        this.data.eventType = eventType;
    }
}
