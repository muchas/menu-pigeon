import * as moment from "moment";
import { Event } from "../Interfaces/Event";
import { EventNotification } from "./EventNotification";
import { Recipient, RecipientPreferences } from "../Recipient/Recipient";
import { max, min } from "../utils";
import { NotificationLevel } from "queue/lib/Messages/Recipient";

/**
 * Responsibility:
 * given events and recipient
 * choose which time is the best to notify recipient about each of them
 * (in the edge case scenario there may be no such time)
 */
export class EventNotificationScheduler {

    public schedule(recipient: Recipient,
                    events: Event[],
                    targetDay: Date): EventNotification[] {
        const defaultPreferences = new RecipientPreferences(9, 0, NotificationLevel.Daily);
        const preferences = recipient.preferences || defaultPreferences;

        const targetDayNotificationStart = moment(targetDay)
            .set("hour", preferences.earliestHour)
            .set("minute", preferences.earliestMinute)
            .set("second", 0)
            .toDate();

        const targetDayNotificationEnd = moment(targetDay)
            .set("hour", preferences.latestHour)
            .set("minute", preferences.latestMinute)
            .set("second", 0)
            .toDate();

        const notifications = [];

        for (const event of events) {
            if (event.expirationTime < targetDayNotificationStart || event.readyTime > targetDayNotificationEnd) {
                continue;
            }

            // greedily schedule earliest possible time
            const readyTime = max(event.readyTime, targetDayNotificationStart);
            const expirationTime = min(event.expirationTime, targetDayNotificationEnd);

            notifications.push(
                new EventNotification(readyTime, expirationTime, event, recipient)
            );
        }

        return notifications;
    }
}
