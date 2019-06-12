import * as chai from "chai";
import * as winston from "winston";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import { Job, Queue } from "queue";
import { Container } from "inversify";
import { createContainer } from "../src/inversify.config";
import { Connection } from "typeorm";
import Config from "../src/Config";
import Mongo from "../src/Mongo";
import { createORMConnection } from "../src/typeorm.config";

export const setup = (): Container => {
    chai.use(chaiAsPromised);
    chai.use(sinonChai);
    // @ts-ignore
    winston.level = "nope";

    return createContainer();
};

export const setupWithMongo = async (): Promise<Container> => {
    const container = setup();
    const config = container.get<Config>(Config);
    const mongo = container.get<Mongo>(Mongo);

    config.set("MONGO_USERNAME", "");
    config.set("MONGO_PASSWORD", "");

    await mongo.connect();

    return container;
};

export const tearDownWithMongo = async (container: Container): Promise<void> => {
    const mongo = container.get<Mongo>(Mongo);
    await mongo.db.dropDatabase();
    await mongo.disconnect();
};

export const setupWithDb = async (): Promise<Container> => {
    const container = setup();
    const config = container.get<Config>(Config);
    const connection = await createORMConnection(config);
    container.bind(Connection).toConstantValue(connection);

    return container;
};

export const tearDownWithDb = async (container: Container): Promise<void> => {
    const connection = container.get<Connection>(Connection);
    await connection.dropDatabase();
    await connection.close();
};

export const setupWithAllDbs = async (): Promise<Container> => {
    const container = await setupWithMongo();
    const config = container.get<Config>(Config);
    const connection = await createORMConnection(config);
    container.bind(Connection).toConstantValue(connection);
    return container;
};

export const tearDownWithAllDbs = async (container: Container): Promise<void> => {
    await tearDownWithDb(container);
    await tearDownWithMongo(container);
};

export const mockQueue = (container: Container): SinonStubbedInstance<Queue> => {
    const queue = sinon.createStubInstance(Queue);
    container.rebind(Queue).toConstantValue(queue as any);
    return queue;
};

export const createJob = <T>(message: T): Job<T> => {
    const queue = sinon.createStubInstance(Queue);
    return new Job<T>(queue as any, {}, message);
};

export const sleep = async (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));
