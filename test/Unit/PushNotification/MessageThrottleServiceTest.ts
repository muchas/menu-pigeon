import * as moment from 'moment';
import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {Event} from '../../../src/Interfaces/Event';
import {Recipient, RecipientPreferences} from '../../../src/Recipient/Recipient';
import {EventNotificationScheduler} from '../../../src/Event/EventNotificationScheduler';
import {NotificationLevel} from 'queue/lib/Messages/Recipient';
import {MessageThrottleService} from "../../../src/PushNotification/MessageThrottleService";
import {Message} from "../../../src/Entity/Message";


const createMessage = (topics: string[] = []) => {
    const message = new Message();
    message.title = 'Hej John, lunch dnia!';
    message.body = 'Sprawdź szczegóły';
    message.topics = topics;
    return message;
};


describe('MessageThrottleService', () => {

    let throttleService: MessageThrottleService;
    let recipient: Recipient;

    beforeEach(async () => {
        chai.use(chaiAsPromised);
        chai.use(sinonChai);

        throttleService = new MessageThrottleService();
        recipient = new Recipient('#r1', 'John', []);
    });

    it('should stop messages if disabled', async () => {
        // given
        const messages = [createMessage(), createMessage(), createMessage()];

        recipient.preferences = new RecipientPreferences(9, 0, NotificationLevel.Never);

        // when
        const throttledMessages = throttleService.throttle(recipient, messages);

        // then
        expect(throttledMessages).to.be.lengthOf(0);
    });
});
