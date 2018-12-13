import {PushNotification} from "../Entity/PushNotification";

export enum PushNotificationStatus {
    SENT = 0,
    DELIVERED,
    ERROR,
    UNKNOWN,
}


export class PushNotificationReceipt {

    constructor(public notification: PushNotification,
                public fetchedSuccessfully: boolean = true,
                public status?: PushNotificationStatus,
                public data?: Object) {}
}
