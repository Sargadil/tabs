'use strict';

const { test, expect } = require('@playwright/test');

test.describe('mouse click', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('clicking a tab selects it, moves focus to it, and swaps the visible panel', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await tabs.nth(2).click();

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(2)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });

    test('clicking the already-active tab is a no-op', async ({ page }) => {
        const container = page.locator('#tabs');
        const tabs = page.getByRole('tab');
        const events = [];
        await page.exposeFunction('recordChange', (detail) => events.push(detail));
        await container.evaluate((el) => {
            el.addEventListener('tabs:change', (e) => window.recordChange(e.detail));
        });

        await tabs.nth(0).click();

        expect(events.length).toBe(0);
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });
});
