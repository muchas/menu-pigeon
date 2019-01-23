import { PushNotification } from "../Entity/PushNotification";

export enum PushNotificationStatus {
    SCHEDULED = 0,
    SENT,
    DELIVERED,
    ERROR,
    UNKNOWN,
}

export interface PushNotificationReceiptData {
    status?: string;
    message?: string;
    details?: {
        error?:
            | "DeviceNotRegistered"
            | "InvalidCredentials"
            | "MessageTooBig"
            | "MessageRateExceeded";
    };
}

export class PushNotificationReceipt {
    public constructor(
        public notification: PushNotification,
        public fetchedSuccessfully: boolean = true,
        public status?: PushNotificationStatus,
        public data?: PushNotificationReceiptData,
    ) {}
}
