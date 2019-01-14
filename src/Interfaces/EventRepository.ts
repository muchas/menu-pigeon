import { injectable } from "inversify";
import { Event } from "./Event";
import { Moment } from "moment-timezone";

@injectable()
export abstract class EventRepository {
    public async abstract findOne(id: string): Promise<Event | undefined>;
    public async abstract findRelevant(time: Moment): Promise<Event[]>;
    public async abstract addMany(recipients: Event[]);
    public async abstract add(recipient: Event);
}
