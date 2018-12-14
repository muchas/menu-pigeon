import {Event} from "../Interfaces/Event";
import {Business, PersistedPublication} from "./Business";


export class LunchOfferEvent implements Event {

    constructor(public id: string,
                public readyTime: Date,
                public expirationTime: Date,
                public topics: string[],
                public content: PersistedPublication,
                public eventType: string = 'LUNCH_OFFER') {}

    get business(): Business {
        return this.content.business;
    }
}
