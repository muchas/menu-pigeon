import { injectable } from "inversify";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import Mongo from "../../Mongo";
import { Collection } from "mongodb";
import * as moment from "moment-timezone";

@injectable()
export class PersistedPublicationRegister {
    private static readonly COLLECTION_NAME: string = "persisted_publication_ids";

    public constructor(private readonly mongo: Mongo) {
        //
    }

    public async register(publication: PersistedPublication): Promise<boolean> {
        const date = moment(publication.readyTime).format("YYYY-MM-DD");
        const result = await this.collection().updateOne(
            {
                businessId: publication.businessId,
                date,
            },
            {
                $set: {
                    businessId: publication.businessId,
                    date,
                },
            },
            {
                upsert: true,
            },
        );
        return result.upsertedCount === 1;
    }

    private collection(): Collection {
        return this.mongo.db.collection(PersistedPublicationRegister.COLLECTION_NAME);
    }
}
