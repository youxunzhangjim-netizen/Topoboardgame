import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const args = process.argv.slice(2);

function argValue(name, fallback = '') {
    const index = args.indexOf(name);
    if (index >= 0 && args[index + 1]) return args[index + 1];
    const prefix = `${name}=`;
    const found = args.find((item) => item.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
}

const editionId = argValue('--edition', process.env.TOPOBOARD_EDITION || 'steam-stable');
const outputDir = argValue('--outDir', process.env.TOPOBOARD_OUT_DIR || 'dist');
const editionPath = join(root, 'configs', 'editions', `${editionId}.json`);
const editionConfig = existsSync(editionPath)
    ? JSON.parse(readFileSync(editionPath, 'utf8'))
    : { id: editionId, hiddenRoutes: [], excludePaths: [], features: {} };

function run(args) {
    const commandArgs = process.platform === 'win32'
        ? ['/d', '/s', '/c', 'npm.cmd', ...args]
        : args;
    execFileSync(npm, commandArgs, { cwd: root, stdio: 'inherit' });
}

function copy(from, to) {
    if (!existsSync(from)) {
        throw new Error(`Missing build input: ${from}`);
    }
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true, force: true });
}

function copyIfExists(from, to) {
    if (existsSync(from)) {
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to, { recursive: true, force: true });
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeDistPath(output, relativePath) {
    if (!relativePath) return;
    rmSync(join(output, relativePath), { recursive: true, force: true });
}

function removeWorkflowCardByHref(html, href) {
    const escaped = escapeRegExp(href);
    return html.replace(new RegExp(`\\s*<a class="workflow-card[^"]*" href="${escaped}">[\\s\\S]*?<\\/a>`, 'g'), '');
}

function postProcessEdition(output) {
    for (const relativePath of editionConfig.excludePaths || []) {
        removeDistPath(output, relativePath);
    }

    const labsIndex = join(output, 'labs', 'index.html');
    if (existsSync(labsIndex)) {
        let html = readFileSync(labsIndex, 'utf8');
        for (const route of editionConfig.hiddenRoutes || []) {
            if (route.startsWith('labs/')) {
                const labsRoute = route.slice('labs/'.length).replace(/\/+$/, '');
                html = removeWorkflowCardByHref(html, `./${labsRoute}/`);
            }
        }
        writeFileSync(labsIndex, html);
    }

    const editionJson = JSON.stringify({
        schema: 'topoboard.built-edition.v1',
        edition: editionConfig.id || editionId,
        target: editionConfig.target || '',
        features: editionConfig.features || {},
        hiddenRoutes: editionConfig.hiddenRoutes || []
    }, null, 2);
    writeFileSync(join(output, 'edition.json'), `${editionJson}\n`);
    mkdirSync(join(output, 'js', 'shared'), { recursive: true });
    writeFileSync(join(output, 'js', 'shared', 'edition.json'), `${editionJson}\n`);
}

run(['run', 'build', '--workspace', '2dchess']);
run(['run', 'build', '--workspace', '2dgo']);
run(['run', 'build', '--workspace', '2dreversi']);
run(['run', 'build', '--workspace', '3dchess']);
run(['run', 'build', '--workspace', '3dgo']);
run(['run', 'build', '--workspace', '3dreversi']);
run(['run', 'build', '--workspace', '4dgo']);
run(['run', 'build', '--workspace', '4dreversi']);
run(['run', 'build', '--workspace', 'algebraic-games']);

const launcherOutput = join(root, '.launcher-dist');
await viteBuild({
    root,
    base: './',
    build: {
        outDir: launcherOutput,
        emptyOutDir: true
    }
});

const output = join(root, outputDir);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

copy(launcherOutput, output);
copyIfExists(join(root, 'favicon.png'), join(output, 'favicon.png'));
copyIfExists(join(root, 'js'), join(output, 'js'));
copyIfExists(join(root, 'configs'), join(output, 'configs'));
copyIfExists(join(root, 'docs'), join(output, 'docs'));
copyIfExists(join(root, 'labs'), join(output, 'labs'));
copy(join(root, 'discord'), join(output, 'discord'));
mkdirSync(join(output, '2D'), { recursive: true });
mkdirSync(join(output, '3D'), { recursive: true });
mkdirSync(join(output, '4D'), { recursive: true });
copy(join(root, '2D', '2dchess', 'dist'), join(output, '2D', '2dchess'));
copy(join(root, '2D', '2dgo', 'dist'), join(output, '2D', '2dgo'));
copy(join(root, '2D', '2dreversi', 'dist'), join(output, '2D', '2dreversi'));
copy(join(root, '3D', '3dchess', 'dist'), join(output, '3D', '3dchess'));
copy(join(root, '3D', '3dgo', 'dist'), join(output, '3D', '3dgo'));
copy(join(root, '3D', '3dreversi', 'dist'), join(output, '3D', '3dreversi'));
copy(join(root, '4D', '4dgo', 'dist'), join(output, '4D', '4dgo'));
copy(join(root, '4D', '4dreversi', 'dist'), join(output, '4D', '4dreversi'));
copyIfExists(join(root, '2D', 'jump'), join(output, '2D', 'jump'));
copyIfExists(join(root, '3D', 'jump'), join(output, '3D', 'jump'));
copyIfExists(join(root, '4D', 'jump'), join(output, '4D', 'jump'));
copyIfExists(join(root, '2D', 'hex'), join(output, '2D', 'hex'));
copyIfExists(join(root, '3D', 'hex'), join(output, '3D', 'hex'));
copyIfExists(join(root, '4D', 'hex'), join(output, '4D', 'hex'));
copy(join(root, 'algebraic', 'dist'), join(output, 'algebraic'));
copy(join(root, 'life'), join(output, 'life'));
copyIfExists(join(root, 'spacetime'), join(output, 'spacetime'));
writeFileSync(join(output, '.nojekyll'), '');
postProcessEdition(output);
rmSync(launcherOutput, { recursive: true, force: true });

console.log(`Website bundle ready: ${output}`);
console.log(`Edition: ${editionConfig.id || editionId}`);
