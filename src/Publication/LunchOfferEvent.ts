import {Event} from "../Interfaces/Event";


export class LunchOfferEvent implements Event {

    constructor(public id: string,
                public readyTime: Date,
                public expirationTime: Date,
                public eventType: string = 'LUNCH_OFFER',
                public topics: string[],
                public content: any) {}

    get business(): Business {
        // TODO: implement (take from content)
        return null
    }
}
