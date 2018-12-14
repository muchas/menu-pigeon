import {Consumer, Job} from "queue";
import {EventRepository} from "../Event/EventRepository";


export class EvaluatedPublicationConsumer implements Consumer {
    private eventRepository: EventRepository;

    constructor(eventRepository: EventRepository) {
        this.eventRepository = eventRepository;
    }

    consume(job: Job): Promise<void> {
        return undefined;
    }
}
