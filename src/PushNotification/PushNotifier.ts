import {RecipientRepository} from "../Recipient/RecipientRepository";
import {EventRepository} from "../Event/EventRepository";
import {EventDistributor} from "../Event/EventDistributor";
import {Recipient} from "../Recipient/Recipient";
import {Message} from "../Entity/Message";
import {Event} from "../Interfaces/Event";
import {PushNotificationSender} from "./PushNotificationSender";
import {LunchOfferMessageComposer} from "../Publication/LunchOfferMessageComposer";
import {EventNotification} from "../Event/EventNotification";
import {EventNotificationScheduler} from "../Event/EventNotificationScheduler";


// Responsibility:
// notify recipients about relevant events with push notifications

export class PushNotifier {

    private recipientRepository: RecipientRepository;
    private eventRepository: EventRepository;
    private pushNotificationSender: PushNotificationSender;
    private messageComposer: LunchOfferMessageComposer;
    private scheduler: EventNotificationScheduler;

    constructor(recipientRepository: RecipientRepository,
                eventRepository: EventRepository,
                pushNotificationSender: PushNotificationSender) {
        this.recipientRepository = recipientRepository;
        this.eventRepository = eventRepository;
        this.pushNotificationSender = pushNotificationSender;

        // TODO: extract dependencies?
        this.messageComposer = new LunchOfferMessageComposer();
        this.scheduler = new EventNotificationScheduler();
    }

    public async notifyAll(time: Date) {
        const events = await this.eventRepository.findRelevant(time);
        const recipients = await this.recipientRepository.findAll();
        const recipientsById = new Map(recipients.map((r): [string, Recipient] => [r.id, r]));

        const distributor = new EventDistributor(events);
        const distributedEvents = distributor.distribute(recipients);

        const notifications = this.prepareNotifications(recipientsById, distributedEvents, time);
        const recipientMessages = this.composeMessages(recipientsById, notifications);

        this.applyMessagingLimits(recipientsById, recipientMessages);

        const messages = Array
            .from(recipientMessages.values())
            .reduce((previous, messages) => previous.concat(messages));

        await this.pushNotificationSender.schedule(messages);

        await this.markNotified(recipientsById, events, messages);
    }

    private prepareNotifications(recipients: Map<string, Recipient>,
                                 events: Map<string, Event[]>,
                                 currentTime: Date): Map<string, EventNotification[]> {
        const notifications = new Map();

        events.forEach((events, recipientId) => {
            const recipient = recipients.get(recipientId);
            const recipientNotifications = this.scheduler
                .schedule(recipient, events)
                .filter((n) =>
                    n.readyTime >= currentTime &&
                    n.expirationTime <= currentTime &&
                    !recipient.notifiedEventIds.has(n.event.id));

           notifications.set(recipientId, recipientNotifications);
        });

        return notifications;
    }

    private composeMessages(recipients: Map<string, Recipient>,
                            notifications: Map<string, EventNotification[]>): Map<string, Message[]> {
        const messages = new Map<string, Message[]>();

        notifications.forEach((notifications, recipientId) => {
            const recipient = recipients.get(recipientId);
            const events = notifications.map((n) => n.event);
            const recipientMessages = this.messageComposer.compose(recipient, events);

            messages.set(recipientId, recipientMessages);
        });

        return messages;
    }

    private applyMessagingLimits(recipients: Map<string, Recipient>,
                                 messages: Map<string, Message[]>) {
        // TODO: apply recipient daily messages limits and message priorities
    }

    private async markNotified(recipients: Map<string, Recipient>,
                               events: Event[],
                               messages: Message[]) {
        const eventsById = new Map(events.map((e): [string, Event] => [e.id, e]));

        let recipient;
        let event;

        for (const message of messages) {
            recipient = recipients.get(message.recipientId);

            for (const eventId of message.eventIds) {
                event = eventsById.get(eventId);
                recipient.markNotifiedAbout(event);
            }
        }
    }
}
