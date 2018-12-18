import Timeout = NodeJS.Timeout;
import {injectable} from "inversify";

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

        await this.performAction();
        setTimeout(async () => this.tick(), this.period);
    }
}
