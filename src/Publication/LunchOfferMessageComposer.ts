import {MessageComposer} from "../Interfaces/MessageComposer";
import {Recipient} from "../Recipient/Recipient";
import {Message, MessagePriority} from "../Entity/Message";
import {LunchOfferEvent} from "./LunchOfferEvent";


export class LunchOfferMessageComposer implements MessageComposer {

    public compose(recipient: Recipient, events: LunchOfferEvent[]): Message[] {
        if (events.length == 1) {
            const event = events[0];
            return [
                this.createMessage(
                    recipient.id,
                    `${event.business.name} opublikowali ofertę lunchową`,
                    'Kliknij, aby sprawdzić szczegóły',
                    'high',
                    event.expirationTime)
            ];
        }

        const minExpirationTime = Math.min.apply(null, events.map((e) => e.expirationTime));
        const businessCount = Array.from(new Set(events.map(e => e.business.id))).length;

        return [
            this.createMessage(
                recipient.id,
            'Dzisiejszy lunch',
            `${businessCount} obserwowane lokale zamieściły już ofertę lunchową`,
            'high',
            minExpirationTime)
        ]
    }

    private createMessage(recipientId: string,
                          title: string,
                          body: string,
                          priority: MessagePriority,
                          expirationTime: Date): Message {
        // TODO: extract to Message constructor
        const message = new Message();
        message.recipientId = recipientId;
        message.title = title;
        message.body = body;
        message.priority = priority;
        message.expirationTime = expirationTime;
        return message
    }
}
