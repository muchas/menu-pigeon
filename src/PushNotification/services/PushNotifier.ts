import { Recipient } from "../../Recipient/models/Recipient";
import { Message } from "../../Entity/Message";
import { Event } from "../../Interfaces/Event";
import { PushNotificationSender } from "./PushNotificationSender";
import { injectable } from "inversify";
import { EventRepository } from "../../Interfaces/EventRepository";
import { Moment } from "moment-timezone";
import { RecipientMessagePlanner } from "./RecipientMessagePlanner";
import { RecipientRepository } from "../../Interfaces/RecipientRepository";

/**
 * #GOOD-TO-SHOW
 *
 * Responsibility:
 * notify recipients about relevant events with push notifications
 */
@injectable()
export class PushNotifier {
    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly eventRepository: EventRepository,
        private readonly recipientMessagePlanner: RecipientMessagePlanner,
        private readonly pushNotificationSender: PushNotificationSender,
    ) {}

    public async notifyAll(currentTime: Moment): Promise<void> {
        const events = await this.eventRepository.findRelevant(currentTime);
        const recipients = await this.recipientRepository.findAndLockAll();

        try {
            const messages = recipients
                .map(recipient =>
                    this.recipientMessagePlanner.planMessages(recipient, events, currentTime),
                )
                .reduce((previous, current) => previous.concat(current), []);

            await this.pushNotificationSender.schedule(recipients, messages);
            await this.markNotified(recipients, events, messages);
        } finally {
            await this.recipientRepository.unlock(recipients);
        }
    }

    private async markNotified(
        recipients: Recipient[],
        events: Event[],
        messages: Message[],
    ): Promise<void> {
        const recipientsById = new Map(recipients.map((r): [string, Recipient] => [r.id, r]));
        const eventsById = new Map(events.map((e): [string, Event] => [e.id, e]));
        for (const message of messages) {
            const recipient = recipientsById.get(message.recipientId);

            for (const eventId of message.eventIds) {
                const event = eventsById.get(eventId);
                recipient.markNotifiedAbout(event);
            }
        }

        await this.recipientRepository.addMany(recipients);
    }
}
