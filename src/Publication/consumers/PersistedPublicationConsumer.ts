import { Consumer, Job } from "queue";
import { LunchOfferEventFactory } from "../LunchOffer/LunchOfferEventFactory";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { injectable } from "inversify";
import * as winston from "winston";
import { EventRepository } from "../../Interfaces/EventRepository";
import { PersistedPublicationRepository } from "../repositories/PersistedPublicationRepository";

@injectable()
export class PersistedPublicationConsumer implements Consumer {
    private readonly factory: LunchOfferEventFactory;

    public constructor(
        private readonly eventRepository: EventRepository,
        private readonly publicationRepository: PersistedPublicationRepository,
    ) {
        this.factory = new LunchOfferEventFactory();
    }

    public async consume(job: Job<PersistedPublication>): Promise<void> {
        winston.info("Consumption of persisted publication started", {
            publication_id: job.message.id,
            business_id: job.message.businessId,
        });

        const inserted = await this.publicationRepository.add(job.message);
        if (!inserted) {
            winston.info("Publication has been already processed", {
                publication_id: job.message.id,
                business_id: job.message.businessId,
            });
            return;
        }

        const events = this.factory.create(job.message);
        await this.eventRepository.addMany(events);

        winston.info("Consumption of persisted publication finished", {
            publication_id: job.message.id,
            business_id: job.message.businessId,
        });
    }
}
