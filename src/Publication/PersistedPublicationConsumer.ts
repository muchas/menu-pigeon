import {Consumer, Job} from 'queue';
import {EventRepository} from '../Event/EventRepository';
import {LunchOfferEventFactory} from './LunchOfferEventFactory';
import {PersistedPublication} from 'queue/lib/Messages/PersistedPublication';
import {injectable} from 'inversify';
import {NotifierClock} from '../PushNotification/NotifierClock';
import * as winston from 'winston';

@injectable()
export class PersistedPublicationConsumer implements Consumer {
    private factory: LunchOfferEventFactory;

    constructor(private eventRepository: EventRepository,
                private notifierClock: NotifierClock) {
        this.factory = new LunchOfferEventFactory();
    }

    public async consume(job: Job<PersistedPublication>): Promise<void> {
        const events = this.factory.create(job.message);
        await this.eventRepository.addMany(events);
        await this.notifierClock.tick();
    }
}
