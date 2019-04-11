import * as moment from "moment-timezone";
import { Event } from "../Interfaces/Event";
import { EventNotification } from "./EventNotification";
import { Recipient } from "../Recipient/Models/Recipient";
import { max, min } from "../utils";
import { Moment } from "moment-timezone";

/**
 * Responsibility:
 * given events and recipient
 * choose which time is the best to notify recipient about each of them
 * (in the edge case scenario there may be no such time)
 */
export class EventNotificationScheduler {
    public schedule(recipient: Recipient, events: Event[], targetDay: Moment): EventNotification[] {
        const preferences = recipient.preferences;

        const targetDayNotificationStart = moment(targetDay)
            .set("hour", preferences.earliestHour)
            .set("minute", preferences.earliestMinute)
            .set("second", 0);

        const targetDayNotificationEnd = moment(targetDay)
            .set("hour", preferences.latestHour)
            .set("minute", preferences.latestMinute)
            .set("second", 0);

        const notifications = [];

        for (const event of events) {
            if (
                event.expirationTime < targetDayNotificationStart ||
                event.readyTime > targetDayNotificationEnd
            ) {
                continue;
            }

            // greedily schedule earliest possible time
            const readyTime = max(event.readyTime, targetDayNotificationStart);
            const expirationTime = min(event.expirationTime, targetDayNotificationEnd);

            notifications.push(new EventNotification(readyTime, expirationTime, event, recipient));
        }

        return notifications;
    }
}
