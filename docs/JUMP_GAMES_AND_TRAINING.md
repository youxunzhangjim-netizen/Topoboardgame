# Jump game modes and robot training

Topoboardgame Jump modes are original jump-race games. They use step moves, chain jumps, home zones, and explicit target zones. They do not use Reversi flipping logic.

## New game pages

- `2D/jump/` supports 2D Jump, Torus Jump, Möbius Jump, Klein Jump, RP2 Jump, and Sphere Jump.
- `3D/jump/` supports 3D Jump, 3D Torus Jump, 3D Reflective Jump, and 3D Sphere / Shell Jump.
- `4D/jump/` supports 4D Jump, 4D Torus Jump, 4D Hypercube Jump, and 4D Projection Jump.
- Lab presets link to Anyon Jump Lab, Spin-Parity Jump Lab, and Momentum Jump Lab.

## Shared engine

The reusable engine is in:

- `js/shared/JumpRules.js`
- `js/shared/JumpMoveGenerator.js`
- `js/shared/JumpTargets.js`
- `js/shared/JumpRobot.js`
- `js/shared/JumpGameApp.js`

Move generation is dimension-independent. Directions are arrays like `[dx, dy]`, `[dx, dy, dz]`, or `[dx, dy, dz, dw]`. For twisted spaces, the second half of a jump uses the transformed direction returned by the first topology step.

## Open reference teachers

Zedrichu's two-player Chinese Checkers minimax design and the davidschulte / PettingZoo Chinese Checkers multi-agent design are wired as research references. They do not replace the browser's local Jump robot. They produce teacher/self-play data for Topoboardgame's standard diamond/star geometry, using triangular or square links.

Two-player triangular teacher versus the built-in local robot:

~~~powershell
npm run research:selfplay -- --game 2djump --boundary diamond --lattice triangular --playerCount 2 --botA externalA --externalA "node research/external-bots/random-jsonl-robot.mjs --strategy zedrichu --depth 2" --botB builtin --games 1000 --out local-data/selfplay/jump-2p-triangular-zedrichu.jsonl
~~~

Two-player square-link teacher:

~~~powershell
npm run research:selfplay -- --game 2djump --boundary diamond --lattice square --playerCount 2 --botA externalA --externalA "node research/external-bots/random-jsonl-robot.mjs --strategy zedrichu --depth 2" --botB builtin --games 1000 --out local-data/selfplay/jump-2p-square-zedrichu.jsonl
~~~

Three independent multi-agent policies on the triangular star board:

~~~powershell
npm run research:selfplay -- --game 2djump --boundary diamond --lattice triangular --playerCount 3 --botA externalA --externalA "node research/external-bots/random-jsonl-robot.mjs --strategy pettingzoo --depth 2" --botB externalB --externalB "node research/external-bots/random-jsonl-robot.mjs --strategy pettingzoo --depth 2" --botC externalC --externalC "node research/external-bots/random-jsonl-robot.mjs --strategy pettingzoo --depth 2" --games 1000 --out local-data/selfplay/jump-3p-triangular-pettingzoo.jsonl
~~~

Use the same three-player command with --lattice square for the square-link board. The runner validates every returned move against Topoboardgame's own rules before applying it.

## Training and evaluation commands

Quick smoke training and evaluation:

```bash
npm run ml:train-all -- --preset quick --only 2djump
npm run ml:train-all -- --preset quick --only 3djump
npm run ml:train-all -- --preset quick --only 4djump
```

Normal training and evaluation:

```bash
npm run ml:train-all -- --preset normal --only 2djump
npm run ml:train-all -- --preset normal --only 3djump
npm run ml:train-all -- --preset normal --only 4djump
```

Train/evaluate all current supported local robot games, including Jump:

```bash
npm run ml:train-all -- --preset normal
```

Evaluation runs by default. Do not add `--skipEval true` unless you want a train-only debug run.
