'use strict';

const { test, expect } = require('@playwright/test');

test.describe('horizontal automatic activation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
        await page.getByRole('tab').nth(0).focus();
    });

    test('ArrowRight moves focus and immediately selects the next tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(1)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });

    test('ArrowRight wraps from the last tab back to the first', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(2).focus();
        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowLeft moves focus and immediately selects the previous tab, wrapping at the start', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowLeft');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowUp/ArrowDown are ignored in horizontal orientation', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowDown');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowUp');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('End selects and focuses the last tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('End');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(2)).toBeVisible();
    });

    test('Home selects and focuses the first tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await tabs.nth(2).focus();
        await page.keyboard.press('Home');

        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(0)).toBeVisible();
    });
});
