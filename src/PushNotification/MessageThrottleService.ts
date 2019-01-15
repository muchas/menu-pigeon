import { Recipient } from "../Recipient/Recipient";
import { Message } from "../Entity/Message";
import { LUNCH_EVENT_TYPE } from "../Publication/constants";
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
        private readonly unit: DurationInputArg2
    ) {
    }

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        if (recipient.preferences.level === this.notificationLevel && recipient.lastNotificationTime) {
            const weekAgo = moment().subtract("1", this.unit);
            if (recipient.lastNotificationTime <= weekAgo) {
                return messages.length > 0 ? [messages[0]] : messages;
            } else {
                return [];
            }
        }
        return messages;
    }
}

class LunchMessageRule implements MessageThrottleRule {

    public filter(recipient: Recipient, messages: Message[]): Message[] {
        let lunchEncountered = false;
        return messages.filter((message) => {
            if (message.eventType === LUNCH_EVENT_TYPE) {
                if (lunchEncountered) {
                    return false;
                }
                lunchEncountered = true;
            }
            return true;
        });
    }
}

export class MessageThrottleService {
    private readonly rules: MessageThrottleRule[];

    public constructor() {
        this.rules = [
            new NeverMessageRule(),
            new FrequencyMessageRule(NotificationLevel.Seldom, "week"),
            new FrequencyMessageRule(NotificationLevel.Daily, "day"),
            new FrequencyMessageRule(NotificationLevel.Often, "hour"),
            new LunchMessageRule(),
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
