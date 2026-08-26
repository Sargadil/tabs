'use strict';

const { test, expect } = require('@playwright/test');

test.describe('selectTab()', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('switches the active tab and panel, matching a real click', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.evaluate(() => window.tabsInstance.selectTab(2));

        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(2)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();

        const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
        expect(selectedIndex).toBe(2);
    });

    test('throws a readable error for an out-of-range index', async ({ page }) => {
        const message = await page.evaluate(() => {
            try {
                window.tabsInstance.selectTab(99);
                return null;
            } catch (error) {
                return error.message;
            }
        });

        expect(message).toMatch(/\[@sargadil\/tabs] selectTab: no tab exists at index 99\./);
    });
});

test.describe('destroy()', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('clicking a tab after destroy() no longer changes selection', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.evaluate(() => window.tabsInstance.destroy());
        await tabs.nth(1).click();

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
    });

    test('pressing arrow keys after destroy() no longer changes selection', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(0).focus();
        await page.evaluate(() => window.tabsInstance.destroy());
        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
    });
});
