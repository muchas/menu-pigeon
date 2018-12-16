import Timeout = NodeJS.Timeout;

export abstract class Clock {
    protected period: number = 10;

    private lastTimeout: Timeout;

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
