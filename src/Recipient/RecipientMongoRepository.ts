import { Recipient, RecipientPreferences } from "./Recipient";
import { injectable } from "inversify";
import { RecipientRepository } from "../Interfaces/RecipientRepository";
import Mongo from "../Mongo";
import { Collection } from "mongodb";
import { RecipientDevice } from "./RecipientDevice";
import * as moment from "moment-timezone";

@injectable()
export class RecipientMongoRepository extends RecipientRepository {
    private static readonly COLLECTION_NAME: string = "recipients";

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
                        $each: [...recipient.topicLastNotification].map(([key, date]) => [key, date.toDate()]),
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

    public async findAll(): Promise<Recipient[]> {
        const documents = await this.collection()
            .find()
            .toArray();
        return documents.map(document => this.fromDocument(document));
    }

    public async findByDevice(pushToken: string): Promise<Recipient[]> {
        const documents = await this.collection()
            .find({
                "devices.pushToken": pushToken,
            })
            .toArray();

        return documents.map(document => this.fromDocument(document));
    }

    public async findOne(id: string): Promise<Recipient | undefined> {
        const document = await this.collection().findOne({ id });

        if (!document) {
            return undefined;
        }

        return this.fromDocument(document);
    }

    public collection(): Collection {
        return this.mongo.db.collection(RecipientMongoRepository.COLLECTION_NAME);
    }

    private toDocument(recipient: Recipient): object {
        return {
            name: recipient.name,
            followedTopics: [...recipient.followedTopics],
            devices: recipient.devices.map(device => ({
                pushToken: device.pushToken,
                createdAt: device.createdAt.toDate(),
            })),
            preferences: {
                earliestHour: recipient.preferences.earliestHour,
                earliestMinute: recipient.preferences.earliestMinute,
                level: recipient.preferences.level,
            },
        };
    }

    private fromDocument(data: any): Recipient {
        return new Recipient(
            data.id,
            data.name,
            data.followedTopics,
            data.devices.map(deviceData => new RecipientDevice(deviceData.pushToken, moment(deviceData.createdAt))),
            new RecipientPreferences(
                data.preferences.earliestHour,
                data.preferences.earliestMinute,
                data.preferences.level,
            ),
            new Set(data.notifiedEventIds),
            new Map(data.topicLastNotification.map(([key, date]) => [key, moment(date)])),
        );
    }
}
