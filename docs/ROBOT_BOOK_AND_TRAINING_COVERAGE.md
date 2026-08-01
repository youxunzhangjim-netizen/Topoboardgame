# Robot Book And Training Coverage

This note tracks the current local robot knowledge for Steam-safe builds. External engines and public research sources are references and optional offline teachers; they are not bundled into the Steam app.

## Current Coverage

| Game | UI Robot | Headless Self-Play | Opening Book | Strategy Book | Endgame Notes |
| --- | --- | --- | --- | --- | --- |
| Chess | yes | 2D, 3D | yes | yes | yes |
| Go | yes | 2D, 3D | yes | yes | yes |
| Reversi | yes | 2D, 3D | yes | yes | yes |
| Jump / Chinese Checkers | yes | 2D, 3D, 4D | yes | yes | yes, strategy-rule based |
| Hex / 六貫棋 | yes | 2D, 3D, 4D | yes, local priors | yes | yes, connection-rule based |

## Training And Model Paths

The robot pipeline has clearly separated storage layers:

| Path | Purpose | Release behavior |
| --- | --- | --- |
| `local-data/selfplay/` | Raw JSONL self-play and teacher-play games. | Local training data only; not shipped. |
| `local-data/benchmarks/public-engines/` | Calibration matches against Stockfish, KataGo, and Edax. | Local benchmark data only; not shipped. |
| `local-models/` | Newly trained JSON models staged after self-play or teacher-play. | Local staging only. |
| `public/models/` | Promoted runtime robot models loaded by website and Steam builds. | Shipped if referenced by runtime robots. |
| `models/` | Older structured/research model store and hand-authored model experiments. | Keep separate until explicitly wired into runtime loading. |
| `external-engines/` | Optional local public-engine executables and networks. | Never bundled; teacher/benchmark only. |

Promotion is explicit:

```powershell
npm run models:promote
```

The promotion script copies JSON models from `local-models/` into `public/models/`. Promote only after legality checks and held-out matches pass.

Teacher training is incremental by default. `ai:teacher:standard2d` looks for an existing matching model in this order:

1. promoted runtime model in `public/models/`
2. staged model in `local-models/`
3. older research-linear model in `models/robots/research-linear/`

It passes that model as `--baseModel` to the linear trainer, so new Stockfish/KataGo/Edax teacher games fine-tune the current robot instead of starting from zero weights. Use `--noWarmStart` only for an intentional clean-room comparison run.

## Added Strategy Sources

- Chess uses Stockfish/Lichess-style opening and engine principles as normal-board references, with separate graph-topology rules for seam control, volume lanes, and non-flat board mobility.
- Go uses AlphaZero/KataGo-style policy-value and ownership concepts as references, plus graph-Go notes for liberties, separators, and topology-specific territory.
- Reversi uses Edax/WTHOR-style opening, parity, mobility, and exact late-game ideas, with graph-topology rules for valid rays and seam/cycle parity.
- Jump uses Chinese Checkers MCTS, reinforcement-learning, and endgame-database research as references for ladder paths, home-zone races, and replay-safe endgames.
- Hex uses MoHex/Benzene/NeuroHex research ideas as references for virtual connections, bridges, must-play cuts, edge templates, and connection endgames.

## Promotion Rule

Self-play smoke checks prove only that adapters and legal moves work. A trained model should be promoted to a public robot only after a held-out tournament against the current built-in robot and rule-engine legality verification. Interrupted or capped training runs should not be promoted.

## Strength Calibration

The four UI levels are internal Topological Board Game strength presets. They are not Elo ratings until they are measured against fixed external baselines. Public website bots are a noisy benchmark because account settings, rate limits, network delay, and bot-specific throttles can change; use offline engines first.

Standard-board calibration should be:

| Game | Offline teacher / baseline | Hook | Primary purpose |
| --- | --- | --- | --- |
| Chess | Stockfish through UCI | `STOCKFISH_PATH`, `benchmark:public-engines` | compare move choice, centipawn loss, depth/time ladder |
| Go | KataGo through GTP | `KATAGO_PATH`, `KATAGO_MODEL`, `benchmark:public-engines` | compare winrate/score lead, joseki/fuseki, life-and-death policy |
| Reversi | Edax through GTP | `EDAX_PATH`, `benchmark:public-engines` | compare opening, mobility/parity/stability, exact late endgame |

