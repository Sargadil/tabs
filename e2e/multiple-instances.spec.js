'use strict';

const { test, expect } = require('@playwright/test');

test.describe('multiple instances on one page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/multiple-instances.html');
    });

    test('every generated id is unique across instances', async ({ page }) => {
        const ids = await page.locator('[role="tab"], [role="tabpanel"]').evaluateAll(
            (elements) => elements.map((el) => el.id)
        );

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.length).toBe(8); // 2 tabs + 2 panels, per instance
    });

    test('interacting with one instance does not affect the other', async ({ page }) => {
        const instanceA = page.locator('#tabs-a');
        const instanceB = page.locator('#tabs-b');

        await instanceB.getByRole('tab').nth(1).click();

        await expect(instanceA.getByRole('tab').nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(instanceB.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(instanceA.locator('.tab-panel').nth(0)).toBeVisible();
        await expect(instanceB.locator('.tab-panel').nth(1)).toBeVisible();
    });

    test('keyboard navigation in one instance does not move focus or selection in the other', async ({ page }) => {
        const instanceA = page.locator('#tabs-a');
        const instanceB = page.locator('#tabs-b');

        await instanceA.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowRight');

        await expect(instanceA.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(instanceB.getByRole('tab').nth(0)).toHaveAttribute('aria-selected', 'true');
    });
});
