'use strict';

/**
 * Simulate a horizontal swipe on a locator for options.swipeable tests.
 *
 * The component only ever reads `event.changedTouches[0].{screenX,screenY}`
 * (see src/js/script.js #onTouchStart/#onTouchEnd), so a real `touchstart`/
 * `touchend` dispatch with that exact shape exercises the actual listener
 * wiring, `{ passive: true }` options, and `touch-action: pan-y` styling in
 * each real engine.
 *
 * Playwright's `dispatchEvent` builds a real `Touch` for 'touchstart'/
 * 'touchend' event types, but desktop Firefox doesn't expose a global `Touch`
 * constructor outside of touch-emulation mode ("Touch is not defined").
 * Dispatching a plain `Event` with `changedTouches` attached as a normal
 * property — exactly what the jsdom unit tests do (test/tabs.test.js) —
 * sidesteps that entirely and still exercises the real listener wiring in
 * every engine.
 *
 * @param {import('@playwright/test').Locator} locator
 * @param {{ x1: number, y1: number, x2: number, y2: number }} coords
 */
async function swipe(locator, { x1, y1, x2, y2 }) {
    await locator.evaluate((el, [start, end]) => {
        const startEvent = new Event('touchstart', { bubbles: true });
        startEvent.changedTouches = [start];
        el.dispatchEvent(startEvent);

        const endEvent = new Event('touchend', { bubbles: true });
        endEvent.changedTouches = [end];
        el.dispatchEvent(endEvent);
    }, [{ screenX: x1, screenY: y1 }, { screenX: x2, screenY: y2 }]);
}

module.exports = { swipe };
