import { createContainer } from "../../src/inversify.config";
import "reflect-metadata";
import * as moment from "moment";
import { Event } from "../../src/Interfaces/Event";
import { EventRepository } from "../../src/Event/EventRepository";
import { LunchOfferEvent } from "../../src/Publication/LunchOfferEvent";
import { Recipient } from "../../src/Recipient/Recipient";
import { PushNotificationSender } from "../../src/PushNotification/PushNotificationSender";
import { PushNotifier } from "../../src/PushNotification/PushNotifier";
import { Connection, createConnection } from "typeorm";
import { RecipientRepository } from "../../src/Recipient/RecipientRepository";
import { RecipientDevice } from "../../src/Recipient/RecipientDevice";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { Container } from "inversify";

describe("Push notification integration test", () => {
    let container: Container;

    beforeEach(async () => {
        const connection = await createConnection();
        container = createContainer();
        container.bind(Connection).toConstantValue(connection);
    });

    it.skip("should send expo push notification", async () => {
        let event1: Event;
        let event2: Event;
        let event3: Event;
        let event4: Event;
        let events: Event[];
        let today;

        let publication1: PersistedPublication;
        let publication2: PersistedPublication;
        let publication3: PersistedPublication;
        let publication4: PersistedPublication;

        today = moment();
        const morning = today.toDate();

        publication1 = new PersistedPublication(
            1, "1", "Bococa Bistro", [], morning
        );
        publication2 = new PersistedPublication(
            2, "2", "I Love Coffee Kawiarnia", [], morning
        );
        publication3 = new PersistedPublication(
            3, "3", "Lunch Bar Majeranek", [], morning
        );
        publication4 = new PersistedPublication(
            4, "4", "Bistro Maro", [], morning
        );

        event1 = new LunchOfferEvent("e#1", morning, morning, ["business-1"], publication1);
        event2 = new LunchOfferEvent("e#2", morning, morning, ["business-2"], publication2);
        event3 = new LunchOfferEvent("e#3", morning, morning, ["business-3"], publication3);
        event4 = new LunchOfferEvent("e#4", morning, morning, ["business-4"], publication4);

        events = [event1, event2, event3, event4];

        const device3 = new RecipientDevice("ExponentPushToken[EQuFAcMoN2eE64nHElSquf]", morning);
        const recipient1 = new Recipient(
            "r#1",
            "Iza",
            ["business-2", "business-3", "business-4"],
            [device3]
        );

        const device2 = new RecipientDevice("ExponentPushToken[dtdyV1PhS9NpKWze4p29VE]", morning);
        const recipient2 = new Recipient("r#2", "Michal", ["business-3"], [device2]);

        const device1 = new RecipientDevice("ExponentPushToken[tLEWtTPeOvkhYxrVxIvE7q]", morning);
        const recipient3 = new Recipient(
            "r#3",
            "Sławek",
            ["business-1", "business-2", "business-3", "business-4"],
            [device1]
        );

        const recipients = [recipient1, recipient2, recipient3];

        const notifier = container.get<PushNotifier>(PushNotifier);
        const sender = container.get<PushNotificationSender>(PushNotificationSender);
        const eventRepository = container.get<EventRepository>(EventRepository);
        const recipientRepository = container.get<RecipientRepository>(RecipientRepository);

        eventRepository.addMany(events);
        recipientRepository.addMany(recipients);
        await notifier.notifyAll(today.toDate());
        await sender.sendReady();
    });
});
