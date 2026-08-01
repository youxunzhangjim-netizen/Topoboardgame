#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const games = numberArg('games', 2, 1, 1000);
const maxPlies = numberArg('maxPlies', 120, 1, 500);
const stockfishDepth = numberArg('stockfishDepth', 8, 1, 40);
const stockfishMovetime = numberArg('stockfishMovetime', 0, 0, 600000);
const kataGoVisits = numberArg('katagoVisits', 32, 1, 100000);
const kataGoTimeLimit = numberArg('katagoTimeLimit', 0, 0, 3600);
const kataGoTimeoutMs = numberArg('katagoTimeoutMs', 120000, 30000, 3600000);
const edaxDepth = numberArg('edaxDepth', 6, 1, 30);
const edaxTimeoutMs = numberArg('edaxTimeoutMs', 60000, 10000, 600000);
const levels = String(args.levels || '1,2,3,4')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value >= 1 && value <= 4);
const sides = String(args.sides || 'white,black')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter((value) => ['white', 'black'].includes(value));
const families = new Set(String(args.families || 'chess,go,reversi')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter((value) => ['chess', 'go', 'reversi'].includes(value)));

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const workspaceRoot = resolve(repoRoot, '..');
const searchRoots = unique([repoRoot, workspaceRoot, process.cwd()]);

const stockfishPath = findExecutable('STOCKFISH_PATH', ['stockfish.exe', 'stockfish'], {
  recursiveNames: ['stockfish*.exe']
});
const kataGoPath = findExecutable('KATAGO_PATH', ['katago.exe', 'katago'], {
  recursiveNames: ['katago*.exe']
});
const edaxPath = findExecutable('EDAX_PATH', ['edax.exe', 'edax-avx.exe', 'edax-x64.exe', 'edax'], {
  recursiveNames: ['edax*.exe', 'wEdax*.exe']
});
const kataGoModelPath = findFile('KATAGO_MODEL', ['*.bin.gz'], {
  preferred: [/external-engines/i, /b10c384h6nbttflrs/i, /kata/i, /models/i],
  reject: [/findLatestModelTest/i, /abc\.bin\.gz$/i, /def/i, /ghi/i]
});
const kataGoConfigPath = findFile('KATAGO_CONFIG', ['default_gtp.cfg', 'gtp*.cfg', 'analysis*.cfg'], {
  preferred: [/external-engines/i, /default_gtp/i, /gtp.*human.*5s/i, /gtp/i, /analysis/i]
});

const report = {
  schema: 'topoboardgame.public_engine_benchmark.v1',
  createdAt: new Date().toISOString(),
  requested: {
    games,
    maxPlies,
    stockfishDepth,
    stockfishMovetime,
    kataGoVisits,
    kataGoTimeLimit,
    kataGoTimeoutMs,
    edaxDepth,
    edaxTimeoutMs,
    levels,
    sides,
    families: [...families]
  },
  engines: {
    stockfish: engineStatus(stockfishPath, 'STOCKFISH_PATH'),
    katago: {
      ...engineStatus(kataGoPath, 'KATAGO_PATH'),
      model: kataGoModelPath || '',
      config: kataGoConfigPath || ''
    },
    edax: engineStatus(edaxPath, 'EDAX_PATH')
  },
  results: [],
  notes: []
};

if (!families.has('chess')) {
  report.notes.push('Chess/Stockfish calibration skipped by --families.');
} else if (!stockfishPath) {
  report.notes.push('Stockfish was not found. Set STOCKFISH_PATH to a local Stockfish executable to run Chess matches.');
} else {
  for (const level of levels) {
    if (sides.includes('white')) {
      report.results.push(runStockfishMatch({
        level,
        robotSide: 'white',
        botA: 'builtin',
        botB: 'externalB',
        externalSide: 'externalB'
      }));
    }
    if (sides.includes('black')) {
      report.results.push(runStockfishMatch({
        level,
        robotSide: 'black',
        botA: 'externalA',
        botB: 'builtin',
        externalSide: 'externalA'
      }));
    }
  }
}

