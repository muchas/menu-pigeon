import {Event} from "../Interfaces/Event";


export class EventRepository {
    private events: Event[];

    constructor(events: Event[]) {
        this.events = events;
    }

    public async addMany(events: Event[]) {
        this.events = this.events.concat(events);
        // TODO: add to zookeeper
    }

    public async findRelevant(time: Date): Promise<Event[]> {
        return this.events.filter(
            (event) => event.readyTime <= time && event.expirationTime >= time
        );
    }


}
