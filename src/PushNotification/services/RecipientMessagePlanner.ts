import { injectable } from "inversify";
import { LunchOfferMessageComposer } from "../../Publication/LunchOffer/LunchOfferMessageComposer";
import { EventNotificationScheduler } from "../../Event/services/EventNotificationScheduler";
import { MessageThrottleService } from "./MessageThrottleService";
import { EventDistributor } from "../../Event/services/EventDistributor";
import { Recipient } from "../../Recipient/models/Recipient";
import { Event } from "../../Interfaces/Event";
import { Moment } from "moment-timezone";
import { EventNotification } from "../../Event/models/EventNotification";
import { Message } from "../../Entity/Message";
import { LunchOfferEvent } from "../../Publication/LunchOffer/LunchOfferEvent";

@injectable()
export class RecipientMessagePlanner {
    public constructor(
        private readonly messageComposer: LunchOfferMessageComposer,
        private readonly scheduler: EventNotificationScheduler,
        private readonly distributor: EventDistributor,
        private readonly throttleService: MessageThrottleService,
    ) {}

    public planMessages(recipient: Recipient, events: Event[], currentTime: Moment): Message[] {
        const recipientEvents = this.distributor.filterRelevantFor(recipient, events);
        const notifications = this.prepareNotifications(recipient, recipientEvents, currentTime);
        // TODO: refactor
        const messages = this.messageComposer.compose(
            recipient,
            notifications.map(n => n.event as LunchOfferEvent),
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
}
