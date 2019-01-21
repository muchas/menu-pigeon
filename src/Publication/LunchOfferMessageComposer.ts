import { MessageComposer } from "../Interfaces/MessageComposer";
import { Recipient } from "../Recipient/Recipient";
import { Message, MessagePriority } from "../Entity/Message";
import { LUNCH_OFFER_EVENT_TYPE, LunchOfferEvent } from "./LunchOfferEvent";
import { min } from "moment-timezone";
import { capitalize } from "../utils";
import { Event } from "../Interfaces/Event";

export class LunchOfferMessageComposer implements MessageComposer {

    public compose(recipient: Recipient, events: Event[]): Message[] {
        const offerEvents = events
            .filter(event => event.eventType === LUNCH_OFFER_EVENT_TYPE)
            .map(event => event as LunchOfferEvent);

        if (offerEvents.length <= 0) {
            return [];
        }
        if (offerEvents.length === 1) {
            const event = offerEvents[0];
            const greeting = this.makeGreeting(recipient);
            const businessName = event.content.businessName;
            return [
                this.createMessage(
                    recipient,
                    offerEvents,
                    "Czas na lunch",
                    `${greeting}${businessName} opublikował nową ofertę. Kliknij, aby sprawdzić szczegóły.`,
                    "high",
                ),
            ];
        }

        const businessCount = Array.from(new Set(offerEvents.map(e => e.content.businessId))).length;

        return [
            this.createMessage(
                recipient,
                offerEvents,
                `${this.makeGreeting(recipient)}sprawdź dzisiejszy lunch!`,
                `${businessCount} obserwowane lokale zamieściły już ofertę lunchową`,
                "high",
            ),
        ];
    }

    private makeGreeting(recipient: Recipient): string {
        if (recipient.name) {
            return `Hej ${recipient.name}, `;
        }
        return "";
    }

    private createMessage(recipient: Recipient,
                          events: LunchOfferEvent[],
                          title: string,
                          body: string,
                          priority: MessagePriority): Message {
        const minExpirationTime = min(events.map((e) => e.expirationTime)).toDate();
        const slugs = events.map((event) => event.content.businessSlug);
        const message = new Message();
        message.recipientId = recipient.id;
        message.title = capitalize(title);
        message.body = capitalize(body);
        message.priority = priority;
        message.expirationTime = minExpirationTime;
        message.setEventType(LUNCH_OFFER_EVENT_TYPE);
        message.setEventIds(events.map(event => event.id));
        message.setTopics(this.getMessageTopics(recipient, events));
        message.setNotificationData({slugs});
        return message;
    }

    private getMessageTopics(recipient: Recipient, events: LunchOfferEvent[]): string[] {
        return events
            .map(event => event.topics.filter(topic => recipient.followedTopics.has(topic)))
            .reduce((memo, item) => memo.concat(item), []);
    }
}
