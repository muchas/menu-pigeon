import { Clock } from "../Clock";
import { injectable } from "inversify";
import { PushNotificationSender } from "./PushNotificationSender";

@injectable()
export class SenderClock extends Clock {

    public constructor(private readonly sender: PushNotificationSender) {
        super();
        this.period = 2 * 1000;
    }

    public async performAction() {
        await this.sender.sendReady();
    }
}
