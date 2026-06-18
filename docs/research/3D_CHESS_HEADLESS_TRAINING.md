# 3D Chess Headless Training

This update makes `3dchess` available to the research/self-play and linear-model training pipeline without constructing DOM, Three.js renderers, or WebGL state.

New core files:

```text
3D/3dchess/js/headless/Headless3DChess.js
3D/3dchess/js/headless/RP2HeadlessConfig.js
```

Research adapter support:

```text
research/adapters.mjs
```

Supported headless 3D Chess modes:

```text
r3          cube / open boundary
 t3         periodic cube
reflection  reflective cube
r3_random   random boundary cube
t2          torus surface
sphere      sphere-like surface
klein       Klein bottle surface
mobius      Möbius strip surface
rp2         projective-plane / antipodal style surface
```

Quick smoke:

```powershell
npm run research:selfplay -- --game 3dchess --boundary r3 --games 1 --maxPlies 8 --depth 1 --state false --out local-data/selfplay/smoke/3dchess.jsonl
npm run ml:train-all -- --only 3dchess --preset quick --skipEval true --overwrite true
```

Normal training:

```powershell
npm run ml:train-all -- --only 3dchess --preset normal --overwrite true
```

Raw JSONL data under `local-data/selfplay/` should not be committed. Promote trained model JSON files only when you want the app/site to load them.
