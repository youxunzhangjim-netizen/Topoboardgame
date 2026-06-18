# Topoboardgame Final Pre-upload Checklist

## Code

- [ ] `npm install` completes.
- [ ] `npm run verify:local-robots` passes.
- [ ] `npm run verify:research` passes.
- [ ] `npm run verify:ml` passes.
- [ ] `npm run build` passes.
- [ ] `npm run desktop:dir` passes.
- [ ] `npm run desktop:win` passes on Windows if preparing Steam/desktop release.
- [ ] Local play works offline.
- [ ] Local Robot works offline.
- [ ] Online mode fails gracefully if offline.
- [ ] Firebase Google/Anonymous login works only after Firebase Console providers are enabled.

## Files to include in GitHub

- [ ] Source code.
- [ ] `research/` scripts.
- [ ] `scripts/` helper scripts.
- [ ] `LICENSE.md`.
- [ ] `EULA.md`.
- [ ] `PRIVACY_POLICY.md`.
- [ ] `THIRD_PARTY_NOTICES.md`.
- [ ] `FIREBASE_SETUP.md`.
- [ ] `docs/steam/`.
- [ ] Selected `public/models/*.json` if promoted trained models exist.
- [ ] App icon assets.

## Files not to include

- [ ] `node_modules/`
- [ ] `local-data/selfplay/*.jsonl`
- [ ] temporary logs
- [ ] raw huge datasets
- [ ] Steamworks SDK private files unless making a private commercial build
- [ ] secret `.env` files

## Steam

- [ ] Steamworks partner onboarding complete.
- [ ] Steam Direct app fee paid.
- [ ] App ID acquired.
- [ ] Depot IDs acquired.
- [ ] Store capsule images finished.
- [ ] Screenshots captured from real current build.
- [ ] Trailer/gameplay video prepared if needed.
- [ ] Store page submitted for review.
- [ ] Build submitted for review.
- [ ] Coming Soon page visible at least two weeks before release.