if (!families.has('go')) {
  report.notes.push('Go/KataGo calibration skipped by --families.');
} else if (!kataGoPath) {
  report.notes.push('KataGo executable was not found. The extracted KataGo source tree is not enough; set KATAGO_PATH to a compiled katago.exe.');
} else if (!kataGoModelPath) {
  report.notes.push('KataGo executable was found, but no model was configured. Set KATAGO_MODEL to a .bin.gz network file.');
} else {
  for (const level of levels) {
    if (sides.includes('black')) {
      report.results.push(runKataGoMatch({
        level,
        robotSide: 'black',
        botA: 'builtin',
        botB: 'externalB',
        externalSide: 'externalB'
      }));
    }
    if (sides.includes('white')) {
      report.results.push(runKataGoMatch({
        level,
        robotSide: 'white',
        botA: 'externalA',
        botB: 'builtin',
        externalSide: 'externalA'
      }));
    }
  }
}

if (!families.has('reversi')) {
  report.notes.push('Reversi/Edax calibration skipped by --families.');
} else if (!edaxPath) {
  report.notes.push('Edax executable was not found. The extracted Edax source tree is not enough; set EDAX_PATH to a compiled edax.exe.');
} else {
  for (const level of levels) {
    if (sides.includes('black')) {
      report.results.push(runEdaxMatch({
        level,
        robotSide: 'black',
        botA: 'builtin',
        botB: 'externalB',
        externalSide: 'externalB'
      }));
    }
    if (sides.includes('white')) {
      report.results.push(runEdaxMatch({
        level,
        robotSide: 'white',
        botA: 'externalA',
        botB: 'builtin',
        externalSide: 'externalA'
      }));
    }
  }
}

report.summary = summarizeResults(report.results);
report.notes.push('Public engines calibrate only normal standard 2D boards. Topological, 3D, 4D, and +1D boards still need local graph-aware strategy tests.');
report.notes.push('Games that hit maxPlies are adjudicated/inconclusive for strength rating; use longer maxPlies or teacher eval loss for rating-quality calibration.');

console.log(JSON.stringify(report, null, 2));

function runStockfishMatch({ level, robotSide, botA, botB, externalSide }) {
  const out = `local-data/benchmarks/public-engines/chess-l${level}-${robotSide}-vs-stockfish-d${stockfishDepth}-${Date.now()}.jsonl`;
  const externalCommand = [
    'node',
    'research/external-bots/stockfish-jsonl-wrapper.mjs',
    '--engine',
    quoteArg(stockfishPath),
    '--depth',
    String(stockfishDepth),
    '--movetime',
    String(stockfishMovetime)
  ].join(' ');
  const cmd = [
    'research/selfplay.mjs',
    '--game', '2dchess',
    '--boundary', 'forbidden',
    '--size', '8',
    '--games', String(games),
    '--maxPlies', String(maxPlies),
    '--depthA', String(level),
    '--depthB', String(level),
    '--botA', botA,
    '--botB', botB,
    `--${externalSide}`, externalCommand,
    '--externalTimeoutMs', String(Math.max(10000, stockfishMovetime + 5000)),
    '--record', 'games',
    '--state', 'false',
    '--out', out,
    '--seed', `public-engine-benchmark:chess:l${level}:${robotSide}`
  ];
  return runExternalMatch({
    cmd,
    game: '2dchess',
    robotLevel: level,
    robotSide,
    opponent: 'Stockfish',
    opponentDepth: stockfishDepth,
    opponentMovetimeMs: stockfishMovetime,
    out
  });
}

