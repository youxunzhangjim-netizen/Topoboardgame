import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    featureStatusSuffix,
    listFeatureStatuses,
    steamSafeFeatures
} from '../js/shared/FeatureStatusRegistry.js';
import { BOARD_PERFORMANCE_BUDGET } from '../js/shared/SafeExecution.js';
import { SAFE_LAB_DEFAULTS } from '../js/labs/SafeLabRunner.js';
import { MODEL_REGISTRY } from '../labs/experiments/LabExperimentRegistry.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'release-manifest.json'), 'utf8'));
const errors = [];
const checks = [];

function check(name, callback) {
    try {
        callback();
        checks.push({ name, ok: true });
    } catch (error) {
        errors.push(`${name}: ${error.message}`);
        checks.push({ name, ok: false });
    }
}

function walk(path, visit) {
    if (!existsSync(path)) return;
    for (const entry of readdirSync(path, { withFileTypes: true })) {
        const target = join(path, entry.name);
        visit(target, entry);
        if (entry.isDirectory()) walk(target, visit);
    }
}

const normalPackageRoots = [
    join(root, 'dist'),
    ...Object.entries(manifest.packages)
        .filter(([, definition]) => !definition.allowResearchData)
        .map(([, definition]) => join(root, manifest.outputRoot, definition.output))
        .filter(existsSync)
];

check('normal release packages exclude developer/private data', () => {
    const forbiddenDirectories = new Set([
        'node_modules', '.git', 'local-data', 'test-results', 'playwright-report'
    ]);
    for (const packageRoot of normalPackageRoots) {
        walk(packageRoot, (path, entry) => {
            const name = entry.name.toLowerCase();
            if (entry.isDirectory() && forbiddenDirectories.has(name)) {
                throw new Error(`${relative(root, path)} must not be packaged.`);
            }
            if (entry.isFile() && extname(name) === '.jsonl') {
                throw new Error(`${relative(root, path)} is a raw JSONL dataset.`);
            }
            if (entry.isFile() && manifest.exclude.privateFileNames.some((item) => item.toLowerCase() === name)) {
                throw new Error(`${relative(root, path)} is private.`);
            }
            if (entry.isFile() && name.startsWith('.env') && name !== '.env.example') {
                throw new Error(`${relative(root, path)} is a private environment file.`);
            }
            if (entry.isFile() && statSync(path).size < 2_000_000) {
                const content = readFileSync(path, 'utf8');
                if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|STEAM_PASSWORD\s*=|\"private_key\"\s*:/i.test(content)) {
                    throw new Error(`${relative(root, path)} contains private credentials.`);
                }
            }
        });
    }
});

check('release manifest excludes forbidden content', () => {
    const excluded = new Set(manifest.exclude.directories);
    for (const required of ['node_modules', '.git', 'test-results', 'playwright-report', 'release']) {
        assert.ok(excluded.has(required), `Missing exclusion for ${required}.`);
    }
    assert.ok(manifest.exclude.normalReleaseDirectories.includes('local-data'));
    assert.ok(manifest.exclude.normalReleaseFileExtensions.includes('.jsonl'));
});

check('Steam-visible features are stable or playable', () => {
    const allowed = new Set(manifest.steam.allowedFeatureStatuses);
    for (const feature of steamSafeFeatures()) {
        assert.ok(allowed.has(feature.status), `${feature.id} is Steam-visible with status ${feature.status}.`);
    }
});

check('developing features are hidden or labelled', () => {
    for (const feature of listFeatureStatuses({ status: 'developing' })) {
        assert.ok(feature.steamVisible === false || featureStatusSuffix(feature.status, 'en').includes('Developing'));
        assert.ok(feature.steamVisible === false || featureStatusSuffix(feature.status, 'zh').includes('開發中'));
    }
});

check('Labs have validation tier labels', () => {
    const tiers = new Set(manifest.steam.labTiers);
    assert.ok(MODEL_REGISTRY.length > 0);
    for (const model of MODEL_REGISTRY) {
        assert.ok(tiers.has(model.validationLevel), `${model.id} has invalid tier ${model.validationLevel}.`);
    }
});

check('oversized boards and Labs are warning-gated', () => {
    assert.ok(BOARD_PERFORMANCE_BUDGET.maxSitesByDimension[3] <= 20000);
    assert.ok(BOARD_PERFORMANCE_BUDGET.maxEdges <= 150000);
    assert.ok(SAFE_LAB_DEFAULTS.maxSites <= 20000);
    assert.ok(SAFE_LAB_DEFAULTS.maxEdges <= 100000);
    assert.ok(SAFE_LAB_DEFAULTS.maxStateVariables <= 50000);
});

check('board and Lab safety verification passes', () => {
    for (const script of [
        'verification/verify-board-stability-layer.mjs',
        'verification/verify-vertex-go-boards.mjs',
        'verification/verify-safe-lab-runner.mjs',
        'verification/verify-klein-surface.mjs'
    ]) {
        execFileSync(process.execPath, [join(root, script)], { cwd: root, stdio: 'pipe' });
    }
});

check('app build files exist', () => {
    for (const file of [
        'dist/index.html',
        'dist/2D/2dgo/index.html',
        'dist/3D/3dgo/index.html',
        'dist/labs/experiments/index.html',
        'dist/life/world.html'
    ]) {
        assert.ok(existsSync(join(root, file)) && statSync(join(root, file)).isFile(), `Missing ${file}.`);
    }
});

check('main launcher has no hidden experimental board links', () => {
    const launcher = readFileSync(join(root, 'index.html'), 'utf8').toLowerCase();
    const hrefs = [...launcher.matchAll(/href\s*=\s*[\"']([^\"']+)[\"']/g)].map((match) => match[1]);
    for (const blocked of ['klein_quartic', 'klein-quartic', 'torus-knot', 'trefoil_tube', 'trefoil-solid']) {
        assert.ok(!hrefs.some((href) => href.includes(blocked)), `Launcher exposes hidden route ${blocked}.`);
    }
});

console.table(checks);
if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log('Steam-safe build verification passed.');
}
