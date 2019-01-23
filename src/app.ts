import "reflect-metadata";
import { Connection } from "typeorm";
import { Consumer, Queue, SingleConsumer } from "queue";
import { setupLogging } from "./logging";
import Config from "./Config";
import { PersistedPublicationConsumer } from "./Publication/PersistedPublicationConsumer";
import { RecipientDeletedConsumer } from "./Recipient/RecipientDeletedConsumer";
import { RecipientUpsertConsumer } from "./Recipient/RecipientUpsertConsumer";
import { TopicFollowConsumer } from "./Recipient/TopicFollowConsumer";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import { RecipientDeleted } from "queue/lib/Messages/RecipientDeleted";
import { TopicFollow } from "queue/lib/Messages/TopicFollow";
import * as winston from "winston";
import { createContainer } from "./inversify.config";
import { NotifierClock } from "./PushNotification/NotifierClock";
import { StatusCheckerClock } from "./PushNotification/StatusCheckerClock";
import Mongo from "./Mongo";
import { SenderClock } from "./PushNotification/SenderClock";
import * as moment from "moment-timezone";
import { createORMConnection } from "./typeorm.config";

moment.tz.setDefault("Europe/Warsaw");

const container = createContainer();
const config = container.get<Config>(Config);

setupLogging(config);

createORMConnection(config)
    .then(async connection => {
        container.bind(Connection).toConstantValue(connection);

        const mongo = container.get<Mongo>(Mongo);
        const queue = container.get<Queue>(Queue);
        const notifierClock = container.get<NotifierClock>(NotifierClock);
        const senderClock = container.get<SenderClock>(SenderClock);
        const statusCheckerClock = container.get<StatusCheckerClock>(StatusCheckerClock);

        const persistedPublicationConsumer = new SingleConsumer(
            container.get<PersistedPublicationConsumer>(PersistedPublicationConsumer),
        );
        const recipientUpsertConsumer = new SingleConsumer(
            container.get<RecipientUpsertConsumer>(RecipientUpsertConsumer),
        );
        const recipientDeletedConsumer = new SingleConsumer(
            container.get<RecipientDeletedConsumer>(RecipientDeletedConsumer),
        );
        const topicFollowConsumer = new SingleConsumer(
            container.get<TopicFollowConsumer>(TopicFollowConsumer),
        );

        await mongo.connect();

        await notifierClock.start();
        await statusCheckerClock.start();
        await senderClock.start();

        await queue.consume(
            `${config.get("APP_NAME")}.default`,
            new Map<any, Consumer>([
                [PersistedPublication, persistedPublicationConsumer],
                [RecipientUpsert, recipientUpsertConsumer],
                [RecipientDeleted, recipientDeletedConsumer],
                [TopicFollow, topicFollowConsumer],
            ]),
        );
    })
    .catch(error => winston.error(error));
