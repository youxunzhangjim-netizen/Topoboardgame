#!/usr/bin/env node
import { parseArgs, numberArg, stringArg } from '../../research/lib/cli.mjs';
import { ResearchRng, withSeededMathRandom } from '../../research/lib/rng.mjs';
import { createResearchAdapter, SUPPORTED_RESEARCH_GAMES } from '../../research/adapters.mjs';

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

const games = numberArg(args, 'games', 4, { min: 1, max: 100000 });
const maxTurns = numberArg(args, 'maxTurns', 240, { min: 1, max: 50000 });
const depthA = numberArg(args, 'depthA', 2, { min: 1, max: 5 });
const depthB = numberArg(args, 'depthB', 1, { min: 1, max: 5 });
const topology = stringArg(args, 'topology', stringArg(args, 'boundary', defaultTopology(game)));
const size = numberArg(args, 'size', defaultSize(game), { min: 3, max: 30 });
const seed = stringArg(args, 'seed', `eval-robots-${Date.now()}`);
const rng = new ResearchRng(seed);
const summary = { game, games, depthA, depthB, topology, size, winsA: 0, winsB: 0, draws: 0, results: [] };

for (let index = 0; index < games; index += 1) {
    const result = await runGame(index);
    summary.results.push(result);
    if (result.winner === 'draw' || !result.winner) summary.draws += 1;
    else if (result.winnerSide === 'A') summary.winsA += 1;
    else if (result.winnerSide === 'B') summary.winsB += 1;
    else summary.draws += 1;
}

console.log(JSON.stringify({ ok: true, command: 'eval:robots', ...summary }, null, 2));

async function runGame(index) {
    const adapter = createResearchAdapter(game, {
        topology,
        boundary: topology,
        size,
        seed: `${seed}:${index}:${rng.nextUInt32()}`
    });
    let turn = 0;
    while (!adapter.isTerminal() && turn < maxTurns) {
        const legal = adapter.legalMoves();
        if (!legal.length) break;
        const sideA = turn % 2 === 0;
        const depth = sideA ? depthA : depthB;
        const chosen = await withSeededMathRandom(`${seed}:${index}:${turn}`, async () => adapter.chooseBuiltin(depth));
        let move = chosen?.move || chosen?.best?.move || chosen || legal[0];
        let applied = adapter.applyMove(move);
        if (!applied?.ok) applied = adapter.applyMove(legal[0]);
        if (!applied?.ok) break;
        turn += 1;
    }
    const winner = adapter.winner() || '';
    return {
        index,
        winner,
        winnerSide: winnerSideFor(winner, index),
        turns: turn,
        finalState: adapter.serializeState()
    };
}

function winnerSideFor(winner) {
    if (!winner || winner === 'draw') return '';
    if (winner === 'black') return 'A';
    if (winner === 'white') return 'B';
    return '';
}

function defaultTopology(game) {
    if (game === '2dchess') return 'forbidden';
    if (game.startsWith('3d')) return 'r3';
    if (game.includes('jump')) return game === '4djump' ? 'hypercube' : 'plane';
    return 'open2d';
}

function defaultSize(game) {
    if (game.includes('go')) return game.startsWith('3d') ? 5 : 9;
    if (game.includes('reversi')) return game.startsWith('3d') ? 6 : 8;
    if (game === '4djump') return 4;
    if (game === '3djump') return 6;
    return 8;
}

function printHelp() {
    console.log(`Topoboardgame robot evaluation

Usage:
  npm run eval:robots -- --game 2dchess --games 20 --depthA 2 --depthB 1

This evaluates local robot strengths through the existing headless adapters.`);
}
