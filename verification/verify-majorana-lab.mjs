import assert from 'node:assert/strict';
import { MajoranaLab } from '../js/labs/majorana/MajoranaLab.js';
import {
    MAJORANA_FLAVORS,
    normalizeFlavor
} from '../js/labs/majorana/MajoranaRules.js';

function lab() {
    return new MajoranaLab({
        topology: { topology: 'flat', width: 4, height: 4 },
        majorana: { setupDefaultPair: false }
    });
}

function pairWithParity(parity = 'even', flavor = 2) {
    const instance = lab();
    const result = instance.create_pair(flavor, [1, 1], [2, 1], parity);
    assert.equal(result.ok, true, result.error);
    assert.equal(result.modes.length, 2);
    return { instance, modes: result.modes };
}

{
    const { instance, modes } = pairWithParity('even', 3);
    assert.equal(modes.filter((mode) => mode.active).length, 2);
    assert.equal([...instance.modes.values()].filter((mode) => mode.active).length, 2);
}

{
    const { instance, modes } = pairWithParity('even');
    const measured = instance.measure_parity(modes[0].id, modes[1].id);
    assert.equal(measured.ok, true, measured.error);
    assert.equal(measured.measurement.parity, 'even');
    assert.equal(measured.measurement.channel, '1');
}

{
    const { instance, modes } = pairWithParity('even');
    const merged = instance.merge(modes[0].id, modes[1].id);
    assert.equal(merged.ok, true, merged.error);
    assert.equal(merged.result.channel, '1');
}

{
    const { instance, modes } = pairWithParity('odd');
    const merged = instance.merge(modes[0].id, modes[1].id);
    assert.equal(merged.ok, true, merged.error);
    assert.equal(merged.result.channel, 'ψ');
}

{
    const instance = lab();
    const split = instance.split([1, 1], 5, 'even');
    assert.equal(split.ok, true, split.error);
    assert.equal(split.modes.length, 2);
    assert.equal(split.modes[0].flavor, 5);
    assert.equal(split.modes[1].flavor, 5);
}

{
    const { instance, modes } = pairWithParity('even');
    const [modeA, modeB] = modes;
    const beforeA = modeA.gammaLabel;
    const beforeB = modeB.gammaLabel;
    const braid = instance.braid_clockwise(modeA.id, modeB.id);
    assert.equal(braid.ok, true, braid.error);
    assert.deepEqual(braid.modes[0].position, [2, 1]);
    assert.deepEqual(braid.modes[1].position, [1, 1]);
    assert.equal(braid.modes[0].gammaLabel, beforeB);
    assert.equal(braid.modes[1].gammaLabel, `-${beforeA}`);
    assert.match(braid.event.generator.unitarySymbol, /exp\(π\/4/);
}

{
    const { instance, modes } = pairWithParity('even');
    const [modeA, modeB] = modes;
    const beforeA = modeA.gammaLabel;
    const beforeB = modeB.gammaLabel;
    const braid = instance.braid_counterclockwise(modeA.id, modeB.id);
    assert.equal(braid.ok, true, braid.error);
    assert.equal(braid.modes[0].gammaLabel, `-${beforeB}`);
    assert.equal(braid.modes[1].gammaLabel, beforeA);
}

{
    assert.equal(MAJORANA_FLAVORS.length, 8);
    assert.equal(normalizeFlavor(99) >= 0 && normalizeFlavor(99) <= 7, true);
    const { modes } = pairWithParity('even', 99);
    assert.equal(modes.every((mode) => mode.flavor >= 0 && mode.flavor <= 7), true);
}

console.log('Majorana Lab verification passed.');
