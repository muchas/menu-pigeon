import { RecipientDevice } from "./RecipientDevice";
import { Event } from "../../Interfaces/Event";
import { NotificationLevel, NotificationPreferences } from "queue/lib/Messages/Recipient";
import { Moment } from "moment-timezone";
import * as moment from "moment-timezone";

export class RecipientPreferences implements NotificationPreferences {
    public readonly latestHour: number = 17;
    public readonly latestMinute: number = 0;

    public constructor(
        public earliestHour: number,
        public earliestMinute: number,
        public level: NotificationLevel,
    ) {}
}

export class Recipient {
    public constructor(
        public id: string,
        public name?: string,
        public devices: RecipientDevice[] = [],
        public preferences: RecipientPreferences = new RecipientPreferences(
            9,
            0,
            NotificationLevel.Daily,
        ),
        private readonly _notifiedEventIds: Set<string> = new Set(),
        private readonly _topicLastNotification: Map<string, moment.Moment> = new Map(),
        private readonly _followedTopics: Map<string, moment.Moment> = new Map(),
        private _lastNotificationTime?: Moment,
        private readonly _createdAt: Moment = moment(),
    ) {
        //
    }

    public get pushTokens(): string[] {
        return this.devices.map(device => device.pushToken);
    }

    public get followedTopics(): Map<string, moment.Moment> {
        return this._followedTopics;
    }

    public get topicLastNotification(): Map<string, moment.Moment> {
        return this._topicLastNotification;
    }

    public get notifiedEventIds(): Set<string> {
        return this._notifiedEventIds;
    }

    public get lastNotificationTime(): Moment | undefined {
        return this._lastNotificationTime;
    }

    public get createdAt(): Moment {
        return this._createdAt;
    }

    public markAsNotified(): void {
        this._lastNotificationTime = moment();
    }

    public markNotifiedAbout(event: Event, notificationTime: Moment = moment()): void {
        this.notifiedEventIds.add(event.id);
        for (const topic of event.topics) {
            this.topicLastNotification.set(topic, notificationTime);
        }

        if (!this.lastNotificationTime || notificationTime > this.lastNotificationTime) {
            this._lastNotificationTime = notificationTime;
        }
    }

    public followOnly(topics: string[]): void {
        const followedTopics = [...this.followedTopics.keys()];
        const topicsToFollow = topics.filter(topic => followedTopics.indexOf(topic) === -1);
        const topicsToUnfollow = followedTopics.filter(topic => topics.indexOf(topic) === -1);

        for (const topic of topicsToFollow) {
            this.follow(topic);
        }

        for (const topic of topicsToUnfollow) {
            this.unfollow(topic);
        }
    }

    public follow(topic: string): void {
        if (this.followedTopics.has(topic)) {
            return;
        }

        this.followedTopics.set(topic, moment());
    }

    public unfollow(topic: string): void {
        this.followedTopics.delete(topic);
    }

    public removeDevice(pushToken: string): void {
        this.removeDevices([pushToken]);
    }

    public removeDevices(pushTokens: string[]): void {
        this.devices = this.devices.filter(
            device => pushTokens.find(token => token === device.pushToken) === undefined,
        );
    }
}
