#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, appendFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = arg('logDir', `local-data/training/week-robot-training/${stamp}`);
const logPath = join(repoRoot, logDir, 'runner.log');
const dryRun = flag('dryRun');
const remote = arg('remote', 'origin');
const branch = arg('branch', 'main');
const durationHours = num('durationHours', 24 * 7, 1, 24 * 30);
const standardTeacherGames = num('standardTeacherGames', 1000, 1, 100000);
const variantGames = num('variantGames', 100, 1, 100000);
const chessTeacherDepth = num('stockfishDepth', 8, 1, 40);
const chessTeacherEpochs = num('chessTeacherEpochs', 20, 1, 500);
const goTeacherEpochs = num('goTeacherEpochs', 10, 1, 500);
const variantEpochs = num('variantEpochs', 8, 1, 500);
const teacherGoSizes = arg('teacherGoSizes', '9,13,19')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value >= 5 && value <= 19);
const goPolicyOnly = !flag('goFullSearch');
const goTeacherVisits = num('katagoVisits', goPolicyOnly ? 2 : 16, 1, 100000);

mkdirSync(join(repoRoot, logDir), { recursive: true });
log(`Topoboardgame week robot training started at ${new Date().toISOString()}`);
log(`repo=${repoRoot}`);
log(`dryRun=${dryRun} durationHours=${durationHours} standardTeacherGames=${standardTeacherGames} variantGames=${variantGames}`);

const startedAt = Date.now();
const deadline = startedAt + durationHours * 60 * 60 * 1000;
const jobs = [
  ...standardTeacherJobs(),
  ...variantJobsFromLocalModels()
];

log(`plannedJobs=${jobs.length}`);
for (const job of jobs) {
  if (Date.now() >= deadline) {
    log(`deadline reached before ${job.id}; stopping cleanly`);
    break;
  }
  try {
    runJob(job);
  } catch (error) {
    log(`ERROR job=${job.id}: ${error?.stack || error}`);
  }
}
log(`Topoboardgame week robot training finished at ${new Date().toISOString()}`);

function standardTeacherJobs() {
  const jobs = [{
    id: 'teacher-2dchess-standard-stockfish-s8',
    publicModel: 'public/models/2dchess-standard-stockfish-teacher-linear.json',
    localModel: 'local-models/2dchess-standard-stockfish-teacher-linear.json',
    command: [
      process.execPath, 'scripts/ai/train/trainStandard2DWithPublicTeachers.mjs',
      '--families', 'chess',
      '--games', String(standardTeacherGames),
      '--stockfishDepth', String(chessTeacherDepth),
      '--maxPliesChess', arg('maxPliesChess', '160'),
      '--epochs', String(chessTeacherEpochs),
      '--progressEvery', String(Math.max(1, Math.floor(standardTeacherGames / 20)))
    ],
    verify: [process.execPath, 'verification/verify-robot-move-legality.mjs']
  }];
  for (const size of teacherGoSizes) {
    jobs.push({
      id: `teacher-2dgo-standard-katago-s${size}`,
      publicModel: `public/models/2dgo-open2d-square-s${size}-katago-teacher-linear.json`,
      localModel: `local-models/2dgo-open2d-square-s${size}-katago-teacher-linear.json`,
      command: [
        process.execPath, 'scripts/ai/train/trainStandard2DWithPublicTeachers.mjs',
        '--families', 'go',
        '--games', String(standardTeacherGames),
        '--goSizes', String(size),
        '--katagoVisits', String(goTeacherVisits),
        ...(goPolicyOnly ? ['--katagoPolicyOnly'] : []),
        '--maxPliesGo', String(size >= 19 ? num('maxPliesGo19', 80, 1, 1000) : num('maxPliesGo', 100, 1, 1000)),
        '--epochs', String(goTeacherEpochs),
        '--progressEvery', String(Math.max(1, Math.floor(standardTeacherGames / 20))),
        '--katagoTimeoutMs', arg('katagoTimeoutMs', '60000')
      ],
      verify: [process.execPath, 'verification/verify-go-robot-strategy.mjs']
    });
  }
  return jobs;
}

function variantJobsFromLocalModels() {
  const localModels = safeReadDir(join(repoRoot, 'local-models'))
    .filter((name) => /-100-linear\.json$/i.test(name))
    .filter((name) => /^(2d|3d|4d)(chess|go|reversi|jump|hex)-/i.test(name))
    .sort();
  return localModels
    .map((fileName) => parseVariantModel(fileName))
    .filter(Boolean)
    .map((spec) => {
      const data = `local-data/selfplay/week-robot-training/${stamp}/${spec.stem}.jsonl`;
      return {
        id: `variant-${spec.stem}`,
        publicModel: `public/models/${spec.fileName}`,
        localModel: `local-models/${spec.fileName}`,
        command: [
          process.execPath, 'research/selfplay.mjs',
          '--game', spec.game,
          '--boundary', spec.boundary,
          '--lattice', spec.lattice,
          '--size', String(spec.size),
          '--games', String(variantGames),
          '--depthA', String(defaultDepth(spec.game)),
          '--depthB', String(defaultDepth(spec.game)),
          '--record', 'moves',
          '--state', 'true',
          '--out', data,
          '--seed', `week:${spec.stem}:${stamp}`,
          '--progressEvery', String(Math.max(1, Math.floor(variantGames / 10))),
          ...(spec.playerCount ? ['--playerCount', String(spec.playerCount)] : []),
          ...(spec.game.includes('go') ? ['--fastLegalMoves', 'true'] : [])
        ],
        after: [
          process.execPath, 'research/ml/train-linear.mjs',
          '--in', data,
          '--out', `local-models/${spec.fileName}`,
          '--epochs', String(variantEpochs),
          '--lr', String(defaultLearningRate(spec.game)),
          '--l2', '0.0005',
          '--game', spec.game,
          ...(existsSync(join(repoRoot, 'local-models', spec.fileName)) ? ['--baseModel', `local-models/${spec.fileName}`] : []),
          '--seed', `week-train:${spec.stem}:${stamp}`
        ],
        verify: [process.execPath, 'verification/verify-robot-move-legality.mjs']
      };
    });
}

