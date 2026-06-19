import { createSharedGameAPI } from './RobotPlayer.js';
import {
    createSelfPlayRecord,
    encodeGraphFromGame,
    selfPlayRecordToExamples,
    TrainingDataRecorder
} from './TrainingDataRecorder.js';
import { defaultRobotRegistry } from './RobotRegistry.js';

export const SELF_PLAY_MODES = Object.freeze([
    'robot-vs-robot',
    'robot-vs-previous-version',
    'random-openings',
    'random-topologies',
    'random-board-sizes',
    'random-rule-presets'
]);

function pick(rng, values) {
    if (!values.length) return undefined;
    const random = typeof rng === 'function' ? rng() : Math.random();
    return values[Math.floor(random * values.length) % values.length];
}

function moveWithState(move, stateEncoding, player) {
    if (move && typeof move === 'object') return { ...move, player, stateEncoding };
    return { id: String(move), label: String(move), player, stateEncoding };
}

function summarizeRobot(robot) {
    return {
        modelId: robot?.modelId || '',
        gameType: robot?.gameType || '',
        variant: robot?.variant || '',
        topology: robot?.topology || '',
        level: robot?.level || 1
    };
}

export class SelfPlayTrainer {
    constructor({ registry = defaultRobotRegistry, recorder = new TrainingDataRecorder(), rng = Math.random } = {}) {
        this.registry = registry;
        this.recorder = recorder;
        this.rng = rng;
    }

    createRobotPair({ gameType, variant = 'base', topology = 'normal', levelA = 1, levelB = 1, previousModelId = '' } = {}) {
        const robotA = this.registry.createRobot({ gameType, variant, topology, level: levelA });
        const robotB = previousModelId
            ? this.registry.createRobot({ gameType, variant, topology, level: levelB, modelId: previousModelId })
            : this.registry.createRobot({ gameType, variant, topology, level: levelB });
        return { robotA, robotB };
    }

    randomVariantSpec({
        gameType,
        variants = ['base'],
        topologies = ['normal'],
        boardSizes = [null],
        rulePresets = ['default'],
        dimensions = [2]
    } = {}) {
        return {
            gameType,
            variant: pick(this.rng, variants) || 'base',
            topology: pick(this.rng, topologies) || 'normal',
            boardSize: pick(this.rng, boardSizes) ?? null,
            rulePreset: pick(this.rng, rulePresets) || 'default',
            dimension: pick(this.rng, dimensions) || 2
        };
    }

    async playOneGame({
        gameFactory,
        gameType,
        variant = 'base',
        topology = 'normal',
        dimension = 2,
        boardSize = null,
        rulesVersion = 'local-current',
        robotA,
        robotB,
        maxTurns = 500,
        openingMoves = []
    } = {}) {
        if (typeof gameFactory !== 'function') throw new Error('SelfPlayTrainer.playOneGame requires a gameFactory.');
        const game = gameFactory({ gameType, variant, topology, dimension, boardSize, openingMoves });
        const api = createSharedGameAPI(game, { gameType, variant, topology, dimension, boardSize, rulesVersion });
        for (const opening of openingMoves) api.applyMove(opening);
        const initialState = api.encodeState();
        const graphEncoding = encodeGraphFromGame(api);
        const moves = [];
        const legalMovesPerTurn = [];
        const evaluationsPerTurn = [];
        let turn = 0;
        while (!api.isTerminal() && turn < maxTurns) {
            const player = api.source?.currentPlayer || (turn % 2 === 0 ? 'black' : 'white');
            const robot = turn % 2 === 0 ? robotA : robotB;
            const stateEncoding = api.encodeState();
            const legalMoves = api.getLegalMoves(player);
            if (!legalMoves.length) break;
            legalMovesPerTurn.push(legalMoves);
            const evaluation = await robot.evaluate(api.source, { player, gameApi: api, legalMoves });
            evaluationsPerTurn.push({ player, ...evaluation, stateEncoding });
            const chosen = await robot.chooseMove(api.source, { player, gameApi: api, legalMoves });
            if (!chosen) break;
            moves.push(moveWithState(chosen, stateEncoding, player));
            const applied = api.applyMove(chosen);
            if (applied?.ok === false) {
                return this.recorder.recordSelfPlayGame(createSelfPlayRecord({
                    gameType,
                    variant,
                    topology,
                    dimension,
                    boardSize,
                    rulesVersion,
                    robotA: summarizeRobot(robotA),
                    robotB: summarizeRobot(robotB),
                    initialState,
                    graphEncoding,
                    moves,
                    legalMovesPerTurn,
                    evaluationsPerTurn,
                    result: api.getResult(),
                    winner: '',
                    reason: `illegal move: ${applied.error || 'unknown'}`,
                    turnCount: turn
                }));
            }
            turn += 1;
        }
        const result = api.getResult();
        const winner = result?.winner || result?.result || '';
        return this.recorder.recordSelfPlayGame(createSelfPlayRecord({
            gameType,
            variant,
            topology,
            dimension,
            boardSize,
            rulesVersion: api.getRulesVersion?.() || rulesVersion,
            robotA: summarizeRobot(robotA),
            robotB: summarizeRobot(robotB),
            initialState,
            graphEncoding,
            moves,
            legalMovesPerTurn,
            evaluationsPerTurn,
            result,
            winner,
            reason: turn >= maxTurns ? 'max-turns' : 'terminal',
            turnCount: turn
        }));
    }

    async generateSelfPlayGames({
        games = 1,
        gameFactory,
        gameType,
        variants = ['base'],
        topologies = ['normal'],
        boardSizes = [null],
        rulePresets = ['default'],
        dimensions = [2],
        levelA = 1,
        levelB = 1,
        maxTurns = 500,
        previousModelId = ''
    } = {}) {
        const records = [];
        for (let index = 0; index < games; index += 1) {
            const spec = this.randomVariantSpec({ gameType, variants, topologies, boardSizes, rulePresets, dimensions });
            const { robotA, robotB } = this.createRobotPair({ ...spec, levelA, levelB, previousModelId });
            records.push(await this.playOneGame({
                gameFactory,
                ...spec,
                robotA,
                robotB,
                maxTurns
            }));
        }
        return records;
    }

    recordsToExamples(records, options = {}) {
        return records.flatMap((record) => selfPlayRecordToExamples(record, options));
    }
}

export const defaultSelfPlayTrainer = new SelfPlayTrainer();
