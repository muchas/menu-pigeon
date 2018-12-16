import {RecipientRepository} from '../Recipient/RecipientRepository';
import {EventRepository} from '../Event/EventRepository';
import {EventDistributor} from '../Event/EventDistributor';
import {Recipient} from '../Recipient/Recipient';
import {Message} from '../Entity/Message';
import {Event} from '../Interfaces/Event';
import {PushNotificationSender} from './PushNotificationSender';
import {LunchOfferMessageComposer} from '../Publication/LunchOfferMessageComposer';
import {EventNotification} from '../Event/EventNotification';
import {EventNotificationScheduler} from '../Event/EventNotificationScheduler';
import {LunchOfferEvent} from '../Publication/LunchOfferEvent';
import {MessageThrottleService} from "./MessageThrottleService";

/**
 * Responsibility:
 * notify recipients about relevant events with push notifications
 */
export class PushNotifier {

    private messageComposer: LunchOfferMessageComposer;
    private scheduler: EventNotificationScheduler;
    private distributor: EventDistributor;
    private throttleService: MessageThrottleService;

    constructor(private recipientRepository: RecipientRepository,
                private eventRepository: EventRepository,
                private pushNotificationSender: PushNotificationSender) {
        this.messageComposer = new LunchOfferMessageComposer();
        this.scheduler = new EventNotificationScheduler();
        this.distributor = new EventDistributor();
        this.throttleService = new MessageThrottleService();
    }

    public async notifyAll(currentTime: Date) {
        const events = await this.eventRepository.findRelevant(currentTime);
        const recipients = await this.recipientRepository.findAll();

        const messages = recipients
            .map((recipient) => this.makeMessages(recipient, events, currentTime))
            .reduce((previous, current) => previous.concat(current), []);

        await this.pushNotificationSender.schedule(recipients, messages);
        await this.markNotified(recipients, events, messages);
    }

    private makeMessages(recipient: Recipient, events: Event[], currentTime: Date): Message[] {
        const recipientEvents = this.distributor.filterRelevantFor(recipient, events);
        const notifications = this.prepareNotifications(recipient, recipientEvents, currentTime);
        const messages = this.messageComposer.compose(recipient, notifications.map(n => n.event as LunchOfferEvent));

        return this.throttle(recipient, messages);
    }

    private prepareNotifications(
        recipient: Recipient,
        events: Event[],
        currentTime: Date
    ): EventNotification[] {
        return this.scheduler
            .schedule(recipient, events, currentTime)
            .filter((notification) =>
                notification.readyTime <= currentTime &&
                notification.expirationTime >= currentTime &&
                !recipient.notifiedEventIds.has(notification.event.id));
    }

    private throttle(recipient: Recipient, messages: Message[]): Message[] {
        // TODO: - recipient daily messages limits
        // TODO: - take into consideration message priorities
        // TODO: - recipient topic last notification time
        return messages;
    }

    private async markNotified(recipients: Recipient[],
                               events: Event[],
                               messages: Message[]) {
        const recipientsById = new Map(recipients.map((r): [string, Recipient] => [r.id, r]));
        const eventsById = new Map(events.map((e): [string, Event] => [e.id, e]));

        for (const message of messages) {
            const recipient = recipientsById.get(message.recipientId);

            for (const eventId of message.eventIds) {
                const event = eventsById.get(eventId);
                recipient.markNotifiedAbout(event);
            }
        }
    }
}
