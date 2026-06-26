# Topoboard Labs Research Engine

Topoboard Labs is the research identity of Topoboard: an experimental platform for discrete topological dynamics.

The shared research engine does not introduce new models, rewrite algorithms, or change visual behavior. It defines the contracts that let every current and future Labs model be described as:

```text
Topology + State Space + Local Rule + Dynamics + Observables + Experiment Config + Result Export
```

The TypeScript interfaces live in:

```text
src/labs/research-engine/types.ts
src/labs/research-engine/index.ts
src/labs/research-engine/examples.ts
```

## 1. Core TypeScript Interfaces

The first version defines:

```text
LabTopology
LabStateSpace
LabState
LabLocalRule
LabDynamicsEngine
LabObservable
LabExperimentConfig
LabExperimentResult
```

Supporting types include:

```text
LabSite
LabEdge
LabFace
LabAdjacency
LabTopologyInvariants
LabOrientationData
LabStateConstraint
LabEvent
LabRandomSource
LabStateSnapshot
LabExportOptions
LabExperimentSummary
```

All model validation claims use:

```ts
type LabValidationLevel = 'toy' | 'estimator' | 'benchmarked' | 'research_grade';
```

The validation level should be conservative:

```text
toy
  Visual, educational, symbolic, or exploratory behavior.

estimator
  Discrete approximation or graph estimator with known limitations.

benchmarked
  Compared against known examples, reference data, or accepted algorithms.

research_grade
  Versioned, tested, documented, and reproducible enough to support serious research claims.
```

## 2. Suggested File Structure

```text
src/
  labs/
    research-engine/
      index.ts
      types.ts
      examples.ts
      topology/
        topology-adapter.ts
        topology-hash.ts
      state-space/
        state-space-registry.ts
      local-rules/
        local-rule-registry.ts
      dynamics/
        deterministic-rng.ts
        dynamics-engine.ts
        replay.ts
      observables/
        observable-registry.ts
        observable-export.ts
      export/
        json-export.ts
        csv-export.ts
        experiment-hash.ts
      adapters/
        current-algebraic-adapter.ts
        current-physical-framework-adapter.ts
```

Only `types.ts`, `index.ts`, and `examples.ts` exist in this architectural layer. The rest is the intended migration path.

## 3. Current Labs Mode Mapping

| Current mode | Research section | Model identity | Primary abstraction |
| --- | --- | --- | --- |
| `ising_domain_game` | Spin Systems | Ising / Domain Wall | `LabLocalRule` over spin state space |
| `two_phase_competition_game` | Spin Systems | Phase Competition | binary phase state space |
| `physical_cluster_go` | Statistical Dynamics | Cluster Growth / Percolation | occupied species/resource state space |
| `physical_jump_particles` | Statistical Dynamics | Reaction-Diffusion / Particle Hopping | particle species on sites |
| `spin_ice_vertex_game` | Spin Systems | Spin Ice | edge state space with vertex constraints |
| `z2_gauge_loop_game` | Topological Matter / Field Theory | Wilson Loops / Lattice Gauge Concepts | edge gauge-field state space |
| `clifford_reversi`, `clifford_go`, `clifford_jump` | Quantum Information | Pauli Algebra | site operator state space |
| `physical_clifford_*` | Quantum Information | Stabilizer Codes / Error Correction | Pauli-frame recovery state space |
| `anyon_reversi`, `anyon_jump` | Topological Matter | Anyons / Fusion / Braiding | mobile charge and braid state space |
| `physical_anyon_*` | Topological Matter | Topological Memory | anyon state space plus logical-sector observables |
| `physical_virasoro_go`, `physical_virasoro_reversi`, `virasoro_jump` | Field Theory | Operator Insertions / Toy CFT | primary-field and OPE state space |
| Algebraic sandbox controls | Mathematical Structures | Algebra / Graphs / Topology | symbolic state and graph dynamics |

Biological interpretations should not map into Labs. They belong under Topoboard Life. Cluster and reaction models may remain in Labs only when described as statistical dynamics, graph dynamics, or physical/mathematical estimators.

## 4. Migration Plan From Current Code

1. Add metadata adapters without touching algorithms.
   - Convert the current topology object into `LabTopology`.
   - Convert current board/tokens/edge data into `LabState`.
   - Preserve current visual state exactly.

2. Register state spaces per model family.
   - Ising uses spin states.
   - Spin Ice and Z2 Gauge use edge states.
   - Anyon modes use mobile charge/token states.
   - CFT modes use symbolic primary-field states.

3. Wrap existing local update methods as `LabLocalRule`.
   - The wrapper calls existing JS methods.
   - The wrapper records rule ids, parameters, seed, and hashes.
   - The wrapper does not change move legality or update behavior.

4. Convert existing physics histories into `LabEvent`.
   - Existing `physicsHistory`, braid logs, measurement logs, stochastic logs, and move histories become event streams.

