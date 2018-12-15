import {Consumer, Job} from "queue";
import {EventRepository} from "../Event/EventRepository";
import {LunchOfferEventFactory} from "./LunchOfferEventFactory";
import {PersistedPublication} from "queue/lib/Messages/PersistedPublication";


export class PersistedPublicationConsumer implements Consumer {
    private factory: LunchOfferEventFactory;

    constructor(private eventRepository: EventRepository) {
        this.factory = new LunchOfferEventFactory();
    }

    public async consume(job: Job<PersistedPublication>): Promise<void> {
        const events = this.factory.create(job.message);
        return this.eventRepository.addMany(events);
    }
}
