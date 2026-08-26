'use strict';

const { test, expect } = require('@playwright/test');

test.describe('vertical automatic activation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/vertical.html');
    });

    test('the tablist reports aria-orientation="vertical"', async ({ page }) => {
        await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    });

    test('ArrowDown moves focus and immediately selects the next tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowDown');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(1)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });

    test('ArrowUp moves focus and immediately selects the previous tab, wrapping at the start', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowUp');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowLeft/ArrowRight are ignored in vertical orientation', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowRight');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowLeft');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('End and Home select the last and first tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await tabs.nth(0).focus();
        await page.keyboard.press('End');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(2)).toBeVisible();

        await page.keyboard.press('Home');

        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(0)).toBeVisible();
    });
});
