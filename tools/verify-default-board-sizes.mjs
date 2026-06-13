import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const pages = [
    {
        name: '2D Go',
        html: '2D/2dgo/index.html',
        js: '2D/2dgo/js/main.js',
        selected: '19',
        custom: '19'
    },
    {
        name: '3D Go',
        html: '3D/3dgo/index.html',
        js: '3D/3dgo/js/main.js',
        selected: '19',
        custom: '19'
    },
    {
        name: '2D Reversi',
        html: '2D/2dreversi/index.html',
        js: '2D/2dreversi/js/main.js',
        selected: '12',
        custom: '12'
    },
    {
        name: '3D Reversi',
        html: '3D/3dreversi/index.html',
        js: '3D/3dreversi/js/main.js',
        selected: '12',
        custom: '12'
    }
];

for (const page of pages) {
    const html = await readFile(join(root, page.html), 'utf8');
    const js = await readFile(join(root, page.js), 'utf8');
    assert.match(
        html,
        new RegExp(`<option value="${page.selected}" selected>`),
        `${page.name} should select the largest standard scale by default.`
    );
    assert.match(
        html,
        new RegExp(`id="customBoardSizeInput"[^>]+value="${page.custom}"`),
        `${page.name} custom input should mirror the largest standard scale.`
    );
    assert.match(
        js,
        /size !== null && size\.trim\(\) !== '' && Number\.isFinite\(Number\(size\)\)/,
        `${page.name} should ignore missing URL size parameters.`
    );
    assert.doesNotMatch(
        js,
        /Number\(params\.get\('size'\)\)/,
        `${page.name} must not coerce a missing size parameter to 0.`
    );
}

console.log('Default board-size selection verification passed.');
