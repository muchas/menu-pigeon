import { Event } from "../Interfaces/Event";
import { injectable } from "inversify";
import { EventRepository } from "../Interfaces/EventRepository";
import { Moment } from "moment-timezone";

@injectable()
export class EventMemoryRepository extends EventRepository {
    private readonly events: Event[];

    public constructor(events: Event[] = []) {
        super();
        this.events = events;
    }

    public async addMany(events: Event[]) {
        this.events.push(...events);
    }

    public async add(event: Event) {
        this.events.push(event);
    }

    public async findOne(id: string): Promise<Event | undefined> {
        return this.events.find((event) => event.id === id);
    }

    public async findRelevant(time: Moment): Promise<Event[]> {
        return this.events.filter(
            (event) => event.readyTime <= time && event.expirationTime >= time
        );
    }

}
