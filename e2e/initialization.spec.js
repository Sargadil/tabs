'use strict';

const { test, expect } = require('@playwright/test');

test.describe('initialization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('builds a tablist/tab/tabpanel structure', async ({ page }) => {
        await expect(page.getByRole('tablist')).toHaveCount(1);
        await expect(page.getByRole('tab')).toHaveCount(3);
        await expect(page.getByRole('tabpanel')).toHaveCount(1); // only the active panel is exposed; the rest are `hidden`
    });

    test('wires aria-controls, aria-labelledby, and aria-selected between each tab and its panel', async ({ page }) => {
        const tabs = page.getByRole('tab');
        const panels = page.locator('.tab-panel');

        for (let i = 0; i < 3; i++) {
            const tab = tabs.nth(i);
            const panel = panels.nth(i);
            const tabId = await tab.getAttribute('id');
            const panelId = await panel.getAttribute('id');

            await expect(tab).toHaveAttribute('aria-controls', panelId);
            await expect(panel).toHaveAttribute('aria-labelledby', tabId);
        }

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false');
    });

    test('sets a roving tabindex: only the selected tab is in the Tab order', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
        await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
        await expect(tabs.nth(2)).toHaveAttribute('tabindex', '-1');
    });

    test('hides every panel except the one at initSelectedItem via the native hidden attribute', async ({ page }) => {
        const panels = page.locator('.tab-panel');

        await expect(panels.nth(0)).toBeVisible();
        await expect(panels.nth(1)).toBeHidden();
        await expect(panels.nth(2)).toBeHidden();

        await expect(panels.nth(0)).not.toHaveAttribute('hidden', '');
        await expect(panels.nth(1)).toHaveAttribute('hidden', '');
        await expect(panels.nth(2)).toHaveAttribute('hidden', '');
    });
});

test.describe('options.removeTabPanelTitle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/remove-tab-panel-title.html');
    });

    test('nav buttons get the title text read from the panel, then the title element is removed', async ({ page }) => {
        const tabs = page.getByRole('tab');

        // Real-browser-only check: the nav label comes from `Element.innerText`,
        // which jsdom does not implement (see test/tabs.test.js for the jsdom-safe
        // `data-nav-title` coverage of this same option).
        await expect(tabs.nth(0)).toHaveText('One');
        await expect(tabs.nth(1)).toHaveText('Two');
        await expect(tabs.nth(2)).toHaveText('Three');

        await expect(page.locator('.tab-panel__title')).toHaveCount(0);
        await expect(page.locator('.tab-panel__content')).toHaveCount(3);
    });
});
