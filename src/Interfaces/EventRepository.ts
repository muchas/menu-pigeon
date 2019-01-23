import { injectable } from "inversify";
import { Event } from "./Event";
import { Moment } from "moment-timezone";

@injectable()
export abstract class EventRepository {
    public abstract async findOne(id: string): Promise<Event | undefined>;
    public abstract async findRelevant(time: Moment): Promise<Event[]>;
    public abstract async addMany(recipients: Event[]): Promise<void>;
    public abstract async add(recipient: Event): Promise<void>;
}
