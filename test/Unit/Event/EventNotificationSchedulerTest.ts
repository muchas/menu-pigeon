import * as moment from 'moment';
import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {Event} from '../../../src/Interfaces/Event';
import {RecipientPreferences, Recipient} from '../../../src/Recipient/Recipient';
import {EventNotificationScheduler} from '../../../src/Event/EventNotificationScheduler';
import {NotificationLevel} from 'queue/lib/Messages/Recipient';

describe('EventNotificationScheduler', () => {
    let preferences: RecipientPreferences;
    let recipient: Recipient;
    let scheduler: EventNotificationScheduler;
    let today;

    beforeEach(async () => {
        chai.use(chaiAsPromised);
        chai.use(sinonChai);

        today = moment();
        preferences = new RecipientPreferences(12, 0, NotificationLevel.Often);
        recipient = new Recipient('recipient#1', 'John', [], [], preferences);
        scheduler = new EventNotificationScheduler();
    });

    it('should schedule event for recipient with default preferences', async () => {
        // given
        const event = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 9).toDate(),
            expirationTime: today.set('hour', 18).toDate(),
        } as Event;

        recipient = new Recipient('recipient#2', 'Yui', [], []);

        // when
        const notifications = scheduler.schedule(recipient, [event], today.toDate());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: event.readyTime,
            expirationTime: today.set('hour', 17)  // default max notification hour is set to 17
                .set('minute', 0)
                .set('second', 0)
                .toDate(),
        });
    });

    it('should omit early expiration event', async () => {
        // given
        const event = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 9).toDate(),
            expirationTime: today.set('hour', 11).toDate(),
        } as Event;

        // when
        const notifications = scheduler.schedule(recipient, [event], today.toDate());

        // then
        expect(notifications).to.be.lengthOf(0);
    });

    it('should omit late ready event', async () => {
        // given
        const event = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 18).toDate(),
            expirationTime: today.set('hour', 23).toDate(),
        } as Event;

        // when
        const notifications = scheduler.schedule(recipient, [event], today.toDate());

        // then
        expect(notifications).to.be.lengthOf(0);
    });

    it('should schedule event on recipient preferred hour', async () => {
        // given
        const event = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 10).toDate(),
            expirationTime: today
                .set('hour', 16)
                .set('minute', 0)
                .toDate(),
        } as Event;

        // when
        const notifications = scheduler.schedule(recipient, [event], today.toDate());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: today
                .set('hour', 12)
                .set('minute', 0)
                .set('second', 0)
                .toDate(),
            expirationTime: event.expirationTime,
        });
    });

    it('should schedule event after recipient preferred hour', async () => {
        // given
        const event = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 13).toDate(),
            expirationTime: today
                .set('hour', 16)
                .set('minute', 0)
                .toDate(),
        } as Event;

        // when
        const notifications = scheduler.schedule(recipient, [event], today.toDate());

        // then
        expect(notifications).to.be.lengthOf(1);
        expect(notifications[0]).to.deep.equal({
            event,
            recipient,
            readyTime: event.readyTime,
            expirationTime: event.expirationTime,
        });
    });

    it('should schedule many notifications', async () => {
        // given
        const event1 = {
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 11).toDate(),
            expirationTime: today
                .set('hour', 15)
                .set('minute', 0)
                .toDate(),
        } as Event;
        const event2 = {
            id: 'lafqlkmq-akjwnfkj',
            eventType: 'lunch-offer',
            readyTime: today.set('hour', 10).toDate(),
            expirationTime: today
                .set('hour', 20)
                .set('minute', 0)
                .toDate(),
        } as Event;

        // when
        const notifications = scheduler.schedule(recipient, [event1, event2], today.toDate());

        // then
        const readyTime = today.set('hour', 12).set('minute', 0).set('second', 0).toDate();
        expect(notifications).to.be.lengthOf(2);
        expect(notifications.map((n) => n.readyTime)).to.deep.equal([readyTime, readyTime]);
    });
});
