import {PushNotificationRepository} from "./PushNotificationRepository";
import {PushNotificationTransport} from "../Interfaces/PushNotificationTransport";


export class PushNotificationStatusChecker {
    private transport: PushNotificationTransport;
    private notificationRepository: PushNotificationRepository;

    constructor(transport: PushNotificationTransport,
                notificationRepository: PushNotificationRepository) {
        this.transport = transport;
        this.notificationRepository = notificationRepository;
    }

    public async updateStatus() {
        const notifications = await this.notificationRepository.findSentUnconfirmed();

        for await (const receipt of this.transport.confirmStatuses(notifications)) {
            await this.notificationRepository.setDeliveryStatus(receipt);
        }
    }
}
