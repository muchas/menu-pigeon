import { expect } from "chai";
import { EventDistributor } from "../../../src/Event/EventDistributor";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/Recipient";
import { Event } from "../../../src/Interfaces/Event";
import * as moment from "moment-timezone";
import { NotificationLevel } from "queue/lib/Messages/Recipient";

describe("EventDistributor", () => {
    it("filterRelevantFor events to recipients based on followed topics", async () => {
        // given
        const now = moment();
        const justBeforeNow = moment(now).subtract(1, "second");

        const event1 = {
            id: "kjcblk10-9eknjsal",
            eventType: "lunch-offer",
            topics: ["topic-1", "topic-2"],
            registeredAt: now,
        };
        const event2 = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            topics: ["topic-2"],
            registeredAt: now,
        };
        const event3 = {
            id: "iu12h4iu-1kj24-j124",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            registeredAt: now,
        };
        const events = [event1 as Event, event2 as Event, event3 as Event];

        const distributor = new EventDistributor();
        const recipient = new Recipient(
            "recipient#1",
            "John",
            [],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["topic-1", justBeforeNow]]),
        );

        // when
        const relevantEvents = distributor.filterRelevantFor(recipient, events);

        // then
        expect(relevantEvents).to.be.lengthOf(2);
        expect(relevantEvents).to.deep.equal([event1, event3]);
    });

    it("skip events that registered before follow action", async () => {
        // given
        const now = moment();
        const justAfterNow = moment(now).add(1, "second");

        const event1 = {
            id: "kjcblk10-9eknjsal",
            eventType: "lunch-offer",
            topics: ["topic-1", "topic-2"],
            registeredAt: now,
        };
        const event2 = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            topics: ["topic-2"],
            registeredAt: now,
        };
        const event3 = {
            id: "iu12h4iu-1kj24-j124",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            registeredAt: now,
        };
        const events = [event1 as Event, event2 as Event, event3 as Event];

        const distributor = new EventDistributor();
        const recipient = new Recipient(
            "recipient#1",
            "John",
            [],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["topic-1", justAfterNow]]),
        );

        // when
        const relevantEvents = distributor.filterRelevantFor(recipient, events);

        // then
        expect(relevantEvents).to.be.lengthOf(0);
    });
});
