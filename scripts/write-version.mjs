import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const edition = process.argv[2] || process.env.TOPOBOARD_EDITION || 'web-lite';
const outDir = resolve(root, process.argv[3] || process.env.TOPOBOARD_OUT_DIR || 'dist');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function gitShortHash() {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

const version = {
  name: 'Topological Board Game',
  edition,
  version: packageJson.version || '0.0.0',
  commit: gitShortHash(),
  buildTime: new Date().toISOString()
};

const json = `${JSON.stringify(version, null, 2)}\n`;
const runtimeModule = `globalThis.__TBG_VERSION__ = Object.freeze(${JSON.stringify(version, null, 2)});\nexport const TBG_VERSION = globalThis.__TBG_VERSION__;\n`;

function walkHtmlFiles(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) walkHtmlFiles(path, results);
    else if (name.toLowerCase().endsWith('.html')) results.push(path);
  }
  return results;
}

function htmlScriptPath(htmlFile) {
  const from = dirname(htmlFile);
  const to = join(outDir, 'version.js');
  const path = relative(from, to).replace(/\\/g, '/');
  return path.startsWith('.') ? path : `./${path}`;
}

function injectRuntimeVersionScript() {
  for (const htmlFile of walkHtmlFiles(outDir)) {
    const marker = 'data-tbg-version';
    let html = readFileSync(htmlFile, 'utf8');
    if (html.includes(marker)) continue;
    const script = `<script type="module" ${marker} src="${htmlScriptPath(htmlFile)}"></script>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `  ${script}\n</head>`);
    } else {
      html = `${script}\n${html}`;
    }
    writeFileSync(htmlFile, html);
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'version.json'), json);
writeFileSync(join(outDir, 'version.js'), runtimeModule);

mkdirSync(join(outDir, 'js', 'shared'), { recursive: true });
writeFileSync(join(outDir, 'js', 'shared', 'version.json'), json);
writeFileSync(join(outDir, 'js', 'shared', 'version.js'), runtimeModule);
injectRuntimeVersionScript();

console.log(`Version metadata written: ${join(outDir, 'version.json')}`);
