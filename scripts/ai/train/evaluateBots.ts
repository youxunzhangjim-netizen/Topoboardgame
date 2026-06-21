import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'public/models';
const rows = [];
for (const file of readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const model = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  rows.push({
    file,
    schema: model.schema || 'unknown',
    examples: model.training?.examples || 0,
    featureCount: model.training?.featureCount || Object.keys(model.weights || {}).length,
    lastAccuracy: model.training?.history?.at?.(-1)?.accuracy ?? null
  });
}
console.table(rows.sort((a, b) => String(a.file).localeCompare(String(b.file))));

