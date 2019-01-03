import { Db, MongoClient } from "mongodb";
import { injectable } from "inversify";

@injectable()
export default class Mongo {
    private readonly databaseName: string;
    private readonly url: string;
    private client: MongoClient;
    private _db: Db;

    public constructor(host: string, port: number, username: string, password: string, database: string) {
        this.databaseName = database;
        this.url = this.generateUrl(username, password, host, port);
    }

    public async connect(): Promise<Db> {
        if (!this._db) {
            this.client = await MongoClient.connect(this.url, {
                useNewUrlParser: true,
            });
            this._db = await this.client.db(this.databaseName);
        }

        return this._db;
    }

    public async disconnect(): Promise<void> {
        await this.client.close();
    }

    public get db(): Db {
        return this._db;
    }

    private generateUrl(username: string, password: string, host: string, port: number) {
        if (username || password) {
            return `mongodb://${username}:${password}@${host}:${port}/${this.databaseName}`;
        }

        return `mongodb://${host}:${port}/${this.databaseName}`;
    }
}
