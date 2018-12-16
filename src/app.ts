import 'reflect-metadata';
import {Connection, createConnection} from 'typeorm';
import {Consumer, Queue, SingleConsumer} from 'queue';
import {setupLogging} from './logging';
import Config from './Config';
import {PersistedPublicationConsumer} from './Publication/PersistedPublicationConsumer';
import {RecipientDeletedConsumer} from './Recipient/RecipientDeletedConsumer';
import {RecipientUpsertConsumer} from './Recipient/RecipientUpsertConsumer';
import {TopicFollowConsumer} from './Recipient/TopicFollowConsumer';
import {PersistedPublication} from 'queue/lib/Messages/PersistedPublication';
import {RecipientUpsert} from 'queue/lib/Messages/RecipientUpsert';
import {RecipientDeleted} from 'queue/lib/Messages/RecipientDeleted';
import {TopicFollow} from 'queue/lib/Messages/TopicFollow';
import {PushNotifier} from './PushNotification/PushNotifier';
import * as winston from 'winston';
import {Clock} from './Clock';
import {createContainer} from './inversify.config';

const container = createContainer();
const config = container.get<Config>(Config);

setupLogging(config);


createConnection()
    .then(async connection => {
        container.bind(Connection).toConstantValue(connection);

        const queue = container.get<Queue>(Queue);
        const notifier = container.get<PushNotifier>(PushNotifier);
        const notifierClock = new Clock(() => notifier.notifyAll(new Date()), 10 * 1000);

        const persistedPublicationConsumer = new SingleConsumer(
            container.get<PersistedPublicationConsumer>(PersistedPublicationConsumer)
        );
        const recipientUpsertConsumer = new SingleConsumer(
            container.get<RecipientUpsertConsumer>(RecipientUpsertConsumer)
        );
        const recipientDeletedConsumer = new SingleConsumer(
            container.get<RecipientDeletedConsumer>(RecipientDeletedConsumer)
        );
        const topicFollowConsumer = new SingleConsumer(
            container.get<TopicFollowConsumer>(TopicFollowConsumer)
        );

        notifierClock.tick();

        await queue.consume(
            `${config.get('APP_NAME')}.default`,
            new Map<any, Consumer>([
                [PersistedPublication, persistedPublicationConsumer],
                [RecipientUpsert, recipientUpsertConsumer],
                [RecipientDeleted, recipientDeletedConsumer],
                [TopicFollow, topicFollowConsumer],
            ])
        );

    })
    .catch(error => winston.error(error));
