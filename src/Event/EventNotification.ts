import {Event} from '../Interfaces/Event';
import {Recipient} from '../Recipient/Recipient';

export class EventNotification {

    constructor(public readyTime: Date,
                public expirationTime: Date,
                public event: Event,
                public recipient: Recipient) {}
}
