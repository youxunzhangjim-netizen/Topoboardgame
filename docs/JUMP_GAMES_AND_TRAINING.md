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
