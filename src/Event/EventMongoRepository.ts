import { injectable } from "inversify";
import Mongo from "../Mongo";
import { Collection } from "mongodb";
import { Event } from "../Interfaces/Event";
import { EventRepository } from "../Interfaces/EventRepository";

@injectable()
export class EventMongoRepository extends EventRepository {

    private static readonly COLLECTION_NAME: string = "events";

    public constructor(private readonly mongo: Mongo) {
        super();
    }

    public async addMany(events: Event[]) {
        const upserts = events.map(async event => this.add(event));
        await Promise.all(upserts);
    }

    public async add(event: Event) {
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
            }
        );
    }

    public async findOne(id: string): Promise<Event | undefined> {
        const document = await this.collection().findOne({id});
        if (document) {
            return document;
        }
    }

    public async findRelevant(time: Date): Promise<Event[]> {
        return this.collection()
            .find(
            {
                expirationTime: {
                    $gte: time,
                },
                readyTime: {
                    $lte: time,
                },
            }
            )
            .toArray();
    }

    public collection(): Collection {
        return this.mongo.db.collection(EventMongoRepository.COLLECTION_NAME);
    }

    private toDocument(event: Event) {
        return {
            id: event.id,
            eventType: event.eventType,
            topics: event.topics,
            readyTime: event.readyTime,
            expirationTime: event.expirationTime,
            location: event.location,
            content: event.content,
        };
    }
}
