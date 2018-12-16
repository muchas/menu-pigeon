import {RecipientTargetingPolicy} from '../../Interfaces/RecipientTargetingPolicy';
import {Recipient} from '../../Recipient/Recipient';
import {Event} from '../../Interfaces/Event';

export class FollowedTopicsPolicy implements RecipientTargetingPolicy {

    public shouldKnowAbout(recipient: Recipient, event: Event): boolean {
        const followedTopics = new Set(recipient.followedTopics);
        for (const topic of event.topics) {
            if (followedTopics.has(topic)) {
                return true;
            }
        }
        return false;
    }
}
