import * as env from 'node-env-file';
import 'reflect-metadata';
import {createConnection} from 'typeorm';
import {Consumer, MessageGateCollection, Queue, QueueConnection, SingleConsumer} from 'queue';
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
import {EventRepository} from './Event/EventRepository';
import {RecipientRepository} from './Recipient/RecipientRepository';
import {PushNotifier} from './PushNotification/PushNotifier';
import {PushNotificationSender} from './PushNotification/PushNotificationSender';
import {ExpoTransport} from './PushNotification/ExpoTransport';
import Expo from 'expo-server-sdk';
import {PushNotificationRepository} from './PushNotification/PushNotificationRepository';
import * as winston from 'winston';

env(__dirname + '/../.env');

const config = new Config({
    APP_NAME: 'pigeon',
    GRAYLOG_HOSTNAME: process.env.GRAYLOG_HOSTNAME,
    GRAYLOG_PORT: process.env.GRAYLOG_PORT || 12201,
    RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || 'localhost',
    RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
    RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || 'rabbitmq',
    RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || 'rabbitmq',
    RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || 'posts',
    SENTRY_DSN: process.env.SENTRY_DSN,
});

setupLogging(config);

createConnection().then(async connection => {

    const queueConnection = new QueueConnection(
        config.get('RABBITMQ_HOSTNAME'),
        config.get('RABBITMQ_PORT'),
        config.get('RABBITMQ_USERNAME'),
        config.get('RABBITMQ_PASSWORD')
    );

    const queue = new Queue(
        queueConnection,
        config.get('RABBITMQ_EXCHANGE'),
        new MessageGateCollection()
    );

    const eventRepository = new EventRepository([]);
    const recipientRepository = new RecipientRepository([]);
    const notificationRepository = new PushNotificationRepository(connection);

    const transport = new ExpoTransport(new Expo());
    const sender = new PushNotificationSender(transport, notificationRepository);
    const notifier = new PushNotifier(recipientRepository, eventRepository, sender);

    setInterval(() => notifier.notifyAll(new Date()), 10 * 1000);

    const persistedPublicationConsumer = new SingleConsumer(new PersistedPublicationConsumer(eventRepository));
    const recipientUpsertConsumer = new SingleConsumer(new RecipientUpsertConsumer(recipientRepository));
    const recipientDeletedConsumer = new SingleConsumer(new RecipientDeletedConsumer(recipientRepository));
    const topicFollowConsumer = new SingleConsumer(new TopicFollowConsumer(recipientRepository));

    await queue.consume(`${config.get('APP_NAME').default}`, new Map<any, Consumer>([
        [PersistedPublication, persistedPublicationConsumer],
        [RecipientUpsert, recipientUpsertConsumer],
        [RecipientDeleted, recipientDeletedConsumer],
        [TopicFollow, topicFollowConsumer],
    ]));

}).catch(error => winston.error(error));
