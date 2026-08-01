#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const quick = hasFlag('quick');
const warmStart = !hasFlag('noWarmStart');
const explicitBaseModel = stringArg('baseModel', '');
const games = numberArg('games', quick ? 2 : 100, 1, 10000);
const epochs = numberArg('epochs', quick ? 3 : 12, 1, 500);
const families = new Set(stringArg('families', 'chess,go,reversi')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter((item) => ['chess', 'go', 'reversi'].includes(item)));
const goSizes = stringArg('goSizes', quick ? '9' : '9,13,19')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isInteger(item) && item >= 5 && item <= 19);

const stockfishDepth = numberArg('stockfishDepth', quick ? 1 : 8, 1, 40);
const kataGoVisits = numberArg('katagoVisits', quick ? 2 : 64, 1, 100000);
const kataGoPolicyOnly = hasFlag('katagoPolicyOnly') || stringArg('katagoTeacher', '').toLowerCase() === 'policy';
const edaxDepth = numberArg('edaxDepth', quick ? 1 : 6, 1, 30);
const maxPliesChess = numberArg('maxPliesChess', quick ? 20 : 160, 1, 1000);
const maxPliesGo = numberArg('maxPliesGo', quick ? 24 : 240, 1, 1000);
const maxPliesReversi = numberArg('maxPliesReversi', quick ? 24 : 120, 1, 1000);
const progressEvery = numberArg('progressEvery', quick ? 1 : Math.max(1, Math.floor(games / 20)), 1, 1_000_000);

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const workspaceRoot = resolve(repoRoot, '..');
const searchRoots = unique([repoRoot, workspaceRoot, process.cwd()]);
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const outRoot = `local-data/selfplay/public-teachers/${runStamp}`;
mkdirSync(outRoot, { recursive: true });

const stockfishPath = findExecutable('STOCKFISH_PATH', ['stockfish.exe', 'stockfish'], ['stockfish*.exe']);
const kataGoPath = findExecutable('KATAGO_PATH', ['katago.exe', 'katago'], ['katago*.exe']);
const kataGoModel = findFile('KATAGO_MODEL', ['*.bin.gz'], [/external-engines/i, /b10c384h6nbttflrs/i, /kata/i]);
const kataGoConfig = findFile('KATAGO_CONFIG', ['default_gtp.cfg', 'gtp*.cfg'], [/external-engines/i, /default_gtp/i, /gtp/i]);
const edaxPath = findExecutable('EDAX_PATH', ['edax.exe', 'edax-avx.exe', 'edax-x64.exe', 'edax'], ['edax*.exe', 'wEdax*.exe']);

const summary = {
  schema: 'topoboardgame.teacher_training.standard2d.v1',
  createdAt: new Date().toISOString(),
  outRoot,
  games,
  epochs,
  warmStart,
  families: [...families],
  engines: {
    stockfish: stockfishPath,
    katago: { path: kataGoPath, model: kataGoModel, config: kataGoConfig, visits: kataGoVisits, policyOnly: kataGoPolicyOnly },
    edax: edaxPath
  },
  jobs: []
};

if (families.has('chess')) {
  if (!stockfishPath) {
    summary.jobs.push({ family: 'chess', ok: false, skipped: true, reason: 'Stockfish not found; set STOCKFISH_PATH.' });
  } else {
    runTeacherPair({
      family: 'chess',
      game: '2dchess',
      boundary: 'forbidden',
      lattice: 'square',
      size: 8,
      maxPlies: maxPliesChess,
      depthA: 2,
      depthB: 2,
      teacherA: stockfishCommand(stockfishPath, stockfishDepth),
      teacherB: stockfishCommand(stockfishPath, stockfishDepth),
      modelOut: 'local-models/2dchess-standard-stockfish-teacher-linear.json',
      trainGame: '2dchess',
      lr: '0.035'
    });
  }
}

if (families.has('go')) {
  if (!kataGoPath || !kataGoModel) {
    summary.jobs.push({ family: 'go', ok: false, skipped: true, reason: 'KataGo executable/model not found; set KATAGO_PATH and KATAGO_MODEL.' });
  } else {
    for (const size of goSizes) {
      runTeacherPair({
        family: 'go',
        game: '2dgo',
        boundary: 'open2d',
        lattice: 'square',
        size,
        maxPlies: maxPliesGo,
        depthA: 1,
        depthB: 1,
        teacherA: kataGoCommand(kataGoPath, kataGoModel, kataGoConfig, kataGoVisits, kataGoPolicyOnly),
        teacherB: kataGoCommand(kataGoPath, kataGoModel, kataGoConfig, kataGoVisits, kataGoPolicyOnly),
        modelOut: `local-models/2dgo-open2d-square-s${size}-katago-teacher-linear.json`,
        trainGame: '2dgo',
        lr: '0.045',
        fastLegalMoves: true,
        bothExternal: true
      });
    }
  }
}

