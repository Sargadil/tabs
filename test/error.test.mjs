import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ERROR_PREFIX, fail } from '../src/js/internal/error.js';

// The error layer is the single throw primitive for the whole library
// (MAINT-12). It is pure — no DOM, no Tabs instance — so it can be
// exercised directly. The prefixed-message convention is also covered end
// to end through the jsdom suites (test/configuration.test.js,
// test/disabled.test.js, test/refresh.test.js) and the Playwright specs.

describe('error.fail', () => {
    test('throws a plain Error, not a subclass', () => {
        try {
            fail('boom');
            assert.fail('fail() should have thrown');
        } catch (err) {
            assert.equal(err.constructor, Error);
            assert.ok(!(err instanceof TypeError));
        }
    });

    test('prefixes the message with the package tag and a single space', () => {
        assert.throws(() => fail('something went wrong'), {
            message: '[@sargadil/tabs] something went wrong',
        });
    });

    test('ERROR_PREFIX is the documented tag and is what fail() uses', () => {
        assert.equal(ERROR_PREFIX, '[@sargadil/tabs]');
        assert.throws(() => fail('x'), (err) => err.message.startsWith(`${ERROR_PREFIX} `));
    });
});
