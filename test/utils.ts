import * as chai from "chai";
import * as winston from "winston";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import { Queue } from "queue";
import { Container } from "inversify";
import { createContainer } from "../src/inversify.config";
import { Connection, createConnection } from "typeorm";

export const setup = (): Container => {
    chai.use(chaiAsPromised);
    chai.use(sinonChai);
    // @ts-ignore
    winston.level = "nope";

    return createContainer();
};

export const setupWithDb = async (): Promise<Container> => {
    const container = setup();

    const connection = await createConnection();
    container.bind(Connection).toConstantValue(connection);

    return container;
};

export const tearDownWithDb = async (container: Container): Promise<void> => {
    const connection = container.get<Connection>(Connection);
    await connection.close();
};

export const mockQueue = (container: Container): SinonStubbedInstance<Queue> => {
    const queue = sinon.createStubInstance(Queue);
    container.rebind(Queue).toConstantValue(queue as any);
    return queue;
};
