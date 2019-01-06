import { MessageComposer } from "../Interfaces/MessageComposer";
import { Recipient } from "../Recipient/Recipient";
import { Message, MessagePriority } from "../Entity/Message";
import { LUNCH_OFFER_EVENT_TYPE, LunchOfferEvent } from "./LunchOfferEvent";
import * as moment from "moment";
import { min } from "moment";
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
            return [
                this.createMessage(
                    recipient.id,
                    "Czas na lunch",
                    `${this.makeGreeting(recipient)}${event.content.businessName} opublikował nową ofertę.
                    Kliknij, aby sprawdzić szczegóły.`,
                    "high",
                    event.expirationTime
                ),
            ];
        }

        const minExpirationTime = min(offerEvents.map((e) => moment(e.expirationTime))).toDate();
        const businessCount = Array.from(new Set(offerEvents.map(e => e.content.businessId))).length;

        return [
            this.createMessage(
                recipient.id,
                `${this.makeGreeting(recipient)}sprawdź dzisiejszy lunch!`,
                `${businessCount} obserwowane lokale zamieściły już ofertę lunchową`,
                "high",
                minExpirationTime),
        ];
    }

    private makeGreeting(recipient: Recipient): string {
        if (recipient.name) {
            return `Hej ${recipient.name}, `;
        }
        return "";
    }

    private createMessage(recipientId: string,
                          title: string,
                          body: string,
                          priority: MessagePriority,
                          expirationTime: Date): Message {
        const message = new Message();
        message.recipientId = recipientId;
        message.title = capitalize(title);
        message.body = capitalize(body);
        message.priority = priority;
        message.expirationTime = expirationTime;
        return message;
    }
}
