import "reflect-metadata";
import { Container } from "inversify";
import * as env from "node-env-file";
import Config from "./Config";
import { MessageGateCollection, Queue, QueueConnection } from "queue";
import { PushNotificationSender } from "./PushNotification/services/PushNotificationSender";
import { ExpoTransport } from "./PushNotification/services/ExpoTransport";
import { PushNotificationRepository } from "./PushNotification/repositories/PushNotificationRepository";
import Expo from "expo-server-sdk";
import Mongo from "./Mongo";
import { RecipientRepository } from "./Interfaces/RecipientRepository";
import { RecipientMongoRepository } from "./Recipient/repositories/RecipientMongoRepository";
import { EventRepository } from "./Interfaces/EventRepository";
import { EventMongoRepository } from "./Event/repositories/EventMongoRepository";
import { PushNotificationStatusChecker } from "./PushNotification/services/PushNotificationStatusChecker";
import { RecipientService } from "./Recipient/services/RecipientService";
import {
    CycleMessageRule,
    FrequencyMessageRule,
    LimitRule,
    MessageThrottleService,
    NeverMessageRule,
} from "./PushNotification/services/MessageThrottleService";
import { EventDistributor } from "./Event/services/EventDistributor";
import { FollowedTopicsPolicy } from "./Event/TargetingPolicies/FollowedTopicsPolicy";
import { NotificationLevel } from "queue/lib/Messages/Recipient";

export const createContainer = (): Container => {
    env(`${__dirname}/../.env`);

    const container = new Container({ autoBindInjectable: true });
    container.bind(Container).toConstantValue(container);

    container
        .bind(Config)
        .toDynamicValue(
            () =>
                new Config({
                    APP_NAME: "pigeon",
                    MONGO_HOSTNAME: process.env.MONGO_HOSTNAME || "localhost",
                    MONGO_PORT: process.env.MONGO_PORT || 27017,
                    MONGO_DATABASE: process.env.MONGO_DATABASE || "nalunch",
                    MONGO_USERNAME: process.env.MONGO_USERNAME,
                    MONGO_PASSWORD: process.env.MONGO_PASSWORD,
                    DB_HOSTNAME: process.env.DB_HOSTNAME || "localhost",
                    DB_PORT: process.env.DB_PORT || 5432,
                    DB_NAME: process.env.DB_NAME,
                    DB_USERNAME: process.env.DB_USERNAME,
                    DB_PASSWORD: process.env.DB_PASSWORD,
                    GRAYLOG_HOSTNAME: process.env.GRAYLOG_HOSTNAME,
                    GRAYLOG_PORT: process.env.GRAYLOG_PORT || 12201,
                    RABBITMQ_HOSTNAME: process.env.RABBITMQ_HOSTNAME || "localhost",
                    RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
                    RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || "rabbitmq",
                    RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || "rabbitmq",
                    RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || "posts",
                    SENTRY_DSN: process.env.SENTRY_DSN,
                }),
        )
        .inSingletonScope();

    container
        .bind(Mongo)
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

    container
        .bind(Queue)
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

    container
        .bind(RecipientRepository)
        .to(RecipientMongoRepository)
        .inSingletonScope();
    container
        .bind(EventRepository)
        .to(EventMongoRepository)
        .inSingletonScope();
    container.bind(PushNotificationSender).toDynamicValue(() => {
        const transport = container.get<ExpoTransport>(ExpoTransport);
        const repository = container.get<PushNotificationRepository>(PushNotificationRepository);
        return new PushNotificationSender(transport, repository);
    });
    container.bind(PushNotificationStatusChecker).toDynamicValue(() => {
        const transport = container.get<ExpoTransport>(ExpoTransport);
        const repository = container.get<PushNotificationRepository>(PushNotificationRepository);
        const recipientService = container.get<RecipientService>(RecipientService);
        return new PushNotificationStatusChecker(transport, repository, recipientService);
    });
    container.bind(Expo).toDynamicValue(() => new Expo());

    container
        .bind(EventDistributor)
        .toDynamicValue(() => new EventDistributor([new FollowedTopicsPolicy()]));

    container
        .bind(MessageThrottleService)
        .toDynamicValue(
            () =>
                new MessageThrottleService([
                    new NeverMessageRule(),
                    new FrequencyMessageRule(NotificationLevel.Seldom, "week"),
                    new FrequencyMessageRule(NotificationLevel.Daily, "day"),
                    new CycleMessageRule(NotificationLevel.Often, 20, "minute"),
                    new LimitRule(1),
                ]),
        );

    return container;
};
