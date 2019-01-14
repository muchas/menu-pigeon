import { Clock } from "../Clock";
import { PushNotifier } from "./PushNotifier";
import { injectable } from "inversify";
import moment = require("moment-timezone");

@injectable()
export class NotifierClock extends Clock {

    public constructor(private readonly notifier: PushNotifier) {
        super();
        this.period = 20 * 1000;
    }

    public async performAction() {
        await this.notifier.notifyAll(moment());
    }
}
