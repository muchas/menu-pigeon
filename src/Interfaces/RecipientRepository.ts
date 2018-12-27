import { Recipient } from "../Recipient/Recipient";
import { injectable } from "inversify";

@injectable()
export abstract class RecipientRepository {
    public async abstract findAll(): Promise<Recipient[]>;
    public async abstract findOne(id: string): Promise<Recipient | undefined>;
    public async abstract addMany(recipients: Recipient[]);
    public async abstract add(recipient: Recipient);
    public async abstract remove(id: string);
}
