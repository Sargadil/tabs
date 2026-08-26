'use strict';

const { test, expect } = require('@playwright/test');

test.describe('manual activation mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/manual.html');
        await page.getByRole('tab').nth(0).focus();
    });

    test('Arrow keys move focus and the roving tabindex, but do not change selection', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
        await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(0)).toBeVisible();
        await expect(panels.nth(1)).toBeHidden();
    });

    test('Home/End move focus to the first/last tab without changing selection', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('End');
        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('Home');
        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('Enter activates the focused tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowRight'); // focus tab 2, selection still tab 1
        await page.keyboard.press('Enter');

        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(1)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });

    test('Space activates the focused tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight'); // focus tab 3, selection still tab 1
        await page.keyboard.press(' ');

        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(2)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });
});
