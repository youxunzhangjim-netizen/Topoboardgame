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
