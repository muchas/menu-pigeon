import {PushNotification} from "../Entity/PushNotification";
import {PushNotificationTicket} from "./PushNotificationTicket";
import {PushNotificationReceipt} from "./PushNotificationReceipt";


export class PushNotificationRepository {

    public async findSentUnconfirmed(): Promise<PushNotification[]> {
        return []
    }

    public async findReadyToSend(): Promise<PushNotification[]> {
        return [];
    }

    public async setSendingStatus(pushTicket: PushNotificationTicket) {

    }

    public async setDeliveryStatus(receipt: PushNotificationReceipt) {

    }
}