if (families.has('reversi')) {
  if (!edaxPath) {
    summary.jobs.push({ family: 'reversi', ok: false, skipped: true, reason: 'Edax not found; set EDAX_PATH.' });
  } else {
    runTeacherPair({
      family: 'reversi',
      game: '2dreversi',
      boundary: 'open2d',
      lattice: 'square',
      size: 8,
      maxPlies: maxPliesReversi,
      depthA: 3,
      depthB: 3,
      teacherA: edaxCommand(edaxPath, edaxDepth),
      teacherB: edaxCommand(edaxPath, edaxDepth),
      modelOut: 'local-models/2dreversi-open2d-square-edax-teacher-linear.json',
      trainGame: '2dreversi',
      lr: '0.035'
    });
  }
}

const summaryPath = join(outRoot, 'summary.json');
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ok: summary.jobs.every((job) => job.ok || job.skipped), summaryPath, ...summary }, null, 2));

function runTeacherPair(config) {
  const base = `${config.game}-${config.boundary}-${config.lattice}-s${config.size}`;
  const teacherAOut = join(outRoot, `${base}-teacherA.jsonl`);
  const teacherBOut = join(outRoot, `${base}-teacherB.jsonl`);
  const combinedOut = join(outRoot, `${base}-combined.jsonl`);
  const common = [
    'research/selfplay.mjs',
    '--game', config.game,
    '--boundary', config.boundary,
    '--lattice', config.lattice,
    '--size', String(config.size),
    '--games', String(games),
    '--maxPlies', String(config.maxPlies),
    '--depthA', String(config.depthA),
    '--depthB', String(config.depthB),
    '--record', 'moves',
    '--state', 'true',
    '--progressEvery', String(progressEvery)
  ];
  if (config.fastLegalMoves) common.push('--fastLegalMoves', 'true');

  if (config.bothExternal) {
    const both = runNode([
      ...common,
      '--botA', 'externalA',
      '--botB', 'externalA',
      '--externalA', config.teacherA,
      '--externalTimeoutMs', timeoutFor(config.family),
      '--out', teacherAOut,
      '--seed', `teacher:${base}:both:${runStamp}`
    ]);
    if (both.status) {
      summary.jobs.push({ ...jobInfo(config, teacherAOut, teacherBOut, combinedOut), ok: false, stage: 'teacherBoth', exitCode: both.status });
      return;
    }
    writeFileSync(combinedOut, readFileSync(teacherAOut, 'utf8'));
    trainModel(config, base, teacherAOut, teacherBOut, combinedOut);
    return;
  }

  const first = runNode([
    ...common,
    '--botA', 'externalA',
    '--botB', 'builtin',
    '--externalA', config.teacherA,
    '--externalTimeoutMs', timeoutFor(config.family),
    '--out', teacherAOut,
    '--seed', `teacher:${base}:A:${runStamp}`
  ]);
  if (first.status) {
    summary.jobs.push({ ...jobInfo(config, teacherAOut, teacherBOut, combinedOut), ok: false, stage: 'teacherA', exitCode: first.status });
    return;
  }
  const second = runNode([
    ...common,
    '--botA', 'builtin',
    '--botB', 'externalB',
    '--externalB', config.teacherB,
    '--externalTimeoutMs', timeoutFor(config.family),
    '--out', teacherBOut,
    '--seed', `teacher:${base}:B:${runStamp}`
  ]);
  if (second.status) {
    summary.jobs.push({ ...jobInfo(config, teacherAOut, teacherBOut, combinedOut), ok: false, stage: 'teacherB', exitCode: second.status });
    return;
  }
  writeFileSync(combinedOut, `${readFileSync(teacherAOut, 'utf8').trim()}\n${readFileSync(teacherBOut, 'utf8').trim()}\n`);
  trainModel(config, base, teacherAOut, teacherBOut, combinedOut);
}

function trainModel(config, base, teacherAOut, teacherBOut, combinedOut) {
  const baseModel = findBaseModel(config);
  const train = runNode([
    'research/ml/train-linear.mjs',
    '--in', combinedOut,
    '--out', config.modelOut,
    '--epochs', String(epochs),
    '--lr', config.lr,
    '--l2', '0.0005',
    '--game', config.trainGame,
    ...(baseModel ? ['--baseModel', baseModel] : []),
    '--seed', `teacher-train:${base}:${runStamp}`
  ]);
  summary.jobs.push({
    ...jobInfo(config, teacherAOut, teacherBOut, combinedOut),
    modelOut: config.modelOut,
    baseModel,
    ok: train.status === 0,
    stage: train.status === 0 ? 'complete' : 'train',
    exitCode: train.status || 0
  });
}

function findBaseModel(config) {
  if (!warmStart) return '';
  if (explicitBaseModel && existsSync(explicitBaseModel)) return explicitBaseModel;
  if (existsSync(config.modelOut)) return config.modelOut;

  const wanted = [
    config.game,
    config.boundary,
    config.lattice,
    `s${config.size}`
  ].map((item) => String(item || '').toLowerCase());

  const candidates = [];
  for (const root of ['public/models', 'local-models', 'models/robots/research-linear']) {
    collectJsonModels(root, candidates);
  }
  candidates.sort((a, b) => modelCandidateScore(b, wanted) - modelCandidateScore(a, wanted));
  const best = candidates.find((candidate) => modelCandidateScore(candidate, wanted) > 0);
  return best || '';
}

