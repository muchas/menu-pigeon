import {Recipient} from '../Recipient/Recipient';
import {Event} from './Event';
import {Message} from '../Entity/Message';

export interface MessageComposer {
    compose(recipient: Recipient, events: Event[]): Message[];
}
