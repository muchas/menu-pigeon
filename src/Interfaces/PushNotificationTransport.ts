import { PushNotification } from "../Entity/PushNotification";
import { PushNotificationTicket } from "../PushNotification/models/PushNotificationTicket";
import { PushNotificationReceipt } from "../PushNotification/models/PushNotificationReceipt";

export interface PushNotificationTransport {
    send(notification: PushNotification): Promise<PushNotificationTicket>;
    sendMany(notifications: PushNotification[]): AsyncIterableIterator<PushNotificationTicket>;

    confirmStatus(notification: PushNotification): Promise<PushNotificationReceipt>;
    confirmStatuses(
        notifications: PushNotification[],
    ): AsyncIterableIterator<PushNotificationReceipt>;
}
