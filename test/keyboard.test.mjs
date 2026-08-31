import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { resolveTargetIndex, adjacentEnabledIndex } from '../src/js/internal/keyboard.js';

// The keyboard layer is pure — no DOM, no Tabs instance — so it can be
// exercised directly with plain values (MAINT-3). The same rules are also
// covered end to end through the jsdom suites (test/keyboard-navigation.test.js,
// test/disabled.test.js) and the Playwright specs.

const ALL_ENABLED = [true, true, true, true];

describe('keyboard.adjacentEnabledIndex', () => {
    test('moves one step forward or backward', () => {
        assert.equal(adjacentEnabledIndex(1, 1, ALL_ENABLED), 2);
        assert.equal(adjacentEnabledIndex(1, -1, ALL_ENABLED), 0);
    });

    test('wraps around both ends', () => {
        assert.equal(adjacentEnabledIndex(3, 1, ALL_ENABLED), 0);
        assert.equal(adjacentEnabledIndex(0, -1, ALL_ENABLED), 3);
    });

    test('skips disabled tabs, including across a wrap', () => {
        const enabled = [true, false, false, true];

        assert.equal(adjacentEnabledIndex(0, 1, enabled), 3);
        assert.equal(adjacentEnabledIndex(3, 1, enabled), 0);
        assert.equal(adjacentEnabledIndex(0, -1, enabled), 3);
    });
});

describe('keyboard.resolveTargetIndex', () => {
    const base = { orientation: 'horizontal', rtl: false, currentIndex: 1, enabled: ALL_ENABLED };

    test('Home / End resolve to the first / last enabled tab', () => {
        assert.equal(resolveTargetIndex('Home', base), 0);
        assert.equal(resolveTargetIndex('End', base), 3);
    });

    test('Home / End skip disabled edges', () => {
        const enabled = [false, true, true, false];

        assert.equal(resolveTargetIndex('Home', { ...base, enabled }), 1);
        assert.equal(resolveTargetIndex('End', { ...base, enabled }), 2);
    });

    test('horizontal LTR: ArrowLeft is previous, ArrowRight is next', () => {
        assert.equal(resolveTargetIndex('ArrowLeft', base), 0);
        assert.equal(resolveTargetIndex('ArrowRight', base), 2);
    });

    test('horizontal RTL: the arrows are reversed', () => {
        const rtl = { ...base, rtl: true };

        assert.equal(resolveTargetIndex('ArrowRight', rtl), 0);
        assert.equal(resolveTargetIndex('ArrowLeft', rtl), 2);
    });

    test('vertical: ArrowUp / ArrowDown navigate, ArrowLeft / ArrowRight are ignored', () => {
        const vertical = { ...base, orientation: 'vertical' };

        assert.equal(resolveTargetIndex('ArrowUp', vertical), 0);
        assert.equal(resolveTargetIndex('ArrowDown', vertical), 2);
        assert.equal(resolveTargetIndex('ArrowLeft', vertical), null);
        assert.equal(resolveTargetIndex('ArrowRight', vertical), null);
    });

    test('a non-navigation key returns null', () => {
        assert.equal(resolveTargetIndex('Enter', base), null);
        assert.equal(resolveTargetIndex('x', base), null);
    });

    test('arrow navigation skips disabled tabs and wraps around', () => {
        const enabled = [true, false, true, false];

        assert.equal(resolveTargetIndex('ArrowRight', { ...base, currentIndex: 0, enabled }), 2);
        assert.equal(resolveTargetIndex('ArrowRight', { ...base, currentIndex: 2, enabled }), 0);
    });
});
