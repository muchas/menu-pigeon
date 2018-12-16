import {Consumer, Job} from 'queue';
import {RecipientRepository} from './RecipientRepository';
import {RecipientDeleted} from 'queue/lib/Messages/RecipientDeleted';

export class RecipientDeletedConsumer implements Consumer {

    constructor(private recipientRepository: RecipientRepository) {}

    public async consume(job: Job<RecipientDeleted>) {
        await this.recipientRepository.remove(job.message.id);
    }
}
