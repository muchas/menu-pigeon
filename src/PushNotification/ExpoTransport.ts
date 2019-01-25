import * as winston from "winston";
import { PushNotificationTransport } from "../Interfaces/PushNotificationTransport";
import { PushNotification } from "../Entity/PushNotification";
import Expo, { ExpoPushMessage, ExpoPushReceiptId } from "expo-server-sdk";
import { PushNotificationTicket } from "./PushNotificationTicket";
import { PushNotificationReceipt, PushNotificationStatus } from "./PushNotificationReceipt";
import { toArray } from "../utils";
import { injectable } from "inversify";

@injectable()
export class ExpoTransport implements PushNotificationTransport {
    private readonly client: Expo;

    public constructor(client: Expo) {
        this.client = client;
    }

    public async confirmStatus(notification: PushNotification): Promise<PushNotificationReceipt> {
        const receipts = await toArray(this.confirmStatuses([notification]));
        return receipts[0];
    }

    public async *confirmStatuses(
        notifications: PushNotification[],
    ): AsyncIterableIterator<PushNotificationReceipt> {
        const receiptIds = notifications.map(n => n.receiptId);
        const notificationsByReceiptId = new Map(
            notifications.map((n): [string, PushNotification] => [n.receiptId, n]),
        );
        const chunks = this.client.chunkPushNotificationReceiptIds(receiptIds);

        for (const chunk of chunks) {
            const chunkNotifications = chunk.map(receiptId =>
                notificationsByReceiptId.get(receiptId),
            );

            yield* this.confirmReceiptsChunk(chunk, chunkNotifications);
        }
    }

    public async send(notification: PushNotification): Promise<PushNotificationTicket> {
        const tickets = await toArray(
            this.sendMessagesChunk([this.toExpoPush(notification)], [notification]),
        );
        return tickets[0];
    }

    public async *sendMany(
        notifications: PushNotification[],
    ): AsyncIterableIterator<PushNotificationTicket> {
        const notificationsByToken = new Map(
            notifications.map((n): [string, PushNotification] => [n.pushToken, n]),
        );

        const expoPushes = notifications.map(notification => this.toExpoPush(notification));
        const chunks = this.client.chunkPushNotifications(expoPushes);

        for (const chunk of chunks) {
            const chunkNotifications = chunk.map(expoPush => notificationsByToken.get(expoPush.to));

            yield* this.sendMessagesChunk(chunk, chunkNotifications);
        }
    }

    private async *confirmReceiptsChunk(
        chunk: ExpoPushReceiptId[],
        notifications: PushNotification[],
    ): AsyncIterableIterator<PushNotificationReceipt> {
        try {
            const notificationsByReceiptId = new Map(
                notifications.map((n): [string, PushNotification] => [n.receiptId, n]),
            );
            const receipts = await this.client.getPushNotificationReceiptsAsync(chunk);

            for (const [receiptId, receipt] of Object.entries(receipts)) {
                const notification = notificationsByReceiptId.get(receiptId);
                const status = this.toInternalStatus(receipt.status);
                if (status === PushNotificationStatus.ERROR) {
                    winston.error("Push notification delivery error", {
                        notification_id: notification.id,
                        data: receipt,
                    });
                }

                yield new PushNotificationReceipt(notification, true, status, receipt);
            }
        } catch (e) {
            winston.error(e);

            for (const notification of notifications) {
                yield new PushNotificationReceipt(notification, false);
            }
        }
    }

    private async *sendMessagesChunk(
        chunk: ExpoPushMessage[],
        notifications: PushNotification[],
    ): AsyncIterableIterator<PushNotificationTicket> {
        try {
            const tickets = await this.client.sendPushNotificationsAsync(chunk);

            for (let i = 0; i < notifications.length; i++) {
                yield new PushNotificationTicket(notifications[i], true, tickets[i].id);
            }
        } catch (e) {
            winston.error(e);

            for (const notification of notifications) {
                yield new PushNotificationTicket(notification, false);
            }
        }
    }

    private toInternalStatus(status: string): PushNotificationStatus {
        switch (status) {
            case "ok":
                return PushNotificationStatus.DELIVERED;
            case "error":
                return PushNotificationStatus.ERROR;
            default:
                return PushNotificationStatus.UNKNOWN;
        }
    }

    private toExpoPush(notification: PushNotification): ExpoPushMessage {
        return {
            to: notification.pushToken,
            title: notification.title,
            body: notification.body,
            priority: notification.priority,
            ttl: notification.ttl,
            data: notification.message.data.notificationData,
        };
    }
}
