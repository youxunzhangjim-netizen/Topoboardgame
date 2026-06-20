# Topoboardgame ML training pipeline

This project now supports a small, practical ML path for local robots. The first trainable model is a **linear logistic policy/value robot**. It does not need a GPU and is designed to be understandable: each weight corresponds to a board/game/topology/lattice/move feature.

## Why start with linear models?

For new rules and unusual topologies, a huge neural network is premature. First collect reliable self-play data, train a transparent feature model, use it as an external robot, then later train neural policy/value models from the same JSONL data.

Recommended progression:

1. Built-in rule/search robot generates self-play data.
2. Train a linear model from the data.
3. Run the linear model as a robot against the built-in robot.
4. Aggregate results and promote only models that win consistently.
5. Later export datasets for PyTorch/ONNX/TensorFlow.js policy-value training.

## Data flow

```text
rules + built-in robots
  -> research:selfplay JSONL
  -> ml:train-linear
  -> local-models/*.json
  -> botA linear / external linear-jsonl-robot
  -> tournaments and statistics
```

## Open master engines vs Topoboardgame robots

Normal 2D games may use open trained master engines directly:

```text
normal 2D Chess   -> Stockfish directly
normal 2D Go      -> KataGo directly
normal 2D Reversi -> Edax directly
```

Fairy-Stockfish is different: wire it only when a chess-like variant has an exact Fairy-Stockfish variant definition/name on an ordinary 2D board. Topological chess boards, time-schedule chess, and custom Topoboardgame movement/boundary rules are not automatically Fairy-Stockfish variants.

Direct means the game is the ordinary flat 2D board with no topology, lattice, time schedule, age, delay, or +1D option. Anything else is a Topoboardgame variant. For variants, do not pretend the open engine understands the rules. Use the open engine only as a teacher/baseline when the position can be converted safely, then train a separate local model for that variant.

For 2+1D games, connect the ordinary spatial projection to the suitable open teacher first, then keep the scheduled-time rules local: Stockfish for 2+1D Chess, KataGo for 2+1D Go, and Edax for 2+1D Reversi. Edax should be treated as a normal 8x8 Othello/Reversi teacher, not as a general all-board-size engine.

```text
Stockfish/KataGo/Edax teacher data
  + Topoboardgame legal moves and topology rules
  + self-play on the real variant
  -> local variant robot
```

Examples:

```text
Stockfish -> BaseChessRobot -> TorusChessRobot / CubeChessRobot / TimeScheduleChessRobot
KataGo    -> BaseGoRobot    -> MobiusGoRobot / RP2GoRobot / HoneycombGoRobot
Edax      -> BaseReversiRobot -> KleinReversiRobot / 4DReversiRobot
```

The base model is never overwritten. Save variant models separately so learning torus, Mobius, lattice, 3D, 4D, or +1D rules does not damage the normal-game robot.

## 1. Generate self-play data

Example for 2D Chess RBC left/right boundary:

```bash
npm run research:selfplay -- \
  --game 2dchess \
  --boundary random \
  --games 1000 \
  --depthA 2 \
  --depthB 2 \
  --record moves \
  --state true \
  --out local-data/selfplay/2dchess-rbc-lr-d2-1000.jsonl
```

For larger runs, use batch mode:

```bash
npm run research:batch -- \
  --game 2dreversi \
  --boundary pbc \
  --games 20000 \
  --workers 6 \
  --depth 3 \
  --state true \
  --outDir local-data/selfplay/2dreversi-pbc-d3-20k
```

Use `--legalMoves true` only when you need full move-list datasets; it makes files much larger.

## 2. Train a linear robot

```bash
npm run ml:train-linear -- \
  --in local-data/selfplay/2dchess-rbc-lr-d2-1000.jsonl \
  --out local-models/2dchess-rbc-linear.json \
  --epochs 12 \
  --lr 0.05 \
  --l2 0.0005
```

The model JSON stores feature weights. Positive weights mean the feature correlated with eventual wins for the player making the move. Negative weights mean it correlated with losses.

