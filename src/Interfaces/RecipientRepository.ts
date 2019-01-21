import { Recipient } from "../Recipient/Recipient";
import { injectable } from "inversify";

@injectable()
export abstract class RecipientRepository {
    public async abstract findAll(): Promise<Recipient[]>;
    public async abstract findByDevice(pushToken: string): Promise<Recipient[]>;
    public async abstract findOne(id: string): Promise<Recipient | undefined>;
    public async abstract addMany(recipients: Recipient[]): Promise<void>;
    public async abstract add(recipient: Recipient): Promise<void>;
    public async abstract remove(id: string): Promise<void>;
}
