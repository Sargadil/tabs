'use strict';

/**
 * Smoke coverage for the runnable pages in examples/ (ROADMAP-12).
 *
 * The examples double as documentation, so CI needs to catch the moment one
 * stops working against the current public API. This is deliberately shallow —
 * each example loads its own real build, renders a tablist, and responds to the
 * first arrow key. The feature-specific behaviour each example demonstrates is
 * already covered in depth by the other spec files against e2e/fixtures/*.
 */

const { test, expect } = require('@playwright/test');

const EXAMPLES = [
    'basic',
    'manual-activation',
    'vertical',
    'rtl',
    'disabled',
    'custom-navigation',
    'beforechange',
    'events',
    'dynamic-refresh',
    'multiple-instances',
];

/** Console/page errors that aren't the example's fault. */
const isIgnorable = (text) => /favicon\.ico/i.test(text);

for (const name of EXAMPLES) {
    test(`example: ${name} loads and navigates`, async ({ page }) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' && !isIgnorable(msg.text())) {
                errors.push(msg.text());
            }
        });
        page.on('pageerror', (err) => {
            if (!isIgnorable(err.message)) {
                errors.push(err.message);
            }
        });

        await page.goto(`/examples/${name}.html`);

        const tablist = page.getByRole('tablist').first();
        await expect(tablist).toBeVisible();

        const tabs = tablist.getByRole('tab');
        expect(await tabs.count()).toBeGreaterThanOrEqual(2);

        // Focus the first tab and press both horizontal and vertical "next"
        // keys — one of them applies whatever the example's orientation is.
        await tabs.first().focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');

        const focusMovedToAnotherTab = await page.evaluate(() => {
            const active = document.activeElement;
            return active?.getAttribute('role') === 'tab'
                && active !== document.querySelector('[role="tablist"] [role="tab"]');
        });
        expect(focusMovedToAnotherTab).toBe(true);

        expect(errors).toEqual([]);
    });
}

test('example: multiple-instances groups are independent', async ({ page }) => {
    await page.goto('/examples/multiple-instances.html');

    const [groupA, groupB] = await page.getByRole('tablist').all();
    const aTabs = groupA.getByRole('tab');
    const bTabs = groupB.getByRole('tab');

    await expect(aTabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(bTabs.first()).toHaveAttribute('aria-selected', 'true');

    // Move the first group to its last tab.
    await aTabs.first().focus();
    await page.keyboard.press('End');

    await expect(aTabs.last()).toHaveAttribute('aria-selected', 'true');
    // The second group hasn't moved.
    await expect(bTabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(bTabs.last()).toHaveAttribute('aria-selected', 'false');
});
