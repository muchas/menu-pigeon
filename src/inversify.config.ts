import 'reflect-metadata';
import {Container} from 'inversify';
import * as env from 'node-env-file';
import Config from './Config';
import {MessageGateCollection, Queue, QueueConnection} from 'queue';
import {RecipientRepository} from './Recipient/RecipientRepository';
import {EventRepository} from './Event/EventRepository';

export const createContainer = (): Container => {
    env(__dirname + '/../.env');

    const container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);

    container.bind(Config)
        .toDynamicValue(() => new Config({
            APP_NAME: 'pigeon',
            GRAYLOG_HOSTNAME: process.env.GRAYLOG_HOSTNAME,
            GRAYLOG_PORT: process.env.GRAYLOG_PORT || 12201,
            RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || 'localhost',
            RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
            RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || 'rabbitmq',
            RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || 'rabbitmq',
            RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || 'posts',
            SENTRY_DSN: process.env.SENTRY_DSN,
        }))
        .inSingletonScope();

    container.bind(Queue)
        .toDynamicValue(() => {
            const config = container.get<Config>(Config);

            const queueConnection = new QueueConnection(
                config.get('RABBITMQ_HOSTNAME'),
                config.get('RABBITMQ_PORT'),
                config.get('RABBITMQ_USERNAME'),
                config.get('RABBITMQ_PASSWORD')
            );

            return new Queue(
                queueConnection,
                config.get('RABBITMQ_EXCHANGE'),
                new MessageGateCollection()
            );
        })
        .inSingletonScope();

    container.bind(RecipientRepository).toSelf().inSingletonScope();
    container.bind(EventRepository).toSelf().inSingletonScope();

    return container;
};
