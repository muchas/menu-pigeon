import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';
import {EventDistributor} from "../../../src/Event/EventDistributor";
import {Recipient} from "../../../src/Recipient/Recipient";
import {Event} from "../../../src/Interfaces/Event";


describe('EventDistributor', () => {

    describe('distributing events', () => {

        beforeEach(async function () {
            chai.use(chaiAsPromised);
            chai.use(sinonChai);
        });
    });

    it('filterRelevantFor events to recipients based on followed topics', async () => {
        // given
        const event1 = <Event>{
            id: 'kjcblk10-9eknjsal',
            eventType: 'lunch-offer',
            topics: ['topic-1', 'topic-2'],
        };
        const event2 = <Event>{
            id: 'i1uj4-n1h24-cbm19',
            eventType: 'lunch-offer',
            topics: ['topic-2'],
        };
        const event3 = <Event>{
            id: 'iu12h4iu-1kj24-j124',
            eventType: 'lunch-offer',
            topics: ['topic-1'],
        };
        const events = [
            event1, event2, event3
        ];

        const distributor = new EventDistributor();
        const recipient = new Recipient('recipient#1', 'John', ['topic-1']);

        // when
        const relevantEvents = distributor.filterRelevantFor(recipient, events);

        // then
        expect(relevantEvents).to.be.lengthOf(2);
        expect(relevantEvents).to.deep.equal([[event1, event3]])
    });
});
