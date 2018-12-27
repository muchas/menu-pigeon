import { Recipient } from "../Recipient/Recipient";
import { injectable } from "inversify";

@injectable()
export abstract class RecipientRepository {
    public async abstract findAll(): Promise<Recipient[]>;
    public async abstract findOne(id: string): Promise<Recipient | undefined>;
    public async abstract upsertMany(recipients: Recipient[]);
    public async abstract upsert(recipient: Recipient);
    public async abstract remove(id: string);
}
