import {Event} from '../Interfaces/Event';
import {injectable} from 'inversify';

@injectable()
export class EventRepository {
    private events: Event[];

    constructor(events: Event[] = []) {
        this.events = events;
    }

    public async addMany(events: Event[]) {
        this.events = this.events.concat(events);
    }

    public async findRelevant(time: Date): Promise<Event[]> {
        return this.events.filter(
            (event) => event.readyTime <= time && event.expirationTime >= time
        );
    }

}
