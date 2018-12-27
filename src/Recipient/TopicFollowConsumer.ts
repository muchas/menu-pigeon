import { Consumer, Job } from "queue";
import { TopicFollow } from "queue/lib/Messages/TopicFollow";
import { RecipientMemoryRepository } from "./RecipientMemoryRepository";
import { NotifierClock } from "../PushNotification/NotifierClock";
import { injectable } from "inversify";
import * as winston from "winston";

@injectable()
export class TopicFollowConsumer implements Consumer {

    public constructor(
        private readonly recipientRepository: RecipientMemoryRepository,
        private readonly notifierClock: NotifierClock
    ) {
    }

    public async consume(job: Job<TopicFollow>) {
        const {topicName, recipientId} = job.message;

        winston.info("Consumption of topic follow started", {
            recipient_id: recipientId,
            topic: topicName,
        });

        const recipient = await this.recipientRepository.findOne(recipientId);
        if (!recipient) {
            winston.warn("Topic follow: recipient not found", {
                recipient_id: recipientId,
            });
            return;
        }

        if (job.message.follow) {
            recipient.follow(topicName);
        } else {
            recipient.unfollow(topicName);
        }

        await this.notifierClock.tick();

        winston.info("Consumption of topic follow finished", {
            recipient_id: recipientId,
            topic: topicName,
        });
    }
}
