import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {PushNotification} from './PushNotification';

export type MessagePriority = 'default' | 'normal' | 'high';
export interface MessageData {
    eventIds?: string[];

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
        default: {},
    })
    public data: MessageData;

    @OneToMany(type => PushNotification, notification => notification.message)
    public pushNotifications: PushNotification[];

    get eventIds(): string[] {
        return this.data.eventIds || [];
    }
}
