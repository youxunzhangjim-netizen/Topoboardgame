# Life World Architecture Note

This note describes the current Life World module before adding research tools. It is intentionally scoped to `/life` and does not cover Games, Labs, Firebase, login, or global navigation.

## 1. Current Files and Responsibilities

- `index.html`: Life landing page, language switch, mode cards container, and info dialog.
- `world.html`: Main Life player page. Defines the canvas, beginner controls, advanced settings, pattern JSON tools, observables, score panel, and plots.
- `life.css`: All Life layout, responsive UI, canvas, card, dialog, control, observable, and board styling.
- `life-data.js`: Static mode, geometry, lattice, modifier metadata and bilingual label helpers.
- `life-worlds.js`: Landing-page controller that renders mode cards and info dialogs.
- `life-sim.js`: Small bootstrap that installs the main Life UI.
- `js/i18n.js`: Life-specific language detection, static text localization, link syncing, and translation lookup.
- `js/LifeEngine.js`: Rendering-independent cellular automaton engine. Owns dimension, size, topology, lattice, rule, cells, generation, stepping, seeding, import/export, and observables access.
- `js/rules.js`: Cell model and rule application for life-like, predator-prey, SIR, and forest-fire automata.
- `js/topologies.js`: Boundary/topology normalization, lattice neighbor directions, coordinate mapping, and neighbor lookup.
- `js/presets.js`: Rule presets and preset label helpers.
- `js/observables.js`: Population, density, species, age, cluster, entropy, spatial-correlation, and event-summary calculations.
- `js/LifeUI.js`: Main UI orchestrator. Binds DOM controls, applies mode/geometry/settings changes, handles drawing/erasing/inspection, canvas rendering, 3D camera interaction, online room hooks, challenge scoring, plots, and pattern JSON import/export.

## 2. Current Engine / UI / Data Separation

The core simulation is mostly separated:

- `LifeEngine` is DOM-free and delegates topology, rules, presets, and observables to smaller modules.
- `rules.js`, `topologies.js`, `presets.js`, and `observables.js` are reusable by future tests or research adapters.
- `life-data.js` is display metadata for mode cards and default mode selection.
- `i18n.js` keeps Life translation concerns inside `/life`.

The main coupling point is `LifeUI.js`. It combines page state, control synchronization, canvas rendering, pointer picking, online sync, gameplay status, score formulas, chart drawing, and import/export. This is acceptable for the current beginner page, but it is the first area to split before adding research workflows.

## 3. Current Controls and Observables

Beginner controls currently include:

- Start / Pause, Step, Reset, Random seed.
- Draw, Erase, Inspect.
- Grid toggle and board opacity cycling.
- Mode selection.
- Usage mode: zero-player simulation, one-player challenge, two-player competition.
- Active player and species selection.
- Blocks per side.
- Local / online / robot connection controls.

Advanced controls currently include:

- Board geometry: open plane, torus, cylinder, Mobius, Klein, sphere, RP2, 3D open, 3D periodic, 3D random-boundary, reflective 3D.
- Lattice: square, triangular, honeycomb, SC, BCC, FCC, HCP depending on geometry.
- View mode, dimension, legacy topology selector, rule preset, neighborhood mode, speed.
- Noise and modifier sliders: birth noise, death noise, environment noise, rule noise, topology defect noise, mutation, max age, aging death rate, young birth bonus, old age penalty.
- Max generations.
- Pattern JSON export/import.

The existing three neighborhood modes are:

- Moore.
- Von Neumann.
- Lattice nearest-neighbor.

Live observables currently shown in the UI include:

- Generation, population, density.
- Birth rate, death rate.
- Species fractions.
- Mean age and age distribution.
- Cluster count and largest cluster.
- Entropy.
- Spatial correlation.
- Extinction time and survival time.
- Oscillation detection.
- Front velocity.
- Two-player score readouts.
- Population and species plots.

## 4. Risks Before Adding Research Tools

- `LifeUI.js` is very large and mixes control state, rendering, interaction, networking, challenge logic, and export logic.
- Deterministic replay is not yet a first-class UI concept. The engine supports injected RNG, but the beginner UI currently uses ordinary random behavior for seeds.
- Current pattern export is page-oriented JSON, not a formal experiment schema.
- Rendering and topology are related but not identical: flat board, projected surface, and volume views can represent the same intrinsic topology differently.
- Online/robot controls share the same UI class as local simulation. Research batch tools must avoid accidentally sending network state.
- Some research concepts already exist as advanced controls, but there is not yet a stable adapter boundary for batch runs, reproducibility metadata, or comparison exports.
- The beginner page relies on public URLs `/life/` and `/life/world.html`; migration must preserve both.

## 5. Safe Migration Plan

1. Keep `/life/` and `/life/world.html` unchanged as the beginner entry points.
2. Treat `LifeEngine`, `rules.js`, `topologies.js`, `presets.js`, and `observables.js` as the reusable simulation core.
3. Add tests around engine stepping, topology mapping, import/export, and observable calculations before moving UI behavior.
4. Extract small non-visual adapters from `LifeUI.js` only when needed:
   - control-to-engine config builder,
   - pattern/export serializer,
   - render-independent experiment snapshot,
   - deterministic seed helper.
5. Keep beginner controls in place while adding research tools behind separate panels or routes under `/life`.
6. Do not move online, robot, or drawing behavior until the extracted engine adapters are covered by tests.
7. Introduce reproducible research exports as an additive format; continue accepting the current pattern JSON.
8. Only after compatibility is verified, split rendering helpers from `LifeUI.js` into focused `/life/js` modules.
