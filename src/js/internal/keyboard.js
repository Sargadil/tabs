/**
 * Keyboard / swipe navigation decisions (MAINT-3).
 *
 * Pure functions: given the pressed key (or a swipe direction) and the
 * tablist's current state — orientation, reading direction, the focused
 * index, and which tabs are enabled — they return the index of the tab
 * navigation should move to.
 *
 * They never touch the DOM or a `Tabs` instance, and they do not know
 * about `activationMode`: the caller decides whether the returned index
 * is *selected* (automatic) or merely *focused* (manual).
 *
 * Internal module — not part of the public API. See `src/js/internal/*`
 * in docs/ARCHITECTURE.md.
 */

/**
 * Index of the first enabled tab.
 *
 * @param {boolean[]} enabled
 *   One flag per tab, in document order.
 *
 * @returns {number}
 */
function firstEnabledIndex(enabled) {
    return enabled.findIndex((is_enabled) => is_enabled);
}

/**
 * Index of the last enabled tab.
 *
 * @param {boolean[]} enabled
 *
 * @returns {number}
 */
function lastEnabledIndex(enabled) {
    return enabled.lastIndexOf(true);
}

/**
 * Walk from `from_index` in `direction` (-1 or 1), wrapping around the
 * ends, and return the first enabled tab reached. The caller guarantees
 * at least one enabled tab, so this always terminates.
 *
 * Shared by arrow-key navigation and swipe.
 *
 * @param {number} from_index
 *   Index to start from (exclusive).
 *
 * @param {-1 | 1} direction
 *   -1 for the previous tab, 1 for the next.
 *
 * @param {boolean[]} enabled
 *   One flag per tab, in document order.
 *
 * @returns {number}
 */
export function adjacentEnabledIndex(from_index, direction, enabled) {
    const count = enabled.length;
    let index = from_index;

    do {
        index = (index + direction + count) % count;
    } while (!enabled[index]);

    return index;
}

/**
 * Decide which tab a keydown should navigate to.
 *
 * @param {string} key
 *   The `KeyboardEvent.key` value.
 *
 * @param {object} state
 * @param {'horizontal' | 'vertical'} state.orientation
 * @param {boolean} state.rtl
 *   Reading direction; only consulted for horizontal orientation.
 * @param {number} state.currentIndex
 *   Index of the currently focused tab.
 * @param {boolean[]} state.enabled
 *   One flag per tab, in document order.
 *
 * @returns {number | null}
 *   The target tab index, or null if `key` is not a navigation key.
 */
export function resolveTargetIndex(key, { orientation, rtl, currentIndex, enabled }) {
    if (key === 'Home') {
        return firstEnabledIndex(enabled);
    }

    if (key === 'End') {
        return lastEnabledIndex(enabled);
    }

    const vertical = orientation === 'vertical';
    const previous_key = vertical ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');
    const next_key = vertical ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');

    if (key === previous_key) {
        return adjacentEnabledIndex(currentIndex, -1, enabled);
    }

    if (key === next_key) {
        return adjacentEnabledIndex(currentIndex, 1, enabled);
    }

    return null;
}
