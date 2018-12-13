import * as sinon from 'sinon';
import {SinonStubbedInstance} from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {PushNotification} from "../../../src/Entity/PushNotification";
import Expo from "expo-server-sdk";
import {Message} from "../../../src/Entity/Message";


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
        // when
        // then
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
