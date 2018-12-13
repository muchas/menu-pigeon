import {Event} from "../Interfaces/Event";
import {Recipient} from "../Recipient/Recipient";


// Responsibility: targeting recipients
// Analyzed properties:
// - interest expressed in following given topic,
// TODO: - distance between event and recipient location,

export class EventDistributor {

    private readonly events: Event[];

    constructor(events: Event[]) {
        this.events = events;
    }

    public distribute(recipients: Recipient[]): Map<string, Event[]> {
        const recipientEvents = new Map<string, Event[]>();

        for (const recipient of recipients) {
            for (const event of this.events) {
                if (!this.shouldKnowAbout(recipient, event)) {
                    continue;
                }

                if (recipientEvents.has(recipient.id)) {
                    recipientEvents.get(recipient.id).push(event);
                } else {
                    recipientEvents.set(recipient.id, [event]);
                }
            }

        }

        return recipientEvents;
    }

    private shouldKnowAbout(recipient: Recipient, event: Event): boolean {
        const followedTopics = new Set(recipient.followedTopics);
        for (const topic of event.topics) {
            if (followedTopics.has(topic)) {
                return true;
            }
        }
        return false;
    }
}
