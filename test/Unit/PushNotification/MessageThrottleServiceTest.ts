import { setup } from "../../utils";
import { expect } from "chai";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/Recipient";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { MessageThrottleService } from "../../../src/PushNotification/MessageThrottleService";
import { Message } from "../../../src/Entity/Message";
import { LUNCH_EVENT_TYPE } from "../../../src/Publication/constants";
import * as moment from "moment";

const createMessage = (id: string, topics: string[] = [], eventType = "default") => {
    const message = new Message();
    message.id = id;
    message.title = "Hej John, lunch dnia!";
    message.body = "Sprawdź szczegóły";
    message.setTopics(topics);
    message.setEventType(eventType);
    return message;
};

describe("MessageThrottleService", () => {
    let throttleService: MessageThrottleService;
    let recipient: Recipient;

    beforeEach(() => {
        setup();

        throttleService = new MessageThrottleService();
        recipient = new Recipient("#r1", "John", []);
    });

    it("should stop messages if disabled", async () => {
        // given
        const messages = [createMessage("1"), createMessage("2"), createMessage("3")];

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Never);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(0);
    });

    it("should allow only one message at once", async () => {
        // given
        const messages = [
            createMessage("#1", [], LUNCH_EVENT_TYPE),
            createMessage("#2", [], LUNCH_EVENT_TYPE),
            createMessage("#3", [], "DEFAULT"),
            createMessage("#4", [], LUNCH_EVENT_TYPE),
            createMessage("#5", [], "DEFAULT"),
        ];

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Often);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(1);
        expect(throttledMessages.map(m => m.id)).to.deep.equal(["#1"]);
    });

    it("should receive at most one a week if seldom", async () => {
        // given
        const weekAgo = moment()
            .startOf("week")
            .subtract(1, "minute");

        const messages = [
            createMessage("#1", [], "default"),
            createMessage("#2", [], LUNCH_EVENT_TYPE),
            createMessage("#3", [], "other"),
        ];

        const event = {
            id: "event#1",
            eventType: "default",
            topics: ["business-5"],
            readyTime: weekAgo,
            expirationTime: weekAgo,
        };

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Seldom);
        recipient.markNotifiedAbout(event, weekAgo);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(1);
        expect(throttledMessages[0].id).to.equal("#1");
    });

    it("should not receive if notified within last week and seldom", async () => {
        // given
        const weekAgo = moment()
            .startOf("week")
            .add("1", "minute");

        const messages = [
            createMessage("#1", [], "default"),
            createMessage("#2", [], LUNCH_EVENT_TYPE),
            createMessage("#3", [], "other"),
        ];

        const event = {
            id: "event#1",
            eventType: "default",
            topics: ["business-5"],
            readyTime: weekAgo,
            expirationTime: weekAgo,
        };

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Seldom);
        recipient.markNotifiedAbout(event, weekAgo);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(0);
    });

    it("should receive at most one a day if daily", async () => {
        // given
        const dayAgo = moment()
            .startOf("day")
            .subtract(1, "minute");

        const messages = [
            createMessage("#1", [], "default"),
            createMessage("#2", [], LUNCH_EVENT_TYPE),
            createMessage("#3", [], "other"),
        ];

        const event = {
            id: "event#1",
            eventType: "default",
            topics: ["business-5"],
            readyTime: dayAgo,
            expirationTime: dayAgo,
        };

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Daily);
        recipient.markNotifiedAbout(event, dayAgo);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(1);
        expect(throttledMessages[0].id).to.equal("#1");
    });

    it("should receive at most one per hour if often", async () => {
        // given
        const hourAgo = moment().subtract("1", "hour");

        const messages = [
            createMessage("#1", [], "default"),
            createMessage("#2", [], LUNCH_EVENT_TYPE),
            createMessage("#3", [], "other"),
        ];

        const event = {
            id: "event#1",
            eventType: "default",
            topics: ["business-5"],
            readyTime: hourAgo,
            expirationTime: hourAgo,
        };

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Often);
        recipient.markNotifiedAbout(event, hourAgo);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(1);
        expect(throttledMessages[0].id).to.equal("#1");
    });
});
