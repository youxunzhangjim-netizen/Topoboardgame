import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';

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

function copyIfExists(from, to) {
    if (existsSync(from)) cpSync(from, to, { recursive: true });
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

const output = join(root, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

copy(launcherOutput, output);
copyIfExists(join(root, 'js'), join(output, 'js'));
copyIfExists(join(root, 'docs'), join(output, 'docs'));
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
copy(join(root, 'algebraic', 'dist'), join(output, 'algebraic'));
copy(join(root, 'life'), join(output, 'life'));
copyIfExists(join(root, 'spacetime'), join(output, 'spacetime'));
writeFileSync(join(output, '.nojekyll'), '');
rmSync(launcherOutput, { recursive: true, force: true });

console.log(`Website bundle ready: ${output}`);
