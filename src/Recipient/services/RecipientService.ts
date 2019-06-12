import { injectable } from "inversify";
import { RecipientRepository } from "../../Interfaces/RecipientRepository";
import { DeviceDeleted } from "queue/lib/Messages/DeviceDeleted";
import { Queue } from "queue";

@injectable()
export class RecipientService {
    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly queue: Queue,
    ) {}

    public async removeDevices(pushTokens: string[], propagate: boolean = true): Promise<void> {
        const recipients = await this.recipientRepository.findByDevices(pushTokens);
        if (recipients.length <= 0) {
            return;
        }

        const updatedRecipients = [];
        const removedRecipients = [];

        for (const recipient of recipients) {
            recipient.removeDevices(pushTokens);

            if (recipient.devices.length > 0) {
                updatedRecipients.push(recipient);
            } else {
                removedRecipients.push(recipient);
            }
        }

        await this.recipientRepository.removeMany(removedRecipients.map(r => r.id));
        await this.recipientRepository.addMany(updatedRecipients);

        if (propagate) {
            await this.propagateDevicesRemoval(pushTokens);
        }
    }

    public async removeDevice(pushToken: string, propagate: boolean = true): Promise<void> {
        return this.removeDevices([pushToken], propagate);
    }

    private async propagateDevicesRemoval(pushTokens: string[]): Promise<boolean[]> {
        const promises = pushTokens.map(pushToken =>
            this.queue.produce(new DeviceDeleted(pushToken)),
        );
        return Promise.all(promises);
    }
}
