import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = resolve(root, process.argv[2] || process.env.TOPOBOARD_WEB_DIST || 'dist-web');
const editionPath = join(root, 'configs', 'editions', 'web-lite.json');
const editionConfig = JSON.parse(readFileSync(editionPath, 'utf8'));

const errors = [];

function fail(message) {
    errors.push(message);
}

function walk(dir, results = []) {
    if (!existsSync(dir)) return results;
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        results.push(path);
        if (statSync(path).isDirectory()) walk(path, results);
    }
    return results;
}

function rel(path) {
    return relative(distDir, path).replace(/\\/g, '/');
}

if (!existsSync(distDir)) fail(`Missing web dist directory: ${distDir}`);

const requiredFiles = ['index.html', '.nojekyll', 'edition.json', 'version.json'];
for (const file of requiredFiles) {
    if (!existsSync(join(distDir, file))) fail(`Missing required web file: ${file}`);
}

if (existsSync(join(distDir, 'edition.json'))) {
    const builtEdition = JSON.parse(readFileSync(join(distDir, 'edition.json'), 'utf8'));
    if (builtEdition.edition !== 'web-lite') {
        fail(`Expected web-lite edition, found ${builtEdition.edition || '(missing)'}.`);
    }
}

for (const route of editionConfig.hiddenRoutes || []) {
    if (existsSync(join(distDir, route))) fail(`Hidden web-lite route is still present: ${route}`);
}

const files = walk(distDir);
const forbiddenDirectoryNames = new Set([
    'node_modules',
    '.git',
    'local-data',
    'release',
    'release-packages',
    'steamworks',
    'test-results',
    'playwright-report'
]);

for (const path of files) {
    const relativePath = rel(path);
    const parts = relativePath.split('/');
    if (parts.some((part) => forbiddenDirectoryNames.has(part))) {
        fail(`Forbidden directory published in web-lite dist: ${relativePath}`);
    }
    const lower = relativePath.toLowerCase();
    if (lower.endsWith('.jsonl')) fail(`Training/self-play JSONL published in web-lite dist: ${relativePath}`);
    if (/(^|\/)\.env(\.|$)/i.test(relativePath)) fail(`Environment file published in web-lite dist: ${relativePath}`);
    if (/steam.*credential|credential.*steam|service-account|private-key/i.test(relativePath)) {
        fail(`Private credential-like file published in web-lite dist: ${relativePath}`);
    }
}

const labsIndex = join(distDir, 'labs', 'index.html');
if (existsSync(labsIndex)) {
    const html = readFileSync(labsIndex, 'utf8');
    for (const route of editionConfig.hiddenRoutes || []) {
        if (route.startsWith('labs/')) {
            const labsRoute = route.slice('labs/'.length).replace(/\/+$/, '');
            if (html.includes(`./${labsRoute}/`)) fail(`Labs index still links hidden route: ${route}`);
        }
    }
}

if (errors.length) {
    console.error('Web dist verification failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Web dist verification passed: ${distDir}`);
