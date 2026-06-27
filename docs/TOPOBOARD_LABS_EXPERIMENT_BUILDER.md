# Topoboard Labs Experiment Builder

Route: `/labs/experiments`

Purpose: define, run, compare, and export reproducible batch experiments for discrete topological dynamics without adding new physics models or replacing manual guided experiments.

## Page Architecture

The page follows the research workflow:

1. Select Model
2. Select Topologies
3. Select State Space / Initial Conditions
4. Select Local Rule Parameters
5. Select Seeds and Step Count
6. Select Observables
7. Review Experiment Matrix
8. Run Batch
9. Compare Results
10. Export Dataset

The route is static under `labs/experiments/` and is copied into `dist/labs/experiments/` by `tools/build-website.mjs`.

## Schemas

Batch schemas live in `src/labs/research-engine/batch.ts` and are re-exported by `src/labs/research-engine/index.ts`.

Core schemas:

- `LabBatchParameterSweep`
- `LabBatchSeedPlan`
- `LabBatchStepPlan`
- `LabBatchRunConfig`
- `LabBatchExperimentConfig`
- `LabBatchExperimentResult`
- `LabBatchFailedRun`
- `LabBatchSummaryStatistics`
- `LabBatchExportManifest`

Each batch expands into explicit `LabExperimentConfig` records. Seeds are resolved before running and stored in every run config.

## Parameter Sweep Design

Supported sweep modes:

- `fixed`
- `list`
- `range`
- `distribution`

Ranges expand into numeric values. Distributions use a deterministic generator seed and store resolved run seeds in the final config.

## Runner Architecture

The runner uses existing Topoboard Labs model classes as black-box adapters:

- instantiate the existing model with topology, initial condition, parameters, and seed
- choose from existing legal actions deterministically
- call existing model methods such as `legalMoves`, `place`, `tryPlay`, `flipArrow`, `flipGaugeLoop`, `applyAction`, or `moveParticle`
- export through existing `exportState`, observables, history, and counters
- wrap the result as `LabExperimentResult`

No physics algorithm is rewritten.

## Web Worker Plan

`LabBatchWorker.js` runs module workers when supported. It accepts:

- `start`
- `pause`
- `resume`
- `cancel`

It returns progress, completed runs, failed runs, and final batch completion. If the worker fails or is unavailable, the page falls back to chunked sequential execution with async yields.

## UI Component Hierarchy

- `ExperimentBuilderPage`
- `WorkflowMap`
- `ModelSelector`
- `TopologyMultiSelect`
- `InitialConditionPicker`
- `ParameterSweepEditor`
- `SeedAndStepPlanEditor`
- `ObservableRegistryPicker`
- `ExperimentMatrixReview`
- `BatchRunPanel`
- `ComparisonDashboard`
- `DatasetExportPanel`

## Comparison Dashboard

The dashboard provides primitives only:

- summary table
- observable mini line chart
- histogram-ready value distribution
- scatter-ready parameter/topology rows
- heatmap-ready table
- final-state snapshot metadata

It does not generate phase diagrams.

## Export Format

The dataset envelope includes:

- manifest
- `LabBatchExperimentConfig`
- expanded `LabExperimentConfig[]`
- `LabExperimentResult[]`
- failed runs
- topology metadata / adjacency notes
- reproducibility notes
- validation warnings

CSV exports:

- `observable-time-series.csv`
- `summary.csv`
- `event-logs.csv`

## Compare Topologies

Guided panels link to:

`/labs/experiments/?mode=compare-topologies&model=<currentModel>`

This mode keeps one model, one initial condition, one observable, one seed, and two or more topologies.

On mobile, the page exposes a player-friendly quick panel with bilingual copy and three actions:

- switch to Compare Topologies
- review the generated matrix
- run the current quick comparison

The research controls remain available below the quick panel for users who want full parameter sweeps.

## Testing Checklist

- route loads at `/labs/experiments`
- English and Chinese UI render without overlap
- incompatible topology cards are disabled
- Compare Topologies requires at least two topologies and one observable
- matrix preview stores explicit seeds
- worker progress updates without freezing UI
- pause, resume, and cancel messages work in worker mode
- fallback runner completes if worker creation fails
- JSON export refuses incomplete configs
- CSV export includes observable, summary, and event rows
- guided panel links preserve current model and language
- main Labs page still builds and opens

## Implementation Order

1. Add batch schemas.
2. Add model/topology/observable registry.
3. Add matrix expansion and export helpers.
4. Add existing-model runner and worker.
5. Build `/labs/experiments` UI.
6. Link guided panels to Compare Topologies.
7. Copy route into website build.
8. Run syntax, build, and browser smoke checks.
