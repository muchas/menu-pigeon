import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { PersistedPublicationRepository } from "../../src/Publication/repositories/PersistedPublicationRepository";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import * as moment from "moment-timezone";

describe("PersistedPublicationRepository", () => {
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
            now,
        );

        await publicationRepository.add(persistedPublication);

        // when
        const inserted = await publicationRepository.add(persistedPublication);

        // then
        expect(inserted).to.be.false;
    });

    it("should not insert publications from the same business in one day @slow", async () => {
        // given
        const now = moment().toDate();
        const later = moment(now)
            .add(1, "minute")
            .toDate();
        persistedPublication = new PersistedPublication(
            521,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz",
            [],
            now,
            now,
        );
        const otherPublication = new PersistedPublication(
            12512,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz-changed",
            [],
            later,
            later,
        );

        await publicationRepository.add(persistedPublication);

        // when
        const inserted = await publicationRepository.add(otherPublication);

        // then
        expect(inserted).to.be.false;
    });

    it("should insert publications from the same business on different days @slow", async () => {
        // given
        const now = moment().toDate();
        const later = moment(now)
            .add(1, "day")
            .toDate();
        persistedPublication = new PersistedPublication(
            521,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz",
            [],
            now,
            now,
        );
        const otherPublication = new PersistedPublication(
            12512,
            "n4nx83mwi",
            "Awesome Biz",
            "awesome-biz-changed",
            [],
            later,
            later,
        );

        await publicationRepository.add(persistedPublication);

        // when
        const inserted = await publicationRepository.add(otherPublication);

        // then
        expect(inserted).to.be.true;
    });
});
