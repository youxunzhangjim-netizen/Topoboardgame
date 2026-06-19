#!/usr/bin/env node
import fs from 'node:fs/promises';
import { parseArgs, stringArg } from '../../research/lib/cli.mjs';
import { selfPlayRecordToExamples } from '../TrainingDataRecorder.js';
import { ModelStore } from '../ModelStore.js';
import { VariantTrainer } from '../VariantTrainer.js';

const args = parseArgs();
if (args.help || args.h) {
    printHelp();
    process.exit(0);
}

const input = stringArg(args, 'input', '');
const gameType = stringArg(args, 'gameType', stringArg(args, 'game', 'chess'));
const targetVariant = stringArg(args, 'targetVariant', stringArg(args, 'variant', 'base'));
const targetTopology = stringArg(args, 'targetTopology', stringArg(args, 'topology', targetVariant));
const baseModelId = stringArg(args, 'baseModelId', `models/${gameType}/base`);
const rulesVersion = stringArg(args, 'rulesVersion', 'local-current');
const notes = stringArg(args, 'notes', '');
const root = stringArg(args, 'root', '.');

const records = input ? await readJsonl(input) : [];
const examples = records.flatMap((record) => selfPlayRecordToExamples(record));
const trainer = new VariantTrainer({ modelStore: new ModelStore({ root }) });
const metadata = await trainer.fineTuneVariant({
    gameType,
    baseModelId,
    targetVariant,
    targetTopology,
    examples,
    rulesVersion,
    notes
});

console.log(JSON.stringify({
    ok: true,
    command: 'train:variant',
    input: input || null,
    records: records.length,
    examples: examples.length,
    savedModel: metadata
}, null, 2));

async function readJsonl(filePath) {
    const text = await fs.readFile(filePath, 'utf8');
    return text.split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

function printHelp() {
    console.log(`Topoboardgame variant fine-tuning

Usage:
  npm run train:variant -- --input local-data/training/selfplay/2dchess.jsonl --gameType chess --targetVariant torus
  npm run train:variant -- --input local-data/training/selfplay/4djump.jsonl --gameType jump --targetVariant 4d

The base model is not overwritten. Variant metadata and model placeholders are saved under models/<game>/<variant>/.`);
}
