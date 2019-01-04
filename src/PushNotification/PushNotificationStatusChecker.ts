import { PushNotificationRepository } from "./PushNotificationRepository";
import { PushNotificationTransport } from "../Interfaces/PushNotificationTransport";
import { injectable } from "inversify";
import * as winston from "winston";
import { PushNotificationReceipt } from "./PushNotificationReceipt";
import { RecipientService } from "../Recipient/RecipientService";

@injectable()
export class PushNotificationStatusChecker {
    public constructor(
        private readonly transport: PushNotificationTransport,
        private readonly notificationRepository: PushNotificationRepository,
        private readonly recipientService: RecipientService
    ) {
    }

    public async updateStatus() {
        const notifications = await this.notificationRepository.findSentUnconfirmed();

        for await (const receipt of this.transport.confirmStatuses(notifications)) {
            winston.info("Push notification status confirmed", {
                recipient_id: receipt.notification.message.recipientId,
                push_notification_id: receipt.notification.id,
                receipt_id: receipt.notification.receiptId,
                status: receipt.status,
            });

            await this.notificationRepository.setDeliveryStatus(receipt);
            await this.handleReceipt(receipt);
        }
    }

    private async handleReceipt(receipt: PushNotificationReceipt) {
        if (!receipt.data || !receipt.data.details || !receipt.data.details.error) {
            return;
        }

        const error = receipt.data.details.error;
        if (error === "DeviceNotRegistered") {
            await this.recipientService.removeDevice(receipt.notification.pushToken);
        } else {
            winston.error(error, {
                recipient_id: receipt.notification.message.recipientId,
                push_notification_id: receipt.notification.id,
                receipt_id: receipt.notification.receiptId,
                receipt_data: receipt.data,
            });
        }
    }
}
