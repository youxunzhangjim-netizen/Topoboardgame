# Research Linear Robot Models

These JSON models are lightweight linear policy/value models trained from bounded
Topoboardgame self-play for release-safe robot experiments. Raw JSONL self-play
data stays in `local-data/` and is not committed.

## Included Models

| Model | Training games | Notes |
| --- | ---: | --- |
| `2dchess-forbidden-square-s8-g100-linear.json` | 100 | Standard 2D Chess board, builtin depth-1 self-play, 40-ply cap. |
| `2dgo-open2d-square-s9-g100-linear.json` | 100 | Standard 9x9 2D Go, legal-random bounded self-play, 12-ply cap. |
| `2dreversi-open2d-square-s8-g100-linear.json` | 100 | Standard 8x8 2D Reversi, builtin depth-1 self-play, 60-ply cap. |
| `2dhex-open-hexagonal-s9-g100-linear.json` | 100 | Standard 9x9 2D Hex, builtin depth-1 self-play, 60-ply cap. |
| `3dchess-r3-chess3d-s8-g100-linear.json` | 100 | R3 3D Chess, mixed legal-random/builtin self-play, 40-ply cap. |

## Not Promoted Yet

3D Go self-play was not promoted in this batch. The current headless 3D Go
adapter is too slow even with tiny random games, so it should be optimized
before a model is committed.

## Release Note

These models are small release artifacts, not large research-trained neural
models. They supplement the existing strategy/opening/endgame knowledge books
and are safe to ship with the repository.
