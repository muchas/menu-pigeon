import * as sinon from "sinon";
import { SinonFakeTimers, SinonStubbedInstance } from "sinon";
import { setup } from "../../utils";
import { expect } from "chai";
import { NotifierClock } from "../../../src/PushNotification/clocks/NotifierClock";
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

    it("should not notify before 10 seconds interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(9.5 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.have.callCount(1);
    });

    it("should tick each 10 second interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(10.1 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });

    it("intermediate tick should cancel previous timeout", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(6 * 1000);
        await notifierClock.tick(); // should cancel previous call
        clock.tick(9.5 * 1000);
        await emptyTask();

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });
});
