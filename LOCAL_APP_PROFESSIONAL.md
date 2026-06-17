# Professional Local App / Website / Research Layout

Topoboardgame should remain one codebase:

- Website: GitHub Pages / Firebase online modes.
- Local launcher: starts the app on `127.0.0.1` for local play and local robots.
- Research runner: headless self-play, JSONL export, statistics.
- Future desktop package: Electron or Tauri wrapper around the same web build.

## Local app launcher

Windows:

```bat
Start-Topoboardgame-Windows.bat
```

macOS:

```bash
./Start-Topoboardgame-macOS.command
```

Linux:

```bash
./Start-Topoboardgame-Linux.sh
```

The launcher uses `tools/local-app-launcher.mjs`, checks that dependencies are installed, and starts the local server.

## True desktop app later

For a business/professional desktop package, use one of these:

- Electron + electron-builder: easiest with the current Vite/JavaScript codebase.
- Tauri: smaller app, but requires a Rust toolchain and more setup.

The current zip includes an Electron scaffold in `local-app/electron/`, but dependencies are not forced on normal website users.
