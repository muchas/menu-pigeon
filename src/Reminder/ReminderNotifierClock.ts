import { SerialClock } from "../SerialClock";
import { ReminderNotifier } from "./ReminderNotifier";
import { injectable } from "inversify";
import * as moment from "moment-timezone";

@injectable()
export class ReminderNotifierClock extends SerialClock {
    public constructor(private readonly notifier: ReminderNotifier) {
        super();
        this.period = 5 * 60 * 1000;
    }

    public async performAction(): Promise<void> {
        await this.notifier.notifyRareRecipients(moment());
    }
}
