# Topoboardgame local app + research self-play plan

## 1. Current local app mode

This repository is still a Vite web app, but it can be opened locally without deploying to GitHub Pages.

Double-click launchers added in the repository root:

- `Start-Topoboardgame-Windows.bat`
- `Start-Topoboardgame-macOS.command`
- `Start-Topoboardgame-Linux.sh`

These start the local Vite server at `http://127.0.0.1:5172` and open the game in the default browser.

First run requires Node.js and internet access to install npm packages. After dependencies are installed, local human-vs-human and local robots can run offline. Online multiplayer still needs internet/Firebase/PeerJS.

## 2. Current modes

Use the same codebase for both website and local app. Do not fork the game rules into a separate local codebase.

Recommended separation:

- `core/rules`: legal moves, topology, lattice, win/loss rules.
- `bots`: local robot search/evaluation.
- `ui`: browser rendering and controls.
- `online`: Firebase/PeerJS multiplayer.
- `research`: self-play batch runner and data export.

The current code is already close to this; future work should move more logic from UI files into reusable rule/adapter modules.

## 3. External robot and self-play research data

Target data format: JSONL, one position per line.

```json
{
  "game": "2dchess",
  "mode": "random-left-right",
  "boundary": "random",
  "lattice": "square",
  "turn": 18,
  "player": "white",
  "state": {},
  "legalMoves": [],
  "chosenMove": {},
  "engine": "local-alpha-beta-v2",
  "engineScore": 53,
  "searchPolicy": {},
  "winner": "black",
  "resultForPlayer": -1
}
```

For thousands of games, prefer a headless Node.js runner, not the browser UI. The runner should import the same rule engine/adapters used by the UI so the website, local app, and research dataset always use exactly the same rules.

## 4. Future packaging options

### Lightweight local app now
Use the double-click launchers. This is easiest and keeps GitHub Pages unchanged.

### True desktop app later
Use Electron or Tauri.

- Electron is easiest for a JavaScript/Vite project and can package Windows/macOS/Linux apps.
- Tauri is smaller/faster but requires Rust and a little more setup.

Do not make a separate game codebase. Package the same web build into Electron/Tauri.

## 5. Online behavior in local app

The local app can still show:

- Local
- Local Robot
- Online

When online mode is selected and internet is available, it can use Firebase/PeerJS exactly like the hosted website. When offline, online mode should show a clear error and local/local robot should still work.
