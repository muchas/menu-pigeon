import Timeout = NodeJS.Timeout;

export abstract class Clock {

    private lastTimeout: Timeout;
    protected period: number = 10;

    public async abstract performAction();

    public start() {
        this.tick();
    }

    public async tick() {
        if (this.lastTimeout !== undefined) {
           clearTimeout(this.lastTimeout);
           this.lastTimeout = undefined;
        }

        await this.performAction();
        setTimeout(() => this.tick(), this.period);
    }
}
