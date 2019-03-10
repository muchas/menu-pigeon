import * as moment from "moment-timezone";
import { LunchOfferEvent } from "./LunchOfferEvent";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import { Moment } from "moment-timezone";
import * as uuid from "uuid";

export class LunchOfferEventFactory {
    public create(publication: PersistedPublication): LunchOfferEvent[] {
        return publication.lunchOffers.map(offer => {
            const readyTime = moment.max([
                this.resetToDayStart(offer.date),
                moment(publication.readyTime),
            ]);
            const expirationTime = this.resetToDayStart(offer.date).add("1", "day");

            const topics = this.getPublicationTopics(publication);

            return new LunchOfferEvent(uuid.v4(), readyTime, expirationTime, topics, publication);
        });
    }

    private resetToDayStart(time: Date): Moment {
        return moment(time)
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0);
    }

    private getPublicationTopics(publication: PersistedPublication): string[] {
        return [`business-${publication.businessId}`];
    }
}
