#!/usr/bin/env node

'use strict';

/**
 * Package smoke test (ROADMAP-4).
 *
 * Verifies the actual npm publish artifact — the tarball produced by
 * `npm pack` — rather than files under dist/. This catches breakage in
 * package.json wiring (main/module/types/exports/files) that testing
 * dist/js/tabs.cjs directly cannot detect.
 *
 * Assumes `npm run build` has already produced a fresh dist/. Does not
 * replace or overlap with the unit tests in test/ (run via `npm test`).
 */

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Every file the published tarball is expected to contain. Keep in sync
// with the "files" allowlist in package.json plus whatever npm always
// includes (package.json itself). A mismatch here — extra or missing
// entries — means the publish artifact changed shape and this list (or
// the packaging config) needs a deliberate update.
const EXPECTED_TARBALL_FILES = [
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'dist/css/styles.min.css',
    'dist/js/tabs.cjs',
    'dist/js/tabs.d.ts',
    'dist/js/tabs.mjs',
    'dist/js/tabs.umd.js',
    'package.json',
].sort();

function log(message) {
    process.stdout.write(`${message}\n`);
}

function packTarball(destinationDir) {
    const output = execFileSync(
        'npm',
        ['pack', '--json', '--pack-destination', destinationDir],
        { cwd: PROJECT_ROOT, encoding: 'utf8' }
    );

    const [result] = JSON.parse(output);
    return result;
}

function verifyTarballContents(packResult, pkg) {
    assert.equal(packResult.name, pkg.name, 'npm pack produced a tarball for the wrong package name');
    assert.equal(packResult.version, pkg.version, 'npm pack produced a tarball for the wrong version');

    const actualFiles = packResult.files.map((file) => file.path).sort();

    log('Tarball contents:');
    for (const file of actualFiles) {
        log(`  - ${file}`);
    }

    assert.deepEqual(
        actualFiles,
        EXPECTED_TARBALL_FILES,
        `Tarball file list does not match the expected package contents.\n` +
            `Expected: ${JSON.stringify(EXPECTED_TARBALL_FILES)}\n` +
            `Actual:   ${JSON.stringify(actualFiles)}`
    );
}

function createFixtureProject(workDir) {
    const fixtureDir = path.join(workDir, 'fixture');
    fs.mkdirSync(fixtureDir);
    fs.writeFileSync(
        path.join(fixtureDir, 'package.json'),
        JSON.stringify({ name: 'sargadil-tabs-smoke-fixture', version: '0.0.0', private: true }, null, 2)
    );
    return fixtureDir;
}

function installTarball(fixtureDir, tarballPath) {
    execFileSync(
        'npm',
        ['install', tarballPath, '--no-audit', '--no-fund', '--no-save', '--loglevel=error'],
        { cwd: fixtureDir, stdio: 'pipe' }
    );
}

function runCheck(name, fixtureFile, fixtureDir) {
    const source = path.join(FIXTURES_DIR, fixtureFile);
    const destination = path.join(fixtureDir, fixtureFile);
    fs.copyFileSync(source, destination);

    try {
        const stdout = execFileSync(process.execPath, [destination], { cwd: fixtureDir, encoding: 'utf8' });
        log(`PASS  ${name} — ${stdout.trim()}`);
    } catch (error) {
        log(`FAIL  ${name}`);
        if (error.stdout) log(error.stdout.toString());
        if (error.stderr) log(error.stderr.toString());
        throw new Error(`Package smoke check "${name}" failed.`);
    }
}

function main() {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

    const distEntry = path.join(PROJECT_ROOT, 'dist', 'js', 'tabs.cjs');
    if (!fs.existsSync(distEntry)) {
        throw new Error(`${distEntry} is missing. Run "npm run build" before the package smoke test.`);
    }

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sargadil-tabs-pack-'));

    try {
        log(`==> Packing ${pkg.name}@${pkg.version} with npm pack`);
        const packResult = packTarball(workDir);
        verifyTarballContents(packResult, pkg);

        const tarballPath = path.join(workDir, packResult.filename);

        log('==> Installing the tarball into a fixture project');
        const fixtureDir = createFixtureProject(workDir);
        installTarball(fixtureDir, tarballPath);

        log('==> Verifying the installed package');
        runCheck('package exports (main/module/types/exports map)', 'check-exports.cjs', fixtureDir);
        runCheck('CommonJS import', 'check-cjs.cjs', fixtureDir);
        runCheck('ESM import', 'check-esm.mjs', fixtureDir);
        runCheck('CSS export', 'check-css.cjs', fixtureDir);
        runCheck('TypeScript declarations', 'check-types.cjs', fixtureDir);

        log('==> Package smoke test passed');
    } finally {
        fs.rmSync(workDir, { recursive: true, force: true });
    }
}

try {
    main();
} catch (error) {
    process.stderr.write(`\n${error.message}\n`);
    process.exitCode = 1;
}
