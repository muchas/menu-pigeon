import { expect } from "chai";
import { EventDistributor } from "../../../src/Event/services/EventDistributor";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/models/Recipient";
import { Event } from "../../../src/Interfaces/Event";
import * as moment from "moment-timezone";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { FollowedTopicsPolicy } from "../../../src/Event/TargetingPolicies/FollowedTopicsPolicy";

describe("EventDistributor", () => {
    it("filterRelevantFor events to recipients based on followed topics", async () => {
        // given
        const now = moment();
        const justBeforeNow = moment(now).subtract(1, "second");

        const event1 = {
            id: "kjcblk10-9eknjsal",
            eventType: "lunch-offer",
            topics: ["topic-1", "topic-2"],
            readyTime: now,
            registeredAt: now,
        };
        const event2 = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            topics: ["topic-2"],
            readyTime: now,
            registeredAt: now,
        };
        const event3 = {
            id: "iu12h4iu-1kj24-j124",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            readyTime: now,
            registeredAt: now,
        };
        const events = [event1 as Event, event2 as Event, event3 as Event];

        const distributor = new EventDistributor([new FollowedTopicsPolicy()]);
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

    it("skip events that were followed after ready time", async () => {
        // given
        const now = moment();
        const justAfterNow = moment(now).add(1, "second");

        const event1 = {
            id: "kjcblk10-9eknjsal",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            readyTime: now,
            registeredAt: now,
        };
        const event2 = {
            id: "iu12h4iu-1kj24-j124",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            readyTime: now,
            registeredAt: now,
        };
        const events = [event1 as Event, event2 as Event];

        const distributor = new EventDistributor([new FollowedTopicsPolicy()]);
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

    it("take events that were followed before registering", async () => {
        // given
        const now = moment();
        const justBeforeNow = moment(now).subtract(1, "second");
        const justAfterNow = moment(now).add(1, "second");

        const event1 = {
            id: "kjcblk10-9eknjsal",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            readyTime: justBeforeNow,
            registeredAt: justAfterNow,
        };
        const event2 = {
            id: "iu12h4iu-1kj24-j124",
            eventType: "lunch-offer",
            topics: ["topic-1"],
            readyTime: justBeforeNow,
            registeredAt: justAfterNow,
        };
        const events = [event1 as Event, event2 as Event];

        const distributor = new EventDistributor([new FollowedTopicsPolicy()]);
        const recipient = new Recipient(
            "recipient#1",
            "John",
            [],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(),
            new Map(),
            new Map([["topic-1", now]]),
        );

        // when
        const relevantEvents = distributor.filterRelevantFor(recipient, events);

        // then
        expect(relevantEvents).to.be.lengthOf(2);
    });
});
