import {Device} from "./Device";
import {Event} from "../Interfaces/Event";


export class NotificationPreferences {
    constructor(public earlierstNotificationHour: number,
                public earlierstNotificationMinute: number,
                public messagesDailyLimit?: Number) {}
}


export class Recipient {
    constructor(public id: string,
                public name: string,
                public followedTopics: string[] = [],
                public devices: Device[] = [],
                public preferences?: NotificationPreferences,
                public notifiedEventIds: Set<string> = new Set(),
                public topicLastNotification: Map<string, Date> = new Map()) {}

    public markNotifiedAbout(event: Event) {
        this.notifiedEventIds.add(event.id);
        for (const topic of event.topics) {
            this.topicLastNotification.set(topic, new Date());
        }
    }
}
