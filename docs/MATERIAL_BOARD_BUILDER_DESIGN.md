# Material Board Builder Design

This document designs a future Material Board Builder for Topoboard Labs.

This is planning documentation only. Do not implement these integrations yet.

## Purpose

The Material Board Builder will convert material structures, geometry files, or mesh data into a validated `ResearchBoardSpec`.

It should support scientific workflows without changing the ordinary board-game rules. The output is a finite discrete board object that Labs can measure, replay, and export.

## 1. Sources

Supported sources should be added gradually.

Initial safe sources:

- Manual
- Existing internal presets
- BoardSpec JSON

Future file sources:

- CIF
- POSCAR
- XYZ
- Mesh import

Future database sources:

- Materials Project
- OPTIMADE
- NOMAD

Rules:

- File import/export should arrive before live database connections.
- Database API keys must never be stored in frontend code.
- Web database access requires a backend.
- Desktop database access may later use local user config.

## 2. Structure Operations

The builder should expose structure operations as reproducible steps.

Operations:

- make supercell
- choose primitive/conventional cell
- choose periodic axes
- choose neighbor method
- build graph

Neighbor methods may include:

- fixed cutoff
- nearest neighbors
- Voronoi-like neighbors
- bond table from imported data
- lattice-coordinate adjacency
- mesh-edge adjacency

Every operation should be stored in provenance so the board can be regenerated.

## 3. Defect Operations

Defects should be explicit operations, not silent geometry edits.

Planned defect operations:

- vacancy
- substitution
- interstitial
- displacement
- strain
- surface/slab
- grain boundary
- dislocation line
- void/pore
- impurity cluster
- bond deletion/weakening

Each defect should record:

- defect type
- affected sites or bonds
- parameters
- coordinate frame
- random seed if stochastic
- before/after counts

## 4. Compile To ResearchBoardSpec

The compiled board should extend BoardSpec with research metadata.

Required compiled data:

- sites
- edges
- species
- positions
- periodic images
- defects
- fields
- observables
- provenance

Possible `ResearchBoardSpec` fields:

```json
{
  "schema": "topoboard.research-board.v0",
  "baseBoardSpec": "topoboard.board.v0",
  "species": [],
  "positions": [],
  "periodicImages": [],
  "defects": [],
  "fields": {},
  "observables": [],
  "provenance": {}
}
```

The builder must validate:

- unique site ids
- valid edges
- graph connectivity if required
- periodic images
- species labels
- coordinate units
- defect references
- board size limits
- Lab compatibility

## 5. Labs Connection

Material-derived boards should connect to Labs only after validation.

Potential Lab connections:

- spin/domain Labs
- phase/cluster Labs
- defect diffusion toy Labs
- gauge/bond Labs
- topology/connection Labs

Compatibility examples:

- spin/domain Labs need graph neighbors and local site states
- phase/cluster Labs need connected components and local update rules
- defect diffusion toy Labs need sites, edges, and defect tags
- gauge/bond Labs need edges and preferably faces/plaquettes
- topology/connection Labs need graph structure and boundary/gluing metadata

Do not fake missing topology data. If a Lab requires faces or plaquettes and the imported board does not provide them, the Lab should be disabled or a fallback offered.

## 6. Export

The builder should export both Topoboard-native and scientific formats.

Topoboard exports:

- `topoboard.json`
- JSON
- CSV

Scientific exports:

- XYZ
- VTK/VTU/XDMF
- CIF/POSCAR if possible

Export metadata should include:

- source file or source service
- import parameters
- structure operations
- defect operations
- graph construction method
- units
- app version
- hash/checksum
- validation result

## Safety Rules

- Imported boards are Research/Debug only by default.
- Imported boards must not be allowed in online ranked or public rooms by default.
- Labs must not run on imported boards until validation passes.
- Oversized boards should require Research mode or be rejected.
- External tools should be optional.
- No runtime dependency should be added until the bridge is explicitly implemented and tested.

## Implementation Order

Recommended order:

1. BoardSpec JSON export/import
2. ResearchBoardSpec draft schema
3. manual material-like preset
4. local file import prototype
5. local Python bridge prototype
6. mesh export prototype
7. backend design for database access
8. guarded database lookup
9. research validation suite

This keeps the Steam build stable while preparing the scientific workflow.
