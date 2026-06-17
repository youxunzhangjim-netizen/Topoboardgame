#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "Starting Topoboardgame local app..."
node tools/local-app-launcher.mjs
