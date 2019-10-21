import { Recipient } from "../Recipient/models/Recipient";
import { injectable } from "inversify";

// NOTE: since DI framework in TS cannot bind instances to interfaces
// (due to the interfaces removal during compilation) this interface is
// written as abstract class
@injectable()
export abstract class RecipientRepository {
    public abstract async findAll(): Promise<Recipient[]>;
    public abstract async findAndLockAll(): Promise<Recipient[]>;
    public abstract async unlock(recipients: Recipient[]): Promise<void>;
    public abstract async findByDevice(pushToken: string): Promise<Recipient[]>;
    public abstract async findByDevices(pushTokens: string[]): Promise<Recipient[]>;
    public abstract async findOne(id: string): Promise<Recipient | undefined>;
    public abstract async addMany(recipients: Recipient[]): Promise<void>;
    public abstract async add(recipient: Recipient): Promise<void>;
    public abstract async remove(id: string): Promise<void>;
    public abstract async removeMany(ids: string[]): Promise<void>;
}
