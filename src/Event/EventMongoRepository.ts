import { injectable } from "inversify";
import Mongo from "../Mongo";
import { Collection } from "mongodb";
import { Event } from "../Interfaces/Event";
import { EventRepository } from "../Interfaces/EventRepository";
import { Moment } from "moment-timezone";
import * as moment from "moment-timezone";

@injectable()
export class EventMongoRepository extends EventRepository {

    private static readonly COLLECTION_NAME: string = "events";

    public constructor(private readonly mongo: Mongo) {
        super();
    }

    public async addMany(events: Event[]): Promise<void> {
        const upserts = events.map(async event => this.add(event));
        await Promise.all(upserts);
    }

    public async add(event: Event): Promise<void> {
        const data = this.toDocument(event);

        await this.collection().updateOne(
            {
                id: event.id,
            },
            {
                $set: data,
            },
            {
                upsert: true,
            },
        );
    }

    public async findOne(id: string): Promise<Event | undefined> {
        const document = await this.collection().findOne({id});
        if (document) {
            return {
                ...document,
                readyTime: moment(document.readyTime),
                expirationTime: moment(document.expirationTime),
            };
        }
    }

    public async findRelevant(time: Moment): Promise<Event[]> {
        const events =  await this.collection()
            .find(
            {
                expirationTime: {
                    $gte: time.toDate(),
                },
                readyTime: {
                    $lte: time.toDate(),
                },
            },
            )
            .toArray();

        return events.map((document) => ({
            ...document,
            readyTime: moment(document.readyTime),
            expirationTime: moment(document.expirationTime),
        }));
    }

    public collection(): Collection {
        return this.mongo.db.collection(EventMongoRepository.COLLECTION_NAME);
    }

    private toDocument(event: Event): object {
        return {
            id: event.id,
            eventType: event.eventType,
            topics: event.topics,
            readyTime: event.readyTime.toDate(),
            expirationTime: event.expirationTime.toDate(),
            location: event.location,
            content: event.content,
        };
    }
}
