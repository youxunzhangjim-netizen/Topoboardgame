# All-mode local robot training and evaluation

These commands train the local linear robot models and then run evaluation tournaments. Evaluation is included by default by `npm run ml:train-all`; do not pass `--skipEval true` unless you only want a fast train-only debug run.

## Fast smoke run

```bash
npm install
npm run ml:train-all -- --preset quick
```

## Useful local run for 2D/3D games

```bash
npm run ml:train-all -- --preset normal
```

## Larger research run

```bash
npm run ml:train-all -- --preset large
```

## Limit to one game family

```bash
npm run ml:train-all -- --preset normal --only 2dgo
npm run ml:train-all -- --preset normal --only 2dreversi
npm run ml:train-all -- --preset normal --only 2dchess
npm run ml:train-all -- --preset normal --only 3dgo
npm run ml:train-all -- --preset normal --only 3dreversi
npm run ml:train-all -- --preset normal --only 3dchess
```

## PowerShell wrapper

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Train-AllLinearRobots.ps1 -Preset normal
```

Add `-MaxJobs 3` for a short partial run, or `-SkipEval` only when you deliberately want to skip evaluation.

## Output folders

- Training data: `local-data/selfplay/`
- Evaluation games: `local-data/selfplay/eval-*-linear-vs-builtin-*.jsonl`
- Evaluation summaries: `local-data/summaries/`
- Trained models: `local-models/`

The 2D Go polar board is trained only with the square lattice, because honeycomb and triangular polar boards were removed from the player-facing mode set.
