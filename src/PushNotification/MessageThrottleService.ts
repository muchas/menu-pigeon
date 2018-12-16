import {Recipient} from "../Recipient/Recipient";
import {Message} from "../Entity/Message";


export class MessageThrottleService {

    constructor() {

    }

    public throttle(recipient: Recipient, messages: Message[]): Message[] {
        return [];
    }
}
