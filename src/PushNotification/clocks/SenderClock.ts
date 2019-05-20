import { SerialClock } from "../../SerialClock";
import { injectable } from "inversify";
import { PushNotificationSender } from "../services/PushNotificationSender";

@injectable()
export class SenderClock extends SerialClock {
    public constructor(private readonly sender: PushNotificationSender) {
        super();
        this.period = 2 * 1000;
    }

    public async performAction(): Promise<void> {
        await this.sender.sendReady();
    }
}
