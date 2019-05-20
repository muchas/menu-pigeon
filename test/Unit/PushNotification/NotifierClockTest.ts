import * as sinon from "sinon";
import { setup, sleep } from "../../utils";
import { expect } from "chai";
import { NotifierClock } from "../../../src/PushNotification/clocks/NotifierClock";
import { SinonFakeTimers, SinonStubbedInstance } from "sinon";
import { PushNotifier } from "../../../src/PushNotification/services/PushNotifier";

describe("NotifierClockTest", () => {
    let clock: SinonFakeTimers;
    let notifierClock: NotifierClock;
    let pushNotifer: SinonStubbedInstance<PushNotifier>;
    let emptyTask: () => Promise<void>;

    beforeEach(() => {
        setup();
        clock = sinon.useFakeTimers();

        pushNotifer = sinon.createStubInstance(PushNotifier);
        notifierClock = new NotifierClock(pushNotifer as any);
        emptyTask = async () => null;
    });

    afterEach(() => {
        clock.restore();
    });

    it("should not notify before 20 seconds interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(19.5 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.have.callCount(1);
    });

    it("should tick each 20 second interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(20.1 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });

    it("intermediate tick should cancel previous timeout", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(16 * 1000);
        await notifierClock.tick(); // should cancel previous call
        clock.tick(19.5 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });

    it("should not run concurrently with other ticks (ticks should be serial)", async () => {
        // given
        const firstCall = sinon.stub();
        const nextCall = sinon.stub();

        let callCount = 0;
        const sleepPushNotifier = {
            notifyAll: async () => {
                callCount += 1;
                if (callCount <= 1) {
                    await sleep(10 * 1000);
                    firstCall();
                } else {
                    await sleep(2 * 1000);
                    nextCall();
                }
            },
        };
        notifierClock = new NotifierClock(sleepPushNotifier as any);

        // when
        notifierClock.tick().catch(() => null);
        notifierClock.tick().catch(() => null);

        clock.tick(5 * 1000);
        // after this time first tick is still sleeping
        // the second call is possible but should not occur

        await emptyTask(); // let ticks process in the event loop

        // then
        expect(firstCall).to.be.not.called;
        expect(nextCall).to.be.not.called;
    });
});
