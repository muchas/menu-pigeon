import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { EventRepository } from "../../src/Interfaces/EventRepository";
import * as moment from "moment-timezone";

describe("EventRepository test", () => {
    let container: Container;
    let eventRepository: EventRepository;

    beforeEach(async () => {
        container = await setupWithMongo();

        eventRepository = await container.get<EventRepository>(EventRepository);
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it("should persist new events on register @slow", async () => {
        // given
        const event = {
            id: "#e1",
            eventType: "lunch",
            topics: ["business-50"],
            readyTime: moment(),
            expirationTime: moment(),
            registeredAt: moment(),
        };

        // when
        await eventRepository.add(event);

        // then
        const got = await eventRepository.findOne("#e1");
        expect(got).not.undefined;
        expect(got.eventType).to.equal(event.eventType);
        expect(got.topics).to.deep.equal(event.topics);
        expect(got.readyTime.toISOString()).to.equal(event.readyTime.toISOString());
        expect(got.expirationTime.toISOString()).to.equal(event.expirationTime.toISOString());
        expect(got.registeredAt.toISOString()).to.equal(event.registeredAt.toISOString());
    });
});
