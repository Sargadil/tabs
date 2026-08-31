/**
 * Error layer (MAINT-12).
 *
 * The one place the library throws. Every user-facing error — bad
 * configuration, bad DOM structure, or API misuse — is raised through
 * `fail()` so they all share a single convention:
 *
 * - a plain `Error` (never `TypeError`, never a raw low-level exception
 *   such as "Cannot read properties of undefined");
 * - the message prefixed with `ERROR_PREFIX` + a space.
 *
 * The prefix and the exact message text are part of the frozen public
 * contract (docs/ARCHITECTURE.md → Public contract; README → "Errors"):
 * consumers and tests match on them, so wording only changes with an
 * explicit maintainer decision and a SemVer assessment.
 *
 * Internal module — not part of the public API. See `src/js/internal/*`
 * in docs/ARCHITECTURE.md.
 */

/**
 * Prefix on every error the library throws.
 *
 * @type {string}
 */
export const ERROR_PREFIX = '[@sargadil/tabs]';

/**
 * Throw a library error: a plain `Error` whose message is the package
 * prefix, a space, and `message`.
 *
 * @param {string} message
 *   The message text, without the prefix.
 *
 * @returns {never}
 */
export function fail(message) {
    throw new Error(`${ERROR_PREFIX} ${message}`);
}