function runKataGoMatch({ level, robotSide, botA, botB, externalSide }) {
  const out = `local-data/benchmarks/public-engines/go-l${level}-${robotSide}-vs-katago-v${kataGoVisits}-${Date.now()}.jsonl`;
  const externalCommand = [
    'node',
    'research/external-bots/katago-gtp-jsonl-wrapper.mjs',
    '--engine',
    quoteArg(kataGoPath),
    '--model',
    quoteArg(kataGoModelPath),
    kataGoConfigPath ? `--config ${quoteArg(kataGoConfigPath)}` : '',
    '--visits',
    String(kataGoVisits),
    '--timeLimit',
    String(kataGoTimeLimit)
  ].filter(Boolean).join(' ');
  const cmd = [
    'research/selfplay.mjs',
    '--game', '2dgo',
    '--boundary', 'open2d',
    '--lattice', 'square',
    '--size', '9',
    '--games', String(games),
    '--maxPlies', String(maxPlies),
    '--depthA', String(level),
    '--depthB', String(level),
    '--botA', botA,
    '--botB', botB,
    `--${externalSide}`, externalCommand,
    '--externalTimeoutMs', String(Math.max(kataGoTimeoutMs, Math.ceil(kataGoTimeLimit * 1000) + 15000)),
    '--record', 'games',
    '--state', 'false',
    '--out', out,
    '--seed', `public-engine-benchmark:go:l${level}:${robotSide}`
  ];
  return runExternalMatch({
    cmd,
    game: '2dgo',
    robotLevel: level,
    robotSide,
    opponent: 'KataGo',
    opponentVisits: kataGoVisits,
    opponentTimeLimitSec: kataGoTimeLimit,
    opponentTimeoutMs: kataGoTimeoutMs,
    out
  });
}

function runEdaxMatch({ level, robotSide, botA, botB, externalSide }) {
  const out = `local-data/benchmarks/public-engines/reversi-l${level}-${robotSide}-vs-edax-d${edaxDepth}-${Date.now()}.jsonl`;
  const externalCommand = [
    'node',
    'research/external-bots/edax-gtp-jsonl-wrapper.mjs',
    '--engine',
    quoteArg(edaxPath),
    '--depth',
    String(edaxDepth)
  ].join(' ');
  const cmd = [
    'research/selfplay.mjs',
    '--game', '2dreversi',
    '--boundary', 'open2d',
    '--lattice', 'square',
    '--size', '8',
    '--games', String(games),
    '--maxPlies', String(maxPlies),
    '--depthA', String(level),
    '--depthB', String(level),
    '--botA', botA,
    '--botB', botB,
    `--${externalSide}`, externalCommand,
    '--externalTimeoutMs', String(edaxTimeoutMs),
    '--record', 'games',
    '--state', 'false',
    '--out', out,
    '--seed', `public-engine-benchmark:reversi:l${level}:${robotSide}`
  ];
  return runExternalMatch({
    cmd,
    game: '2dreversi',
    robotLevel: level,
    robotSide,
    opponent: 'Edax',
    opponentDepth: edaxDepth,
    opponentTimeoutMs: edaxTimeoutMs,
    out
  });
}

function runExternalMatch(base) {
  const result = spawnSync(process.execPath, base.cmd, { encoding: 'utf8' });
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const parsed = parseLastJson(stdout);
  const gameRecords = parsed?.ok ? summarizeGameRecordFile(base.out) : null;
  return {
    ...base,
    cmd: undefined,
    ok: result.status === 0 && Boolean(parsed?.ok),
    exitCode: result.status,
    summary: parsed,
    gameRecords,
    out: base.out,
    stderr: stderr ? stderr.split(/\r?\n/).slice(-8) : []
  };
}

