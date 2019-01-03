import { expect } from "chai";
import "reflect-metadata";
import { Container } from "inversify";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { RecipientRepository } from "../../src/Interfaces/RecipientRepository";
import { Recipient, RecipientPreferences } from "../../src/Recipient/Recipient";
import { RecipientDevice } from "../../src/Recipient/RecipientDevice";
import { NotificationLevel } from "queue/lib/Messages/Recipient";

describe("RecipientRepository test", () => {
    let container: Container;
    let recipientRepository: RecipientRepository;
    let recipient: Recipient;

    beforeEach(async () => {
        container = await setupWithMongo();

        recipientRepository = await container.get<RecipientRepository>(RecipientRepository);
        recipient = new Recipient(
            "#r1",
            "John",
            ["business-1", "business-5"],
            [
                new RecipientDevice("awopk124pko", new Date()),
                new RecipientDevice("pok1po2k4ij", new Date()),
            ],
            new RecipientPreferences(9, 15, NotificationLevel.Seldom),
            new Set(["#japwjo", "#12mlk1", "#jm214"]),
            new Map([["1241", new Date()], ["125", new Date()]])
        );
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it.skip("should persist new recipients on add", async () => {
        // when
        await recipientRepository.add(recipient);

        // then
        const got = await recipientRepository.findOne("#r1");
        expect(got).not.undefined;
        expect(got.name).to.equal(recipient.name);
    });

    it.skip("should modify existing recipients on add", async () => {
        // given
        const event = {
            id: "8128",
            eventType: "lunch",
            topics: ["business-50"],
            readyTime: new Date(),
            expirationTime: new Date(),
        };

        await recipientRepository.add(recipient);

        recipient.name = "Andrew";
        recipient.follow("business-50");
        recipient.unfollow("business-1");
        recipient.markNotifiedAbout(event);

        // when
        await recipientRepository.add(recipient);

        // then
        const got = await recipientRepository.findOne("#r1");
        expect(got).not.undefined;
        expect(got.name).to.equal(recipient.name);
        expect([...got.followedTopics]).to.deep.equal(["business-5", "business-50"]);
        expect([...got.notifiedEventIds]).to.deep.equal(["#japwjo", "#12mlk1", "#jm214", "8128"]);
        expect([...got.topicLastNotification.keys()]).to.deep.equal(["1241", "125", "business-50"]);
    });
});
