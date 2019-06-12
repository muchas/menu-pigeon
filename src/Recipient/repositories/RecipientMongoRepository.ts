import { Recipient, RecipientPreferences } from "../models/Recipient";
import { injectable } from "inversify";
import { RecipientRepository } from "../../Interfaces/RecipientRepository";
import Mongo from "../../Mongo";
import { Collection, ObjectID } from "mongodb";
import { RecipientDevice } from "../models/RecipientDevice";
import * as moment from "moment-timezone";

@injectable()
export class RecipientMongoRepository extends RecipientRepository {
    private static readonly COLLECTION_NAME: string = "recipients";
    private static readonly LOCK_TIMEOUT: number = 5 * 60 * 1000;

    public constructor(private readonly mongo: Mongo) {
        super();
    }

    public async addMany(recipients: Recipient[]): Promise<void> {
        const upserts = recipients.map(async recipient => this.add(recipient));
        await Promise.all(upserts);
    }

    public async add(recipient: Recipient): Promise<void> {
        const data = this.toDocument(recipient);

        await this.collection().updateOne(
            {
                id: recipient.id,
            },
            {
                $set: data,
                $addToSet: {
                    notifiedEventIds: {
                        $each: [...recipient.notifiedEventIds],
                    },
                    topicLastNotification: {
                        $each: [...recipient.topicLastNotification].map(([key, date]) => [
                            key,
                            date.toDate(),
                        ]),
                    },
                },
            },
            {
                upsert: true,
            },
        );
    }

    public async remove(id: string): Promise<void> {
        await this.collection().deleteOne({ id });
    }

    public async removeMany(ids: string[]): Promise<void> {
        await this.collection().deleteMany({
            id: {
                $in: ids,
            },
        });
    }

    public async findAll(): Promise<Recipient[]> {
        const documents = await this.collection()
            .find()
            .toArray();
        return documents.map(this.fromDocument);
    }

    public async findAndLockAll(): Promise<Recipient[]> {
        const lockId = await this.lockAll();

        const documents = await this.collection()
            .find({
                lockId,
            })
            .toArray();
        return documents.map(this.fromDocument);
    }

    private async lockAll(): Promise<ObjectID> {
        const lockId = new ObjectID();
        const lockStart = new Date().getTime() - RecipientMongoRepository.LOCK_TIMEOUT;
        await this.collection().updateMany(
            {
                $or: [
                    { lockId: null },
                    {
                        lockId: {
                            $lt: ObjectID.createFromTime(lockStart / 1000),
                        },
                    },
                ],
            },
            {
                $set: {
                    lockId,
                },
            },
        );
        return lockId;
    }

    public async unlock(recipients: Recipient[]): Promise<void> {
        const recipientIds = recipients.map(recipient => recipient.id);

        await this.collection().updateMany(
            {
                id: {
                    $in: recipientIds,
                },
            },
            {
                $set: {
                    lockId: null,
                },
            },
        );
    }

    public async findByDevice(pushToken: string): Promise<Recipient[]> {
        return this.findByDevices([pushToken]);
    }

    public async findByDevices(pushTokens: string[]): Promise<Recipient[]> {
        const documents = await this.collection()
            .find({
                "devices.pushToken": {
                    $in: pushTokens,
                },
            })
            .toArray();

        return documents.map(this.fromDocument);
    }

    public async findOne(id: string): Promise<Recipient | undefined> {
        const document = await this.collection().findOne({ id });

        if (!document) {
            return undefined;
        }

        return this.fromDocument(document);
    }

    private collection(): Collection {
        return this.mongo.db.collection(RecipientMongoRepository.COLLECTION_NAME);
    }

    private toDocument(recipient: Recipient): object {
        return {
            name: recipient.name,
            devices: recipient.devices.map(device => ({
                pushToken: device.pushToken,
                createdAt: device.createdAt.toDate(),
            })),
            preferences: {
                earliestHour: recipient.preferences.earliestHour,
                earliestMinute: recipient.preferences.earliestMinute,
                level: recipient.preferences.level,
            },
            followedTopics: [...recipient.followedTopics].map(([key, date]) => [
                key,
                date.toDate(),
            ]),
            lastNotificationTime: recipient.lastNotificationTime
                ? recipient.lastNotificationTime.toDate()
                : undefined,
            createdAt: recipient.createdAt.toDate(),
        };
    }

    private fromDocument(data: any): Recipient {
        return new Recipient(
            data.id,
            data.name,
            data.devices.map(
                deviceData =>
                    new RecipientDevice(deviceData.pushToken, moment(deviceData.createdAt)),
            ),
            new RecipientPreferences(
                data.preferences.earliestHour,
                data.preferences.earliestMinute,
                data.preferences.level,
            ),
            new Set(data.notifiedEventIds),
            new Map(data.topicLastNotification.map(([key, date]) => [key, moment(date)])),
            new Map(data.followedTopics.map(([key, date]) => [key, moment(date)])),
            data.lastNotificationTime ? moment(data.lastNotificationTime) : undefined,
            data.createdAt ? moment(data.createdAt) : moment(),
        );
    }
}
