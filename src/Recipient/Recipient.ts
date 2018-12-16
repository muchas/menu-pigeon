import {RecipientDevice} from './RecipientDevice';
import {Event} from '../Interfaces/Event';
import {NotificationLevel, NotificationPreferences} from 'queue/lib/Messages/Recipient';

export class RecipientPreferences implements NotificationPreferences {

    public readonly latestHour: number = 17;
    public readonly latestMinute: number = 0;

    constructor(public earliestHour: number,
                public earliestMinute: number,
                public level: NotificationLevel) {}
}

export class Recipient {

    public followedTopics: Set<string>;

    constructor(public id: string,
                public name?: string,
                followedTopics: string[] = [],
                public devices: RecipientDevice[] = [],
                public preferences?: RecipientPreferences,
                public notifiedEventIds: Set<string> = new Set(),
                public topicLastNotification: Map<string, Date> = new Map()) {
        this.followedTopics = new Set(followedTopics);
    }

    public get pushTokens(): string[] {
        return this.devices.map((device) => device.pushToken);
    }

    public markNotifiedAbout(event: Event) {
        this.notifiedEventIds.add(event.id);
        for (const topic of event.topics) {
            this.topicLastNotification.set(topic, new Date());
        }
    }

    public follow(topic: string) {
        return this.followedTopics.add(topic);
    }

    public unfollow(topic: string) {
        return this.followedTopics.delete(topic);
    }
}
