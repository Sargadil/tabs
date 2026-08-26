'use strict';

/**
 * Automated axe-core scans (ROADMAP-6).
 *
 * These scans catch a *subset* of accessibility issues that a static/automated
 * tool can detect (ARIA misuse, missing accessible names, invalid attribute
 * values, contrast, ...). Passing with zero violations is NOT the same as
 * "fully WCAG compliant" — axe itself only claims to catch roughly a third of
 * WCAG issues. Things like whether the keyboard/focus behaviour actually
 * makes sense, or whether a screen reader user can use the component, are
 * covered by the manual VoiceOver/NVDA matrix in ACCESSIBILITY.md (ROADMAP-7),
 * not here.
 *
 * Scans run against the full page (not scoped to the component) so a
 * regression in the surrounding fixture page — e.g. a broken landmark or
 * heading structure — is caught too.
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function expectNoViolations(page) {
    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe('axe: default tabs (horizontal, automatic)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/default.html');
    });

    test('has no violations on initial render', async ({ page }) => {
        await expectNoViolations(page);
    });

    test('has no violations after a mouse click switches the active tab', async ({ page }) => {
        await page.getByRole('tab').nth(1).click();

        await expectNoViolations(page);
    });

    test('has no violations after automatic keyboard activation (ArrowRight/Home/End)', async ({ page }) => {
        await page.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('End');
        await page.keyboard.press('Home');

        await expectNoViolations(page);
    });

    test('has no violations after repeated switching (dynamic state)', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(1).click();
        await tabs.nth(2).click();
        await tabs.nth(0).click();
        await page.evaluate(() => window.tabsInstance.selectTab(2));

        // The previously active panel must have been fully removed from the
        // accessibility tree (hidden), not just visually hidden — otherwise
        // axe (and screen readers) would see two `role="tabpanel"` elements
        // exposed at once.
        await expect(page.getByRole('tabpanel')).toHaveCount(1);
        await expect(page.getByRole('tab').nth(2)).toHaveAttribute('aria-selected', 'true');

        await expectNoViolations(page);
    });
});

test.describe('axe: manual activation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/manual.html');
    });

    test('has no violations on initial render', async ({ page }) => {
        await expectNoViolations(page);
    });

    test('has no violations after moving focus without changing selection', async ({ page }) => {
        await page.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        await expectNoViolations(page);
    });

    test('has no violations after activating the focused tab with Enter/Space', async ({ page }) => {
        await page.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await expectNoViolations(page);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press(' ');

        await expectNoViolations(page);
    });
});

test.describe('axe: vertical tabs', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/vertical.html');
    });

    test('has no violations on initial render', async ({ page }) => {
        await expectNoViolations(page);
    });

    test('has no violations after ArrowDown/ArrowUp switch the active tab', async ({ page }) => {
        await page.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowUp');

        await expectNoViolations(page);
    });
});

test.describe('axe: custom navigation markup', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/custom-nav.html');
    });

    test('has no violations on initial render', async ({ page }) => {
        await expectNoViolations(page);
    });

    test('has no violations after a click switches the active tab', async ({ page }) => {
        await page.getByRole('tab').nth(2).click();

        await expectNoViolations(page);
    });

    test('has no violations after keyboard activation', async ({ page }) => {
        await page.getByRole('tab').nth(0).focus();
        await page.keyboard.press('ArrowRight');

        await expectNoViolations(page);
    });
});

test.describe('axe: multiple tab groups on one page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/multiple-instances.html');
    });

    test('has no violations on initial render', async ({ page }) => {
        await expectNoViolations(page);
    });

    test('has no violations after switching one instance while the other is untouched', async ({ page }) => {
        await page.locator('#tabs-b').getByRole('tab').nth(1).click();

        await expectNoViolations(page);
    });
});