function runJob(job) {
  log(`START ${job.id}`);
  runCommand(job.command, `${job.id}:train`);
  if (job.after) runCommand(job.after, `${job.id}:fit`);
  promoteOne(job.localModel, job.publicModel);
  if (job.verify) runCommand(job.verify, `${job.id}:verify`);
  commitAndPush(job);
  log(`DONE ${job.id}`);
}

function promoteOne(localModel, publicModel) {
  const src = join(repoRoot, localModel);
  const dest = join(repoRoot, publicModel);
  if (!existsSync(src)) throw new Error(`trained local model missing: ${localModel}`);
  mkdirSync(dirname(dest), { recursive: true });
  if (!dryRun) copyFileSync(src, dest);
  log(`promoted ${localModel} -> ${publicModel}`);
}

function commitAndPush(job) {
  const status = git(['status', '--short', '--', job.publicModel]).stdout.trim();
  if (!status) {
    log(`no public model diff for ${job.publicModel}; skip commit`);
    return;
  }
  runCommand(['git', 'add', job.publicModel], `${job.id}:git-add`);
  const message = `Train robot model ${basename(job.publicModel, '.json')}`;
  const commit = spawnSync('git', ['commit', '-m', message], { cwd: repoRoot, encoding: 'utf8' });
  logOutput(`${job.id}:git-commit`, commit);
  if (commit.status !== 0 && !/nothing to commit/i.test(`${commit.stdout}\n${commit.stderr}`)) {
    throw new Error(`git commit failed for ${job.publicModel}`);
  }
  runCommand(['git', 'pull', '--rebase', remote, branch], `${job.id}:git-pull-rebase`);
  runCommand(['git', 'push', remote, branch], `${job.id}:git-push`);
}

function parseVariantModel(fileName) {
  const stem = fileName.replace(/-100-linear\.json$/i, '');
  const parts = stem.split('-');
  const game = parts.shift();
  const sizeIndex = parts.findIndex((part) => /^s\d+$/i.test(part));
  if (!game || sizeIndex < 2) return null;
  const size = Number(parts[sizeIndex].slice(1));
  const playerToken = parts.find((part) => /^p\d+$/i.test(part));
  const playerCount = playerToken ? Number(playerToken.slice(1)) : 0;
  const lattice = parts[sizeIndex - 1];
  const boundary = parts.slice(0, sizeIndex - 1).join('-') || defaultBoundary(game);
  return { fileName, stem, game, boundary, lattice, size, playerCount };
}

function runCommand(command, label) {
  log(`RUN ${label}: ${command.join(' ')}`);
  if (dryRun) return;
  const result = spawnSync(command[0], command.slice(1), { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 });
  logOutput(label, result);
  if (result.error) log(`[${label}:error] ${result.error.stack || result.error}`);
  if (result.status !== 0) throw new Error(`${label} failed with exit ${result.status}`);
}

function git(argv) {
  const result = spawnSync('git', argv, { cwd: repoRoot, encoding: 'utf8' });
  logOutput(`git ${argv.join(' ')}`, result);
  return result;
}

function logOutput(label, result) {
  if (result.stdout) log(`[${label}:stdout]\n${result.stdout}`);
  if (result.stderr) log(`[${label}:stderr]\n${result.stderr}`);
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  appendFileSync(logPath, line);
}

function safeReadDir(dir) {
  try { return readdirSync(dir); } catch { return []; }
}

function defaultDepth(game) {
  if (game.includes('reversi')) return 2;
  if (game.includes('chess')) return 2;
  return 1;
}

function defaultLearningRate(game) {
  if (game.includes('go')) return 0.05;
  if (game.includes('reversi')) return 0.04;
  return 0.04;
}

function defaultBoundary(game) {
  if (game.includes('chess')) return 'standard';
  if (game.includes('go') || game.includes('reversi')) return 'open2d';
  if (game.includes('jump')) return game.startsWith('4d') ? 'hypercube' : game.startsWith('3d') ? 'cube' : 'plane';
  return 'open';
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

function arg(name, fallback = '') {
  return String(args[name] ?? process.env[`TBG_${name.toUpperCase()}`] ?? fallback);
}

function flag(name) {
  return ['1', 'true', 'yes'].includes(String(args[name] ?? process.env[`TBG_${name.toUpperCase()}`] ?? '').toLowerCase());
}

function num(name, fallback, min, max) {
  const value = Number(args[name] ?? process.env[`TBG_${name.toUpperCase()}`]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}
