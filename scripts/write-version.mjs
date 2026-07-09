import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const edition = process.argv[2] || process.env.TOPOBOARD_EDITION || 'web-lite';
const outDir = resolve(root, process.argv[3] || process.env.TOPOBOARD_OUT_DIR || 'dist');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const editionPath = join(root, 'configs', 'editions', `${edition}.json`);
const editionConfig = existsSync(editionPath)
    ? JSON.parse(readFileSync(editionPath, 'utf8'))
    : { id: edition, target: '' };

function gitValue(args) {
    try {
        return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return '';
    }
}

const version = {
    schema: 'topoboard.version.v1',
    productName: packageJson.productName || packageJson.name,
    packageName: packageJson.name,
    version: packageJson.version,
    edition: editionConfig.id || edition,
    editionName: editionConfig.name || edition,
    target: editionConfig.target || '',
    builtAt: new Date().toISOString(),
    gitCommit: gitValue(['rev-parse', '--short=12', 'HEAD']),
    gitBranch: gitValue(['rev-parse', '--abbrev-ref', 'HEAD'])
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'version.json'), `${JSON.stringify(version, null, 2)}\n`);
mkdirSync(join(outDir, 'js', 'shared'), { recursive: true });
writeFileSync(join(outDir, 'js', 'shared', 'version.json'), `${JSON.stringify(version, null, 2)}\n`);

console.log(`Version metadata written: ${join(outDir, 'version.json')}`);
