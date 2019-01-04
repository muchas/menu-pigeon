import { Clock } from "../Clock";
import { injectable } from "inversify";
import { PushNotificationStatusChecker } from "./PushNotificationStatusChecker";

@injectable()
export class StatusCheckerClock extends Clock {

    public constructor(private readonly statusChecker: PushNotificationStatusChecker) {
        super();
        this.period = 60 * 1000;
    }

    public async performAction() {
        await this.statusChecker.updateStatus();
    }
}
