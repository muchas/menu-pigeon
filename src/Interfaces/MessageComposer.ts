import { Recipient } from "../Recipient/Models/Recipient";
import { Event } from "./Event";
import { Message } from "../Entity/Message";

export interface MessageComposer {
    compose(recipient: Recipient, events: Event[]): Message[];
}
