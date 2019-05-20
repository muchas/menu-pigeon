import { Recipient } from "../Recipient/models/Recipient";
import { sample } from "../utils";
import { Message } from "../Entity/Message";
import { boundMethod } from "autobind-decorator";
import * as moment from "moment-timezone";

interface MessageFormat {
    title: string;
    body: string;
}

export class ReminderMessageFactory {
    private readonly messages: MessageFormat[] = [
        {
            title: "Gotowy na lunch?",
            body: "Skorzystaj z aplikacji i znajdź coś smacznego!",
        },
        {
            title: "Wybierz swój lunch",
            body: "Z aplikacją będzie łatwiej!",
        },
        {
            title: "Czas na obiad",
            body: "Sprawdź co na lunch w Twojej okolicy!",
        },
    ];

    private static readonly NOTIFICATION_TYPE: string = "APP_REMINDER";

    @boundMethod
    public create(recipient: Recipient): Message {
        const sampledMessage = sample(this.messages);
        const message = new Message();
        message.recipientId = recipient.id;
        message.title = sampledMessage.title;
        message.body = sampledMessage.body;
        message.priority = "high";
        message.expirationTime = moment()
            .hour(13)
            .toDate();
        message.setEventType(ReminderMessageFactory.NOTIFICATION_TYPE);
        message.setNotificationData({ type: ReminderMessageFactory.NOTIFICATION_TYPE });
        return message;
    }
}
