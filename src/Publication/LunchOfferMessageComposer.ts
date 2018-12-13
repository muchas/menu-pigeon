import {MessageComposer} from "../Interfaces/MessageComposer";
import {Recipient} from "../Recipient/Recipient";
import {Event} from "../Interfaces/Event";
import {Message} from "../Entity/Message";


export class LunchOfferMessageComposer implements MessageComposer {

    compose(recipient: Recipient, events: Event[]): Message[] {
        return undefined;
    }
}
