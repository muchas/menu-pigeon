import * as sinon from "sinon";
import { SinonStubbedInstance } from "sinon";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { Recipient, RecipientPreferences } from "../../../src/Recipient/Models/Recipient";
import { RecipientUpsertConsumer } from "../../../src/Recipient/Consumers/RecipientUpsertConsumer";
import { RecipientRepository } from "../../../src/Interfaces/RecipientRepository";
import { NotifierClock } from "../../../src/PushNotification/NotifierClock";
import { expect } from "chai";
import { RecipientMongoRepository } from "../../../src/Recipient/RecipientMongoRepository";
import { RecipientDevice } from "../../../src/Recipient/Models/RecipientDevice";
import * as moment from "moment-timezone";
import { createJob } from "../../utils";
import { RecipientService } from "../../../src/Recipient/RecipientService";

describe("RecipientUpsertConsumer", () => {
    let recipientUpsertConsumer: RecipientUpsertConsumer;
    let recipientRepository: SinonStubbedInstance<RecipientRepository>;
    let recipientService: SinonStubbedInstance<RecipientService>;
    let notifierClock: SinonStubbedInstance<NotifierClock>;

    beforeEach(async () => {
        recipientRepository = sinon.createStubInstance(RecipientMongoRepository);
        recipientService = sinon.createStubInstance(RecipientService);
        notifierClock = sinon.createStubInstance(NotifierClock);
        recipientUpsertConsumer = new RecipientUpsertConsumer(
            recipientRepository,
            recipientService as any,
            notifierClock as any,
        );
    });

    it("should create new recipient", async () => {
        // given
        const preferences = new RecipientPreferences(7, 0, NotificationLevel.Often);
        const recipientUpsert = new RecipientUpsert(
            "r#1",
            [{ pushToken: "Token[mmpx1io321]" }, { pushToken: "Token[ko6ixmoi124]" }],
            ["business-2", "business-3"],
            preferences,
            "John",
        );

        recipientRepository.findOne.returns(undefined);
        recipientRepository.findByDevices.returns([]);

        // when
        await recipientUpsertConsumer.consume(createJob(recipientUpsert));

        // then
        expect(recipientRepository.add).to.have.been.calledOnce;
        expect(notifierClock.tick).to.have.been.calledOnce;
        const addArgs = recipientRepository.add.getCall(0).args;
        expect(addArgs).to.have.lengthOf(1);
        const recipient = addArgs[0];
        expect(recipient.id).to.equal("r#1");
        expect(recipient.name).to.equal("John");
        expect(recipient.preferences).to.deep.equal(preferences);
        expect(recipient.pushTokens).to.deep.equal(["Token[mmpx1io321]", "Token[ko6ixmoi124]"]);
        expect([...recipient.followedTopics.keys()]).to.deep.equal(["business-2", "business-3"]);
    });

    it("should update existing recipient", async () => {
        // given
        const now = moment();
        const justBeforeNow = moment(now).subtract(1, "second");
        const preferences = new RecipientPreferences(11, 30, NotificationLevel.Often);
        const recipientUpsert = new RecipientUpsert(
            "r#1",
            [{ pushToken: "Token[mmpx1io321]" }, { pushToken: "Token[ko6ixmoi124]" }],
            ["business-3"],
            preferences,
            "John",
        );
        const existingRecipient = new Recipient(
            recipientUpsert.id,
            "Johny",
            [new RecipientDevice("old", justBeforeNow)],
            new RecipientPreferences(9, 0, NotificationLevel.Daily),
            new Set(["1", "2"]),
            new Map([["topic1", justBeforeNow]]),
            new Map([["topic1", justBeforeNow], ["business-3", justBeforeNow]]),
        );

        recipientRepository.findOne.returns(existingRecipient);
        recipientRepository.findByDevices.returns([]);

        // when
        await recipientUpsertConsumer.consume(createJob(recipientUpsert));

        // then
        expect(recipientRepository.add).to.have.been.calledOnce;
        expect(notifierClock.tick).to.have.been.calledOnce;
        const addArgs = recipientRepository.add.getCall(0).args;
        expect(addArgs).to.have.lengthOf(1);
        const recipient = addArgs[0];
        expect(recipient.id).to.equal("r#1");
        expect(recipient.name).to.equal("John");
        expect(recipient.preferences).to.deep.equal(preferences);
        expect(recipient.pushTokens).to.deep.equal(["Token[mmpx1io321]", "Token[ko6ixmoi124]"]);
        expect([...recipient.followedTopics.keys()]).to.deep.equal(["business-3"]);
        expect([...recipient.followedTopics.values()]).to.deep.equal([justBeforeNow]);
    });
});
