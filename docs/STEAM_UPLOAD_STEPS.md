# Steam upload steps for Topoboardgame

## 1. Local build check

```bash
npm install
npm run verify:life
npm run verify:defaults
npm run verify:local-robots
npm run build
npm run desktop:package
```

Check the files under `release/`. Launch the packaged app from the generated Windows/macOS/Linux output and test the main launcher, local games, Firebase login, online rooms, and Life interface.

## 2. Steamworks setup

Create or open the Steamworks app. Add depots for the operating systems you plan to ship. Keep each depot ID and the app ID private in your local config.

```bash
cp steamworks/steam_config.example.json steamworks/steam_config.local.json
```

Edit `steamworks/steam_config.local.json` and fill:

- `steamAccountName`
- `appId`
- enabled depot IDs
- platform content roots
- optional live branch name

Do not save Steam passwords, Steam Guard codes, or two-factor codes in this file.

## 3. Generate SteamPipe VDF files

```bash
npm run steam:check-info
npm run steam:prepare-vdf
```

Generated files are written to `steamworks/generated/`, which is intentionally ignored by Git.

## 4. Upload with SteamCMD / ContentBuilder

Copy or point the Steamworks SDK ContentBuilder to this project. Use the generated app build file:

```bash
steamcmd +login YOUR_STEAMWORKS_LOGIN +run_app_build ../steamworks/generated/app_build_topoboardgame.vdf +quit
```

Use the path style required by your ContentBuilder working directory. Upload first to a private branch, install it from Steam, and test it before setting the build live.

## 5. Store and release checklist

Complete the Steamworks store page checklist and the build checklist. Upload capsules, screenshots, trailer if available, supported languages, system requirements, EULA, privacy policy, third-party notices, price package, and launch options. Submit the store page and build for review before release.

## 6. Firebase and online play checklist for Steam

For the Steam desktop app, test Firebase flows in the packaged app, not only in Vite. If OAuth popup/redirect is blocked by the desktop shell, keep Visitor mode available in the Steam app and document Google sign-in support separately for non-Steam web builds. Confirm Firestore rules allow authenticated users to read/write their own profile and room documents used by `online.js`.
