import Timeout = NodeJS.Timeout;
import { injectable } from "inversify";
import * as winston from "winston";

@injectable()
export abstract class Clock {
    protected period: number = 10;

    private lastTimeout: Timeout;

    public async abstract performAction();

    public async start() {
        return this.tick();
    }

    public async tick() {
        if (this.lastTimeout !== undefined) {
           clearTimeout(this.lastTimeout);
           this.lastTimeout = undefined;
        }

        try {
            await this.performAction();

            setTimeout(async () => this.tick(), this.period);
        } catch(e) {
            winston.error(e);
            winston.error('Clock stopped ticking');
        }
    }
}
