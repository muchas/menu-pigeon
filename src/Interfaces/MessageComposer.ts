import { Recipient } from "../Recipient/models/Recipient";
import { Event } from "./Event";
import { Message } from "../Entity/Message";

export interface MessageComposer<T extends Event> {
    compose(recipient: Recipient, events: T[]): Message[];
}
