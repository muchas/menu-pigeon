import Timeout = NodeJS.Timeout;
import { injectable } from "inversify";
import * as winston from "winston";
/* tslint:disable:no-require-imports */
import AwaitLock = require("await-lock");

@injectable()
export abstract class SerialClock {
    protected period: number = 10;

    private lastTimeout: Timeout;
    private readonly lock: AwaitLock;

    public abstract async performAction(): Promise<void>;

    protected constructor() {
        this.lock = new AwaitLock();
    }

    public async start(): Promise<void> {
        return this.tick();
    }

    public async tick(): Promise<void> {
        if (this.lastTimeout !== undefined) {
            clearTimeout(this.lastTimeout);
            this.lastTimeout = undefined;
        }

        await this.lock.acquireAsync();
        try {
            await this.performAction();

            this.lastTimeout = setTimeout(async () => this.tick(), this.period);
        } catch (e) {
            winston.error(e);
            winston.error("SerialClock stopped ticking");
        } finally {
            this.lock.release();
        }
    }
}
