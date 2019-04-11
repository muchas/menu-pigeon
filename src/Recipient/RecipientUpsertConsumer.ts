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

        await this.updateOldDeviceHolders(recipientDevices);

        const recipient = await this.getOrCreateRecipient(id);
        recipient.name = name;
        recipient.devices = recipientDevices;
        recipient.preferences = recipientPreferences;
        recipient.followOnly(followedTopics);

        await this.recipientRepository.add(recipient);
        await this.notifierClock.tick();

        winston.info("Consumption of recipient add finished", {
            recipient_id: id,
        });
    }

    private async updateOldDeviceHolders(devices: RecipientDevice[]): Promise<void> {
        const pushTokens: string[] = devices.map(device => device.pushToken);
        const oldDeviceHolders = await this.recipientRepository.findByDevices(pushTokens);
        const updatedRecipients: Recipient[] = [];
        const removedRecipients: Recipient[] = [];

        for (const recipient of oldDeviceHolders) {
            recipient.devices = recipient.devices.filter(
                device => pushTokens.find(token => token === device.pushToken) === undefined,
            );

            if (recipient.devices.length > 0) {
                updatedRecipients.push(recipient);
            } else {
                removedRecipients.push(recipient);
            }
        }

        await this.recipientRepository.addMany(updatedRecipients);
        await this.recipientRepository.removeMany(removedRecipients.map(r => r.id));
    }

    private async getOrCreateRecipient(id: string): Promise<Recipient> {
        const recipient = await this.recipientRepository.findOne(id);
        if (!recipient) {
            return new Recipient(id);
        }
        return recipient;
    }
}
