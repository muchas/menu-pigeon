import { PushNotificationRepository } from "./PushNotificationRepository";
import { PushNotificationTransport } from "../Interfaces/PushNotificationTransport";
import { injectable } from "inversify";

@injectable()
export class PushNotificationStatusChecker {
    public constructor(
        private readonly transport: PushNotificationTransport,
        private readonly notificationRepository: PushNotificationRepository
    ) {
    }

    public async updateStatus() {
        const notifications = await this.notificationRepository.findSentUnconfirmed();

        for await (const receipt of this.transport.confirmStatuses(notifications)) {
            await this.notificationRepository.setDeliveryStatus(receipt);
        }
    }
}
