# Labs realistic-rule redesign

This patch keeps the Labs board, lattice, boundary, dimension, topology, and visual-control format, but treats those boards as graph/space/spacetime substrates for operators, particles, fields, and measurements rather than forcing every Lab problem into Go, Reversi, or Jump rules.

## Global Labs rule principle

- A board coordinate is a graph vertex, edge variable, worldline point, CFT insertion point, stabilizer site, resource/contact site, or measurement region according to the selected physical or mathematical problem.
- The same topology controls adjacency, seams, homology, ray transport, and boundary behavior, but the local update rule is chosen from the modeled system.
- UI labels keep the previous Labs layout while renaming old game words into operator insertion, local fusion, OPE interval, Pauli recovery, resource contact, worldline exchange, scattering, gauge loop, spin-ice string, and domain-update language.
- Exports and physical histories record the physical action names so downstream analysis can distinguish the modeled manipulation from the old boardgame analogy.

## Mode-by-mode redesign summary

### Pauli-Frame Recovery Operators

The physical Clifford Reversi Lab is now a local Pauli-frame recovery system. A move applies a selected Pauli operator to any non-ancilla physical site, multiplies it with the current local Pauli state, applies the selected frame transform, and removes the site when the product returns to the identity. It no longer requires enclosing or flipping an opponent line. Measurements include local Pauli, connected-domain parity, line-interval parity, neighborhood stabilizer checks, stabilizer checks, and logical-cycle parity.

### Physical Clifford Field Operators

The physical Clifford Go Lab keeps the grid/contact UI but presents the mechanics as Pauli operator insertion and contact-driven field updates. Counts and history use operator/contact-removal language rather than capture language in the physical variant.

### Clifford and Virasoro Worldlines

The Jump-derived Labs are presented as graph worldline systems. Single-step movement is propagation, crossing an occupied site is exchange/scattering, and multi-step paths are multi-step scattering/worldline histories. The old jump wording has been removed from the physical status text and option labels where the Lab is modeling particles, braids, or operator transport.

### Anyon Fusion & Braiding Worldlines / Topological Memory Worldlines

Anyon modes emphasize mobile topological charges, braid words, inverse-braid recovery, fusion channels, vacuum recovery, logical memory, and exchange phases. Physical memory modes keep the same token UI while treating movement as worldline control rather than a jumping boardgame.

### Physical Anyon Charge Grid

The Reversi-like anyon Lab is presented as a local charge-fusion grid. A placement triggers charge fusion and topology seam transport for locally affected chains rather than ordinary color flipping.

### CFT Local OPE Operators

The physical Virasoro Reversi Lab has been refactored into a local CFT operator system. A move inserts a primary field at an empty graph vertex and propagates local OPE updates along nearby topology-aware graph rays. The OPE table updates channel labels, phase transport, stress proxies, entropy, and conformal-block estimators without requiring a boardgame bracket.

### CFT Field Insertion Graph

The physical Virasoro Go Lab is treated as a primary-field insertion graph on a discretized Riemann surface or graph manifold. Local graph/OPE contacts update fusion and stress observables; the UI and verification now describe local fusion rather than capture as the purpose of the update.

### Physical Cluster Field

The cluster Lab is a competing growth/resource-contact model. Empty neighbors are resource or oxygen contacts. A species can nucleate or grow from adjacent same-species material; zero-contact clusters undergo local extinction, annihilation, or confinement. Visible badges now show resource contacts instead of liberties.

### Particle Hopping / Reaction System

The particle Lab uses adjacent hopping, exchange/scattering over occupied interaction sites, multi-step scattering paths, and recombination of opposite charges. Path parity records exchange or braid-like worldline complexity.

### Spin & Phase Domain Game / Two-Phase Competition Game

These Labs already used physical energy rules. Their visible rule text now clarifies that optional line-interval rewrites are constrained spin/domain updates, not Reversi flips. Observables remain energy, domains, interfaces, nucleation, coarsening, and topology wrapping.

### Spin Ice Vertex Game

The board is an edge-variable system. Actions flip arrows, strings, loops, or monopole-moving paths; observables measure ice-rule violations, monopoles, strings, loop winding, energy, and defect density.

### Z2 Gauge Loop Game

The board is a gauge-edge system. Actions flip edges, paths, and loops; open strings create star-charge endpoints, closed loops preserve local constraints, and noncontractible loops update Wilson-loop/logical sectors.

## Verification

The algebraic local-game verification now checks the rewritten Pauli recovery and CFT local-OPE rules. The physical-problem verification confirms that the physical-mode definitions remain internally consistent.
