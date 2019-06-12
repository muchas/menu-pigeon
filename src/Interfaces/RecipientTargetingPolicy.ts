import { Recipient } from "../Recipient/models/Recipient";
import { Event } from "./Event";

export interface RecipientTargetingPolicy {
    shouldKnowAbout(recipient: Recipient, event: Event): boolean;
}
