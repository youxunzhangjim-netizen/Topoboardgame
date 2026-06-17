#!/usr/bin/env bash
set -euo pipefail
npm run research:selfplay -- --game 2dchess --boundary periodic --games 100 --depthA 2 --depthB 2 --record moves --state true --out local-data/selfplay/2dchess-periodic-smoke.jsonl
npm run ml:train-linear -- --in local-data/selfplay/2dchess-periodic-smoke.jsonl --out local-models/2dchess-periodic-smoke-linear.json --epochs 8 --lr 0.05
npm run ml:evaluate-linear -- --model local-models/2dchess-periodic-smoke-linear.json --in local-data/selfplay/2dchess-periodic-smoke.jsonl
