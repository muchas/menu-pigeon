import { Recipient } from "../Recipient/Recipient";
import { Event } from "./Event";

export interface RecipientTargetingPolicy {
    shouldKnowAbout(recipient: Recipient, event: Event);
}
