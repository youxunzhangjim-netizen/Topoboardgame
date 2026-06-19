#!/usr/bin/env node
import { parseArgs, stringArg } from '../../research/lib/cli.mjs';
import { ModelStore } from '../ModelStore.js';

const args = parseArgs();
if (args.help || args.h) {
    printHelp();
    process.exit(0);
}

const modelId = stringArg(args, 'modelId', '');
const out = stringArg(args, 'out', '');
const root = stringArg(args, 'root', '.');
if (!modelId) {
    console.error('Missing --modelId.');
    printHelp();
    process.exit(2);
}

const store = new ModelStore({ root });
const bundle = await store.exportModel(modelId, { outputPath: out });
console.log(JSON.stringify({
    ok: true,
    command: 'export:model',
    modelId,
    out: out || null,
    metadata: bundle.metadata
}, null, 2));

function printHelp() {
    console.log(`Topoboardgame model export

Usage:
  npm run export:model -- --modelId models/chess/torus/variant-fine-tuning-123 --out dist/models/chess-torus.json

Exports model metadata/bundle JSON for browser or Steam builds.`);
}
