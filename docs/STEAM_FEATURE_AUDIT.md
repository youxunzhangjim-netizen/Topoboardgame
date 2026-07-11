# Steam Feature Audit

This audit is for the Steam-stable build. Steam reviewers must be able to launch the app, enter local gameplay, and make progress without signing in or opening a web browser.

## Required Steam-Stable Behavior

- Main menu loads as Offline Guest when Firebase/Auth is unavailable.
- Local 2D, 3D, 4D, Life, and Labs entries either open a working bundled page or show a clear developing label.
- Local play is the default. Online rooms are only used after the player explicitly opens online controls.
- Online room/chat failures show an unavailable message and do not block local play.
- Steam build serves bundled `dist-steam/app` files; it must not navigate to GitHub Pages or Vercel for gameplay.
- Store text should describe only accessible current-build content. Planned items must be marked developing or omitted.

## Current Steam Review Path

1. Main menu.
2. `2D Go`, place one stone.
3. Home.
4. `2D Reversi`, make one move.
5. Home.
6. Optional: open `2D Jump`, `3D Go`, `4D Go`, `Life World`, and `Labs` to confirm page rendering.

## Review Fix Summary

The Steam hotfix makes Firebase/Auth optional for local play, keeps Steam/Web online pools shared when online is available, and adds packaged smoke/package verification for the bundled desktop app.
