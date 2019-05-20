import { MessageComposer } from "../../Interfaces/MessageComposer";
import { Recipient } from "../../Recipient/models/Recipient";
import { Message, MessagePriority } from "../../Entity/Message";
import { LUNCH_OFFER_EVENT_TYPE, LunchOfferEvent } from "./LunchOfferEvent";
import { min } from "moment-timezone";
import { capitalize, sample } from "../../utils";
import { Event } from "../../Interfaces/Event";
import { LUNCH_NOTIFICATION_TYPE } from "./constants";
import { NotificationLevel } from "queue/lib/Messages/Recipient";

export class LunchOfferMessageComposer implements MessageComposer {
    private readonly universalMessageTitles: string[] = [
        "Gotowy na lunch?",
        "Sprawdź dzisiejsze lunche!",
        "Wybierz swój lunch",
    ];

    public compose(recipient: Recipient, events: Event[]): Message[] {
        const offerEvents = events
            .filter(event => event.eventType === LUNCH_OFFER_EVENT_TYPE)
            .map(event => event as LunchOfferEvent);

        const businessCount = new Set(offerEvents.map(e => e.content.businessId)).size;

        if (businessCount <= 0) {
            return [];
        }
        if (businessCount === 1) {
            const event = offerEvents[0];
            const businessName = event.content.businessName;
            return [
                this.createMessage(
                    recipient,
                    offerEvents,
                    sample([this.getRandomMessageTitle(), "Nowa oferta lunchowa"]),
                    `Oferta na dziś od ${businessName} jest już dostępna`,
                ),
            ];
        }

        if (recipient.preferences.level === NotificationLevel.Daily) {
            return [
                this.createMessage(
                    recipient,
                    offerEvents,
                    "Twoje codzienne podsumowanie",
                    this.getMessageBody(businessCount),
                ),
            ];
        }

        return [
            this.createMessage(
                recipient,
                offerEvents,
                this.getRandomMessageTitle(),
                this.getMessageBody(businessCount),
            ),
        ];
    }

    private createMessage(
        recipient: Recipient,
        events: LunchOfferEvent[],
        title: string,
        body: string,
        priority: MessagePriority = "high",
    ): Message {
        const minExpirationTime = min(events.map(e => e.expirationTime)).toDate();
        const slugs = events.map(event => event.content.businessSlug);
        const message = new Message();
        message.recipientId = recipient.id;
        message.title = capitalize(title);
        message.body = capitalize(body);
        message.priority = priority;
        message.expirationTime = minExpirationTime;
        message.setEventType(LUNCH_OFFER_EVENT_TYPE);
        message.setEventIds(events.map(event => event.id));
        message.setTopics(this.getMessageTopics(recipient, events));
        message.setNotificationData({ slugs, type: LUNCH_NOTIFICATION_TYPE });
        return message;
    }

    private getMessageTopics(recipient: Recipient, events: LunchOfferEvent[]): string[] {
        return events
            .map(event => event.topics.filter(topic => recipient.followedTopics.has(topic)))
            .reduce((memo, item) => memo.concat(item), []);
    }

    private getRandomMessageTitle(): string {
        return sample(this.universalMessageTitles);
    }

    private getMessageBody(businessCount: number): string {
        const modulo = businessCount % 10;

        if (businessCount <= 0) {
            return "Kliknij, aby sprawdzić szczegóły";
        }

        if (businessCount === 1) {
            return "1 obserwowany lokal zamieścił już ofertę lunchową";
        }

        if (modulo > 1 && modulo < 5) {
            return `${businessCount} obserwowane lokale zamieściły już ofertę lunchową`;
        }

        if (modulo >= 5 || modulo === 1) {
            return `${businessCount} obserwowanych lokali zamieściło już ofertę lunchową`;
        }

        return "Kliknij, aby sprawdzić szczegóły";
    }
}
