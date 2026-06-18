#!/usr/bin/env bash
set -e

npm run verify:local-robots
npm run verify:research
npm run verify:ml
npm run build
npm run desktop:dir

echo "Preupload check finished."
echo "Do not commit local-data/selfplay/*.jsonl, node_modules, dist, or raw logs."
