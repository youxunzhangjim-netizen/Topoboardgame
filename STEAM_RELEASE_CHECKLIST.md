# Steam Release Checklist for Topoboardgame

This repository contains Steam-ready scaffolding, but it is not a submitted Steam build until you complete Steamworks onboarding and replace the template IDs.

## Required before Steam upload

1. Create a Steamworks partner account.
2. Create a Steam app and get the real AppID.
3. Create Windows/macOS/Linux depots if needed.
4. Replace placeholders in `steamworks/templates/*.vdf`.
5. Build the desktop app:
   - Windows: `npm run desktop:win`
   - macOS: `npm run desktop:mac`
   - Linux: `npm run desktop:linux`
6. Test local play, Local Robot, and Online mode fallback without internet.
7. Bundle selected trained model JSON files in `public/models/` before `npm run build`.
8. Keep raw `local-data/selfplay/*.jsonl` out of the Steam package.
9. Add a privacy policy if Online/Firebase/analytics are enabled.
10. Review third-party notices and license obligations.

## Recommended store route

- Start with a Coming Soon page.
- Use a demo/playtest build before full release.
- Keep the first Steam build conservative: stable local modes, local robots, analysis UI, and clear online-mode requirements.

## Important licensing note

If you use Steamworks SDK features, review open-source license compatibility carefully. The commercial-license build can remain closed source, while the AGPL community build should avoid proprietary SDK coupling unless you have reviewed compatibility.


## Icon assets included in this build

- Electron master icon: `local-app/build-resources/icon.png`
- Windows icon: `local-app/build-resources/icon.ico`
- Steam shortcut icon: `steamworks/assets/shortcut_icon_256.png`
- Steam app icon: `steamworks/assets/app_icon_184.jpg`

These are functional placeholder/production-draft icons. They can be replaced later by an artist if the filenames are kept or the paths in `package.json` and Steamworks settings are updated.


## Current upload helper files

This patched build includes a SteamPipe config template and a generated-VDF workflow:

```bash
npm run steam:check-info
npm run steam:prepare-vdf
```

See `docs/STEAM_UPLOAD_STEPS.md` for the full upload sequence.
