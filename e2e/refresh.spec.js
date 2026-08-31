'use strict';

/**
 * Real-browser coverage for the public refresh() API (ROADMAP-11).
 *
 * The unit suite (test/refresh.test.js) already covers the state machine in
 * jsdom; these tests exercise the parts that only a real engine gets right:
 * actual focus movement, keyboard navigation over the rebuilt nav, and that
 * repeated refresh() calls don't leave duplicate event listeners behind.
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/fixtures/refresh.html');
});

test('picks up a newly added panel and drives it with mouse + keyboard', async ({ page }) => {
    await page.evaluate(() => {
        window.addPanel('Four');
        window.tabsInstance.refresh();
    });

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(4);

    await tabs.nth(3).click();
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);

    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(2)).toBeFocused();
});

test('keeps the active tab selected across a refresh', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();

    await page.evaluate(() => {
        window.addPanel('Four');
        window.tabsInstance.refresh();
    });

    await expect(page.getByRole('tab').nth(2)).toHaveAttribute('aria-selected', 'true');
    const selectedIndex = await page.evaluate(() => window.tabsInstance.getSelectedIndex());
    expect(selectedIndex).toBe(2);
});

test('removing the active panel activates the tab that took its place', async ({ page }) => {
    await page.getByRole('tab').nth(1).click(); // "Two"

    await page.evaluate(() => {
        window.removePanelAt(1);
        window.tabsInstance.refresh();
    });

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(1)).toHaveText('Three');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
});

test('repeated refresh() calls do not stack tabs:change listeners', async ({ page }) => {
    const changeCount = await page.evaluate(async () => {
        let count = 0;
        document.getElementById('tabs').addEventListener('tabs:change', () => { count += 1; });

        window.tabsInstance.refresh();
        window.tabsInstance.refresh();
        window.tabsInstance.refresh();

        document.querySelectorAll('#tabs [role="tab"]')[1].click();

        return count;
    });

    expect(changeCount).toBe(1);
});

test('does not steal focus from outside the tablist', async ({ page }) => {
    await page.evaluate(() => {
        const input = document.createElement('input');
        input.id = 'outside';
        document.body.prepend(input);
        input.focus();

        window.addPanel('Four');
        window.tabsInstance.refresh();
    });

    await expect(page.locator('#outside')).toBeFocused();
});

test('keeps keyboard focus on the active tab when focus was already in the tablist', async ({ page }) => {
    const firstTab = page.getByRole('tab').nth(0);
    await firstTab.focus();
    await expect(firstTab).toBeFocused();

    await page.evaluate(() => {
        window.addPanel('Four');
        window.tabsInstance.refresh();
    });

    await expect(page.getByRole('tab').nth(0)).toBeFocused();
});

test('synchronizes a tab that became disabled, and axe stays clean', async ({ page }) => {
    await page.evaluate(() => {
        window.setTitleDisabledAt(0, true); // disable the active first tab
        window.tabsInstance.refresh();
    });

    const tabs = page.getByRole('tab');
    await expect(tabs.nth(0)).toBeDisabled();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
