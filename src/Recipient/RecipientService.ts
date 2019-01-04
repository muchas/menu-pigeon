import { injectable } from "inversify";
import { RecipientRepository } from "../Interfaces/RecipientRepository";
import { DeviceDeleted } from "queue/lib/Messages/DeviceDeleted";
import { Queue } from "queue";

@injectable()
export class RecipientService {

    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly queue: Queue
    ) {}

    public async removeDevice(pushToken: string) {
        const recipients = await this.recipientRepository.findByDevice(pushToken);
        if (recipients.length <= 0) {
            // as Pigeon service may consume DeviceDeleted messages
            // this condition prevents infinite public-consume loops
            return;
        }

        for (const recipient of recipients) {
            recipient.removeDevice(pushToken);
        }

        const promises = recipients.map((recipient) => this.recipientRepository.add(recipient));
        await Promise.all(promises);

        await this.queue.produce(new DeviceDeleted(pushToken));
    }
}
