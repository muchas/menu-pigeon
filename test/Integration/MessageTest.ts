import "reflect-metadata";
import * as moment from "moment-timezone";
import { Event } from "../../src/Interfaces/Event";
import { EventMemoryRepository } from "../../src/Event/EventMemoryRepository";
import { LunchOfferEvent } from "../../src/Publication/LunchOfferEvent";
import { Recipient, RecipientPreferences } from "../../src/Recipient/Recipient";
import { PushNotificationSender } from "../../src/PushNotification/PushNotificationSender";
import { PushNotifier } from "../../src/PushNotification/PushNotifier";
import { Connection, createConnection } from "typeorm";
import { RecipientDevice } from "../../src/Recipient/RecipientDevice";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { Container } from "inversify";
import { PushNotificationStatusChecker } from "../../src/PushNotification/PushNotificationStatusChecker";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { RecipientMongoRepository } from "../../src/Recipient/RecipientMongoRepository";
import { setupWithMongo } from "../utils";

describe("Push notification integration test", () => {
    let container: Container;

    beforeEach(async () => {
        const connection = await createConnection();
        container = await setupWithMongo();
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
        const tomorrow = today.add(1, "day").toDate();

        publication1 = new PersistedPublication(1, "1", "Bococa Bistro", "bococa", [], morning);
        publication2 = new PersistedPublication(
            2,
            "2",
            "I Love Coffee Kawiarnia",
            "ilc",
            [],
            morning,
        );
        publication3 = new PersistedPublication(
            3,
            "3",
            "Lunch Bar Majeranek",
            "majeranek",
            [],
            morning,
        );
        publication4 = new PersistedPublication(4, "4", "Bistro Maro", "maro", [], morning);

        event1 = new LunchOfferEvent("e#1", morning, tomorrow, ["business-1"], publication1);
        event2 = new LunchOfferEvent("e#2", morning, tomorrow, ["business-2"], publication2);
        event3 = new LunchOfferEvent("e#3", morning, tomorrow, ["business-3"], publication3);
        event4 = new LunchOfferEvent("e#4", morning, tomorrow, ["business-4"], publication4);

        events = [event1, event2, event3, event4];

        const device3 = new RecipientDevice("ExponentPushToken[EQuFAcMoN2eE64nHElSquf]", morning);
        const recipient1 = new Recipient(
            "r#1",
            "Iza",
            [device3],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["business-2", moment()], ["business-3", moment()], ["business-4", moment()]]),
        );

        const device2 = new RecipientDevice("ExponentPushToken[dtdyV1PhS9NpKWze4p29VE]", morning);
        const recipient2 = new Recipient(
            "r#2",
            "Michal",
            [device2],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["business-3", moment()]]),
        );

        const device1 = new RecipientDevice("ExponentPushToken[tLEWtTPeOvkhYxrVxIvE7q]", morning);
        const recipient3 = new Recipient(
            "r#3",
            "Sławek",
            [device1],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["business-1", moment()]]),
        );

        const recipients = [recipient1, recipient2, recipient3];

        const notifier = container.get<PushNotifier>(PushNotifier);
        const sender = container.get<PushNotificationSender>(PushNotificationSender);
        const eventRepository = container.get<EventMemoryRepository>(EventMemoryRepository);
        const recipientRepository = container.get<RecipientMongoRepository>(
            RecipientMongoRepository,
        );

        await eventRepository.addMany(events);
        await recipientRepository.addMany(recipients);
        await notifier.notifyAll(today.toDate());
        await sender.sendReady();
    });

    it.skip("should save notification status", async () => {
        const statusChecker = container.get<PushNotificationStatusChecker>(
            PushNotificationStatusChecker,
        );

        await statusChecker.updateStatus();
    });
});
