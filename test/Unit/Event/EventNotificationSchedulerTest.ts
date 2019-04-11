import * as moment from "moment-timezone";
import { expect } from "chai";
import { Event } from "../../../src/Interfaces/Event";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/Models/Recipient";
import { EventNotificationScheduler } from "../../../src/Event/EventNotificationScheduler";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { setup } from "../../utils";
import { Moment } from "moment-timezone";

describe("EventNotificationScheduler", () => {
    let preferences: RecipientPreferences;
    let recipient: Recipient;
    let scheduler: EventNotificationScheduler;
    let _today: Moment;
    const today = () => _today.clone();

    beforeEach(() => {
        setup();

        _today = moment();
        preferences = new RecipientPreferences(12, 0, NotificationLevel.Often);
        recipient = new Recipient("recipient#1", "John", [], preferences);
        scheduler = new EventNotificationScheduler();
    });

    it("should schedule event for recipient with default preferences", async () => {
        // given

        const event = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 9),
            expirationTime: today().set("hour", 18),
        };

        recipient = new Recipient(
            "recipient#2",
            "Yui",
            [],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
        );

        // when
        const notifications = scheduler.schedule(recipient, [event as Event], today());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: event.readyTime,
            expirationTime: today()
                .set("hour", 17) // default max notification hour is set to 17
                .set("minute", 0)
                .set("second", 0),
        });
    });

    it("should omit early expiration event", async () => {
        // given
        const event = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 9),
            expirationTime: today().set("hour", 11),
        };

        // when
        const notifications = scheduler.schedule(recipient, [event as Event], today());

        // then
        expect(notifications).to.be.lengthOf(0);
    });

    it("should omit late ready event", async () => {
        // given
        const event = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 18),
            expirationTime: today().set("hour", 23),
        };

        // when
        const notifications = scheduler.schedule(recipient, [event as Event], today());

        // then
        expect(notifications).to.be.lengthOf(0);
    });

    it("should schedule event on recipient preferred hour", async () => {
        // given
        const event = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 10),
            expirationTime: today()
                .set("hour", 16)
                .set("minute", 0),
        };

        // when
        const notifications = scheduler.schedule(recipient, [event as Event], today());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: today()
                .set("hour", 12)
                .set("minute", 0)
                .set("second", 0),
            expirationTime: event.expirationTime,
        });
    });

    it("should schedule event after recipient preferred hour", async () => {
        // given
        const event = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 13),
            expirationTime: today()
                .set("hour", 16)
                .set("minute", 0),
        };

        // when
        const notifications = scheduler.schedule(recipient, [event as Event], today());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: event.readyTime,
            expirationTime: event.expirationTime,
        });
    });

    it("should schedule many notifications", async () => {
        // given
        const event1 = {
            id: "i1uj4-n1h24-cbm19",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 11),
            expirationTime: today()
                .set("hour", 15)
                .set("minute", 0),
        };
        const event2 = {
            id: "lafqlkmq-akjwnfkj",
            eventType: "lunch-offer",
            readyTime: today().set("hour", 10),
            expirationTime: today()
                .set("hour", 20)
                .set("minute", 0),
        };

        // when
        const notifications = scheduler.schedule(
            recipient,
            [event1 as Event, event2 as Event],
            today(),
        );

        // then
        const readyTime = today()
            .set("hour", 12)
            .set("minute", 0)
            .set("second", 0);
        expect(notifications).to.be.lengthOf(2);
        expect(notifications.map(n => n.readyTime)).to.deep.equal([readyTime, readyTime]);
    });
});
