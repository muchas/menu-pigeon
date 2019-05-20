import { SerialClock } from "../../SerialClock";
import { injectable } from "inversify";
import { PushNotificationStatusChecker } from "../services/PushNotificationStatusChecker";

@injectable()
export class StatusCheckerClock extends SerialClock {
    public constructor(private readonly statusChecker: PushNotificationStatusChecker) {
        super();
        this.period = 60 * 1000;
    }

    public async performAction(): Promise<void> {
        await this.statusChecker.updateStatus();
    }
}
