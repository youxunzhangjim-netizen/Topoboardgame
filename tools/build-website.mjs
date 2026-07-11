import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
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

function parseEnvFile(filePath) {
    if (!existsSync(filePath)) return {};
    const entries = {};
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const equalsIndex = line.indexOf('=');
        if (equalsIndex <= 0) continue;
        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        entries[key] = value;
    }
    return entries;
}

const editionEnvPath = join(root, `.env.${editionId}`);
const editionEnv = parseEnvFile(editionEnvPath);
for (const key of Object.keys(editionEnv)) {
    if (!key.startsWith('VITE_')) {
        throw new Error(`${editionEnvPath} contains non-public key ${key}. Only VITE_* build flags are allowed.`);
    }
}
for (const [key, value] of Object.entries(editionEnv)) {
    if (process.env[key] === undefined) process.env[key] = value;
}

function publicTopoboardEnv() {
    return Object.fromEntries(
        Object.entries(process.env)
            .filter(([key]) => key.startsWith('VITE_TBG_'))
            .sort(([left], [right]) => left.localeCompare(right))
    );
}

function boolEnv(name) {
    return String(process.env[name] || '').toLowerCase() === 'true';
}

function numberEnv(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) ? value : fallback;
}

function runtimeEditionConfig() {
    const edition = process.env.VITE_TBG_EDITION || editionId || 'web-lite';
    return {
        name: edition,
        clientKind: process.env.VITE_TBG_CLIENT_KIND || 'web',
        onlineEnv: process.env.VITE_TBG_ONLINE_ENV || 'prod',
        onlinePool: process.env.VITE_TBG_ONLINE_POOL || 'global',
        isWebLite: edition === 'web-lite',
        isSteam: edition === 'steam-stable',
        isResearch: edition === 'research-dev',
        enableOnline: boolEnv('VITE_TBG_ENABLE_ONLINE'),
        enableSteam: boolEnv('VITE_TBG_ENABLE_STEAM'),
        enableResearchBridge: boolEnv('VITE_TBG_ENABLE_RESEARCH_BRIDGE'),
        enableResearchBridgeDetection: boolEnv('VITE_TBG_ENABLE_RESEARCH_BRIDGE_DETECTION'),
        enableMaterialDatabases: boolEnv('VITE_TBG_ENABLE_MATERIAL_DATABASES'),
        showExperimentalBoards: boolEnv('VITE_TBG_SHOW_EXPERIMENTAL_BOARDS'),
        showResearchLabs: boolEnv('VITE_TBG_SHOW_RESEARCH_LABS'),
        maxSites: numberEnv('VITE_TBG_MAX_SITES', 3000)
    };
}

function writeRuntimeEditionConfig(output) {
    const config = runtimeEditionConfig();
    const source = `export const EDITION = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
    mkdirSync(join(output, 'js', 'shared'), { recursive: true });
    writeFileSync(join(output, 'js', 'shared', 'EditionConfig.js'), source);
}

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
        buildFlags: publicTopoboardEnv(),
        online: {
            clientKind: process.env.VITE_TBG_CLIENT_KIND || '',
            environment: process.env.VITE_TBG_ONLINE_ENV || '',
            pool: process.env.VITE_TBG_ONLINE_POOL || '',
            enabled: process.env.VITE_TBG_ENABLE_ONLINE === 'true'
        },
        hiddenRoutes: editionConfig.hiddenRoutes || []
    }, null, 2);
    writeFileSync(join(output, 'edition.json'), `${editionJson}\n`);
    mkdirSync(join(output, 'js', 'shared'), { recursive: true });
    writeFileSync(join(output, 'js', 'shared', 'edition.json'), `${editionJson}\n`);
}

function walkHtmlFiles(directory, files = []) {
    for (const entry of readdirSync(directory)) {
        const fullPath = join(directory, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
            walkHtmlFiles(fullPath, files);
        } else if (entry.toLowerCase().endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

function posixPath(value) {
    return String(value).replace(/\\/g, '/');
}

function relativeScriptPath(htmlPath, scriptPath) {
    let pathFromHtml = posixPath(relative(dirname(htmlPath), scriptPath));
    if (!pathFromHtml.startsWith('.')) pathFromHtml = `./${pathFromHtml}`;
    return pathFromHtml;
}

function injectSteamErrorOverlay(output) {
    const overlayPath = join(output, 'js', 'shared', 'SteamErrorOverlay.js');
    if (!existsSync(overlayPath)) return;
    for (const htmlPath of walkHtmlFiles(output)) {
        let html = readFileSync(htmlPath, 'utf8');
        if (html.includes('SteamErrorOverlay.js')) continue;
        const scriptPath = relativeScriptPath(htmlPath, overlayPath);
        const scriptTag = `<script src="${scriptPath}"></script>`;
        if (/<head([^>]*)>/i.test(html)) {
            html = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${scriptTag}`);
        } else {
            html = `${scriptTag}\n${html}`;
        }
        writeFileSync(htmlPath, html);
    }
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
const launcherBase = (process.env.VITE_TBG_EDITION || editionId) === 'web-lite' ? '/Topoboardgame/' : './';
await viteBuild({
    root,
    base: launcherBase,
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
writeRuntimeEditionConfig(output);
postProcessEdition(output);
if ((process.env.VITE_TBG_EDITION || editionId) === 'steam-stable') {
    injectSteamErrorOverlay(output);
}
rmSync(launcherOutput, { recursive: true, force: true });

console.log(`Website bundle ready: ${output}`);
console.log(`Edition: ${editionConfig.id || editionId}`);
