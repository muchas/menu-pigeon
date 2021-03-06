import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PushNotification } from "./PushNotification";

export type MessagePriority = "default" | "normal" | "high";
export interface MessageData {
    eventIds?: string[];
    eventType?: string;
    topics?: string[];
    notificationData?: object;
}

@Entity()
export class Message {
    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @Column()
    public recipientId: string;

    @Column()
    public title: string;

    @Column()
    public body: string;

    @Column()
    public priority: MessagePriority;

    @Column("timestamp")
    public expirationTime: Date;

    @CreateDateColumn()
    public createdAt: Date;

    @Column({
        type: "json",
    })
    public data: MessageData = {};

    @OneToMany(type => PushNotification, notification => notification.message)
    public pushNotifications: PushNotification[];

    public get eventIds(): string[] {
        return this.data.eventIds || [];
    }

    public get topics(): string[] {
        return this.data.topics || [];
    }

    public get eventType(): string {
        return this.data.eventType || "";
    }

    public setTopics(topics: string[]): void {
        this.data.topics = topics;
    }

    public setEventIds(eventIds: string[]): void {
        this.data.eventIds = eventIds;
    }

    public setEventType(eventType: string): void {
        this.data.eventType = eventType;
    }

    public setNotificationData(data: object): void {
        this.data.notificationData = data;
    }
}