function engineStatus(path, envName) {
  return {
    configured: Boolean(path),
    path: path || '',
    envName
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = 'true';
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function numberArg(name, fallback, min, max) {
  const value = Number(args[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function findExecutable(envName, commandNames, { recursiveNames = [] } = {}) {
  const configured = process.env[envName];
  if (configured && existsSync(configured)) return configured;
  const pathDirs = String(process.env.PATH || '').split(delimiter).filter(Boolean);
  const candidates = [];
  for (const dir of pathDirs) {
    for (const command of commandNames) candidates.push(join(dir, command));
  }
  const pathMatch = candidates.find((candidate) => existsSync(candidate));
  if (pathMatch) return pathMatch;
  for (const pattern of recursiveNames) {
    const found = findFirstFileByPattern(pattern, { executable: true });
    if (found) return found;
  }
  return '';
}

function findFile(envName, globPatterns, { preferred = [], reject = [] } = {}) {
  const configured = process.env[envName];
  if (configured && existsSync(configured)) return configured;
  const matches = [];
  for (const pattern of globPatterns) matches.push(...findFilesByPattern(pattern));
  const filtered = unique(matches).filter((item) => !reject.some((rx) => rx.test(item)));
  filtered.sort((a, b) => preferenceScore(b, preferred) - preferenceScore(a, preferred));
  return filtered[0] || '';
}

function findFirstFileByPattern(pattern, options = {}) {
  return findFilesByPattern(pattern, options)[0] || '';
}

function findFilesByPattern(pattern, { executable = false } = {}) {
  const rx = globToRegExp(pattern);
  const matches = [];
  for (const root of searchRoots) {
    walk(root, (filePath) => {
      const normalized = filePath.replace(/\\/g, '/');
      if (/\/(node_modules|dist-web|dist-steam|dist-research|\.git|release|Gamebuild|playwright-report|test-results)\//i.test(normalized)) return;
      const name = normalized.split('/').pop();
      if (!rx.test(name)) return;
      if (executable && !/\.(exe|cmd|bat)$/i.test(name) && !name.includes('.')) return;
      matches.push(filePath);
    });
  }
  return unique(matches);
}

function walk(root, visit) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const filePath = join(root, entry.name);
    if (entry.isDirectory()) {
      if (/^(node_modules|dist-web|dist-steam|dist-research|\.git|release|Gamebuild|playwright-report|test-results)$/i.test(entry.name)) continue;
      walk(filePath, visit);
    } else if (entry.isFile()) {
      visit(filePath);
    }
  }
}

function globToRegExp(pattern) {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function preferenceScore(filePath, preferred) {
  const text = String(filePath || '');
  let score = 0;
  for (const rx of preferred) if (rx.test(text)) score += 10;
  try {
    score += Math.min(9, Math.floor(statSync(filePath).size / 1_000_000));
  } catch {
    // Ignore unreadable file size in discovery scoring.
  }
  return score;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function summarizeResults(results) {
  const output = {};
  for (const item of results) {
    const key = `${item.game}:L${item.robotLevel}:${item.robotSide}:vs:${item.opponent}`;
    const summary = item.summary || {};
    const records = item.gameRecords || {};
    output[key] = {
      ok: item.ok,
      games: summary.games || 0,
      winners: summary.winners || {},
      maxPliesReached: records.maxPliesReached || 0,
      completedBeforePlyCap: records.completedBeforePlyCap || 0,
      averagePlies: records.averagePlies ?? null,
      output: item.out,
      note: records.maxPliesReached
        ? 'Contains max-ply adjudications; do not treat as an Elo/rating result.'
        : 'All games ended before the ply cap in this run.'
    };
  }
  return output;
}

function summarizeGameRecordFile(outPath) {
  let text = '';
  try {
    text = readFileSync(outPath, 'utf8');
  } catch {
    return null;
  }
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter((row) => row?.type === 'game');
  const plies = rows.map((row) => Number(row.plies) || 0);
  const maxPliesReached = rows.filter((row) => row.maxPliesReached).length;
  return {
    games: rows.length,
    maxPliesReached,
    completedBeforePlyCap: rows.length - maxPliesReached,
    averagePlies: rows.length
      ? Number((plies.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(2))
      : 0
  };
}

function quoteArg(value) {
  const text = String(value || '');
  return /\s/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
}

function parseLastJson(stdout) {
  const text = String(stdout || '');
  const start = text.lastIndexOf('\n{');
  const candidate = start >= 0 ? text.slice(start + 1) : text;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
