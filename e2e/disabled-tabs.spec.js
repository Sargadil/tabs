'use strict';

const { test, expect } = require('@playwright/test');

test.describe('disabled tabs: default nav, automatic mode', () => {
    test.beforeEach(async ({ page }) => {
        // One (index 0) and Four (index 3) are disabled via aria-disabled="true" on
        // their .tab-panel__title; the generated nav turns that into a native
        // <button disabled>. initSelectedItem is 1 (Two).
        await page.goto('/e2e/fixtures/disabled.html');
    });

    test('disabled panels produce a native <button disabled>, enabled ones do not', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await expect(tabs.nth(0)).toBeDisabled();
        await expect(tabs.nth(1)).toBeEnabled();
        await expect(tabs.nth(2)).toBeEnabled();
        await expect(tabs.nth(3)).toBeDisabled();
    });

    test('Home skips the disabled first tab; End skips the disabled last tab', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(2).focus();
        await page.keyboard.press('Home');
        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('End');
        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('ArrowRight/ArrowLeft wrap around the disabled edges to the other enabled end', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(2).focus();
        await page.keyboard.press('ArrowRight'); // skip disabled 3, skip disabled 0, land on enabled 1
        await expect(tabs.nth(1)).toBeFocused();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowLeft'); // skip disabled 0, skip disabled 3, land on enabled 2
        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('the disabled tabs are excluded from the Tab sequential focus order', async ({ page }) => {
        // Only one tab (the selected one) is ever in the Tab order at all (roving
        // tabindex), so this also confirms Enter/Space could never reach a disabled
        // tab via real keyboard use — it can't be focused in the first place.
        const tabs = page.getByRole('tab');

        await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
        await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
        await expect(tabs.nth(2)).toHaveAttribute('tabindex', '-1');
        await expect(tabs.nth(3)).toHaveAttribute('tabindex', '-1');
    });

    test('a click event reaching a disabled tab directly does not activate it', async ({ page }) => {
        // A real user click can't reach a disabled <button> at all (verified: Playwright's
        // own actionability check refuses to click a disabled element). dispatchEvent
        // bypasses that, simulating a click event arriving through some other path
        // (e.g. a wrapping label, or a testing/automation tool) to prove the component's
        // own guard — not just the browser's native block — is what keeps it inert.
        const tabs = page.getByRole('tab');

        await tabs.nth(0).dispatchEvent('click');

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    });

    test('selectTab() throws a readable error for a disabled index, and state is unchanged', async ({ page }) => {
        const message = await page.evaluate(() => {
            try {
                window.tabsInstance.selectTab(3);
                return null;
            } catch (error) {
                return error.message;
            }
        });

        expect(message).toMatch(/\[@sargadil\/tabs] Cannot select disabled tab at index 3\./);
        await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
    });
});

test.describe('disabled tabs: constructor validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/disabled.html');
    });

    test('initSelectedItem pointing at a disabled tab throws', async ({ page }) => {
        const message = await page.evaluate(() => {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="tabs" id="tabs-invalid-initial">
                    <div class="tabs__nav"></div>
                    <div class="tabs__panels">
                        <div class="tab-panel"><h2 class="tab-panel__title" aria-disabled="true">One</h2><div class="tab-panel__content">1</div></div>
                        <div class="tab-panel"><h2 class="tab-panel__title">Two</h2><div class="tab-panel__content">2</div></div>
                    </div>
                </div>`);

            try {
                new window.Tabs({ contextID: 'tabs-invalid-initial' });
                return null;
            } catch (error) {
                return error.message;
            }
        });

        expect(message).toMatch(/\[@sargadil\/tabs] initSelectedItem 0 is disabled\./);
    });

    test('every tab disabled throws "At least one enabled tab is required."', async ({ page }) => {
        const message = await page.evaluate(() => {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="tabs" id="tabs-all-disabled">
                    <div class="tabs__nav"></div>
                    <div class="tabs__panels">
                        <div class="tab-panel"><h2 class="tab-panel__title" aria-disabled="true">One</h2><div class="tab-panel__content">1</div></div>
                        <div class="tab-panel"><h2 class="tab-panel__title" aria-disabled="true">Two</h2><div class="tab-panel__content">2</div></div>
                    </div>
                </div>`);

            try {
                new window.Tabs({ contextID: 'tabs-all-disabled' });
                return null;
            } catch (error) {
                return error.message;
            }
        });

        expect(message).toMatch(/\[@sargadil\/tabs] At least one enabled tab is required\./);
    });
});

test.describe('disabled tabs: custom navigation (native disabled + aria-disabled)', () => {
    test.beforeEach(async ({ page }) => {
        // Docs is enabled, Support is a native <button disabled>, Settings is a
        // <div role="tab" aria-disabled="true">. initSelectedItem is 0 (Docs).
        await page.goto('/e2e/fixtures/disabled-custom-nav.html');
    });

    test('reflects the authored disabled state without the library adding anything extra', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await expect(tabs.nth(0)).toBeEnabled();
        await expect(tabs.nth(1)).toBeDisabled();
        await expect(tabs.nth(2)).toHaveAttribute('aria-disabled', 'true');
    });

    test('ArrowRight from Docs skips both the disabled button and the disabled div, wrapping back to Docs', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(0)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('a click reaching the native disabled button does not activate it', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(1).dispatchEvent('click');

        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('clicking the aria-disabled div does not activate it either', async ({ page }) => {
        const tabs = page.getByRole('tab');

        // Playwright's own actionability check refuses a real .click() here too
        // (it treats aria-disabled="true" as not-enabled), so dispatchEvent is used
        // to prove the component's own guard — not just tooling — keeps it inert.
        await tabs.nth(2).dispatchEvent('click');

        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('Enter on the (programmatically focused) aria-disabled div does not activate it', async ({ page }) => {
        const tabs = page.getByRole('tab');

        // tabindex="-1" keeps it out of the Tab order, but it can still receive
        // focus programmatically (e.g. from assistive tech) — confirm Enter is a
        // no-op there too, not just unreachable.
        await tabs.nth(2).evaluate((el) => el.focus());
        await page.keyboard.press('Enter');

        await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false');
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('selectTab() throws for both the native-disabled and aria-disabled tab', async ({ page }) => {
        const messages = await page.evaluate(() => {
            const results = [];
            for (const index of [1, 2]) {
                try {
                    window.tabsInstance.selectTab(index);
                    results.push(null);
                } catch (error) {
                    results.push(error.message);
                }
            }
            return results;
        });

        expect(messages[0]).toMatch(/Cannot select disabled tab at index 1\./);
        expect(messages[1]).toMatch(/Cannot select disabled tab at index 2\./);
    });
});

test.describe('disabled tabs: manual activation mode', () => {
    test.beforeEach(async ({ page }) => {
        // Two (index 1) is disabled; initSelectedItem defaults to 0 (One).
        await page.goto('/e2e/fixtures/disabled-manual.html');
    });

    test('ArrowRight moves focus past the disabled tab without selecting it', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(0).focus();
        await page.keyboard.press('ArrowRight');

        await expect(tabs.nth(2)).toBeFocused();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true', { timeout: 500 });
    });

    test('a click reaching the disabled tab does not activate it', async ({ page }) => {
        const tabs = page.getByRole('tab');

        await tabs.nth(1).dispatchEvent('click');

        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
    });
});
