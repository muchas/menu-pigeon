import { setupWithMongo, tearDownWithMongo } from "../utils";
import { expect } from "chai";
import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import * as moment from "moment-timezone";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { PersistedPublicationConsumer } from "../../src/Publication/PersistedPublicationConsumer";
import { Container } from "inversify";
import { EventRepository } from "../../src/Interfaces/EventRepository";
import { Job, Queue } from "queue";
import { Connection } from "typeorm";
import { createORMConnection } from "../../src/typeorm.config";
import Config from "../../src/Config";
import { EventMongoRepository } from "../../src/Event/EventMongoRepository";

const createPersistedPublicationJob = (
    publication: PersistedPublication,
): Job<PersistedPublication> => {
    const queue = sinon.createStubInstance(Queue);
    return new Job<PersistedPublication>(queue as any, {}, publication);
};

describe("PersistedPublication", () => {
    let today;
    let container: Container;
    let publicationConsumer: PersistedPublicationConsumer;
    let eventRepository: SinonStubbedInstance<EventMongoRepository>;
    let morning;

    beforeEach(async () => {
        container = await setupWithMongo();
        const config = container.get<Config>(Config);
        const connection = await createORMConnection(config);
        container.bind(Connection).toConstantValue(connection);

        today = moment();
        morning = today.set(8, "hour").toDate();

        eventRepository = sinon.createStubInstance(EventMongoRepository);
        container.rebind(EventRepository).toConstantValue(eventRepository as any);

        publicationConsumer = container.get<PersistedPublicationConsumer>(
            PersistedPublicationConsumer,
        );
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it("should not process the same publication more than once @slow", async () => {
        // given
        const offers = [{ date: today.toDate(), lunches: [], soups: [], prices: [], texts: [] }];
        const publication = new PersistedPublication(
            1,
            "1",
            "Bococa Bistro",
            "bococa",
            offers,
            morning,
            morning,
        );

        // when
        await publicationConsumer.consume(createPersistedPublicationJob(publication));
        await publicationConsumer.consume(createPersistedPublicationJob(publication));

        // then
        expect(eventRepository.addMany).to.have.callCount(1);
    });
});
