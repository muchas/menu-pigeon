import { createJob, setupWithAllDbs, tearDownWithAllDbs } from "../utils";
import { expect } from "chai";
import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import * as moment from "moment-timezone";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { PersistedPublicationConsumer } from "../../src/Publication/consumers/PersistedPublicationConsumer";
import { Container } from "inversify";
import { EventRepository } from "../../src/Interfaces/EventRepository";
import { EventMongoRepository } from "../../src/Event/repositories/EventMongoRepository";

describe("PersistedPublicationConsumer", () => {
    let today;
    let container: Container;
    let publicationConsumer: PersistedPublicationConsumer;
    let eventRepository: SinonStubbedInstance<EventMongoRepository>;
    let morning;

    beforeEach(async () => {
        container = await setupWithAllDbs();

        today = moment();
        morning = today.set(8, "hour").toDate();

        eventRepository = sinon.createStubInstance(EventMongoRepository);
        container.rebind(EventRepository).toConstantValue(eventRepository as any);

        publicationConsumer = container.get<PersistedPublicationConsumer>(
            PersistedPublicationConsumer,
        );
    });

    afterEach(async () => {
        await tearDownWithAllDbs(container);
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
        await publicationConsumer.consume(createJob(publication));
        await publicationConsumer.consume(createJob(publication));

        // then
        expect(eventRepository.addMany).to.have.callCount(1);
    });
});
