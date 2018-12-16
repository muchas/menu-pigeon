import {Consumer, Job} from 'queue';
import {RecipientUpsert} from 'queue/lib/Messages/RecipientUpsert';
import {RecipientRepository} from './RecipientRepository';
import {Recipient, RecipientPreferences} from './Recipient';
import {RecipientDevice} from './RecipientDevice';

export class RecipientUpsertConsumer implements Consumer {

    constructor(private recipientRepository: RecipientRepository) {}

    public async consume(job: Job<RecipientUpsert>): Promise<void> {
        const {id, name, devices, preferences} = job.message;
        const recipientDevices = devices.map(
            (device) => new RecipientDevice(device.pushToken, new Date())
        );
        const recipientPreferences = new RecipientPreferences(
            preferences.earliestHour, preferences.earliestMinute, preferences.level
        );
        const recipient = new Recipient(
            id, name, [], recipientDevices, recipientPreferences
        );

        await this.recipientRepository.upsert(recipient);
    }
}
