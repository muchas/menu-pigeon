import {Event} from "../Interfaces/Event";


export class EventRepository {
    private events: Event[];

    constructor(events: Event[]) {
        this.events = events;
    }

    public async add(event: Event) {
        this.events.push(event);
        // TODO: add to zookeeper
    }

    public async findRelevant(time: Date): Promise<Event[]> {
        return this.events.filter(
            (event) => event.readyTime <= time && event.expirationTime >= time
        );
    }
}
