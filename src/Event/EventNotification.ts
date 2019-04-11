import { Event } from "../Interfaces/Event";
import { Recipient } from "../Recipient/Models/Recipient";
import { Moment } from "moment-timezone";

export class EventNotification {
    public constructor(
        public readyTime: Moment,
        public expirationTime: Moment,
        public event: Event,
        public recipient: Recipient,
    ) {}
}
