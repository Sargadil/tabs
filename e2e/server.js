'use strict';

/**
 * Minimal static file server for the Playwright browser tests (ROADMAP-5).
 *
 * Serves the repo root so fixtures under e2e/fixtures/*.html can import the
 * real build artifact (dist/js/tabs.mjs) the same way a consumer would.
 * Dependency-free on purpose: this is dev/test tooling only, never shipped.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 4173;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(ROOT, urlPath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    process.stdout.write(`e2e static server listening on http://127.0.0.1:${PORT}\n`);
});
