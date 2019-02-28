import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { PersistedPublicationRepository } from "../../src/Publication/PersistedPublicationRepository";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import * as moment from "moment-timezone";

describe("PersistedPublicationRepository test", () => {
    let container: Container;
    let publicationRepository: PersistedPublicationRepository;
    let persistedPublication: PersistedPublication;

    beforeEach(async () => {
        container = await setupWithMongo();

        publicationRepository = container.get<PersistedPublicationRepository>(
            PersistedPublicationRepository,
        );
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it("should insert publications on add @slow", async () => {
        // given
        const now = moment().toDate();
        persistedPublication = new PersistedPublication(
            521,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz",
            [],
            now,
        );

        // when
        const inserted = await publicationRepository.add(persistedPublication);

        // then
        expect(inserted).to.be.true;
    });

    it("should not insert existing publications on add @slow", async () => {
        // given
        const now = moment().toDate();
        persistedPublication = new PersistedPublication(
            521,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz",
            [],
            now,
        );

        await publicationRepository.add(persistedPublication);

        // when
        const inserted = await publicationRepository.add(persistedPublication);

        // then
        expect(inserted).to.be.false;
    });
});
