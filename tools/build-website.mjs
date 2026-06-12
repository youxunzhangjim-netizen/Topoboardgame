import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'cmd.exe' : 'npm';

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
    cpSync(from, to, { recursive: true });
}

run(['run', 'build', '--workspace', '2dchess']);
run(['run', 'build', '--workspace', 'toruschess']);

const output = join(root, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

copy(join(root, 'index.html'), join(output, 'index.html'));
copy(join(root, 'css'), join(output, 'css'));
copy(join(root, '2dchess', 'dist'), join(output, '2dchess'));
copy(join(root, 'toruschess', 'dist'), join(output, 'toruschess'));
writeFileSync(join(output, '.nojekyll'), '');

console.log(`Website bundle ready: ${output}`);