## 3. Evaluate the model on held-out data

Generate a separate validation run:

```bash
npm run research:selfplay -- \
  --game 2dchess \
  --boundary random \
  --games 300 \
  --depthA 2 \
  --depthB 2 \
  --record moves \
  --state true \
  --out local-data/selfplay/2dchess-rbc-lr-valid.jsonl
```

Then evaluate:

```bash
npm run ml:evaluate-linear -- \
  --model local-models/2dchess-rbc-linear.json \
  --in local-data/selfplay/2dchess-rbc-lr-valid.jsonl
```

## 4. Let the trained model play

Use it directly inside the research runner:

```bash
npm run research:selfplay -- \
  --game 2dchess \
  --boundary random \
  --botA linear \
  --modelA local-models/2dchess-rbc-linear.json \
  --botB builtin \
  --depthB 2 \
  --games 200 \
  --out local-data/selfplay/linear-vs-builtin-2dchess-rbc.jsonl
```

Or use the persistent external JSONL robot:

```bash
npm run research:selfplay -- \
  --game 2dchess \
  --boundary random \
  --botA externalA \
  --externalA "node research/external-bots/linear-jsonl-robot.mjs --model local-models/2dchess-rbc-linear.json" \
  --botB builtin \
  --games 200
```

## 5. Aggregate statistics

```bash
npm run research:aggregate -- \
  --in local-data/selfplay/linear-vs-builtin-2dchess-rbc.jsonl \
  --out local-data/summaries/linear-vs-builtin-2dchess-rbc-summary.json
```

Promote a trained model only if it wins clearly over a sufficiently large tournament, for example at least 55% over 400+ games.

## 6. Train per game/mode/topology/lattice

Recommended models:

```text
local-models/2dchess-standard-linear.json
local-models/2dchess-periodic-linear.json
local-models/2dchess-reflection-linear.json
local-models/2dchess-rbc-left-right-linear.json
local-models/2dgo-klein-honeycomb-linear.json
local-models/2dgo-pbc-triangular-linear.json
local-models/2dreversi-pbc-square-linear.json
local-models/3dgo-sphere-fcc-linear.json
local-models/3dreversi-t3-hcp-linear.json
```

Do not mix all game modes into one model at first. Each topology/lattice changes what “good” means.

## 7. Export feature datasets for Python / PyTorch later

```bash
npm run ml:export-dataset -- \
  --in local-data/selfplay/2dchess-rbc-lr-d2-1000.jsonl \
  --out local-data/datasets/2dchess-rbc-features.jsonl
```

Later, a Python policy-value trainer can read these examples and train a neural network. For browser/local-app inference, export to ONNX or TensorFlow.js.

## Current limitations

- This first ML robot is a feature-linear model, not a deep neural network.
- It learns correlations from self-play data, so bad self-play data produces bad models.
- It does not replace the legal-move rule engine. All robots must still choose from legal moves.
- 3D Chess is not yet supported by headless research self-play until the 3D Chess rule core is separated from DOM/WebGL rendering.

## Windows PowerShell commands

Do not copy Linux/macOS multiline commands with `\` into PowerShell. In PowerShell, either use one single line or use the backtick character `` ` `` at the end of each continued line.

Recommended PowerShell smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Train-QuickSmoke.ps1 -Game 2dchess -Boundary periodic -Games 100 -Depth 2
```

Train one model:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 2dchess -Boundary periodic -Lattice square -Games 10000 -DepthA 2 -DepthB 2
```

Train all supported headless robots, quick preset:

```powershell
npm run ml:train-all -- --preset quick
```

Train all supported headless robots, normal preset:

```powershell
npm run ml:train-all -- --preset normal
```

Current headless ML coverage:

- 2dchess
- 2dgo
- 2dreversi
- 3dgo
- 3dreversi

3dchess is playable with the UI local robot, but it is not yet in headless ML training because its current constructors still create DOM/WebGL renderers. Refactor it into a pure rule core before adding it to `research:selfplay`.
