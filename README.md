# Topological Boardgame

Playable graph board games on flat, periodic, twisted, spherical, projective, 3D, and 4D topologies.

## Algebraic Physical Modes

The algebraic app includes normal game modes and physical variants beside them. Physical variants export a shared research record:

- `physicsHistory[]`
- per-move `observables`
- `physicalAnswer`
- JSON export
- CSV export

Each physical history entry records:

- `tick`
- `player`
- `action`
- `affectedVertices`
- `affectedEdges`
- `topology`
- `physicalUpdate`
- `observables`

## Ising Domain Game

Mode id: `ising_domain_game`

Physical meaning:

- Black = spin up, `s = +1`
- White = spin down, `s = -1`
- Empty = unoccupied / undecided site
- Board = graph embedded in the selected topology

Energy:

```text
E = -J * sum_<ij> s_i s_j - h * sum_i s_i
```

The neighbor sum uses `topology.neighbors(vertex)` and the topology edge helpers, so torus, Mobius, Klein bottle, RP2, sphere, random-boundary, R3, and 4D graph boards do not assume rectangular boundaries.

Actions:

- Place a spin on an empty vertex.
- Flip one occupied spin.
- Flip a connected local domain when Domain Flip is enabled.
- Apply an optional Reversi-like bracket flip when Bracket Flip is enabled.

Optional Metropolis update:

- Compute `deltaEnergy`.
- Accept if `deltaEnergy <= 0`.
- If `deltaEnergy > 0`, accept with probability `exp(-deltaEnergy / T)`.

Initial states:

- `random_spins`
- `domain_wall_seed`
- `droplet_seed`
- `stripe_seed`
- `checkerboard`
- `thermal_sample`

The domain-wall seed creates adjacent black and white spin domains with a configurable `wallThickness`, then leaves undecided sites so both players have legal moves immediately.

Observables:

- energy
- delta energy
- magnetization
- domain-wall length
- domain-wall density
- number of black / white domains
- largest domain size
- nearest-neighbor correlation estimate `<s_i s_j>`
- noncontractible domain-wall count on cycle-supporting topologies
- twisted sector for Mobius, Klein bottle, and RP2

Final physical answer:

- final phase: `ordered`, `disordered`, `metastable`, `topological_domain_wall`, or `twisted_sector`
- relaxation time
- stable domain-wall lifetime
- energy drop

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?mode=ising_domain_game
```

## Two-Phase Competition Game

Mode id: `two_phase_competition_game`

Physical meaning:

- Black = phase A
- White = phase B
- Empty = metastable or unconverted region
- Board = physical substrate graph on the selected topology

Energy:

```text
E = interfaceCost * interfaceLength
    - biasA * areaA
    - biasB * areaB
    + curvaturePenalty if enabled
```

Actions:

- Nucleate a phase at an empty site.
- Grow a domain into neighboring empty sites.
- Flip an interface site only when the energy does not increase.
- Optional noise creates random droplets during updates.

Initial states:

- `phase_separated`
- `random_droplets`
- `single_nucleus`
- `two_nuclei`
- `stripe_domains`
- `metastable_empty`

Observables:

- area fraction of phase A / B
- interface length
- number of domains
- largest domain
- nucleation count
- coarsening rate
- winding / noncontractible interfaces
- metastable lifetime

Final physical answer:

- winner phase
- final area fraction
- whether phase separation occurred
- whether topology stabilized an interface
- coarsening exponent estimate when enough history exists

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?mode=two_phase_competition_game
```

## CFT Observable Go

Mode id: `physical_virasoro_go`

Physical meaning:

- Board = discretized Riemann surface / graph manifold.
- Empty vertex = identity operator.
- Stone = primary-field insertion.
- Black / white = source sign or player control.
- `primaryType` carries the physical field.

Default CFT:

- Ising CFT, `c = 1/2`.
- identity: `h = 0`
- sigma: `h = 1/16`
- epsilon: `h = 1/2`

Actions:

- place primary field
- capture / fuse a cluster by topology-aware Go liberties
- measure OPE channel
- measure two-point or four-point correlators
- apply Virasoro deformation `L_n`

Initial states:

- `two_point_insertions`
- `four_point_block`
- `boundary_cft`
- `thermal_sparse`
- `identity_background_with_defects`

Observables:

- primary counts
- OPE channel distribution
- two-point correlation estimates
- four-point cross-ratio
- conformal block weights and dominant block
- stress tensor proxy `T(v)`
- entanglement entropy and mutual information estimates
- anomaly events for N=2 Virasoro actions

Final physical answer:

