import { PushNotificationSender } from "../PushNotification/PushNotificationSender";
import { RecipientRepository } from "../Interfaces/RecipientRepository";
import { Recipient } from "../Recipient/Models/Recipient";
import * as moment from "moment-timezone";
import { Moment } from "moment-timezone";
import { NotificationLevel } from "queue/lib/Messages/Recipient";
import { ReminderMessageFactory } from "./ReminderMessageFactory";
import { injectable } from "inversify";

@injectable()
export class ReminderNotifier {
    private static readonly SILENT_DAYS: number = 14;
    private static readonly FORBIDDEN_DAYS: number[] = [5, 6, 0]; // Fri, Sat, Sun
    private static readonly START_HOUR: number = 11;
    private static readonly START_MINUTE: number = 15;
    private static readonly END_HOUR: number = 12;
    private static readonly END_MINUTE: number = 0;

    private readonly reminderMessageFactory: ReminderMessageFactory;

    public constructor(
        private readonly recipientRepository: RecipientRepository,
        private readonly pushNotificationSender: PushNotificationSender,
    ) {
        this.reminderMessageFactory = new ReminderMessageFactory();
    }

    public async notifyRareRecipients(currentTime: Moment = moment()): Promise<void> {
        if (!this.isAllowedToNotify(currentTime)) {
            return;
        }

        const recipients = await this.getRareRecipients(currentTime);
        const messages = recipients.map(this.reminderMessageFactory.create);

        await this.pushNotificationSender.schedule(recipients, messages);
    }

    private isAllowedToNotify(currentTime: Moment): boolean {
        const startTime = moment(currentTime)
            .hour(ReminderNotifier.START_HOUR)
            .minute(ReminderNotifier.START_MINUTE)
            .second(0);
        const endTime = moment(currentTime)
            .hour(ReminderNotifier.END_HOUR)
            .minute(ReminderNotifier.END_MINUTE)
            .second(0);

        return (
            !ReminderNotifier.FORBIDDEN_DAYS.includes(currentTime.weekday()) &&
            currentTime.isBetween(startTime, endTime, "minute", "[]")
        );
    }

    private async getRareRecipients(currentTime: Moment): Promise<Recipient[]> {
        const boundaryDate = moment(currentTime).subtract(ReminderNotifier.SILENT_DAYS, "day");
        const recipients = await this.recipientRepository.findAll();

        return recipients.filter(
            recipient =>
                recipient.preferences.level !== NotificationLevel.Never &&
                (!recipient.lastNotificationTime || recipient.lastNotificationTime <= boundaryDate),
        );
    }
}
