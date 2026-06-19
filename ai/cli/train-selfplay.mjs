#!/usr/bin/env node
import { parseArgs, numberArg, stringArg, boolArg } from '../../research/lib/cli.mjs';
import { ResearchRng, withSeededMathRandom } from '../../research/lib/rng.mjs';
import { createResearchAdapter, SUPPORTED_RESEARCH_GAMES } from '../../research/adapters.mjs';
import { createSelfPlayRecord, selfPlayRecordToExamples, TrainingDataRecorder } from '../TrainingDataRecorder.js';

const args = parseArgs();
if (args.help || args.h) {
    printHelp();
    process.exit(0);
}

const game = stringArg(args, 'game', '2dchess').toLowerCase();
if (!SUPPORTED_RESEARCH_GAMES.includes(game)) {
    console.error(`Unsupported --game ${game}. Supported: ${SUPPORTED_RESEARCH_GAMES.join(', ')}`);
    process.exit(2);
}

const games = numberArg(args, 'games', 10, { min: 1, max: 1_000_000 });
const maxTurns = numberArg(args, 'maxTurns', numberArg(args, 'maxPlies', defaultMaxTurns(game), { min: 1, max: 50_000 }), { min: 1, max: 50_000 });
const depthA = numberArg(args, 'depthA', numberArg(args, 'depth', 2, { min: 1, max: 5 }), { min: 1, max: 5 });
const depthB = numberArg(args, 'depthB', depthA, { min: 1, max: 5 });
const seed = stringArg(args, 'seed', `train-selfplay-${Date.now()}`);
const out = stringArg(args, 'out', defaultRecordOutput(game));
const examplesOut = stringArg(args, 'examplesOut', '');
const randomVariants = boolArg(args, 'randomVariants', false);
const includeLegalMoves = boolArg(args, 'legalMoves', true);
const recorder = new TrainingDataRecorder();
const rng = new ResearchRng(seed);
const records = [];
const examples = [];

for (let index = 0; index < games; index += 1) {
    const spec = selfPlaySpec(game, { randomVariants, args, rng, index });
    const record = await runSelfPlayGame({ game, spec, index });
    records.push(recorder.recordSelfPlayGame(record));
    examples.push(...selfPlayRecordToExamples(record));
}

await recorder.writeJsonl(out, records);
if (examplesOut) await recorder.writeJsonl(examplesOut, examples);

console.log(JSON.stringify({
    ok: true,
    command: 'train:selfplay',
    game,
    games,
    records: records.length,
    examples: examples.length,
    out,
    examplesOut: examplesOut || null
}, null, 2));

async function runSelfPlayGame({ game, spec, index }) {
    const adapter = createResearchAdapter(game, spec.options);
    const gameType = gameTypeFromKey(game);
    const initialState = adapter.serializeState();
    const moves = [];
    const legalMovesPerTurn = [];
    const evaluationsPerTurn = [];
    let reason = 'terminal';
    let turn = 0;

    while (!adapter.isTerminal() && turn < maxTurns) {
        const player = adapter.currentPlayer();
        const legalMoves = adapter.legalMoves();
        if (!legalMoves.length) {
            reason = 'no-legal-moves';
            break;
        }
        const stateEncoding = adapter.serializeState();
        const depth = turn % 2 === 0 ? depthA : depthB;
        const evaluation = Number(adapter.evaluate(player)) || 0;
        const chosen = await withSeededMathRandom(`${seed}:${index}:${turn}:${player}`, async () =>
            adapter.chooseBuiltin(depth));
        let move = chosen?.move || chosen?.best?.move || chosen || null;
        if (!move) move = rng.pick(legalMoves);
        let apply = adapter.applyMove(move);
        if (!apply?.ok) {
            move = legalMoves[0];
            apply = adapter.applyMove(move);
            if (!apply?.ok) {
                reason = `illegal-fallback:${apply?.error || 'unknown'}`;
                break;
            }
        }
        legalMovesPerTurn.push(includeLegalMoves ? legalMoves.map(serializeMove) : legalMoves.map((entry) => ({ id: moveId(entry) })));
        evaluationsPerTurn.push({
            player,
            score: evaluation,
            searched: Number(chosen?.nodes || chosen?.searched || chosen?.simulations || 0),
            stateEncoding
        });
        moves.push({
            ...serializeMove(move),
            player,
            score: Number(chosen?.score ?? evaluation) || 0,
            stateEncoding
        });
        turn += 1;
    }

    if (turn >= maxTurns) reason = 'max-turns';
    const winner = adapter.winner() || '';
    return createSelfPlayRecord({
        gameId: `${game}-${seed}-${index}`,
        gameType,
        variant: spec.variant,
        topology: spec.topology,
        dimension: spec.dimension,
        boardSize: spec.boardSize,
        rulesVersion: spec.rulesVersion,
        robotA: { modelId: `Base${capitalize(gameType)}Robot`, depth: depthA },
        robotB: { modelId: `Base${capitalize(gameType)}Robot`, depth: depthB },
        initialState,
        moves,
        legalMovesPerTurn,
        evaluationsPerTurn,
        result: {
            finalState: adapter.serializeState(),
            options: adapter.options,
            winner
        },
        winner,
        reason,
        turnCount: turn,
        topologyFeatures: {
            topology: spec.topology,
            lattice: spec.lattice,
            variant: spec.variant,
            dimension: spec.dimension,
            boardSize: spec.boardSize,
            rulePreset: spec.rulePreset
        }
    });
}

