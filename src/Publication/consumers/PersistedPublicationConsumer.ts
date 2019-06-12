import { Consumer, Job } from "queue";
import { LunchOfferEventFactory } from "../LunchOffer/LunchOfferEventFactory";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { injectable } from "inversify";
import * as winston from "winston";
import { EventRepository } from "../../Interfaces/EventRepository";
import { PersistedPublicationRegister } from "../services/PersistedPublicationRegister";

@injectable()
export class PersistedPublicationConsumer implements Consumer {
    private readonly factory: LunchOfferEventFactory;

    public constructor(
        private readonly eventRepository: EventRepository,
        private readonly publicationRegister: PersistedPublicationRegister,
    ) {
        this.factory = new LunchOfferEventFactory();
    }

    public async consume(job: Job<PersistedPublication>): Promise<void> {
        winston.info("Consumption of persisted publication started", {
            publication_id: job.message.id,
            business_id: job.message.businessId,
        });

        const shouldProcess = await this.publicationRegister.register(job.message);
        if (!shouldProcess) {
            winston.info("Publication should not be processed", {
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
