import { createSharedGameAPI } from './RobotPlayer.js';

function normalizeRobot(robot) {
    if (!robot || typeof robot !== 'object') throw new Error('A robot instance is required.');
    return robot;
}

function resultWinner(result) {
    if (!result) return '';
    if (typeof result === 'string') return result;
    if (result.draw) return 'draw';
    return result.winner || result.result || '';
}

function moveId(move) {
    if (!move) return '';
    if (typeof move === 'string') return move;
    return move.id || move.moveId || move.label || JSON.stringify(move);
}

export class RobotEvaluator {
    constructor({ registry = null } = {}) {
        this.registry = registry;
    }

    async evaluatePosition(robot, gameState, options = {}) {
        const player = normalizeRobot(robot);
        const api = createSharedGameAPI(gameState, options);
        const analysis = await player.analyze(gameState, { ...options, gameApi: api });
        return {
            modelId: player.modelId,
            gameType: player.gameType,
            variant: player.variant,
            topology: api.getTopologyInfo(),
            rulesVersion: api.getRulesVersion(),
            analysis
        };
    }

    async compareToTeacher(robot, teacher, gameState, options = {}) {
        const [robotAnalysis, teacherAnalysis] = await Promise.all([
            normalizeRobot(robot).analyze(gameState, options),
            teacher.analyze(gameState, options)
        ]);
        const robotMove = moveId(robotAnalysis.bestMove || robotAnalysis.move);
        const teacherMove = moveId(teacherAnalysis.bestMove || teacherAnalysis.move);
        return {
            robotMove,
            teacherMove,
            agreesWithTeacher: Boolean(robotMove && teacherMove && robotMove === teacherMove),
            robotAnalysis,
            teacherAnalysis
        };
    }

    async playMatch({
        gameFactory,
        robotA,
        robotB,
        games = 2,
        maxTurns = 500,
        recorder = null,
        gameMetadata = {}
    } = {}) {
        if (typeof gameFactory !== 'function') throw new Error('playMatch requires a gameFactory.');
        const summary = { games, winsA: 0, winsB: 0, draws: 0, records: [] };
        for (let index = 0; index < games; index += 1) {
            const game = gameFactory({ index });
            const api = createSharedGameAPI(game, gameMetadata);
            const initialState = api.encodeState();
            const moves = [];
            const legalMovesPerTurn = [];
            const evaluationsPerTurn = [];
            let turn = 0;
            while (!api.isTerminal() && turn < maxTurns) {
                const current = api.source?.currentPlayer || (turn % 2 === 0 ? 'black' : 'white');
                const robot = turn % 2 === 0 ? robotA : robotB;
                const legal = api.getLegalMoves(current);
                legalMovesPerTurn.push(legal);
                const evaluation = await robot.evaluate(game, { player: current, gameApi: api });
                evaluationsPerTurn.push({ player: current, ...evaluation });
                const move = await robot.chooseMove(game, { player: current, gameApi: api, legalMoves: legal });
                if (!move) break;
                moves.push({ ...move, player: current, stateEncoding: api.encodeState() });
                const applied = api.applyMove(move);
                if (applied?.ok === false) break;
                turn += 1;
            }
            const result = api.getResult();
            const winner = resultWinner(result);
            if (winner === 'draw' || !winner) summary.draws += 1;
            else if (winner === 'black' || winner === 'white') {
                const winnerIsA = (winner === 'black' && index % 2 === 0) || (winner === 'white' && index % 2 === 1);
                if (winnerIsA) summary.winsA += 1;
                else summary.winsB += 1;
            }
            const record = recorder?.recordSelfPlayGame?.({
                ...gameMetadata,
                gameId: `eval-${Date.now()}-${index}`,
                source: 'evaluation-match',
                robotA: robotA.modelId,
                robotB: robotB.modelId,
                initialState,
                moves,
                legalMovesPerTurn,
                evaluationsPerTurn,
                result,
                winner,
                reason: turn >= maxTurns ? 'max-turns' : 'terminal',
                turnCount: turn
            });
            if (record) summary.records.push(record);
        }
        return summary;
    }
}

export const defaultRobotEvaluator = new RobotEvaluator();
