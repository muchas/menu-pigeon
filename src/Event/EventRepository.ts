import { Event } from "../Interfaces/Event";
import { injectable } from "inversify";

@injectable()
export class EventRepository {
    private readonly events: Event[];

    public constructor(events: Event[] = []) {
        this.events = events;
    }

    public addMany(events: Event[]) {
        this.events.push(...events);
    }

    public async findRelevant(time: Date): Promise<Event[]> {
        return this.events.filter(
            (event) => event.readyTime <= time && event.expirationTime >= time
        );
    }

}
