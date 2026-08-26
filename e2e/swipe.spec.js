'use strict';

const { test, expect } = require('@playwright/test');
const { swipe } = require('./support/swipe');

test.describe('options.swipeable', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/swipeable.html');
    });

    test('a horizontal swipe left selects the next tab', async ({ page }) => {
        const panels = page.locator('.tab-panel');

        await swipe(panels.nth(0), { x1: 200, y1: 100, x2: 50, y2: 105 });

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(1);
    });

    test('a horizontal swipe right selects the previous tab', async ({ page }) => {
        await page.evaluate(() => window.tabsInstance.selectTab(1));
        const panels = page.locator('.tab-panel');

        await swipe(panels.nth(1), { x1: 50, y1: 100, x2: 200, y2: 105 });

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('swiping left from the last tab wraps to the first', async ({ page }) => {
        await page.evaluate(() => window.tabsInstance.selectTab(2));
        const panels = page.locator('.tab-panel');

        await swipe(panels.nth(2), { x1: 200, y1: 100, x2: 50, y2: 105 });

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('a mostly-vertical or too-short drag is ignored', async ({ page }) => {
        const panels = page.locator('.tab-panel');

        await swipe(panels.nth(0), { x1: 100, y1: 200, x2: 90, y2: 20 }); // mostly vertical
        await swipe(panels.nth(0), { x1: 100, y1: 100, x2: 90, y2: 100 }); // below threshold

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('panels get touch-action: pan-y so a vertical scroll is not blocked', async ({ page }) => {
        const touchAction = await page.locator('.tab-panel').first().evaluate((el) => getComputedStyle(el).touchAction);

        expect(touchAction).toBe('pan-y');
    });
});

test.describe('swipe is a no-op when options.swipeable is not set', () => {
    test('a horizontal swipe on the default fixture does not change the active tab', async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
        const panels = page.locator('.tab-panel');

        await swipe(panels.nth(0), { x1: 200, y1: 100, x2: 50, y2: 105 });

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });
});