function collectJsonModels(root, output) {
  const abs = resolve(repoRoot, root);
  walk(abs, (filePath) => {
    if (/\.json$/i.test(filePath) && !/summary|manifest|package|metadata|smoke/i.test(filePath)) output.push(filePath);
  });
}

function modelCandidateScore(filePath, wanted) {
  const text = filePath.replace(/\\/g, '/').toLowerCase();
  const token = tokenScore(text, wanted);
  if (token < 60) return -1000;
  if (text.includes('/public/models/')) return 120 + token;
  if (text.includes('/local-models/')) return 90 + token;
  if (text.includes('/models/robots/research-linear/')) return 70 + token;
  return token;
}

function tokenScore(text, wanted) {
  let score = 0;
  for (const token of wanted) if (token && text.includes(token)) score += 20;
  if (text.includes('-100-') || text.includes('-g100-') || text.includes('g100')) score += 8;
  if (text.includes('teacher')) score += 4;
  if (text.includes('smoke')) score -= 1000;
  return score;
}

function jobInfo(config, teacherAOut, teacherBOut, combinedOut) {
  return {
    family: config.family,
    game: config.game,
    boundary: config.boundary,
    lattice: config.lattice,
    size: config.size,
    teacherAOut,
    teacherBOut,
    combinedOut
  };
}

function runNode(argv) {
  return spawnSync(process.execPath, argv, { cwd: repoRoot, stdio: 'inherit' });
}

function stockfishCommand(engine, depth) {
  return `node research/external-bots/stockfish-jsonl-wrapper.mjs --engine ${quoteArg(engine)} --depth ${depth}`;
}

function kataGoCommand(engine, model, config, visits, policyOnly) {
  return [
    'node research/external-bots/katago-gtp-jsonl-wrapper.mjs',
    '--engine', quoteArg(engine),
    '--model', quoteArg(model),
    config ? `--config ${quoteArg(config)}` : '',
    '--visits', String(visits),
    policyOnly ? '--policyOnly' : ''
  ].filter(Boolean).join(' ');
}

function edaxCommand(engine, depth) {
  return `node research/external-bots/edax-gtp-jsonl-wrapper.mjs --engine ${quoteArg(engine)} --depth ${depth}`;
}

function timeoutFor(family) {
  if (family === 'go') return String(numberArg('katagoTimeoutMs', 120000, 30000, 3600000));
  if (family === 'reversi') return String(numberArg('edaxTimeoutMs', 60000, 10000, 600000));
  return String(numberArg('stockfishTimeoutMs', 30000, 5000, 600000));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) parsed[key] = 'true';
    else { parsed[key] = next; index += 1; }
  }
  return parsed;
}

function hasFlag(name) {
  return args[name] === 'true';
}

function stringArg(name, fallback = '') {
  return String(args[name] ?? process.env[`TBG_${name.toUpperCase()}`] ?? fallback);
}

function numberArg(name, fallback, min, max) {
  const value = Number(args[name] ?? process.env[`TBG_${name.toUpperCase()}`]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function findExecutable(envName, commandNames, recursiveNames) {
  const configured = process.env[envName];
  if (configured && existsSync(configured)) return configured;
  const pathDirs = String(process.env.PATH || '').split(delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    for (const command of commandNames) {
      const candidate = join(dir, command);
      if (existsSync(candidate)) return candidate;
    }
  }
  for (const pattern of recursiveNames) {
    const found = findFilesByPattern(pattern).find((item) => /\.(exe|cmd|bat)$/i.test(item));
    if (found) return found;
  }
  return '';
}

function findFile(envName, globPatterns, preferred = []) {
  const configured = process.env[envName];
  if (configured && existsSync(configured)) return configured;
  const matches = unique(globPatterns.flatMap((pattern) => findFilesByPattern(pattern)));
  matches.sort((a, b) => preferenceScore(b, preferred) - preferenceScore(a, preferred));
  return matches[0] || '';
}

function findFilesByPattern(pattern) {
  const rx = globToRegExp(pattern);
  const matches = [];
  for (const root of searchRoots) walk(root, (filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    if (/\/(node_modules|dist-web|dist-steam|dist-research|\.git|release|Gamebuild|playwright-report|test-results)\//i.test(normalized)) return;
    if (rx.test(normalized.split('/').pop() || '')) matches.push(filePath);
  });
  return unique(matches);
}

function walk(root, visit) {
  let entries = [];
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const filePath = join(root, entry.name);
    if (entry.isDirectory()) {
      if (/^(node_modules|dist-web|dist-steam|dist-research|\.git|release|Gamebuild|playwright-report|test-results)$/i.test(entry.name)) continue;
      walk(filePath, visit);
    } else if (entry.isFile()) visit(filePath);
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
  let score = 0;
  for (const rx of preferred) if (rx.test(filePath)) score += 10;
  if (/external-engines/i.test(filePath)) score += 8;
  return score;
}

function quoteArg(value) {
  const text = String(value || '');
  return /\s/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
