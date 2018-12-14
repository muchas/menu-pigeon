import * as chai from 'chai';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as moment from 'moment';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {Recipient} from "../../../src/Recipient/Recipient";
import {PushNotifier} from "../../../src/PushNotification/PushNotifier";
import {RecipientRepository} from "../../../src/Recipient/RecipientRepository";
import {EventRepository} from "../../../src/Event/EventRepository";
import {PushNotificationSender} from "../../../src/PushNotification/PushNotificationSender";
import {LunchOfferEvent} from "../../../src/Publication/LunchOfferEvent";
import {Event} from "../../../src/Interfaces/Event";
import {Business, PersistedPublication} from "../../../src/Publication/Business";


describe('PushNotifier', () => {

    let event1: Event;
    let event2: Event;
    let event3: Event;
    let event4: Event;
    let events: Event[];
    let eventRepository: EventRepository;
    let today;

    let publication1: PersistedPublication;
    let publication2: PersistedPublication;
    let publication3: PersistedPublication;
    let publication4: PersistedPublication;

    let business1: Business;
    let business2: Business;
    let business3: Business;
    let business4: Business;

    beforeEach(async function () {
        chai.use(chaiAsPromised);
        chai.use(sinonChai);

        today = moment();
        const morning = today.toDate();

        business1 = new Business('1', 'Bococa Bistro');
        business2 = new Business('2', 'I Love Coffee Kawiarnia');
        business3 = new Business('3', 'Lunch Bar Majeranek');
        business4 = new Business('4', 'Bistro Maro');

        publication1 = new PersistedPublication(1, business1);
        publication2 = new PersistedPublication(2, business2);
        publication3 = new PersistedPublication(3, business3);
        publication4 = new PersistedPublication(4, business4);

        event1 = new LunchOfferEvent('e#1', morning, morning, ['business-1'], publication1);
        event2 = new LunchOfferEvent('e#2', morning, morning, ['business-2'], publication2);
        event3 = new LunchOfferEvent('e#3', morning, morning, ['business-3'], publication3);
        event4 = new LunchOfferEvent('e#4', morning, morning, ['business-4'], publication4);

        events = [event1, event2, event3, event4];

        eventRepository = new EventRepository(events);
    });

    it('should send messages to interested recipients', async () => {
        // given
        const recipient1 = new Recipient('r#1', 'Iza', ['business-2', 'business-3']);
        const recipient2 = new Recipient('r#2', 'Michal', ['business-3']);
        const recipient3 = new Recipient('r#3', 'Slawek', ['business-1', 'business-2', 'business-3', 'business-4']);

        const recipients = [recipient1, recipient2, recipient3];
        const recipientRepository = new RecipientRepository(recipients);
        const sender = sinon.createStubInstance(PushNotificationSender);
        // @ts-ignore
        const notifier = new PushNotifier(recipientRepository, eventRepository, sender);

        // when
        await notifier.notifyAll(today.toDate());

        // then
        expect(sender.schedule).to.have.been.calledOnceWith(recipients, []);
    });
});
