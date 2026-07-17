import assert from 'node:assert/strict';
import { AnyonJumpGame } from '../js/localgames/AnyonJump.js';

function exchangeLab() {
    const game = new AnyonJumpGame({
        topology: { topology: 'flat', width: 5, height: 4 },
        config: { setupMode: 'excitation', braidEffect: 'add_braid_token', braidMemoryMode: 'word_exact' }
    });
    game.currentPlayer = 'black';
    const a = game.addToken({ id: 'a', owner: 'black', coord: [1, 1], anyonType: 'e' });
    const b = game.addToken({ id: 'b', owner: 'black', coord: [2, 1], anyonType: 'm' });
    const c = game.addToken({ id: 'c', owner: 'black', coord: [4, 1], anyonType: 'psi' });
    assert.ok(a && b && c);
    return game;
}

function onceCommit(commit) {
    let committed = false;
    return () => {
        if (committed) return { ok: false, skipped: true };
        committed = true;
        return commit();
    };
}

{
    const game = exchangeLab();
    const rejected = game.exchange_pair_clockwise('a', 'c');
    assert.equal(rejected.ok, false);
    assert.match(rejected.error, /adjacent/i);
}

{
    const game = exchangeLab();
    let chainCalled = false;
    game.chainJump = () => {
        chainCalled = true;
        throw new Error('Jump chain logic must not run for braiding exchange.');
    };
    const result = game.exchange_pair_clockwise('a', 'b');
    assert.equal(result.ok, true, result.error);
    assert.equal(chainCalled, false);
    assert.deepEqual(game.tokens.get('a').coord, [2, 1]);
    assert.deepEqual(game.tokens.get('b').coord, [1, 1]);
    assert.equal(result.event.braidGenerator.generator, 'sigma');
    assert.equal(result.event.braidGenerator.sign, 1);
    assert.equal(result.event.braidWord.at(-1).generator, 'sigma');
}

{
    const game = exchangeLab();
    const result = game.exchange_pair_counterclockwise('a', 'b');
    assert.equal(result.ok, true, result.error);
    assert.deepEqual(game.tokens.get('a').coord, [2, 1]);
    assert.deepEqual(game.tokens.get('b').coord, [1, 1]);
    assert.equal(result.event.braidGenerator.sign, -1);
    assert.equal(result.event.braidWord.at(-1).sign, -1);
}

{
    const game = exchangeLab();
    let commits = 0;
    const callback = onceCommit(() => {
        commits += 1;
        return game.exchange_pair_clockwise('a', 'b');
    });
    const first = callback();
    const second = callback();
    assert.equal(first.ok, true, first.error);
    assert.equal(second.ok, false);
    assert.equal(second.skipped, true);
    assert.equal(commits, 1);
}

console.log('Braiding exchange verification passed.');
