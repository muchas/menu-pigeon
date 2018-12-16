import { RecipientDevice } from "./RecipientDevice";
import { Event } from "../Interfaces/Event";
import { NotificationLevel, NotificationPreferences } from "queue/lib/Messages/Recipient";
import { max, Moment } from "moment";
import * as moment from "moment";

export class RecipientPreferences implements NotificationPreferences {

    public readonly latestHour: number = 17;
    public readonly latestMinute: number = 0;

    public constructor(
        public earliestHour: number,
        public earliestMinute: number,
        public level: NotificationLevel
    ) {
    }
}

export class Recipient {

    public followedTopics: Set<string>;

    public constructor(
        public id: string,
        public name?: string,
        followedTopics: string[] = [],
        public devices: RecipientDevice[] = [],
        public preferences: RecipientPreferences = new RecipientPreferences(
            9, 0, NotificationLevel.Daily
        ),
        public notifiedEventIds: Set<string> = new Set(),
        public topicLastNotification: Map<string, Date> = new Map()
    ) {
        this.followedTopics = new Set(followedTopics);
    }

    public get pushTokens(): string[] {
        return this.devices.map((device) => device.pushToken);
    }

    public get lastNotificationTime(): Moment | undefined {
        const dates = Array.from(this.topicLastNotification.values());
        if (dates.length === 0) {
            return;
        }
        return max(dates.map((date) => moment(date)));
    }

    public markNotifiedAbout(event: Event, notificationTime: Date = new Date()) {
        this.notifiedEventIds.add(event.id);
        for (const topic of event.topics) {
            this.topicLastNotification.set(topic, notificationTime);
        }
    }

    public follow(topic: string) {
        return this.followedTopics.add(topic);
    }

    public unfollow(topic: string) {
        return this.followedTopics.delete(topic);
    }
}
