import { Recipient } from "./Recipient";
import { injectable } from "inversify";
import { RecipientRepository } from "../Interfaces/RecipientRepository";

@injectable()
export class RecipientMemoryRepository extends RecipientRepository {
    public constructor(private recipients: Recipient[] = []) {
        super();
    }

    public async addMany(recipients: Recipient[]): Promise<void> {
        for (const recipient of recipients) {
            await this.add(recipient);
        }
    }

    public async add(recipient: Recipient): Promise<void> {
        const existingRecipient = this.recipients.find(r => r.id === recipient.id);
        if (existingRecipient) {
            recipient.notifiedEventIds = existingRecipient.notifiedEventIds;
            recipient.topicLastNotification = existingRecipient.topicLastNotification;

            await this.remove(existingRecipient.id);
        }

        this.recipients.push(recipient);
    }

    public async remove(id: string): Promise<void> {
        this.recipients = this.recipients.filter(r => r.id !== id);
    }

    public async findAll(): Promise<Recipient[]> {
        return [...this.recipients];
    }

    public async findByDevice(pushToken: string): Promise<Recipient[]> {
        return this.recipients.filter(recipient =>
            recipient.devices.find(device => device.pushToken === pushToken),
        );
    }

    public async findOne(id: string): Promise<Recipient | undefined> {
        return this.recipients.find(recipient => recipient.id === id);
    }
}
