import { createJob, setupWithAllDbs, tearDownWithAllDbs } from "../utils";
import { expect } from "chai";
import * as sinon from "sinon";
import { SinonFakeTimers } from "sinon";
import * as moment from "moment-timezone";
import { RecipientPreferences } from "../../src/Recipient/models/Recipient";
import { PushNotifier } from "../../src/PushNotification/services/PushNotifier";
import { PushNotificationSender } from "../../src/PushNotification/services/PushNotificationSender";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { PersistedPublicationConsumer } from "../../src/Publication/consumers/PersistedPublicationConsumer";
import { Container } from "inversify";
import { EventRepository } from "../../src/Interfaces/EventRepository";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { RecipientUpsertConsumer } from "../../src/Recipient/consumers/RecipientUpsertConsumer";
import { RecipientMongoRepository } from "../../src/Recipient/repositories/RecipientMongoRepository";
import { RecipientMessagePlanner } from "../../src/PushNotification/services/RecipientMessagePlanner";

describe("PushNotifier", () => {
    let eventRepository: EventRepository;
    let clock: SinonFakeTimers;
    let recipientRepository: RecipientMongoRepository;
    let today;
    let container: Container;
    let publicationConsumer: PersistedPublicationConsumer;
    let recipientUpsertConsumer: RecipientUpsertConsumer;
    let recipientMessagePlanner: RecipientMessagePlanner;

    let publication1: PersistedPublication;
    let publication2: PersistedPublication;
    let publication3: PersistedPublication;
    let publication4: PersistedPublication;

    beforeEach(async () => {
        container = await setupWithAllDbs();

        today = moment().hour(11);
        clock = sinon.useFakeTimers(today.toDate());
        const morning = moment(today)
            .hour(8)
            .toDate();

        const offers = [{ date: today.toDate(), foods: [], prices: [], texts: [] }];
        publication1 = new PersistedPublication(
            1,
            "1",
            "Bococa Bistro",
            "bococa",
            offers,
            morning,
            morning,
        );
        publication2 = new PersistedPublication(
            2,
            "2",
            "I Love Coffee Kawiarnia",
            "ilc",
            offers,
            morning,
            morning,
        );
        publication3 = new PersistedPublication(
            3,
            "3",
            "Lunch Bar Majeranek",
            "majeranek",
            offers,
            morning,
            morning,
        );
        publication4 = new PersistedPublication(
            4,
            "4",
            "Bistro Maro",
            "maro",
            offers,
            morning,
            morning,
        );

        publicationConsumer = container.get<PersistedPublicationConsumer>(
            PersistedPublicationConsumer,
        );
        recipientUpsertConsumer = container.get<RecipientUpsertConsumer>(RecipientUpsertConsumer);
        eventRepository = container.get<EventRepository>(EventRepository);
        recipientRepository = container.get<RecipientMongoRepository>(RecipientMongoRepository);
        recipientMessagePlanner = container.get<RecipientMessagePlanner>(RecipientMessagePlanner);
    });

    afterEach(async () => {
        clock.restore();
        await tearDownWithAllDbs(container);
    });

    it("should send messages to interested recipients @slow", async () => {
        // given
        const preferences = new RecipientPreferences(7, 0, NotificationLevel.Often);
        const recipientUpsert1 = new RecipientUpsert(
            "r#1",
            [],
            ["business-2", "business-3"],
            preferences,
            "Iza",
        );
        const recipientUpsert2 = new RecipientUpsert(
            "r#2",
            [],
            ["business-3"],
            preferences,
            "Michal",
        );
        const recipientUpsert3 = new RecipientUpsert(
            "r#3",
            [],
            ["business-1", "business-2", "business-3", "business-4"],
            preferences,
            "Slawek",
        );

        const sender = sinon.createStubInstance(PushNotificationSender);
        const notifier = new PushNotifier(
            recipientRepository,
            eventRepository,
            recipientMessagePlanner,
            sender as any,
        );

        // when
        await recipientUpsertConsumer.consume(createJob(recipientUpsert1));
        await recipientUpsertConsumer.consume(createJob(recipientUpsert2));
        await recipientUpsertConsumer.consume(createJob(recipientUpsert3));

        // recipients will be notified about the events after topic subscription
        // therefore any time need to elapse between recipients and event consumption
        clock.tick(1000);

        await publicationConsumer.consume(createJob(publication1));
        await publicationConsumer.consume(createJob(publication2));
        await publicationConsumer.consume(createJob(publication3));
        await publicationConsumer.consume(createJob(publication4));

        await notifier.notifyAll(today);

        // then
        const recipients = sender.schedule.getCall(0).args[0];
        expect(recipients.map(r => r.id)).to.deep.equal(["r#1", "r#2", "r#3"]);
        const persistedRecipients = await recipientRepository.findAll();
        const notifiedTopics = persistedRecipients.map(r => [...r.topicLastNotification.keys()]);
        expect(notifiedTopics).deep.equals([
            ["business-2", "business-3"],
            ["business-3"],
            ["business-1", "business-2", "business-3", "business-4"],
        ]);
    });

    it("should not send messages to locked recipients @slow", async () => {
        // given
        const preferences = new RecipientPreferences(7, 0, NotificationLevel.Often);
        const recipientUpsert1 = new RecipientUpsert(
            "r#1",
            [],
            ["business-2", "business-3"],
            preferences,
            "Iza",
        );
        const recipientUpsert2 = new RecipientUpsert(
            "r#2",
            [],
            ["business-3"],
            preferences,
            "Michal",
        );
        const recipientUpsert3 = new RecipientUpsert(
            "r#3",
            [],
            ["business-1", "business-2", "business-3", "business-4"],
            preferences,
            "Slawek",
        );

        const sender = sinon.createStubInstance(PushNotificationSender);
        const notifier = new PushNotifier(
            recipientRepository,
            eventRepository,
            recipientMessagePlanner,
            sender as any,
        );

        // when
        await recipientUpsertConsumer.consume(createJob(recipientUpsert1));
        await recipientUpsertConsumer.consume(createJob(recipientUpsert2));
        await recipientUpsertConsumer.consume(createJob(recipientUpsert3));

        // recipients will be notified about the events after topic subscription
        // therefore any time need to elapse between recipients and event consumption
        clock.tick(1000);

        await publicationConsumer.consume(createJob(publication1));
        await publicationConsumer.consume(createJob(publication2));
        await publicationConsumer.consume(createJob(publication3));
        await publicationConsumer.consume(createJob(publication4));

        await recipientRepository.findAndLockAll();
        await notifier.notifyAll(today);

        // then
        const recipients = sender.schedule.getCall(0).args[0];
        expect(recipients.map(r => r.id)).to.deep.equal([]);
        const persistedRecipients = await recipientRepository.findAll();
        const notifiedTopics = persistedRecipients.map(r => [...r.topicLastNotification.keys()]);
        expect(notifiedTopics).deep.equals([[], [], []]);
    });
});
