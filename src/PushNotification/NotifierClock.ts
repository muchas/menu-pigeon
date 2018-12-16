import { Clock } from "../Clock";
import { PushNotifier } from "./PushNotifier";
import { injectable } from "inversify";

@injectable()
export class NotifierClock extends Clock {

    public constructor(private readonly notifier: PushNotifier) {
        super();
        this.period = 10 * 1000;
    }

    public async performAction() {
        await this.notifier.notifyAll(new Date());
    }
}
