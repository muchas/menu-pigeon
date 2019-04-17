import { expect } from "chai";
import { setupWithMongo, tearDownWithMongo } from "../utils";
import { Container } from "inversify";
import { Recipient } from "../../src/Recipient/Models/Recipient";
import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import * as moment from "moment-timezone";
import { RecipientRepository } from "../../src/Interfaces/RecipientRepository";
import { RecipientService } from "../../src/Recipient/RecipientService";
import { Queue } from "queue";

describe("RecipientServiceTest", () => {
    let container: Container;
    let recipientService: RecipientService;
    let queue: SinonStubbedInstance<Queue>;

    beforeEach(async () => {
        container = await setupWithMongo();
        queue = sinon.createStubInstance(Queue);
        container.rebind(Queue).toConstantValue(queue as any);

        recipientService = container.get<RecipientService>(RecipientService);
    });

    afterEach(async () => {
        await tearDownWithMongo(container);
    });

    it("should remove recipients with no devices @slow", async () => {
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
            new Recipient(recipientId1, "Alex", [device1, device3, device2]),
            new Recipient(recipientId2, "Josh", [device3]),
            new Recipient(recipientId3, "Mick", [device4, device3]),
        ];

        await recipientRepository.addMany(recipients);

        // when
        await recipientService.removeDevices([device3.pushToken, device4.pushToken]);

        // then
        const recipient1 = await recipientRepository.findOne(recipientId1);
        const recipient2 = await recipientRepository.findOne(recipientId2);
        const recipient3 = await recipientRepository.findOne(recipientId3);

        expect(recipient2).to.be.undefined;
        expect(recipient3).to.be.undefined;
        expect(recipient1).not.to.be.undefined;
        expect(recipient1.devices.map(d => d.pushToken)).to.deep.equal([
            device1.pushToken,
            device2.pushToken,
        ]);
    });
});
