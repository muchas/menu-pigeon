import {Event} from "../Interfaces/Event";
import {EventNotification} from "./EventNotification";
import {Recipient} from "../Recipient/Recipient";


// Responsibility:
// given events and recipient
// choose which time is the best to notify recipient about each of them
// (in the edge case scenario there may be not such time)


export class EventNotificationScheduler {

    public schedule(recipient: Recipient, events: Event[]): EventNotification[] {
        return [];
    }
}
