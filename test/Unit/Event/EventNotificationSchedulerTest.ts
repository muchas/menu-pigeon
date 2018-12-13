import * as sinon from 'sinon';
import {expect} from 'chai';
import {SinonStubbedInstance} from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {PushNotification} from "../../../src/Entity/PushNotification";
import Expo from "expo-server-sdk";
import {Message} from "../../../src/Entity/Message";
import {Event} from "../../../src/Interfaces/Event";
import {NotificationPreferences, Recipient} from "../../../src/Recipient/Recipient";
import {EventNotificationScheduler} from "../../../src/Event/EventNotificationScheduler";


const createPushNotification = (message: Message,
                                token: string,
                                status: number,
                                receiptId?: string): PushNotification => {
    const notification = new PushNotification();
    notification.status = status;
    notification.pushToken = token;
    notification.message = message;
    notification.receiptId = receiptId;
    return notification;
};

describe('EventNotificationScheduler', () => {

    describe('sending pushes', () => {
        let expoClient: SinonStubbedInstance<Expo>;
        let message: Message;
        let pushNotification: PushNotification;

        beforeEach(async function () {
            chai.use(chaiAsPromised);
            chai.use(sinonChai);

            message = new Message();
            message.title = 'Pretty nice title';
            message.body = 'This is message body!';
            message.priority = 'high';

            pushNotification = createPushNotification(message, 'PUSH_TOKEN1', 0);

            expoClient = sinon.createStubInstance(Expo);
        });
    });

    it('should schedule event for recipient with default preferences', async () => {
        // given
        // when
        // then
    });

    it('should omit early expiration event for recipient with late preferred hour', async () => {
        // given
        // when
        // then
    });

    it('should schedule event on recipient preferred hour', async () => {
        // given
        // TODO: set correct dates
        const event = <Event>{
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            topics: ['topic-2'],
            readyTime: new Date(),
            expirationTime: new Date(),
        };

        const today = new Date();
        const preferences = new NotificationPreferences(12, 0);
        const recipient = new Recipient('recipient#1', 'John', [], [], preferences);

        const scheduler = new EventNotificationScheduler();

        // when
        const notifications = scheduler.schedule(recipient, [event], today);

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({event, recipient, readyTime: '', expiredTime: ''})
    });

    it('should schedule event after recipient preferred hour', async () => {
        // given
        // when
        // then
    });

    it('should schedule many notifications', async () => {
        // given
        // when
        // then
    });
});
