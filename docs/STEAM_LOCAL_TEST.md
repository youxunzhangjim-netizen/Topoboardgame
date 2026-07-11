# Steam Local Test

Use this checklist before uploading a new Steam build.

## Windows Debug Run

In PowerShell:

```powershell
$env:TBG_STEAM_DEBUG="1"
npm run desktop:dir
.\release\win-unpacked\Topoboardgame.exe
```

Or in CMD:

```cmd
set TBG_STEAM_DEBUG=1
npm run desktop:dir
release\win-unpacked\Topoboardgame.exe
```

When `TBG_STEAM_DEBUG=1`, the Electron window opens at `1280x900`, DevTools opens, and desktop load events are written to:

```text
%APPDATA%\Topoboardgame\logs\steam-debug.log
```

If a white screen appears, open DevTools Console and copy the first red error. Also include the latest lines from `steam-debug.log`.

## Smoke Test

1. Launch the unpacked exe.
2. Open at least one 2D game, one 3D game, one 4D game, Life World, and Labs.
3. Confirm each page renders controls and board content.
4. Return Home from each page.
5. Start a local game move where possible.

The packaged app serves local files through a private `127.0.0.1` server so multi-page module builds work the same way in Steam as they do in a browser preview.
