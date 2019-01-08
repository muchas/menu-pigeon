import * as sinon from "sinon";
import { setup } from "../../utils";
import { expect } from "chai";
import { NotifierClock } from "../../../src/PushNotification/NotifierClock";
import { SinonFakeTimers, SinonStubbedInstance } from "sinon";
import { PushNotifier } from "../../../src/PushNotification/PushNotifier";

describe("NotifierClockTest", () => {
    let clock: SinonFakeTimers;
    let notifierClock: NotifierClock;
    let pushNotifer: SinonStubbedInstance<PushNotifier>;

    beforeEach(() => {
        setup();
        clock = sinon.useFakeTimers();

        pushNotifer = sinon.createStubInstance(PushNotifier);
        notifierClock = new NotifierClock(pushNotifer as any);
    });

    afterEach(() => {
        clock.restore();
    });

    it("should not notify before 20 seconds interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(19.5 * 1000);

        // then
        expect(pushNotifer.notifyAll).to.have.callCount(1);
    });

    it("should tick each 20 second interval", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(20.1 * 1000);

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });

    it("should tick each ", async () => {
        // given
        await notifierClock.start();

        // when
        clock.tick(16 * 1000);
        await notifierClock.tick();  // should cancel previous call
        clock.tick(19.5 * 1000);

        // then
        expect(pushNotifer.notifyAll).to.be.callCount(2);
    });
});
