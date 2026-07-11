import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distArg = process.argv[2] || 'dist-steam/app';
const distPath = join(root, distArg);

const scannedExtensions = new Set(['.html', '.js', '.mjs', '.css']);
const forbidden = [
  { label: 'absolute Vite asset script', pattern: /src=["']\/assets/ig },
  { label: 'absolute Vite asset stylesheet', pattern: /href=["']\/assets/ig },
  { label: 'absolute shared js script', pattern: /src=["']\/js/ig },
  { label: 'absolute shared js link', pattern: /href=["']\/js/ig },
  { label: 'absolute 2D game link', pattern: /href=["']\/2D/ig },
  { label: 'absolute 3D game link', pattern: /href=["']\/3D/ig },
  { label: 'absolute 4D game link', pattern: /href=["']\/4D/ig },
  { label: 'absolute Life link', pattern: /href=["']\/life/ig },
  { label: 'absolute Labs link', pattern: /href=["']\/labs/ig },
  { label: 'absolute Algebraic link', pattern: /href=["']\/algebraic/ig },
  { label: 'absolute spacetime link', pattern: /href=["']\/spacetime/ig },
  { label: 'absolute 2D navigation', pattern: /(?:window\.)?location\.href\s*=\s*["']\/2D/ig },
  { label: 'absolute 3D navigation', pattern: /(?:window\.)?location\.href\s*=\s*["']\/3D/ig },
  { label: 'absolute 4D navigation', pattern: /(?:window\.)?location\.href\s*=\s*["']\/4D/ig },
  { label: 'absolute game navigation assign', pattern: /location\.assign\(\s*["']\/(?:2D|3D|4D|life|labs|algebraic|spacetime)/ig }
];

function extensionOf(filePath) {
  const index = filePath.lastIndexOf('.');
  return index >= 0 ? filePath.slice(index).toLowerCase() : '';
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
    } else if (scannedExtensions.has(extensionOf(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineAndColumn(source, index) {
  const before = source.slice(0, index);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

if (!existsSync(distPath)) {
  console.error(`[verify-steam-dist] Missing Steam dist folder: ${distPath}`);
  process.exit(1);
}

const indexPath = join(distPath, 'index.html');
if (!existsSync(indexPath)) {
  console.error(`[verify-steam-dist] Missing Steam index.html: ${indexPath}`);
  process.exit(1);
}

const failures = [];
for (const filePath of walk(distPath)) {
  const source = readFileSync(filePath, 'utf8');
  for (const check of forbidden) {
    check.pattern.lastIndex = 0;
    let match;
    while ((match = check.pattern.exec(source))) {
      const position = lineAndColumn(source, match.index);
      failures.push({
        file: relative(distPath, filePath).replace(/\\/g, '/'),
        label: check.label,
        match: match[0],
        line: position.line,
        column: position.column
      });
    }
  }
}

if (failures.length) {
  console.error('[verify-steam-dist] Steam build contains absolute local paths that can break Electron routing.');
  for (const failure of failures.slice(0, 80)) {
    console.error(`- ${failure.file}:${failure.line}:${failure.column} ${failure.label}: ${failure.match}`);
  }
  if (failures.length > 80) {
    console.error(`...and ${failures.length - 80} more.`);
  }
  process.exit(1);
}

console.log(`[verify-steam-dist] OK: ${distArg} uses relative Steam-safe local paths.`);
