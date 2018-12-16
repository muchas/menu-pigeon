import {Consumer, Job} from 'queue';
import {TopicFollow} from 'queue/lib/Messages/TopicFollow';
import {RecipientRepository} from './RecipientRepository';
import {NotifierClock} from '../PushNotification/NotifierClock';

export class TopicFollowConsumer implements Consumer {

    constructor(private recipientRepository: RecipientRepository,
                private notifierClock: NotifierClock) {}

    public async consume(job: Job<TopicFollow>) {
        const {topicName, recipientId} = job.message;
        const recipient = await this.recipientRepository.findOne(recipientId);
        if (!recipient) {
            return;
        }

        if (job.message.follow) {
            recipient.follow(topicName);
        } else {
            recipient.unfollow(topicName);
        }

        await this.notifierClock.tick();
    }
}
