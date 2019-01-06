import {setupWithMongo, tearDownWithMongo} from "../utils";
import {expect} from "chai";
import * as sinon from "sinon";
import * as moment from "moment";
import {Recipient, RecipientPreferences} from "../../src/Recipient/Recipient";
import {PushNotifier} from "../../src/PushNotification/PushNotifier";
import {PushNotificationSender} from "../../src/PushNotification/PushNotificationSender";
import {PersistedPublication} from "queue/lib/Messages/PersistedPublication";
import {PersistedPublicationConsumer} from "../../src/Publication/PersistedPublicationConsumer";
import {Container} from "inversify";
import {EventRepository} from "../../src/Interfaces/EventRepository";
import {RecipientRepository} from "../../src/Interfaces/RecipientRepository";
import {RecipientUpsert} from "queue/lib/Messages/RecipientUpsert";
import {NotificationLevel} from "queue/lib/Messages/Recipient";
import {RecipientUpsertConsumer} from "../../src/Recipient/RecipientUpsertConsumer";
import {Job, Queue} from "queue";
import {Connection, createConnection} from "typeorm";


const createRecipientUpsertJob = (upsert: RecipientUpsert): Job<RecipientUpsert> => {
    const queue = sinon.createStubInstance(Queue);
    return new Job<RecipientUpsert>(queue as any, {}, upsert);
};

const createPersistedPublicationJob = (publication: PersistedPublication): Job<PersistedPublication> => {
    const queue = sinon.createStubInstance(Queue);
    return new Job<PersistedPublication>(queue as any, {}, publication);
};

describe("PushNotifier", () => {

    let eventRepository: EventRepository;
    let recipientRepository: RecipientRepository;
    let today;
    let container: Container;
    let publicationConsumer: PersistedPublicationConsumer;
    let recipientUpsertConsumer: RecipientUpsertConsumer;

    let publication1: PersistedPublication;
    let publication2: PersistedPublication;
    let publication3: PersistedPublication;
    let publication4: PersistedPublication;

    beforeEach(async () => {
        const connection = await createConnection();
        container = await setupWithMongo();
        container.bind(Connection).toConstantValue(connection);

        today = moment();
        const morning = today.set(8, 'hour').toDate();

        const offers = [{date: today.toDate(), lunches: [], soups: [], prices: [], texts: []}];
        publication1 = new PersistedPublication(1, "1", "Bococa Bistro", offers, morning);
        publication2 = new PersistedPublication(2, "2", "I Love Coffee Kawiarnia", offers, morning);
        publication3 = new PersistedPublication(3, "3", "Lunch Bar Majeranek", offers, morning);
        publication4 = new PersistedPublication(4, "4", "Bistro Maro", offers, morning);

        publicationConsumer = container.get<PersistedPublicationConsumer>(PersistedPublicationConsumer);
        recipientUpsertConsumer = container.get<RecipientUpsertConsumer>(RecipientUpsertConsumer);
        eventRepository = container.get<EventRepository>(EventRepository);
        recipientRepository = container.get<RecipientRepository>(RecipientRepository);
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it.only("should send messages to interested recipients @slow", async () => {
        // given
        const preferences = new RecipientPreferences(7, 0, NotificationLevel.Often);
        const recipientUpsert1 = new RecipientUpsert(
            "r#1", [], ["business-2", "business-3"], preferences, "Iza"
        );
        const recipientUpsert2 = new RecipientUpsert(
            "r#2", [], ["business-3"], preferences, "Michal"
        );
        const recipientUpsert3 = new RecipientUpsert(
            "r#3", [], ["business-1", "business-2", "business-3", "business-4"],
            preferences, "Slawek"
        );

        const recipient1 = new Recipient(
            "r#1", "Iza", ["business-2", "business-3"], [], preferences
        );
        const recipient2 = new Recipient("r#2", "Michal", ["business-3"], [], preferences);
        const recipient3 = new Recipient(
            "r#3", "Slawek", ["business-1", "business-2", "business-3", "business-4"],
            [], preferences
        );
        const recipients = [recipient1, recipient2, recipient3];

        const sender = sinon.createStubInstance(PushNotificationSender);
        const notifier = new PushNotifier(recipientRepository, eventRepository, sender as any);

        // when
        await publicationConsumer.consume(createPersistedPublicationJob(publication1));
        await publicationConsumer.consume(createPersistedPublicationJob(publication2));
        await publicationConsumer.consume(createPersistedPublicationJob(publication3));
        await publicationConsumer.consume(createPersistedPublicationJob(publication4));

        await recipientUpsertConsumer.consume(createRecipientUpsertJob(recipientUpsert1));
        await recipientUpsertConsumer.consume(createRecipientUpsertJob(recipientUpsert2));
        await recipientUpsertConsumer.consume(createRecipientUpsertJob(recipientUpsert3));

        await notifier.notifyAll(today.toDate());

        // then
        expect(sender.schedule).to.have.been.calledWith(recipients);
        const persistedRecipients = await recipientRepository.findAll();
        const notifiedTopics = persistedRecipients.map((r) => [...r.topicLastNotification.keys()]);
        expect(notifiedTopics).deep.equals(
            [["business-2", "business-3"], ["business-3"], ["business-1", "business-2", "business-3", "business-4"]]
        );
    });
});
