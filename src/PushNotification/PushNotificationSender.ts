import {PushNotificationTransport} from "../Interfaces/PushNotificationTransport";
import {PushNotificationRepository} from "./PushNotificationRepository";
import {Message} from "../Entity/Message";


export class PushNotificationSender {

    private transport: PushNotificationTransport;
    private notificationRepository: PushNotificationRepository;

    constructor(transport: PushNotificationTransport,
                notificationRepository: PushNotificationRepository) {
        this.transport = transport;
        this.notificationRepository = notificationRepository;
    }

    public async schedule(messages: Message[]) {
        // this.notificationRepository.storeMany(messages);
    }

    public async sendReady() {
        const notifications = await this.notificationRepository.findReadyToSend();

        for await (const ticket of this.transport.sendMany(notifications)) {
            await this.notificationRepository.setSendingStatus(ticket);
        }
    }
}

