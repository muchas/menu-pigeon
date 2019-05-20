import { SerialClock } from "../../SerialClock";
import { PushNotifier } from "../services/PushNotifier";
import { injectable } from "inversify";
import * as moment from "moment-timezone";

@injectable()
export class NotifierClock extends SerialClock {
    public constructor(private readonly notifier: PushNotifier) {
        super();
        this.period = 20 * 1000;
    }

    public async performAction(): Promise<void> {
        await this.notifier.notifyAll(moment());
    }
}
