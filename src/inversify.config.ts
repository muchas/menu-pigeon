import "reflect-metadata";
import { Container } from "inversify";
import * as env from "node-env-file";
import Config from "./Config";
import { MessageGateCollection, Queue, QueueConnection } from "queue";
import { PushNotificationSender } from "./PushNotification/PushNotificationSender";
import { ExpoTransport } from "./PushNotification/ExpoTransport";
import { PushNotificationRepository } from "./PushNotification/PushNotificationRepository";
import Expo from "expo-server-sdk";
import Mongo from "./Mongo";
import { RecipientRepository } from "./Interfaces/RecipientRepository";
import { RecipientMongoRepository } from "./Recipient/RecipientMongoRepository";
import { EventRepository } from "./Interfaces/EventRepository";
import { EventMongoRepository } from "./Event/EventMongoRepository";
import { PushNotificationStatusChecker } from "./PushNotification/PushNotificationStatusChecker";
import { RecipientService } from "./Recipient/RecipientService";

export const createContainer = (): Container => {
    env(`${__dirname}/../.env`);

    const container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);

    container.bind(Config)
        .toDynamicValue(() => new Config({
            APP_NAME: "pigeon",
            MONGO_HOSTNAME: process.env.MONGO_HOSTNAME || "localhost",
            MONGO_PORT: process.env.MONGO_PORT || 27017,
            MONGO_DATABASE: process.env.MONGO_DATABASE || "nalunch",
            MONGO_USERNAME: process.env.MONGO_USERNAME,
            MONGO_PASSWORD: process.env.MONGO_PASSWORD,
            GRAYLOG_HOSTNAME: process.env.GRAYLOG_HOSTNAME,
            GRAYLOG_PORT: process.env.GRAYLOG_PORT || 12201,
            RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || "localhost",
            RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
            RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || "rabbitmq",
            RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || "rabbitmq",
            RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || "posts",
            SENTRY_DSN: process.env.SENTRY_DSN,
        }))
        .inSingletonScope();

    container.bind(Mongo)
        .toDynamicValue(() => {
            const config = container.get<Config>(Config);
            return new Mongo(
                config.get("MONGO_HOSTNAME"),
                config.get("MONGO_PORT"),
                config.get("MONGO_USERNAME"),
                config.get("MONGO_PASSWORD"),
                config.get("MONGO_DATABASE"),
            );
        })
        .inSingletonScope();

    container.bind(Queue)
        .toDynamicValue(() => {
            const config = container.get<Config>(Config);

            const queueConnection = new QueueConnection(
                config.get("RABBITMQ_HOSTNAME"),
                config.get("RABBITMQ_PORT"),
                config.get("RABBITMQ_USERNAME"),
                config.get("RABBITMQ_PASSWORD"),
            );

            return new Queue(
                queueConnection,
                config.get("RABBITMQ_EXCHANGE"),
                new MessageGateCollection(),
            );
        })
        .inSingletonScope();

    container.bind(RecipientRepository).to(RecipientMongoRepository).inSingletonScope();
    container.bind(EventRepository).to(EventMongoRepository).inSingletonScope();
    container.bind(PushNotificationSender).toDynamicValue(
        () => {
            const transport = container.get<ExpoTransport>(ExpoTransport);
            const repository = container.get<PushNotificationRepository>(PushNotificationRepository);
            return new PushNotificationSender(transport, repository);
        },
    );
    container.bind(PushNotificationStatusChecker).toDynamicValue(
        () => {
            const transport = container.get<ExpoTransport>(ExpoTransport);
            const repository = container.get<PushNotificationRepository>(PushNotificationRepository);
            const recipientService = container.get<RecipientService>(RecipientService);
            return new PushNotificationStatusChecker(transport, repository, recipientService);
        },
    );
    container.bind(Expo).toDynamicValue(() => new Expo());

    return container;
};
