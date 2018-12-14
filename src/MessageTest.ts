import "reflect-metadata";
import * as moment from 'moment';
import {Event} from "./Interfaces/Event";
import {Business, PersistedPublication} from "./Publication/Business";
import {EventRepository} from "./Event/EventRepository";
import {LunchOfferEvent} from "./Publication/LunchOfferEvent";
import {Recipient} from "./Recipient/Recipient";
import {PushNotificationSender} from "./PushNotification/PushNotificationSender";
import {ExpoTransport} from "./PushNotification/ExpoTransport";
import {PushNotifier} from "./PushNotification/PushNotifier";
import {createConnection} from "typeorm";
import {RecipientRepository} from "./Recipient/RecipientRepository";
import Expo from "expo-server-sdk";
import {PushNotificationRepository} from "./PushNotification/PushNotificationRepository";
import {Device} from "./Recipient/Device";


createConnection().then(async connection => {
    let event1: Event;
    let event2: Event;
    let event3: Event;
    let event4: Event;
    let events: Event[];
    let eventRepository: EventRepository;
    let today;

    let publication1: PersistedPublication;
    let publication2: PersistedPublication;
    let publication3: PersistedPublication;
    let publication4: PersistedPublication;

    let business1: Business;
    let business2: Business;
    let business3: Business;
    let business4: Business;

    today = moment();
    const morning = today.toDate();

    business1 = new Business('1', 'Bococa Bistro');
    business2 = new Business('2', 'I Love Coffee Kawiarnia');
    business3 = new Business('3', 'Lunch Bar Majeranek');
    business4 = new Business('4', 'Bistro Maro');

    publication1 = new PersistedPublication(1, business1);
    publication2 = new PersistedPublication(2, business2);
    publication3 = new PersistedPublication(3, business3);
    publication4 = new PersistedPublication(4, business4);

    event1 = new LunchOfferEvent('e#1', morning, morning, ['business-1'], publication1);
    event2 = new LunchOfferEvent('e#2', morning, morning, ['business-2'], publication2);
    event3 = new LunchOfferEvent('e#3', morning, morning, ['business-3'], publication3);
    event4 = new LunchOfferEvent('e#4', morning, morning, ['business-4'], publication4);

    events = [event1, event2, event3, event4];

    eventRepository = new EventRepository(events);

    const recipient1 = new Recipient('r#1', 'Iza', ['business-2', 'business-3']);
    const recipient2 = new Recipient('r#2', 'Michal', ['business-3']);

    const device = new Device('ExponentPushToken[tLEWtTPeOvkhYxrVxIvE7q]', morning);

    const recipient3 = new Recipient('r#3', 'Sławek', ['business-1', 'business-2', 'business-3', 'business-4'], [device]);

    const recipients = [recipient1, recipient2, recipient3];
    const recipientRepository = new RecipientRepository(recipients);
    const notificationRepository = new PushNotificationRepository(connection);
    const transport = new ExpoTransport(new Expo());
    const sender = new PushNotificationSender(transport, notificationRepository);

    const notifier = new PushNotifier(recipientRepository, eventRepository, sender);

    await notifier.notifyAll(today.toDate());

    await sender.sendReady();

}).catch(error => console.log(error));
