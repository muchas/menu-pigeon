import { Recipient } from "./Recipient";
import { injectable } from "inversify";

@injectable()
export class RecipientMemoryRepository {
    public constructor(private recipients: Recipient[] = []) {
    }

    public async addMany(recipients: Recipient[]) {
        this.recipients.push(...recipients);
    }

    public async upsert(recipient: Recipient) {
        const existingRecipient = this.recipients.find((r) => r.id === recipient.id);
        if (existingRecipient !== null) {
            recipient.notifiedEventIds = existingRecipient.notifiedEventIds;
            recipient.topicLastNotification = existingRecipient.topicLastNotification;

            await this.remove(existingRecipient.id);
        }

        this.recipients.push(recipient);
    }

    public async remove(id: string) {
        this.recipients = this.recipients.filter((r) => r.id !== id);
    }

    public async findAll(): Promise<Recipient[]> {
        return [...this.recipients];
    }

    public async findOne(id: string): Promise<Recipient | undefined> {
        return this.recipients.find((recipient) => recipient.id === id);
    }
}