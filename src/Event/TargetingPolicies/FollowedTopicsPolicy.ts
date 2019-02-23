import { RecipientTargetingPolicy } from "../../Interfaces/RecipientTargetingPolicy";
import { Recipient } from "../../Recipient/Recipient";
import { Event } from "../../Interfaces/Event";

export class FollowedTopicsPolicy implements RecipientTargetingPolicy {
    public shouldKnowAbout(recipient: Recipient, event: Event): boolean {
        for (const topic of event.topics) {
            const followedAt = recipient.followedTopics.get(topic);
            if (followedAt !== undefined && followedAt.isBefore(event.registeredAt)) {
                return true;
            }
        }
        return false;
    }
}
