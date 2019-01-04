import { injectable } from "inversify";
import { RecipientRepository } from "../Interfaces/RecipientRepository";
import { Queue } from "queue";

@injectable()
export class RecipientService {

    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly queue: Queue
    ) {}

    public async removeDevice(pushToken: string) {
        const recipients = await this.recipientRepository.findByDevice(pushToken);

        for (const recipient of recipients) {
            recipient.removeDevice(pushToken);
        }

        const promises = recipients.map((recipient) => this.recipientRepository.add(recipient));
        await Promise.all(promises);

        // TODO: add message for recipient
        this.queue.produce;
        // await this.queue.produce(new DeviceRemoved(pushToken));
    }
}
