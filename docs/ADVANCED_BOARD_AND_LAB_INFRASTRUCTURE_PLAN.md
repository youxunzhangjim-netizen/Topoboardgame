# Advanced Board And Lab Infrastructure Plan

Conceptual development branch: `advanced-board-lab-infra`

This plan starts the next infrastructure layer after the first Steam upload. It is intentionally conservative: the current Steam build remains the stable public baseline, and the new work is additive until individual boards or Labs are verified.

## 1. Steam Build Remains Stable

The uploaded Steam build is the release baseline. Advanced board and Lab infrastructure must not change current public gameplay behavior by default.

Release-safe rules:

- Do not rewrite all games at once.
- Do not redesign the UI.
- Do not change base rules for Chess, Go, Reversi, Jump, Hex, Life, or Labs.
- Do not expose experimental board generators unless they pass validation or are clearly marked as developing.
- Keep working Steam-visible boards playable while new compatibility code is added beside them.

## 2. BoardSpec Is Additive

`BoardSpec` is a compatibility layer, not a replacement for existing board code.

Its purpose is to describe a board in a consistent way:

- space
- lattice
- boundary condition
- playable kind: cell, vertex, edge, or mixed
- sites
- edges
- draw positions
- 3D positions
- target zones
- metadata

Existing board generators can continue to work. When a board is ready, it can export or adapt into `BoardSpec` so validators, hit testing, rendering safety, and future tooling can read it consistently.

## 3. Gradual Board Adaptation

Boards should be adapted one family at a time, starting with boards that already caused release risk:

- Go vertex boards
- Honeycomb graph cylinder and torus
- Klein bottle vertex boards
- 3D embedded 2D surfaces
- 4D slice views

Migration order:

1. Keep legacy generator.
2. Add a small adapter that produces `BoardSpec`.
3. Validate sites, edges, neighbor symmetry, and degree ranges.
4. Route hit testing through playable site adapters only for that board.
5. Keep fallback to the legacy stable board if validation fails.

This avoids a large BoardSpec refactor while still creating a common safety path.

## 4. External Tools Come Later

No external scientific toolchain is introduced in this step.

Deferred integrations:

- Python bridges
- Gmsh mesh generation
- ASE
- pymatgen
- OVITO
- ParaView
- Materials Project
- NOMAD
- OPTIMADE

Future bridges should be optional and isolated. They should export validated `BoardSpec` or Lab data, never replace Steam gameplay paths directly.

## 5. Labs Use Safe Runners And Compatibility Checks

Labs should become safer before they become larger.

Required safety behavior:

- validate board size before running
- estimate site, edge, and state-variable counts
- chunk long loops
- yield to the UI during long runs
- allow cancel and pause
- record performance warnings
- avoid infinite "running" states
- fall back or suspend a Lab if a model exceeds Steam-safe limits

Labs should report whether a model is:

- toy
- estimator
- benchmarked
- research_grade

This helps separate educational visualization from physically validated research tools.

## 6. No Heavy Database Or Mesh Integration In This Step

This phase does not add material databases, general mesh import, or heavy topology expansion.

Explicitly out of scope:

- material database connections
- automatic crystal structure import
- general genus-g surfaces
- new knot families
- Klein quartic revival
- external meshing pipelines
- full BoardSpec-only renderer rewrite

The goal is stability, validation, and observability.

## 7. Lightweight Performance Audit

`js/shared/PerformanceAudit.js` provides a small debug-only audit layer.

It records:

- board generation time
- board validation time
- render time
- Lab initialization time
- Lab step time
- site and cell counts
- edge counts
- visible draw object counts

Thresholds:

- board generation warning: more than 300 ms
- board generation danger: more than 1500 ms
- render warning: more than 100 ms
- render danger: more than 500 ms
- Lab step warning: more than 100 ms
- Lab step danger: more than 500 ms

Detailed console output is debug-only and should not spam normal players.

## 8. Branch Discipline

Use `advanced-board-lab-infra` as the working branch concept for this infrastructure track.

Recommended workflow:

1. Keep `main` aligned with the Steam-safe build.
2. Add infrastructure modules on the advanced branch.
3. Keep modules unused until verified.
4. Add small verification scripts before wiring runtime pages.
5. Promote only stable adapters back into the release line.

This keeps the Steam build stable while allowing deeper scientific board and Lab infrastructure to grow safely.
