# Life & Evolution Worlds Engine Architecture

The Life engine is deliberately separated from rendering.

```text
life/js/topologies.js     Boundary and topology mapping
life/js/rules.js          Cell update rules
life/js/presets.js        Named rule presets
life/js/observables.js    Population/statistics extraction
life/js/LifeEngine.js     Engine state, stepping, seeding, import/export
life/js/LifeUI.js         Browser canvas/UI adapter
```

## Topology abstraction

Rules do not know whether the board is a plane, torus, Möbius strip, Klein bottle, sphere-like grid, projective plane, reflective boundary, cube, or periodic cube.

Instead, the engine calls:

```js
topology.getNeighbors(position, dimension, neighborhoodType)
topology.step(position, direction)
```

## Supported neighborhoods

```text
1D nearest neighbor
2D Moore
2D von Neumann
3D Moore
3D von Neumann
4D abstract Moore / von Neumann
```

## Supported cell fields

```js
{
  state: 0 | 1,
  species: 0 | 1 | 2 | 3 | ...,
  age: number,
  energy: number,
  health: number,
  infected: boolean,
  recovered: boolean
}
```

## Presets

```text
Classic Conway Life: B3/S23
HighLife: B36/S23
Seeds: B2/S
Day & Night: B3678/S34678
3D Life soft: B5/S4-6
3D Life dense: B6/S5-7
Noisy Life
Age-Structured Life
Multi-Species Life
Predator–Prey Automaton
Epidemic/SIR Automaton
Forest-Fire Automaton
```

## Research usage example

```js
import { createLifeEngine } from './life/js/LifeEngine.js';
import { getRulePreset } from './life/js/presets.js';

const engine = createLifeEngine({
  dimension: 2,
  size: [128, 128],
  boundary: 'klein',
  neighborhoodType: 'moore',
  rule: getRulePreset('multiSpecies')
});

engine.randomSeed({ density: 0.2, speciesCount: 3 });

for (let t = 0; t < 1000; t += 1) {
  engine.step();
}

console.log(engine.getObservables());
```

## Playable UI and research panel

`life/world.html` now supports three usage modes:

```text
Zero-player simulation
One-player challenge
Two-player competition
```

One-player goals include survival, population-band control, oscillator detection, glider-like motion, noise survival, invasive-growth control, and ecosystem stability.

Two-player modes include Seed War, Territory Life, Extinction Battle, Mutation Duel, and Ecosystem Balance.

The research panel displays population, density, birth/death rate, species fractions, age distribution, cluster statistics, entropy, spatial correlation, extinction/survival time, oscillation detection, and front-velocity estimate. It also includes simple live plots for population and species fractions.

The scoring formula is:

```text
score = living cells + territory bonus + stability bonus + diversity bonus
        - overcrowding penalty - extinction penalty
```

## Geometry and lattice alignment with board games

Life & Evolution Worlds now uses the same short geometry vocabulary as the 2D/3D Go and Reversi pages:

```text
R2, T2, Mobius, Klein, S2, RP2, R3, T3, 3D RBC, Reflective
```

Age, noise, mutation, species count, and topology defects are modifiers that can be applied to every Life board rather than separate top-level worlds. The Life UI therefore asks for board geometry and lattice first, then lets players or researchers add modifiers.

Supported lattice families:

```text
2D: square, triangular, honeycomb
3D: sc, bcc, fcc, hcp
```

The engine keeps the rule evolution intrinsic to the board graph. The canvas renderer can display the same graph as a cut-open 2D board, projected 3D surface, or layered 3D volume.
