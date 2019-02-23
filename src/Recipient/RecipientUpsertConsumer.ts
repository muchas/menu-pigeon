import { Consumer, Job } from "queue";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import { Recipient, RecipientPreferences } from "./Recipient";
import { RecipientDevice } from "./RecipientDevice";
import { NotifierClock } from "../PushNotification/NotifierClock";
import { injectable } from "inversify";
import * as winston from "winston";
import { RecipientRepository } from "../Interfaces/RecipientRepository";
import * as moment from "moment-timezone";

@injectable()
export class RecipientUpsertConsumer implements Consumer {
    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly notifierClock: NotifierClock,
    ) {}

    public async consume(job: Job<RecipientUpsert>): Promise<void> {
        const { id, name, devices, followedTopics, preferences } = job.message;

        winston.info("Consumption of recipient add started", {
            recipient_id: id,
        });

        const recipientDevices = devices.map(
            device => new RecipientDevice(device.pushToken, moment()),
        );
        const recipientPreferences = new RecipientPreferences(
            preferences.earliestHour,
            preferences.earliestMinute,
            preferences.level,
        );

        let recipient = await this.recipientRepository.findOne(id);
        if (!recipient) {
            recipient = new Recipient(id, name, recipientDevices, recipientPreferences);
        }

        recipient.followOnly(followedTopics);

        await this.recipientRepository.add(recipient);
        await this.notifierClock.tick();

        winston.info("Consumption of recipient add finished", {
            recipient_id: id,
        });
    }
}
