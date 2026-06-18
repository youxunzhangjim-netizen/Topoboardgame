# Topoboardgame App Icon and Art Replacement Guide

This build includes a temporary production-ready app icon based on the requested concept:

- dark blue background
- white line-art trophy/cup behind the main symbol
- white chess pawn in front of the cup
- small top circle with a small donut/ring shape

## Files added

Electron / local desktop app:

- `local-app/build-resources/icon-source.svg` — editable vector source
- `local-app/build-resources/icon.png` — 1024×1024 master PNG
- `local-app/build-resources/icon.ico` — Windows icon file
- `local-app/build-resources/icon-16.png`
- `local-app/build-resources/icon-24.png`
- `local-app/build-resources/icon-32.png`
- `local-app/build-resources/icon-48.png`
- `local-app/build-resources/icon-64.png`
- `local-app/build-resources/icon-128.png`
- `local-app/build-resources/icon-184.png`
- `local-app/build-resources/icon-256.png`
- `local-app/build-resources/icon-512.png`
- `local-app/build-resources/icon-1024.png`

Website/public branding:

- `public/brand/topoboardgame-icon-source.svg`
- `public/brand/topoboardgame-icon.png`
- `public/brand/topoboardgame-icon-184.png`
- `public/brand/topoboardgame-icon-256.png`
- `public/brand/topoboardgame-icon-512.png`
- `public/brand/topoboardgame-icon-1024.png`

Steam icon placeholders:

- `steamworks/assets/shortcut_icon_256.png`
- `steamworks/assets/shortcut_icon.ico`
- `steamworks/assets/app_icon_184.jpg`

## Can an artist change the icon later?

Yes. Keep the same filenames and replace the files above.

Recommended artist workflow:

1. Design a clean 1024×1024 square master icon.
2. Keep the main pawn/cup silhouette readable at 32×32 and 64×64.
3. Export a transparent or filled-background PNG as `local-app/build-resources/icon.png`.
4. Export Windows `.ico` as `local-app/build-resources/icon.ico`.
5. Export Steam icons:
   - `steamworks/assets/shortcut_icon_256.png`
   - `steamworks/assets/app_icon_184.jpg`
6. Run:

```powershell
npm run desktop:dir
npm run desktop:win
```

If only the visual art changes and filenames stay the same, no code changes are required.

## Important

Do not treat the current icon as final store capsule art. Steam store capsules, library hero images, screenshots, and trailer still need separate professional artwork.

## Current icon revision

The current icon uses a dark-blue background with white glowing line art. The top donut-shaped circle is now the pawn's own head/top, connected into the pawn body, rather than an extra floating ring. The pawn base uses a donut-shaped ellipse so the bottom ring remains visible at small sizes.