function selfPlaySpec(game, { randomVariants, args, rng, index }) {
    const fixedTopology = stringArg(args, 'topology', stringArg(args, 'boundary', defaultTopology(game)));
    const topology = randomVariants ? rng.pick(topologyPool(game)) : fixedTopology;
    const boardSize = randomVariants
        ? rng.pick(sizePool(game))
        : numberArg(args, 'size', defaultSize(game), { min: 3, max: 30 });
    const lattice = randomVariants
        ? rng.pick(latticePool(game, topology))
        : stringArg(args, 'lattice', defaultLattice(game));
    const rulePreset = randomVariants
        ? rng.pick(['default', 'balanced', 'research'])
        : stringArg(args, 'rulePreset', 'default');
    return {
        topology,
        lattice,
        variant: variantFromTopology(game, topology),
        dimension: Number(game[0]) || (game.includes('3d') ? 3 : 2),
        boardSize,
        rulePreset,
        rulesVersion: `research-adapter:${game}`,
        options: {
            topology,
            boundary: topology,
            lattice,
            size: boardSize,
            seed: `${seed}:${index}:${rng.nextUInt32()}`,
            rulePreset
        }
    };
}

function serializeMove(move) {
    if (!move) return null;
    if (typeof move === 'string') return { id: move, label: move };
    if (move.id || move.label) return { ...move, flips: Array.isArray(move.flips) ? move.flips.length : move.flips };
    if (move.coord) return { id: move.coord.join(','), coord: move.coord, label: `(${move.coord.join(',')})`, type: move.type || 'play' };
    if (move.from && move.to) return { id: move.id || `${JSON.stringify(move.from)}>${JSON.stringify(move.to)}`, from: move.from, to: move.to, label: move.label || '' };
    return { id: JSON.stringify(move), raw: move };
}

function moveId(move) {
    return serializeMove(move)?.id || '';
}

function gameTypeFromKey(game) {
    if (game.includes('chess')) return 'chess';
    if (game.includes('go')) return 'go';
    if (game.includes('reversi')) return 'reversi';
    if (game.includes('jump')) return 'jump';
    return game;
}

function variantFromTopology(game, topology) {
    if (game === '4djump') return '4d';
    if (game.startsWith('3d')) return topology === 'torus' ? '3d-torus' : '3d';
    if (/cube/i.test(topology)) return 'cube';
    if (/klein/i.test(topology)) return 'klein';
    if (/mobius/i.test(topology)) return 'mobius';
    if (/cylinder|pbcx|pbc-x/i.test(topology)) return 'cylinder';
    if (/polar|radial/i.test(topology)) return 'polar';
    if (/rp2|projective/i.test(topology)) return 'rp2';
    if (/sphere/i.test(topology)) return 'sphere';
    if (/torus|periodic/i.test(topology)) return 'torus';
    return 'base';
}

function topologyPool(game) {
    if (game === '2dchess') return ['forbidden', 'periodic', 'reflection', 'random'];
    if (game === '3dchess') return ['r3', 'torus', 'cube', 'sphere', 'rp2', 'mobius', 'klein'];
    if (game.includes('go') || game.includes('reversi')) return ['open2d', 'cylinder', 'torus', 'mobius', 'klein', 'sphere', 'projective', 'r3'];
    if (game === '4djump') return ['hypercube'];
    if (game === '3djump') return ['cube', 'cylinder', 'torus'];
    if (game === '2djump') return ['plane', 'polar', 'cylinder', 'torus', 'mobius', 'klein', 'rp2', 'sphere'];
    return ['plane', 'cylinder', 'torus', 'mobius', 'klein'];
}

function sizePool(game) {
    if (game.includes('go')) return [5, 7, 9, 11];
    if (game === '4djump') return [4, 5];
    if (game.startsWith('3d')) return [4, 5, 6, 8];
    return [6, 8, 10, 12];
}

function latticePool(game, topology = '') {
    if (game === '3dgo') return ['sc', 'bcc', 'fcc'];
    if (game.includes('go') || game.includes('reversi')) return ['square', 'honeycomb', 'triangular'];
    if (game === '2djump') return String(topology).toLowerCase() === 'polar' ? ['square'] : ['square', 'triangular'];
    return ['square'];
}

function defaultTopology(game) {
    if (game === '2dchess') return 'forbidden';
    if (game.startsWith('3d')) return 'r3';
    if (game === '4djump') return 'hypercube';
    if (game.includes('jump')) return 'plane';
    return 'open2d';
}

function defaultLattice(game) {
    if (game === '3dgo') return 'sc';
    if (game === '3dchess') return 'chess3d';
    return 'square';
}

function defaultSize(game) {
    if (game.includes('go')) return game.startsWith('3d') ? 5 : 9;
    if (game.includes('reversi')) return game.startsWith('3d') ? 6 : 8;
    if (game === '4djump') return 4;
    if (game === '3djump') return 6;
    return 8;
}

function defaultMaxTurns(game) {
    if (game.includes('go')) return 220;
    if (game.includes('reversi')) return 500;
    return 240;
}

function defaultRecordOutput(game) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `local-data/training/selfplay/${game}-${stamp}.jsonl`;
}

function capitalize(value) {
    return String(value || '').slice(0, 1).toUpperCase() + String(value || '').slice(1);
}

function printHelp() {
    console.log(`Topoboardgame local robot self-play training

Usage:
  npm run train:selfplay -- --game 2dchess --games 100 --randomVariants true
  npm run train:selfplay -- --game 4djump --games 20 --out local-data/training/jump4d.jsonl

Outputs training records shaped as topoboardgame.selfplay.trainingRecord.v1.
The browser/Steam app loads finished model files; this command runs locally in Node.js.`);
}
