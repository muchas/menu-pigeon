import { Recipient } from "../Recipient/Recipient";
import { Message } from "../Entity/Message";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import * as moment from "moment-timezone";
import { DurationInputArg2 } from "moment-timezone";

interface MessageThrottleRule {
    filter(recipient: Recipient, messages: Message[]): Message[];
}

class NeverMessageRule implements MessageThrottleRule {
    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (recipient.preferences.level === NotificationLevel.Never) {
            return [];
        }
        return messages;
    }
}

class FrequencyMessageRule implements MessageThrottleRule {
    public constructor(
        private readonly notificationLevel: NotificationLevel,
        private readonly format: string,
    ) {}

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (
            recipient.preferences.level === this.notificationLevel &&
            recipient.lastNotificationTime
        ) {
            const currentTime = moment().format(this.format);
            const lastTime = recipient.lastNotificationTime.format(this.format);
            if (currentTime !== lastTime) {
                return messages;
            } else {
                return [];
            }
        }
        return messages;
    }
}

class CycleMessageRule implements MessageThrottleRule {
    public constructor(
        private readonly notificationLevel: NotificationLevel,
        private readonly unit: DurationInputArg2,
    ) {}

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (
            recipient.preferences.level === this.notificationLevel &&
            recipient.lastNotificationTime
        ) {
            const cycleStart = moment().subtract("1", this.unit);
            if (recipient.lastNotificationTime <= cycleStart) {
                return messages;
            } else {
                return [];
            }
        }
        return messages;
    }
}

class LimitRule implements MessageThrottleRule {
    public constructor(private readonly limit: number) {}

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        return messages.slice(0, this.limit);
    }
}

export class MessageThrottleService {
    private readonly rules: MessageThrottleRule[];

    public constructor() {
        this.rules = [
            new NeverMessageRule(),
            new FrequencyMessageRule(NotificationLevel.Seldom, "YYYY-MM-ww"),
            new FrequencyMessageRule(NotificationLevel.Daily, "YYYY-MM-DD"),
            new CycleMessageRule(NotificationLevel.Often, "hour"),
            new LimitRule(1),
        ];
    }

    public throttle(recipient: Recipient, messages: Message[]): Message[] {
        let filteredMessages = messages;
        for (const rule of this.rules) {
            filteredMessages = rule.filter(recipient, filteredMessages);
        }
        return filteredMessages;
    }
}
