import {PushNotification} from "../Entity/PushNotification";

export class PushNotificationTicket {

    constructor(public notification: PushNotification,
                public sentSuccessfully: boolean = true,
                public receiptId?: string,
                public data?: Object,
                public error?: Object) {
    }
}
