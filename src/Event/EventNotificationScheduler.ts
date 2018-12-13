import {Event} from "../Interfaces/Event";
import {EventNotification} from "./EventNotification";
import {NotificationPreferences, Recipient} from "../Recipient/Recipient";


// Responsibility:
// given events and recipient
// choose which time is the best to notify recipient about each of them
// (in the edge case scenario there may be no such time)

export class EventNotificationScheduler {

    public schedule(recipient: Recipient,
                    events: Event[],
                    targetDay: Date): EventNotification[] {
        // TODO: implement
        const notifications = [];
        const preferences = recipient.preferences || new NotificationPreferences(0 ,0);

        // greedily schedule earliest possible time

        for (const event of events) {
            if (event.expirationTime) {
                continue;
            }
        }

        return notifications;
    }
}
