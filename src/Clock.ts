import Timeout = NodeJS.Timeout;

export class Clock {

    private lastTimeout: Timeout;

    constructor(private action: () => any,
                private period: number) {}

    public tick() {
        if (this.lastTimeout !== undefined) {
           clearTimeout(this.lastTimeout);
           this.lastTimeout = undefined;
        }

        this.action();
        setTimeout(() => this.tick(), this.period);
    }
}
