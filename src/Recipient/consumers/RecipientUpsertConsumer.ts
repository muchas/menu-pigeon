import { Consumer, Job } from "queue";
import { RecipientUpsert } from "queue/lib/Messages/RecipientUpsert";
import { Recipient, RecipientPreferences } from "../models/Recipient";
import { RecipientDevice } from "../models/RecipientDevice";
import { injectable } from "inversify";
import * as winston from "winston";
import { RecipientRepository } from "../../Interfaces/RecipientRepository";
import * as moment from "moment-timezone";
import { RecipientService } from "../services/RecipientService";

@injectable()
export class RecipientUpsertConsumer implements Consumer {
    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly recipientService: RecipientService,
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

        winston.info("Consumption of recipient add finished", {
            recipient_id: id,
        });
    }

    private async updateOldDeviceHolders(devices: RecipientDevice[]): Promise<void> {
        const pushTokens: string[] = devices.map(device => device.pushToken);
        return this.recipientService.removeDevices(pushTokens, false);
    }

    private async getOrCreateRecipient(id: string): Promise<Recipient> {
        let recipient = await this.recipientRepository.findOne(id);
        if (!recipient) {
            recipient = new Recipient(id);
            recipient.markAsNotified();
        }
        return recipient;
    }
}
