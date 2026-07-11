# Manual Steam Smoke Test

Run this before every Steam upload if the automated smoke test cannot control the packaged app.

## Required Review Path

1. Disconnect the network or leave Firebase sign-in unused.
2. Launch `release/win-unpacked/Topoboardgame.exe`.
3. Confirm the main menu opens as `Offline Guest`.
4. Click `2D Go`.
5. Confirm the board and controls render.
6. Place one local stone.
7. Return to Home.
8. Click `2D Reversi`.
9. Confirm the board and controls render.
10. Make one local move.
11. Return to Home.
12. Open `2D Jump`, `3D Go`, `4D Go`, `Life World`, and `Labs`.
13. Confirm every visible page shows controls, board/canvas content, or a clear implemented interface.
14. Open an online panel without signing in.
15. Confirm it shows online unavailable or asks the user to choose online intentionally, without blocking local play.

## Fail Conditions

- Blank white screen.
- File not found page.
- Renderer crash.
- Main menu requires Google sign-in.
- Local game button waits on Firebase/Auth before opening.
- Visible Steam-stable option opens a missing/broken route.

## Steam Review Response

Thank you for the review. We fixed the Steam build issue that caused a white screen when starting gameplay. The Steam build now loads bundled local game pages correctly, uses relative asset paths for the Electron/Steam package, and local gameplay does not require website access or login.

Suggested review path:

1. Launch the app.
2. Click `Quick Start: 2D Go`.
3. Place a stone on the board.
4. Return to Home.
5. Click `Quick Start: 2D Reversi` or another visible mode.

All visible Steam-stable game options have been checked locally in the packaged build. Features not ready for the current build have been hidden or marked as developing.