- final dominant block
- identity / vacuum block dominance
- entropy growth
- strongest correlations
- final OPE sector
- anomaly count

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?layer=physical&mode=physical_virasoro_go
```

## CFT Domain-Wall Reversi

Mode id: `physical_virasoro_reversi`

Physical meaning:

- Black = positive source / domain sign.
- White = negative source / domain sign.
- Stone = primary field or spin/domain insertion.
- Bracketed Reversi line = discrete CFT interval.
- Flipping = OPE channel and domain transformation.

Default CFT:

- Ising CFT, `c = 1/2`.
- Primary fields: `identity`, `sigma`, and `epsilon`.
- OPE rules:
  - `sigma x sigma -> identity + epsilon`
  - `sigma x epsilon -> sigma`
  - `epsilon x epsilon -> identity`

Actions:

- place primary/domain stone
- flip bracketed interval
- update OPE channel along the flipped interval
- measure interval parity
- measure OPE channel
- measure region entropy
- apply Virasoro deformation `L_n`

Initial states:

- `domain_wall_seed`
- `four_sigma_block`
- `boundary_condition_change`
- `thermal_cft_sample`
- `two_phase_interval_seed`

Observables:

- domain-wall length
- primary counts
- OPE channel transitions
- conformal block weights and dominant block
- interval entropy estimate
- stress proxy
- central-charge anomaly events
- twisted / topological sector when supported

Final physical answer:

- final dominant OPE channel
- final domain-wall length
- stable topological or twisted sector
- entropy growth
- anomaly count
- final CFT sector

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?layer=physical&mode=physical_virasoro_reversi
```

## Spin Ice Vertex Game

Mode id: `spin_ice_vertex_game`

Physical meaning:

- Board variables live on graph edges.
- Black = arrow direction along the chosen edge orientation.
- White = arrow direction opposite to the chosen edge orientation.
- Local vertex rule = ice rule.

Default square-ice rule:

- Each degree-four vertex prefers two arrows in and two arrows out.
- Violations are monopoles.
- Finite boundary ports are treated as boundary conditions; twisted/nonorientable seams can stabilize residual defects.

Actions:

- Flip one arrow.
- Flip a connected string of arrows.
- Flip a closed loop.
- Move a monopole by flipping an adjacent arrow.
- Annihilate a monopole-antimonopole pair along a graph path.

Initial states:

- `ice_rule_vacuum`
- `random_arrows`
- `monopole_pair`
- `loop_excitation`
- `thermal_ice_sample`

Observables:

- number of ice-rule violations
- monopole count
- string length
- closed loop count
- winding loops on torus, Klein bottle, Mobius strip, and RP2 graphs
- energy from vertex-rule violations
- monopole separation

Final physical answer:

- whether the ice-rule vacuum recovered
- monopole lifetime
- average string length
- topological loop sector
- final defect density

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?mode=spin_ice_vertex_game
```

## Z2 Gauge Loop Game

Mode id: `z2_gauge_loop_game`

Physical meaning:

- Board variables live on graph edges.
- Edge variable `U_e = +1` or `-1`.
- Black edge = `U_e = +1`.
- White edge = `U_e = -1`.
- Vertex charge = product of adjacent edge variables.
- Plaquette flux = product around a local face or graph cycle.

Actions:

- Flip one edge.
- Flip a connected path of edges.
- Flip a closed loop.
- Measure a star check.
- Measure a plaquette / flux check.
- Optional noisy edge flip.

In the 2D board, visible black/white edge strokes can be clicked directly for the one-edge and noisy-edge actions. Vertex labels report the local star and plaquette signs.

Physics:

- Open string flips create pairs of star-charge defects at endpoints.
- Closed loop flips preserve local constraints when the loop is contractible.
- Noncontractible loops change the logical Wilson-loop sector on cycle-supporting topologies.

Initial states:

- `gauge_vacuum`
- `random_edge_errors`
- `paired_charge_defects`
- `paired_flux_defects`
- `logical_loop_error`

Observables:

- number of star violations
- number of plaquette / flux violations
- syndrome weight
- logical Wilson loops
- logical sector
- memory alive / logical error
- loop length distribution
- decoder success estimate when enabled

Final physical answer:

- whether the gauge vacuum recovered
- final syndrome weight
- whether a logical error occurred
- memory lifetime
- Wilson-loop sector

Open directly with:

```text
https://youxunzhangjim-netizen.github.io/Topoboardgame/algebraic/?mode=z2_gauge_loop_game
```

## Local app launch

This repository includes local launchers:

- Windows: double-click `Start-Topoboardgame-Windows.bat`
- macOS: double-click `Start-Topoboardgame-macOS.command`
- Linux: run `./Start-Topoboardgame-Linux.sh`

The first run installs npm dependencies. Local play and local robots run on `http://127.0.0.1:5172`. Online multiplayer still requires internet.

## Local ML / trainable robots

See `research/docs/ML_TRAINING_PIPELINE.md` for the self-play -> train -> evaluate -> external robot workflow. The first trainable robot is a local linear policy/value model trained from JSONL self-play data. It can run inside the headless research runner or as an external JSONL robot.
