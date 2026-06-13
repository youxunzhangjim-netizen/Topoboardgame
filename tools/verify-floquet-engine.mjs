import assert from 'node:assert/strict';
import { createGraphTopology } from '../js/topology/GraphTopologies.js';
import {
    FloquetEngine,
    createGameTime,
    createTemporalEntityState,
    createVertexFieldState,
    normalizeTimeConfig
} from '../js/time/FloquetEngine.js';

const torus = createGraphTopology({ topology: 'torus', width: 4, height: 4 });

{
    const config = normalizeTimeConfig({ floquetMode: 'basic', updateMode: 'after_move', period: 4 });
    assert.equal(config.floquetMode, 'basic');
    assert.equal(config.updateMode, 'after_move');
    assert.equal(config.period, 4);
    assert.deepEqual(createGameTime({ tick: 5, period: 4 }).phase, 1);
    assert.deepEqual(createVertexFieldState({ stress: 2 }).stress, 2);
    assert.deepEqual(createTemporalEntityState({ age: 3, cooldown: 2 }).cooldown, 2);
}

{
    const engine = new FloquetEngine({
        topology: torus,
        config: {
            floquetMode: 'basic',
            updateMode: 'after_move',
            period: 4,
            decayRate: 0.5,
            diffusionRate: 0.4,
            rechargeRate: 0.25
        }
    });
    const board = new Map([['0,0', { pauliLabel: 'X', age: 0, energy: 0, cooldown: 2 }]]);
    engine.setVertexState([0, 0], { stress: 1 });
    const first = engine.applyTimeEvolution({ trigger: 'after_move', player: 'black', board });
    assert.equal(first.applied, true);
    assert.equal(engine.gameTime.tick, 1);
    assert.equal(engine.gameTime.phase, 1);
    assert.equal(board.get('0,0').age, 1);
    assert.equal(board.get('0,0').cooldown, 1);
    assert.equal(board.get('0,0').energy, 0.25);
    assert.equal(engine.getVertexState([0, 0]).stress, 0.5);

    const second = engine.applyTimeEvolution({ trigger: 'after_move', player: 'white', board, completedRound: true });
    assert.equal(second.effects.some((effect) => effect.kind === 'field_diffusion'), true);
    assert.ok(engine.getVertexState([3, 0]).stress > 0, 'torus diffusion should use wrapped neighbors');
    assert.equal(engine.gameTime.round, 1);
}

{
    const board = new Map([
        ['0,0', { coord: [0, 0], pauliLabel: 'X' }],
        ['1,0', { coord: [1, 0], pauliLabel: 'X' }]
    ]);
    const hEngine = new FloquetEngine({
        topology: torus,
        config: { floquetMode: 'clifford', updateMode: 'after_move', period: 4, hDefectVertices: [[0, 0]] },
        state: { gameTime: { tick: 1, phase: 1, period: 4 } }
    });
    hEngine.applyTimeEvolution({ trigger: 'after_move', board });
    assert.equal(board.get('0,0').pauliLabel, 'Z', 'phase 1 H defect maps X to Z');

    const sEngine = new FloquetEngine({
        topology: torus,
        config: { floquetMode: 'clifford', updateMode: 'after_move', period: 4, sDefectVertices: [[1, 0]] },
        state: { gameTime: { tick: 2, phase: 2, period: 4 } }
    });
    sEngine.applyTimeEvolution({ trigger: 'after_move', board });
    assert.equal(board.get('1,0').pauliLabel, 'Y', 'phase 2 S defect maps X to Y');
}

{
    const engine = new FloquetEngine({
        topology: torus,
        config: {
            floquetMode: 'virasoro',
            updateMode: 'after_move',
            period: 4,
            markedVertices: [[2, 2]],
            l0Scale: 2,
            virasoro_CFT_N2: true,
            anomalyStress: 0.5
        },
        state: { gameTime: { tick: 2, phase: 2, period: 4 } }
    });
    engine.setVertexState([2, 2], { stress: 1 });
    const result = engine.applyTimeEvolution({ trigger: 'after_move' });
    assert.equal(result.effects.some((effect) => effect.kind === 'virasoro_L0_scaling'), true);
    assert.equal(engine.getVertexState([2, 2]).stress, 2.5);
}

{
    const tokens = new Map([['a1', { id: 'a1', coord: [0, 0], anyonType: 'e' }]]);
    const engine = new FloquetEngine({
        topology: torus,
        config: {
            floquetMode: 'anyon',
            updateMode: 'after_move',
            period: 5,
            seamAutomorphismVertices: [[0, 0]]
        },
        state: { gameTime: { tick: 4, phase: 4, period: 5 } }
    });
    const event = engine.applyTimeEvolution({
        trigger: 'after_move',
        tokens,
        game: { config: { anyonModel: 'toric_code' } }
    });
    assert.equal(tokens.get('a1').anyonType, 'm');
    assert.equal(event.effects.some((effect) => effect.kind === 'anyon_seam_automorphism' && effect.count === 1), true);
}

{
    const engine = new FloquetEngine({
        topology: torus,
        config: { floquetMode: 'basic', updateMode: 'after_full_round', period: 4 }
    });
    assert.equal(engine.shouldUpdate('after_move', { player: 'black' }), false);
    assert.equal(engine.shouldUpdate('after_move', { player: 'white' }), true);
}

console.log('Discrete-time/Floquet engine verification passed.');
