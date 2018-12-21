import { Consumer, Job } from "queue";
import { RecipientRepository } from "./RecipientRepository";
import { RecipientDeleted } from "queue/lib/Messages/RecipientDeleted";
import { injectable } from "inversify";
import * as winston from "winston";

@injectable()
export class RecipientDeletedConsumer implements Consumer {

    public constructor(private readonly recipientRepository: RecipientRepository) {}

    public async consume(job: Job<RecipientDeleted>) {
        winston.info("Consumption of recipient deleted started", {
            recipient_id: job.message.id,
        });

        await this.recipientRepository.remove(job.message.id);

        winston.info("Consumption of recipient deleted finished", {
            recipient_id: job.message.id,
        });
    }
}
