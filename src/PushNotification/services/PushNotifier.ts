import { EventDistributor } from "../../Event/services/EventDistributor";
import { Recipient } from "../../Recipient/models/Recipient";
import { Message } from "../../Entity/Message";
import { Event } from "../../Interfaces/Event";
import { PushNotificationSender } from "./PushNotificationSender";
import { LunchOfferMessageComposer } from "../../Publication/LunchOffer/LunchOfferMessageComposer";
import { EventNotification } from "../../Event/models/EventNotification";
import { EventNotificationScheduler } from "../../Event/services/EventNotificationScheduler";
import { MessageThrottleService } from "./MessageThrottleService";
import { injectable } from "inversify";
import { EventRepository } from "../../Interfaces/EventRepository";
import { Moment } from "moment-timezone";
import { RecipientMongoRepository } from "../../Recipient/repositories/RecipientMongoRepository";

/**
 * Responsibility:
 * notify recipients about relevant events with push notifications
 */
@injectable()
export class PushNotifier {
    private readonly messageComposer: LunchOfferMessageComposer;
    private readonly scheduler: EventNotificationScheduler;
    private readonly distributor: EventDistributor;
    private readonly throttleService: MessageThrottleService;

    public constructor(
        private readonly recipientRepository: RecipientMongoRepository,
        private readonly eventRepository: EventRepository,
        private readonly pushNotificationSender: PushNotificationSender,
    ) {
        this.messageComposer = new LunchOfferMessageComposer();
        this.scheduler = new EventNotificationScheduler();
        this.distributor = new EventDistributor();
        this.throttleService = new MessageThrottleService();
    }

    public async notifyAll(currentTime: Moment): Promise<void> {
        const events = await this.eventRepository.findRelevant(currentTime);
        const recipients = await this.recipientRepository.findAndLockAll();

        try {
            const messages = recipients
                .map(recipient => this.makeMessages(recipient, events, currentTime))
                .reduce((previous, current) => previous.concat(current), []);

            await this.pushNotificationSender.schedule(recipients, messages);
            await this.markNotified(recipients, events, messages);
        } finally {
            await this.recipientRepository.unlock(recipients);
        }
    }

    private makeMessages(recipient: Recipient, events: Event[], currentTime: Moment): Message[] {
        const recipientEvents = this.distributor.filterRelevantFor(recipient, events);
        const notifications = this.prepareNotifications(recipient, recipientEvents, currentTime);
        const messages = this.messageComposer.compose(
            recipient,
            notifications.map(n => n.event),
        );

        return this.throttleService.throttle(recipient, messages);
    }

    private prepareNotifications(
        recipient: Recipient,
        events: Event[],
        currentTime: Moment,
    ): EventNotification[] {
        return this.scheduler
            .schedule(recipient, events, currentTime)
            .filter(
                notification =>
                    notification.readyTime <= currentTime &&
                    notification.expirationTime >= currentTime &&
                    !recipient.notifiedEventIds.has(notification.event.id),
            );
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
