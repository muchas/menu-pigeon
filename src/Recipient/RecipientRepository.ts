import {Recipient} from './Recipient';

export class RecipientRepository {
    private recipients: Recipient[];

    constructor(recipients: Recipient[]) {
        this.recipients = recipients;
    }

    public async upsert(recipient: Recipient) {
        const existingRecipient = this.recipients.find((r) => r.id === recipient.id);
        if (existingRecipient !== null) {
            recipient.followedTopics = existingRecipient.followedTopics;
            recipient.notifiedEventIds = existingRecipient.notifiedEventIds;
            recipient.topicLastNotification = existingRecipient.topicLastNotification;
        }

        this.recipients.push(recipient);
        // TODO: add to zookeeper
    }

    public async remove(id: string)  {
        this.recipients = this.recipients.filter((r) => r.id !== id);
    }

    public async findAll(): Promise<Recipient[]> {
        return [...this.recipients];
    }

    public async findOne(id: string): Promise<Recipient | void> {
        return this.recipients.find((recipient) => recipient.id === id);
    }
}
