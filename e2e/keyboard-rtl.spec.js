'use strict';

const { test, expect } = require('@playwright/test');

test.describe('RTL: horizontal automatic activation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/rtl.html');
        await page.getByRole('tab').nth(0).focus();
    });

    test('ArrowLeft moves focus and immediately selects the next tab', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowLeft');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(1)).toBeVisible();
        await expect(panels.nth(0)).toBeHidden();
    });

    test('ArrowLeft wraps from the last tab back to the first', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(2).focus();
        await page.keyboard.press('ArrowLeft');

        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowRight moves focus and immediately selects the previous tab, wrapping at the start', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('End selects and focuses the last tab; Home selects and focuses the first', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

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

test.describe('RTL: horizontal manual activation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/rtl-manual.html');
        await page.getByRole('tab').nth(0).focus();
    });

    test('ArrowLeft moves focus to the next tab without selecting; Enter activates it', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        await page.keyboard.press('ArrowLeft');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
        await expect(panels.nth(0)).toBeVisible();

        await page.keyboard.press('Enter');

        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(panels.nth(1)).toBeVisible();
    });

    test('ArrowRight moves focus to the previous tab without selecting, wrapping at the start', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true', { timeout: 1000 });
    });
});

test.describe('RTL: vertical orientation is unaffected by direction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/rtl-vertical.html');
        await page.getByRole('tab').nth(0).focus();
    });

    test('ArrowDown selects the next tab, ArrowUp selects the previous, same as LTR', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowDown');
        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowUp');
        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowLeft/ArrowRight are still ignored in vertical orientation, even under RTL', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await page.keyboard.press('ArrowRight');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowLeft');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });
});

test.describe('RTL: direction detected from a local dir="rtl" wrapper, not just <html>', () => {
    test('ArrowLeft selects the next tab even though <html> itself stays LTR', async ({ page }) => {
        await page.goto('/e2e/fixtures/rtl-local.html');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');

        const tabs = page.getByRole('tab');
        await tabs.nth(0).focus();

        await page.keyboard.press('ArrowLeft');

        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    });
});
