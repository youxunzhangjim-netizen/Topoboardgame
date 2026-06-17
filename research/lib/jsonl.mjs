import fs from 'node:fs';
import path from 'node:path';

export function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export class JsonlWriter {
  constructor(filePath) {
    this.filePath = filePath;
    ensureDirFor(filePath);
    this.stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    this.count = 0;
  }
  write(record) {
    this.count += 1;
    this.stream.write(`${JSON.stringify(record)}\n`);
  }
  async close() {
    await new Promise((resolve, reject) => {
      this.stream.end((error) => error ? reject(error) : resolve());
    });
  }
}

export async function* readJsonl(filePath) {
  const data = await fs.promises.readFile(filePath, 'utf8');
  let lineNo = 0;
  for (const line of data.split(/\r?\n/)) {
    lineNo += 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { yield JSON.parse(trimmed); }
    catch (error) { throw new Error(`Invalid JSONL at ${filePath}:${lineNo}: ${error.message}`); }
  }
}
