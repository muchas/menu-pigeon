import { Consumer, Job } from "queue";
import { RecipientRepository } from "./RecipientRepository";
import { RecipientDeleted } from "queue/lib/Messages/RecipientDeleted";
import { injectable } from "inversify";

@injectable()
export class RecipientDeletedConsumer implements Consumer {

    public constructor(private readonly recipientRepository: RecipientRepository) {}

    public async consume(job: Job<RecipientDeleted>) {
        await this.recipientRepository.remove(job.message.id);
    }
}
