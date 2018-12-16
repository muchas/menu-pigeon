import { Device } from "queue/lib/Messages/Recipient";

export class RecipientDevice implements Device {
    public constructor(
        public pushToken: string,
        public readonly createdAt: Date
    ) {
    }
}
