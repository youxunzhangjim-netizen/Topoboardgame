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
