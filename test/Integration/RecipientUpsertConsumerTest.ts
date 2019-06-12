import { expect } from "chai";
import { createJob, setupWithAllDbs, tearDownWithAllDbs } from "../utils";
import { Container } from "inversify";
import { RecipientUpsertConsumer } from "../../src/Recipient/consumers/RecipientUpsertConsumer";
import { Recipient, RecipientPreferences } from "../../src/Recipient/models/Recipient";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import * as moment from "moment-timezone";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { RecipientRepository } from "../../src/Interfaces/RecipientRepository";

describe("RecipientUpsertConsumer", () => {
    let container: Container;
    let recipientUpsertConsumer: RecipientUpsertConsumer;

    beforeEach(async () => {
        container = await setupWithAllDbs();
        recipientUpsertConsumer = container.get<RecipientUpsertConsumer>(RecipientUpsertConsumer);
    });

    afterEach(async () => {
        await tearDownWithAllDbs(container);
    });

    it("should remove inserted devices from old holders @slow", async () => {
        // given
        const recipientRepository = container.get<RecipientRepository>(RecipientRepository);

        const device1 = { pushToken: "Token[1241241xam12]", createdAt: moment() };
        const device2 = { pushToken: "Token[1212m1m2]", createdAt: moment() };
        const device3 = { pushToken: "Token[mo1noi2151]", createdAt: moment() };
        const device4 = { pushToken: "Token[pok1215]", createdAt: moment() };

        const recipientId1 = "#r1";
        const recipientId2 = "#r2";
        const recipientId3 = "#r3";
        const recipients = [
            new Recipient(recipientId1, "Alex", [device1, device2]),
            new Recipient(recipientId2, "Josh", [device3, device1]),
            new Recipient(recipientId3, "Mick", [device4, device3]),
        ];

        await recipientRepository.addMany(recipients);

        const preferences = new RecipientPreferences(7, 0, NotificationLevel.Often);
        const recipientUpsert = new RecipientUpsert(
            "#1",
            [device1, device2],
            [],
            preferences,
            "John",
        );

        // when
        await recipientUpsertConsumer.consume(createJob(recipientUpsert));

        // then
        const recipient1 = await recipientRepository.findOne(recipientId1);
        const recipient2 = await recipientRepository.findOne(recipientId2);
        const recipient3 = await recipientRepository.findOne(recipientId3);

        expect(recipient1).to.be.undefined;
        expect(recipient2).not.to.be.undefined;
        expect(recipient3).not.to.be.undefined;
        expect(recipient2.devices.map(d => d.pushToken)).to.deep.equal([device3.pushToken]);
        expect(recipient3.devices.map(d => d.pushToken)).to.deep.equal([
            device4.pushToken,
            device3.pushToken,
        ]);
    });
});