5. Register observables as `LabObservable`.
   - Existing `computePhysicalObservables`, `computeCFTObservables`, and problem-specific observable functions become pluggable observables.

6. Standardize export.
   - JSON exports include full `LabExperimentConfig`.
   - CSV exports use flat rows: step, time, observable id, value, event id, state hash.

7. Add deterministic replay.
   - Existing seeded randomness must be routed through a `LabRandomSource`.
   - Replay uses config hash, seed, app version, topology hash, rule hash, and initial state hash.

8. Add comparison support.
   - Results should be comparable by model id, topology hash, local rule hash, seed, observable ids, and app version.

## 5. Risks And Edge Cases

Topology reuse:
The same `LabTopology` must support site states, edge states, mobile tokens, and face observables. Do not put model-specific state into the topology.

Edge-based models:
Spin Ice and Z2 Gauge require edge states and sometimes face checks. `LabState.edgeStates` and `LabTopology.faces` must remain first-class.

Mobile particles:
Anyons and particle hopping use token/worldline state. In the first adapter, token state can live in `LabState.metadata`; later it should become a typed token extension.

3D and 4D boards:
Coordinates, rendered positions, graph adjacency, and slice/layer UI are different concepts. `LabTopology.sites[].coord` should be logical, while `position` can be render geometry.

Random boundary conditions:
RBC maps must be included in `LabAdjacency.boundaryMaps` and the topology hash. Otherwise replay cannot be deterministic.

Floating-point values:
Energy, entropy, stress proxies, and correlation estimates need export precision. Hashing should use canonical rounded values when configured.

Validation level:
The platform must not overclaim. CFT and Virasoro graph values are usually `estimator`; visual/symbolic braiding may be `toy`; only tested algorithms should become `benchmarked`.

Hash stability:
Hashes must ignore UI-only data and include all scientific data that changes replay: topology, local rule id and parameters, initial state, seed, app version, and randomness implementation.

Backward compatibility:
Old exports should still load. If an old export lacks a research-engine config, build a compatibility config with warning metadata.

## 6. Minimal Implementation Order

1. Keep the current `types.ts` contracts stable.
2. Add stable stringify and hash utilities for topology, state, rules, configs, and results.
3. Implement `LabRandomSource` with forkable deterministic seeds.
4. Write a topology adapter for current graph topology objects.
5. Write a state adapter for one low-risk mode: Ising.
6. Register Ising observables through `LabObservable`.
7. Export an Ising `LabExperimentResult` beside the existing export.
8. Add deterministic replay smoke test for Ising.
9. Repeat for Anyon braiding because it exercises mobile tokens, braid logs, logical sectors, and topology cycles.
10. Migrate the remaining modes gradually.

## 7. Testing Strategy

Contract tests:
Validate that each produced `LabExperimentConfig` contains model id, topology id, state space id, local rule id, seed, steps, observables, app version, and experiment hash.

Topology tests:
The same topology adapter output should be reusable by Ising, Anyon, Stabilizer, CFT, and graph dynamics tests without model fields.

Hash tests:
Changing topology, seed, initial condition, local rule parameters, or app version must change the experiment hash. Changing UI language or panel layout must not.

Replay tests:
Run a short seeded experiment twice and compare final state hash, event hashes, observable samples, and result hash.

Observable tests:
Every registered observable must return a value, definition, physical meaning, estimator type, validation level, limitations, and export key.

CSV tests:
Every observable time series should flatten to stable CSV rows without losing step, time, observable id, and value.

Compatibility tests:
Existing model exports still work, and the research-engine export appears as an added standardized layer once adapters are connected.

Visual regression:
Because this layer must not change gameplay behavior, Playwright screenshots should remain unchanged until UI work begins.

## 8. Example Experiment Configs

The source examples are in `src/labs/research-engine/examples.ts`.

### Ising On Torus

```ts
import { isingTorusExperimentConfig } from '../src/labs/research-engine/examples';
```

Key identity:

```text
modelId: spin-systems.ising
topologyId: topology.torus.square.16x16.pbc
stateSpaceId: state-space.ising.spin-half
localRuleId: rule.ising.domain-wall.metropolis-v1
seed: 104392
validationLevel: estimator
```

### Anyon Braiding On Torus

```ts
import { anyonBraidingTorusExperimentConfig } from '../src/labs/research-engine/examples';
```

Key identity:

```text
modelId: topological-matter.anyons
topologyId: topology.torus.square.12x12.pbc
stateSpaceId: state-space.anyon.toric-code
localRuleId: rule.anyon.braid-and-fuse.toric-code-v1
seed: 88017
validationLevel: toy
```

## 9. Export Standard

Every future Labs export should contain:

```text
config
finalState
observableTimeSeries
eventLog
snapshots
summary
warnings
resultHash
```

CSV export should be generated from the same result object, not from a separate model-specific path.
