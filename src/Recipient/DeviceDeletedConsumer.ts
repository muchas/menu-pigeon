import { Consumer, Job } from "queue";
import { injectable } from "inversify";
import { RecipientService } from "./RecipientService";
import { DeviceDeleted } from "queue/lib/Messages/DeviceDeleted";

@injectable()
export class DeviceDeletedConsumer implements Consumer {

    public constructor(private readonly recipientService: RecipientService) {}

    public async consume(job: Job<DeviceDeleted>): Promise<void> {
        await this.recipientService.removeDevice(job.message.pushToken);
    }
}
