import { Event } from "../Interfaces/Event";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { Moment } from "moment-timezone";

export const LUNCH_OFFER_EVENT_TYPE = "LUNCH_OFFER";

export class LunchOfferEvent implements Event {

    public constructor(
        public id: string,
        public readyTime: Moment,
        public expirationTime: Moment,
        public topics: string[],
        public content: PersistedPublication,
        public eventType: string = LUNCH_OFFER_EVENT_TYPE,
    ) {}
}
