import { Device } from "queue/lib/Messages/Recipient";
import { Moment } from "moment-timezone";

export class RecipientDevice implements Device {
    public constructor(
        public pushToken: string,
        public readonly createdAt: Moment,
    ) {
    }
}
