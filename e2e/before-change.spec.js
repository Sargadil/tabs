'use strict';

const { test, expect } = require('@playwright/test');

test.describe('tabs:beforechange event', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('is cancelable, bubbles, and carries {fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel}', async ({ page }) => {
        const tabs = page.getByRole('tab');

        const detail = await page.evaluate(() => {
            return new Promise((resolve) => {
                const container = document.getElementById('tabs');
                const tabButtons = container.querySelectorAll('[role="tab"]');

                container.addEventListener('tabs:beforechange', (event) => {
                    resolve({
                        cancelable: event.cancelable,
                        bubbles: event.bubbles,
                        fromIndex: event.detail.fromIndex,
                        toIndex: event.detail.toIndex,
                        fromTabIsIndex0: event.detail.fromTab === tabButtons[0],
                        toTabIsIndex2: event.detail.toTab === tabButtons[2],
                        fromPanelIsPanel0: event.detail.fromPanel === document.querySelectorAll('.tab-panel')[0],
                        toPanelIsPanel2: event.detail.toPanel === document.querySelectorAll('.tab-panel')[2],
                    });
                }, { once: true });

                window.tabsInstance.selectTab(2);
            });
        });

        expect(detail).toEqual({
            cancelable: true,
            bubbles: true,
            fromIndex: 0,
            toIndex: 2,
            fromTabIsIndex0: true,
            toTabIsIndex2: true,
            fromPanelIsPanel0: true,
            toPanelIsPanel2: true,
        });

        // sanity: the (non-canceled) transition from the evaluate() block above actually happened.
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('fires before "tabs:change", and before any state mutation, on a normal transition', async ({ page }) => {
        const order = await page.evaluate(() => {
            return new Promise((resolve) => {
                const container = document.getElementById('tabs');
                const events = [];

                container.addEventListener('tabs:beforechange', (event) => {
                    events.push({
                        type: 'tabs:beforechange',
                        toTabAlreadySelected: event.detail.toTab.getAttribute('aria-selected') === 'true',
                        oldPanelStillVisible: !event.detail.fromPanel.hidden,
                    });
                });

                container.addEventListener('tabs:change', (event) => {
                    events.push({ type: 'tabs:change', index: event.detail.index });
                    resolve(events);
                });

                window.tabsInstance.selectTab(1);
            });
        });

        expect(order).toEqual([
            { type: 'tabs:beforechange', toTabAlreadySelected: false, oldPanelStillVisible: true },
            { type: 'tabs:change', index: 1 },
        ]);
    });

    test('canceling a click leaves aria-selected, tabindex, hidden panels, and selected index untouched, and restores focus', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.evaluate(() => {
            document.getElementById('tabs').addEventListener('tabs:beforechange', (event) => event.preventDefault());
        });

        await tabs.nth(0).focus();
        await tabs.nth(2).click();

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
        await expect(tabs.nth(2)).toHaveAttribute('tabindex', '-1');
        await expect(panels.nth(0)).toBeVisible();
        await expect(panels.nth(2)).toBeHidden();
        await expect(tabs.nth(0)).toBeFocused();

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('canceling a keyboard change leaves focus/selection untouched', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.evaluate(() => {
            document.getElementById('tabs').addEventListener('tabs:beforechange', (event) => event.preventDefault());
        });

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(0)).toBeVisible();
        await expect(tabs.nth(0)).toBeFocused();

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('canceling selectTab() leaves state untouched and does not steal focus', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        const result = await page.evaluate(() => {
            document.getElementById('tabs').addEventListener('tabs:beforechange', (event) => event.preventDefault());
            window.tabsInstance.selectTab(2);

            return { activeElementIsBody: document.activeElement === document.body };
        });

        expect(result.activeElementIsBody).toBe(true);
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(0)).toBeVisible();
        await expect(panels.nth(2)).toBeHidden();

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(0);
    });

    test('canceling prevents "tabs:change" from firing', async ({ page }) => {
        const tabs = page.getByRole('tab');

        const changeCount = await page.evaluate(() => {
            const container = document.getElementById('tabs');
            let count = 0;

            container.addEventListener('tabs:beforechange', (event) => event.preventDefault());
            container.addEventListener('tabs:change', () => count++);

            window.tabsInstance.selectTab(1);

            return count;
        });

        expect(changeCount).toBe(0);
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });
});
