# Steam Cloud Save Setup

The Electron build stores desktop save data in:

```text
C:\Users\<Username>\Documents\TopologicalBoardGame\save.json
```

The directory is created from:

```js
path.join(app.getPath('documents'), 'TopologicalBoardGame')
```

## What Is Stored

`save.json` contains:

- a mirrored copy of the game's `localStorage` preferences and notebooks;
- explicit game-state slots saved through the desktop IPC bridge;
- save metadata and update timestamps.

Firebase login credentials are not copied into this file. Authentication uses session persistence, and Firestore persistent IndexedDB caching is not enabled by this project.

On the first desktop launch after this feature is installed, existing Electron `localStorage` is migrated into `save.json`. On later launches, the file is loaded before page scripts run, so a Steam Cloud copy can restore the same settings and local records on another computer.

## Steamworks Auto-Cloud

Configure the Windows Auto-Cloud entry with:

| Field | Value |
| --- | --- |
| Root | `user_documents` |
| Subdirectory | `TopologicalBoardGame` |
| Pattern | `save.json` |
| Recursive | No |
| Platform | Windows |

If the Steamworks UI displays platform-specific root names instead of `user_documents`, select the entry that maps to the current user's Documents folder.

Do not include Electron's Chromium `User Data` directory. It contains cache, session, and browser implementation files that are not portable saves.

## Frontend Save API

Use the shared manager from a game page:

```js
import {
  createGameSaveController,
  loadGameState,
  saveGameState
} from '../../js/shared/DesktopSaveManager.js';

await saveGameState(game.exportState(), {
  slotId: '2d-go-autosave',
  metadata: { family: 'go', dimension: 2 }
});

const savedState = await loadGameState('2d-go-autosave');
if (savedState) game.importState(savedState);

const saves = createGameSaveController({
  app: game,
  slotId: '2d-go-autosave',
  metadata: { family: 'go', dimension: 2 }
});
await saves.save();
await saves.load();
```

In Electron these calls use IPC and Node.js `fs` in the main process. In a normal browser they retain a `localStorage` fallback. Renderer code never receives filesystem access or a caller-controlled path.

## Verification

Run:

```powershell
npm run verify:desktop-save
npm run build
npm run verify:electron-save
```