For each level L1-L4, run fixed-seed games per standard board size and record:

- illegal move rate: must be 0
- win/draw/loss against the public teacher
- agreement with teacher top move
- average teacher loss after the robot move
- average thinking time
- endgame conversion rate

Quick local smoke command:

```powershell
# Uses autodiscovery first: ../stockfish-windows-x86-64-avx2 and ../external-engines.
npm run benchmark:public-engines -- --games 2 --levels 1,2,3,4 --stockfishDepth 4 --katagoVisits 16 --edaxDepth 4 --maxPlies 80
```

Run one family at a time for longer batches:

```powershell
npm run benchmark:public-engines -- --families chess --games 100 --levels 1,2,3,4 --sides white,black --stockfishDepth 8 --maxPlies 160
npm run benchmark:public-engines -- --families go --games 100 --levels 1,2,3,4 --sides white,black --katagoVisits 64 --maxPlies 240
npm run benchmark:public-engines -- --families reversi --games 100 --levels 1,2,3,4 --sides white,black --edaxDepth 6 --maxPlies 120
```

Rating-quality local command:

```powershell
$env:STOCKFISH_PATH = "C:\path\to\stockfish.exe"
$env:KATAGO_PATH = "C:\path\to\katago.exe"
$env:KATAGO_MODEL = "C:\path\to\network.bin.gz"
$env:EDAX_PATH = "C:\path\to\edax.exe"
npm run benchmark:public-engines -- --games 100 --levels 1,2,3,4 --stockfishDepth 8 --katagoVisits 64 --edaxDepth 6
```

`benchmark:public-engines` runs real 2D standard-board matches through JSONL wrappers when the public engines are configured:

- Chess: Stockfish UCI via `STOCKFISH_PATH`.
- Go: KataGo GTP via `KATAGO_PATH` and `KATAGO_MODEL`.
- Reversi: Edax GTP via `EDAX_PATH`.

The benchmark auto-searches the repository workspace for extracted executables and prefers `external-engines/` when present. If a match reaches the ply cap, treat the result as adjudicated/inconclusive rather than an Elo-quality win.

Current public-engine role:

- Stockfish, KataGo, and Edax are offline teachers and calibration opponents.
- They do not replace Topological Board Game robots in the app.
- They should not be shipped in Steam/web packages unless their licenses and package plans are handled separately.
- Standard 2D teacher labels can improve opening books, evaluation features, and search tuning.
- 3D, 4D, topology, lattice, and +1D variants still need graph-aware self-play because public engines do not understand those rules directly.

Suggested calibration ladder:

1. Run `npm run verify:robot-legality` and `npm run verify:robot-levels`.
2. Run 20 quick games per level against public engines to catch protocol and move-conversion errors.
3. Run 100 fixed-seed games per level for Chess, Go, and Reversi standard boards.
4. Compare teacher top-move agreement and average loss, not only win/loss.
5. Promote only models that improve held-out results without illegal moves.
6. Re-run Steam/web builds after promotion so `public/models/` is included.

Only after standard boards pass should the same learned ideas be generalized to topology variants. External engines can teach normal-board priorities, but custom topological boards still need local graph-aware rules because Stockfish, KataGo, and Edax do not directly understand Möbius, Klein, sphere, torus, 3D, 4D, or +1D rules.

## Engine Ideas To Borrow Safely

Chess standard board:

- iterative deepening with a strict per-move time budget
- alpha-beta / principal variation search
- transposition table keyed by position hash
- move ordering from book move, captures, checks, killer/history moves
- quiescence search for forcing capture/check lines
- late-move reductions and aspiration windows after legality is stable
- opening book and endgame tablebase hooks for normal chess only

Go standard board:

- MCTS/UCT with a small playout or policy-prior budget
- local pattern and joseki/fuseki priors
- life-and-death tactical reading near groups with few liberties
- ownership/territory estimate as a feature, not a rule change
- ladder/net/eye-shape heuristics before expensive search

Reversi standard board:

- bitboard-style move generation for 8x8 where available
- mobility, frontier, corner, X/C-square, parity, and stability features
- alpha-beta/PVS with transposition table
- exact search in the late endgame when empty count is small
- opening book built from trusted Othello/Reversi records

For public Lichess-style play, use a dedicated bot account and the official API only after offline engine matches are stable. Do not use public bot play as the first strength test, and do not automate a normal human account.
