# Topoboard Labs Unified Research Workspace UI

Topoboard Labs presents the existing Labs models as reproducible experiments for discrete topological dynamics. This UI layer does not add scientific models, rewrite algorithms, or change visual model behavior.

## 1. Updated UI Architecture

```text
Topoboard Labs
  Labs Home / Model Catalog
  Model Header
  Unified Workspace
    Left: configuration and scientific metadata
    Center: visualization and dynamics
    Right: observables, export, notes, logs
```

Each Labs page now exposes:

```text
Model Header
Topology Panel
State Space Panel
Rule Panel
Initial Condition Panel
Dynamics Panel
Observables Panel
Visualization Panel
Export Panel
Research Notes Panel
```

## 2. Component Hierarchy

```text
LabWorkspace
  LabsNavigationCatalog
  LabHeader
    ValidationLevelBadge
    ExperimentHashBadge
  SimpleResearchModeToggle
  TopologyPanel
  StateSpacePanel
  RulePanel
  InitialConditionPanel
  DynamicsPanel
  VisualizationPanel
    BoardRenderer / GraphRenderer / 3D Renderer
    SnapshotButton
  ObservablePanel
  EventLogViewer
  ExportPanel
  ResearchNotesPanel
```

The current vanilla implementation maps these components to existing DOM panels in `algebraic/index.html` and dynamic metadata in `algebraic/js/main.js`.

## 3. Routing Changes

Current routing remains compatible:

```text
/algebraic/?mode=ising_domain_game
/algebraic/?mode=physical_anyon_jump
```

Future canonical routes should map to the same modes:

```text
/labs/spin-systems/ising
/labs/statistical-dynamics/cluster-growth
/labs/quantum-information/stabilizer-codes
/labs/topological-matter/anyons
/labs/field-theory/toy-cft
/labs/mathematical-structures/algebra
```

## 4. Desktop Wireframe

```text
Topoboard Labs | Simple / Research

Labs Home: model catalog cards

Model Header
  Name | Family | Validation | Experiment Hash | App Version

┌ Left rail ───────────┬ Center ───────────────────┬ Right rail ─────────────┐
│ Model / Topology     │ Visualization Panel        │ Observables             │
│ Size / Parameters    │ Board / Graph / Lattice    │ Time Evolution          │
│ State Space          │ Dynamics controls          │ Event Logs              │
│ Local Rule           │ Layer controls             │ Export                  │
│ Initial Condition    │                            │ Research Notes          │
└──────────────────────┴────────────────────────────┴────────────────────────┘
```

## 5. Mobile Wireframe

```text
Topoboard Labs
Model Header
Visualization Panel
Simple controls
State Space / Rule / Initial Condition details
Observables
Export
Research Notes
```

Research details are collapsible. Visualization appears before long configuration panels.

## 6. Simple Mode Behavior

Simple Mode emphasizes:

```text
model description
topology selector
initial condition
main visualization
reset / measure / step-like controls
3 to 5 key observables
simple result export
```

Research-only metadata, event logs, collaboration controls, advanced details, and long export text are hidden.

## 7. Research Mode Behavior

Research Mode shows:

```text
all configuration panels
hashes
seed
state-space details
rule definition
topology summary
observables with definitions and limitations
event logs
config JSON export
result JSON export
observable CSV export
snapshot export
citation text
reproducible experiment link
```

## 8. Migration Plan For Current Labs Pages

1. Keep existing model classes and rendering behavior unchanged.
2. Add metadata for each current mode in the Labs model registry.
3. Populate the shared workspace from current selectors and observables.
4. Route old mode URLs into the unified workspace.
5. Gradually replace legacy terminology in visible labels.
6. Later, connect the TypeScript Research Engine contracts to the export layer.
7. Later, add canonical `/labs/...` routes while preserving old `/algebraic/?mode=...` links.

## 9. Accessibility Requirements

```text
All mode toggles use aria-pressed.
Navigation cards are buttons, not plain divs.
Panels use semantic sections or details/summary.
The model catalog has an aria label.
The workspace has a named landmark.
Research-only hiding preserves keyboard order in Simple Mode.
No horizontal overflow on mobile.
Touch targets remain at least 30px high.
Export text remains selectable and copyable.
```

## 10. Testing Checklist

```text
node --check algebraic/js/main.js
npm run build
desktop Playwright layout check
mobile Playwright layout check
Simple Mode toggle check
Research Mode toggle check
model catalog selection check
all current Labs modes load without page errors
research export JSON parses for every mode
experiment hash and topology hash populate
observable CSV export downloads
snapshot export downloads
copy citation/link update status text
```
