import Timeout = NodeJS.Timeout;
import { injectable } from "inversify";
import * as winston from "winston";

@injectable()
export abstract class Clock {
    protected period: number = 10;

    private lastTimeout: Timeout;

    public abstract async performAction(): Promise<void>;

    public async start(): Promise<void> {
        return this.tick();
    }

    public async tick(): Promise<void> {
        this.clearLastTimeout();
        try {
            await this.performAction();

            this.lastTimeout = setTimeout(async () => this.tick(), this.period);
        } catch (e) {
            winston.error(e);
            winston.error("Clock stopped ticking");
        }
    }

    private clearLastTimeout(): void {
        if (this.lastTimeout !== undefined) {
            clearTimeout(this.lastTimeout);
            this.lastTimeout = undefined;
        }
    }
}
