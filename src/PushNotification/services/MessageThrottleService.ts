import { Recipient } from "../../Recipient/models/Recipient";
import { Message } from "../../Entity/Message";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import * as moment from "moment-timezone";
import { DurationInputArg2 } from "moment-timezone";
import { DurationInputArg1 } from "moment";

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
        private readonly granularity: moment.unitOfTime.StartOf,
    ) {}

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (
            recipient.preferences.level === this.notificationLevel &&
            recipient.lastNotificationTime
        ) {
            if (!moment().isSame(recipient.lastNotificationTime, this.granularity)) {
                return messages;
            }
            return [];
        }
        return messages;
    }
}

class CycleMessageRule implements MessageThrottleRule {
    public constructor(
        private readonly notificationLevel: NotificationLevel,
        private readonly amount: DurationInputArg1,
        private readonly unit: DurationInputArg2,
    ) {}

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (
            recipient.preferences.level === this.notificationLevel &&
            recipient.lastNotificationTime
        ) {
            const cycleStart = moment().subtract(this.amount, this.unit);
            if (recipient.lastNotificationTime <= cycleStart) {
                return messages;
            }
            return [];
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
            new FrequencyMessageRule(NotificationLevel.Seldom, "week"),
            new FrequencyMessageRule(NotificationLevel.Daily, "day"),
            new CycleMessageRule(NotificationLevel.Often, 20, "minute"),
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
