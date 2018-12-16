import { Event } from "../Interfaces/Event";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";

export class LunchOfferEvent implements Event {

    public constructor(
        public id: string,
        public readyTime: Date,
        public expirationTime: Date,
        public topics: string[],
        public content: PersistedPublication,
        public eventType: string = "LUNCH_OFFER"
    ) {}

    public get businessId(): string {
        return this.content.businessId;
    }

    public get businessName(): string {
        return this.content.businessName;
    }
}
