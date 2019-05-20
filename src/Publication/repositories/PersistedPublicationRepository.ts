import { injectable } from "inversify";
import { PersistedPublication } from "queue/lib/Messages/PersistedPublication";
import Mongo from "../../Mongo";
import { Collection } from "mongodb";

@injectable()
export class PersistedPublicationRepository {
    private static readonly COLLECTION_NAME: string = "persisted_publication_ids";

    public constructor(private readonly mongo: Mongo) {
        //
    }

    public async add(publication: PersistedPublication): Promise<boolean> {
        const result = await this.collection().updateOne(
            {
                id: publication.id,
            },
            {
                $set: {
                    id: publication.id,
                },
            },
            {
                upsert: true,
            },
        );
        return result.upsertedCount === 1;
    }

    private collection(): Collection {
        return this.mongo.db.collection(PersistedPublicationRepository.COLLECTION_NAME);
    }
}
