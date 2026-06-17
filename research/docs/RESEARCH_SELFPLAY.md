# Research Self-Play and Statistics Workflow

This folder is for large automatic robot-vs-robot experiments. It is designed for research/statistics data, not for clicking through the UI.

## Supported headless games

- `2dchess`
- `2dgo`
- `2dreversi`
- `3dgo`
- `3dreversi`

`3dchess` currently has browser/local robot support, but the 3D chess classes still construct DOM/WebGL renderers. For high-volume headless research, the next engineering task is extracting a pure `3dchess-core` rule engine from the renderer classes.

## Run built-in robots

```bash
npm run research:selfplay -- --game 2dchess --boundary random --games 1000 --depthA 2 --depthB 2 --out local-data/selfplay/2dchess-rbc-lr.jsonl
npm run research:selfplay -- --game 2dgo --boundary klein --lattice honeycomb --size 9 --games 500 --out local-data/selfplay/2dgo-klein-honeycomb.jsonl
npm run research:selfplay -- --game 3dgo --boundary sphere --lattice sc --size 5 --games 100 --out local-data/selfplay/3dgo-sphere.jsonl
npm run research:selfplay -- --game 3dreversi --boundary r3 --size 6 --games 500 --out local-data/selfplay/3dreversi-r3.jsonl
```

## Aggregate statistics

```bash
npm run research:aggregate -- --in local-data/selfplay/2dchess-rbc-lr.jsonl --out local-data/summaries/2dchess-rbc-lr-summary.json
```

This produces both JSON and CSV summaries.

## Data format

The runner writes JSON Lines (`.jsonl`). Each line is one JSON record, which is suitable for streaming and large datasets. Use `--record moves` for training data and `--record games` for smaller statistical runs.

Recommended large-run flags:

```bash
--record moves --state false
```

Recommended model-training flags:

```bash
--record moves --state true
```

## External robots

Use the JSONL stdin/stdout protocol in `EXTERNAL_ROBOT_PROTOCOL.md`. External robots can be written in Python, Rust, C++, Julia, or JavaScript.

## Data policy

Do not commit large generated datasets to the public website repo. Keep them in `local-data/`, which is gitignored. Commit only summaries, plots, or small representative samples.

## Parallel/batch runs

For larger datasets, shard the run across multiple local Node processes:

```bash
npm run research:batch -- --game 2dreversi --boundary pbc --games 10000 --workers 4 --depth 3 --state false --outDir local-data/selfplay/reversi-pbc-10k
```

Each worker writes `shard-000.jsonl`, `shard-001.jsonl`, etc. Aggregate each shard or concatenate them first:

```bash
cat local-data/selfplay/reversi-pbc-10k/shard-*.jsonl > local-data/selfplay/reversi-pbc-10k/all.jsonl
npm run research:aggregate -- --in local-data/selfplay/reversi-pbc-10k/all.jsonl --out local-data/summaries/reversi-pbc-10k.json
```
