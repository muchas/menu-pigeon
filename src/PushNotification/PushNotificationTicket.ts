import { PushNotification } from "../Entity/PushNotification";
import { Moment } from "moment-timezone";
import * as moment from "moment-timezone";

export class PushNotificationTicket {
    public constructor(
        public notification: PushNotification,
        public sentSuccessfully: boolean = true,
        public receiptId?: string,
        public data?: object,
        public error?: object,
        public sentAt: Moment = moment(),
    ) {}
}
