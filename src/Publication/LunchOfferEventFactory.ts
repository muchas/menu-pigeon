import * as moment from 'moment';
import {LunchOfferEvent} from "./LunchOfferEvent";
import {PersistedPublication} from "queue/lib/Messages/PersistedPublication";
import {Moment} from "moment";
import * as uuid from "uuid";


export class LunchOfferEventFactory {

    public create(publication: PersistedPublication): LunchOfferEvent[] {
        return publication.lunchOffers.map((offer) => {
            const readyTime = this.resetToDayStart(offer.date).toDate();
            const expirationTime = this.resetToDayStart(offer.date)
                .add('1', 'day')
                .toDate();

            const topics = this.getPublicationTopics(publication);

            return new LunchOfferEvent(uuid.v4(), readyTime, expirationTime, topics, publication);
        });
    }

    private resetToDayStart(time: Date): Moment {
        return moment(time)
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0);
    }

    private getPublicationTopics(publication: PersistedPublication): string[] {
        return [`business-${publication.businessName}`]
    }
}
