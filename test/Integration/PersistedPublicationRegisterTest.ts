import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { PersistedPublicationRegister } from "../../src/Publication/services/PersistedPublicationRegister";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import * as moment from "moment-timezone";

describe("PersistedPublicationRegister", () => {
    let container: Container;
    let publicationRegister: PersistedPublicationRegister;
    let persistedPublication: PersistedPublication;

    beforeEach(async () => {
        container = await setupWithMongo();

        publicationRegister = container.get<PersistedPublicationRegister>(
            PersistedPublicationRegister,
        );
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it("should insert publications on register @slow", async () => {
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
        const shouldProcess = await publicationRegister.register(persistedPublication);

        // then
        expect(shouldProcess).to.be.true;
    });

    it("should not insert existing publications on register @slow", async () => {
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

        await publicationRegister.register(persistedPublication);

        // when
        const shouldProcess = await publicationRegister.register(persistedPublication);

        // then
        expect(shouldProcess).to.be.false;
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

        await publicationRegister.register(persistedPublication);

        // when
        const shouldProcess = await publicationRegister.register(otherPublication);

        // then
        expect(shouldProcess).to.be.false;
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

        await publicationRegister.register(persistedPublication);

        // when
        const shouldProcess = await publicationRegister.register(otherPublication);

        // then
        expect(shouldProcess).to.be.true;
    });
});
