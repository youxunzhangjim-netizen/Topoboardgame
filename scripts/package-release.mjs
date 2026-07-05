import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'release-manifest.json'), 'utf8'));
const outputRoot = resolve(root, manifest.outputRoot);
const command = process.argv[2] || '';

function withinOutput(path) {
    const resolved = resolve(path);
    return resolved === outputRoot || resolved.startsWith(`${outputRoot}${sep}`);
}

function removeOutput(path) {
    if (!withinOutput(path)) throw new Error(`Refusing to clean outside ${outputRoot}.`);
    rmSync(path, { recursive: true, force: true });
}

function normalizedParts(path) {
    return relative(root, path).split(/[\\/]+/).filter(Boolean);
}

function isExcluded(path, allowResearchData) {
    const parts = normalizedParts(path);
    const lowerParts = parts.map((part) => part.toLowerCase());
    const name = basename(path).toLowerCase();
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    const excludedDirectories = manifest.exclude.directories.map((item) => item.toLowerCase());
    const normalDirectories = manifest.exclude.normalReleaseDirectories.map((item) => item.toLowerCase());
    if (lowerParts.some((part) => excludedDirectories.includes(part))) return true;
    if (!allowResearchData) {
        const relativeLower = parts.join('/').toLowerCase();
        if (normalDirectories.some((directory) =>
            relativeLower === directory || relativeLower.startsWith(`${directory}/`))) return true;
        if (manifest.exclude.normalReleaseFileExtensions.includes(extension)) return true;
    }
    if (manifest.exclude.fileExtensions.includes(extension)) return true;
    if (name.startsWith('.env') && name !== '.env.example') return true;
    if (manifest.exclude.privateFileNames.some((item) => item.toLowerCase() === name)) return true;
    return manifest.exclude.privateNameFragments.some((fragment) => name.includes(fragment.toLowerCase()));
}

function packageTarget(packageId) {
    const definition = manifest.packages[packageId];
    if (!definition) throw new Error(`Unknown release package "${packageId}".`);
    const destination = resolve(outputRoot, definition.output);
    if (!withinOutput(destination)) throw new Error('Invalid package output path.');
    removeOutput(destination);
    mkdirSync(destination, { recursive: true });
    for (const sourcePath of definition.include) {
        const source = resolve(root, sourcePath);
        if (!existsSync(source)) throw new Error(`Missing release input: ${sourcePath}`);
        const target = join(destination, sourcePath);
        mkdirSync(dirname(target), { recursive: true });
        cpSync(source, target, {
            recursive: true,
            filter: (candidate) => !isExcluded(candidate, Boolean(definition.allowResearchData))
        });
    }
    console.log(`${packageId} package ready: ${destination}`);
}

if (command === 'clean') {
    removeOutput(outputRoot);
    mkdirSync(outputRoot, { recursive: true });
    console.log(`Release staging cleaned: ${outputRoot}`);
} else {
    packageTarget(command);
}
