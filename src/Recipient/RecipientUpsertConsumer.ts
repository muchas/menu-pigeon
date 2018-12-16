import {Consumer, Job} from 'queue';
import {RecipientUpsert} from 'queue/lib/Messages/RecipientUpsert';
import {RecipientRepository} from './RecipientRepository';
import {Recipient, RecipientPreferences} from './Recipient';
import {RecipientDevice} from './RecipientDevice';
import {Clock} from '../Clock';

export class RecipientUpsertConsumer implements Consumer {

    constructor(private recipientRepository: RecipientRepository,
                private notifierClock: Clock) {}

    public async consume(job: Job<RecipientUpsert>): Promise<void> {
        const {id, name, devices, followedTopics, preferences} = job.message;
        const recipientDevices = devices.map(
            (device) => new RecipientDevice(device.pushToken, new Date())
        );
        const recipientPreferences = new RecipientPreferences(
            preferences.earliestHour, preferences.earliestMinute, preferences.level
        );
        const recipient = new Recipient(
            id, name, followedTopics, recipientDevices, recipientPreferences
        );

        await this.recipientRepository.upsert(recipient);

        this.notifierClock.tick();
    }
}
