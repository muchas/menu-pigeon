import {PushNotification} from "../Entity/PushNotification";
import {PushNotificationTicket} from "../PushNotification/PushNotificationTicket";
import {PushNotificationReceipt} from "../PushNotification/PushNotificationReceipt";

export interface PushNotificationTransport {
    send(notification: PushNotification): Promise<PushNotificationTicket>;
    sendMany(notifications: PushNotification[]): AsyncIterableIterator<PushNotificationTicket>;

    confirmStatus(notification: PushNotification): Promise<PushNotificationReceipt>;
    confirmStatuses(notifications: PushNotification[]): AsyncIterableIterator<PushNotificationReceipt>;
}
