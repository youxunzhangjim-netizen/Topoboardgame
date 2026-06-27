# Life World Rules

This document explains the rule concepts used by Life World.

## Cellular Automaton Basics

A cellular automaton has:

- a board or topology,
- cells with local states,
- a neighborhood around each cell,
- an update rule,
- discrete time steps called generations.

At each generation, every cell checks its neighbors and becomes alive, stays alive, dies, mutates, or changes species according to the selected rule.

## B/S Rules

B/S notation is the standard shorthand for outer-totalistic Life-like rules.

`B3/S23` means:

- Birth on exactly 3 living neighbors.
- Survival on exactly 2 or 3 living neighbors.

Examples:

- Conway Life: `B3/S23`.
- HighLife: `B36/S23`.
- Seeds: `B2/S`.
- Day & Night: `B3678/S34678`.

The allowed neighbor counts depend on the current neighborhood. A 2D Moore radius-1 neighborhood has up to 8 neighbors, while a 3D Moore radius-1 neighborhood has up to 26.

## Moore Neighborhood

Moore neighborhood uses Chebyshev distance. On a 2D square board with radius 1, it includes horizontal, vertical, and diagonal neighbors.

This is the usual neighborhood for classic Conway Life.

## Von Neumann Neighborhood

Von Neumann neighborhood uses Manhattan distance. On a 2D square board with radius 1, it includes only the four orthogonal neighbors.

It creates more axis-aligned growth and usually behaves differently from Moore Life even with the same B/S counts.

## Lattice Nearest-Neighbor Mode

Lattice nearest-neighbor mode asks the selected lattice for its nearest sites. This keeps neighborhood meaning consistent on square, triangular, honeycomb, SC, BCC, FCC, and HCP-style choices.

If a topology/lattice combination is unsupported, Life World warns and falls back to the nearest supported option.

## Topology and Boundary Behavior

Topology changes how cells near boundaries interact:

- Open boundaries lose neighbors outside the board.
- Periodic boundaries wrap to the opposite side.
- Cylinder boundaries wrap in one direction.
- Mobius and Klein boundaries wrap with orientation flips.
- Spherical and projective choices identify edges to represent curved surfaces.
- Reflective boundaries mirror movement at the edge.

These choices can change extinction, oscillation, clustering, and spreading even when the local rule is identical.

## Noise, Age, and Mutation

Noise controls introduce random deviations:

- Birth noise can create spontaneous births.
- Death noise can kill otherwise surviving cells.
- Environment or rule noise can perturb the update decision.
- Topology defect noise can add irregularity tied to the board.

Age controls let cells become older and optionally die or weaken with age. Mutation lets species change during survival or birth, which makes ecosystem and competition modes less deterministic.

## Species Competition

Species competition uses the same local board but allows cells to carry species identities. Births can follow local majority species, and mutation can move a cell into another species. This supports two-player territory play and ecological experiments.

## Observables and Detection

The research observables are measurements, not win conditions. Detected still lifes, oscillators, and moving candidates are approximate. Moving candidates compare translated shape hashes on compatible 2D flat boards and should not be treated as exact glider proof.

## Scans and Comparisons

Phase diagram scanning samples multiple rules and random seeds to classify behavior. Topology comparison keeps the rule and seed fixed while changing geometry. Both tools are meant for exploration and reproducibility, with JSON/CSV export for later analysis.
