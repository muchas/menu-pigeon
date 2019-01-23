import { Event } from "../Interfaces/Event";
import { Recipient } from "../Recipient/Recipient";
import { RecipientTargetingPolicy } from "../Interfaces/RecipientTargetingPolicy";
import { FollowedTopicsPolicy } from "./TargetingPolicies/FollowedTopicsPolicy";

/**
 * Responsibility: targeting recipients
 * Analyzed properties:
 * - interest expressed in following given topic,
 * TODO: - distance between event and recipient location,
 */
export class EventDistributor {
    private readonly targetingPolicies: RecipientTargetingPolicy[] = [new FollowedTopicsPolicy()];

    public filterRelevantFor(recipient: Recipient, events: Event[]): Event[] {
        return events.filter(event => this.shouldKnowAbout(recipient, event));
    }

    private shouldKnowAbout(recipient: Recipient, event: Event): boolean {
        for (const policy of this.targetingPolicies) {
            if (policy.shouldKnowAbout(recipient, event)) {
                return true;
            }
        }
        return false;
    }
}
