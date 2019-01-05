import {Consumer, Job} from "queue";
import {RecipientUpsert} from "queue/lib/Messages/RecipientUpsert";
import {Recipient, RecipientPreferences} from "./Recipient";
import {RecipientDevice} from "./RecipientDevice";
import {NotifierClock} from "../PushNotification/NotifierClock";
import {injectable} from "inversify";
import * as winston from "winston";
import {RecipientRepository} from "../Interfaces/RecipientRepository";

@injectable()
export class RecipientUpsertConsumer implements Consumer {

    public constructor(private readonly recipientRepository: RecipientRepository,
                       private readonly notifierClock: NotifierClock) {}

    public async consume(job: Job<RecipientUpsert>): Promise<void> {
        const {id, name, devices, followedTopics, preferences} = job.message;

        winston.info("Consumption of recipient add started", {
            recipient_id: id,
        });

        const recipientDevices = devices.map(
            (device) => new RecipientDevice(device.pushToken, new Date())
        );
        const recipientPreferences = new RecipientPreferences(
            preferences.earliestHour, preferences.earliestMinute, preferences.level
        );
        const recipient = new Recipient(
            id, name, followedTopics, recipientDevices, recipientPreferences
        );

        await this.recipientRepository.add(recipient);
        await this.notifierClock.tick();

        winston.info("Consumption of recipient add finished", {
           recipient_id: id,
        });
    }
}
