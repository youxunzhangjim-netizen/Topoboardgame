# Future External Material And Mesh Bridge

This document describes a future architecture for connecting Topological Board Game and Topoboard Labs to professional material, geometry, mesh, and visualization tools.

This is planning documentation only. No runtime dependency, API connection, or Python bridge is added in this step.

## Planned Architecture

```text
Topological Board Game UI
  -> BoardSpec / ResearchBoardSpec
  -> optional local Python bridge
  -> pymatgen / ASE / spglib / Gmsh / meshio / PyVista / OVITO
  -> material databases through backend or local config
```

The UI remains responsible for finite discrete boards, gameplay rules, Lab controls, measurements, replay, and export. External tools should prepare reliable structures, meshes, and scientific geometry data that can be compiled into a validated board specification.

## BoardSpec Boundary

`BoardSpec` and future `ResearchBoardSpec` are the boundary between the application and external scientific tooling.

The external side may produce:

- atomic sites
- graph nodes
- mesh vertices
- cell centers
- bonds or edges
- faces or plaquettes
- periodic images
- species labels
- defect metadata
- provenance

Topoboard should not trust imported data until it passes validation. Imported boards should remain Research/Debug only until validated and reviewed.

## Local Python Bridge

The desktop version may later support an optional local Python bridge.

Possible Python tools:

- `pymatgen` for crystal structures, Materials Project objects, CIF/POSCAR handling, symmetry-adjacent workflows
- `ASE` for atomistic structures and file conversion
- `spglib` for symmetry and primitive/conventional cell operations
- `Gmsh` for external mesh generation
- `meshio` for mesh file conversion
- `PyVista` for mesh inspection and VTK-style output
- `OVITO` as an external visualization/export target

The bridge should be optional. The Steam game must still run without Python installed.

## API Keys And Database Access

Do not store API keys in frontend code.

Materials Project requires an API key. Other database services may also require keys, account tokens, or institutional access.

For the web version:

- database access should go through a backend service
- API keys must stay server-side
- rate limits and user identity should be handled by the backend
- imported results should be converted into a validated BoardSpec before use

For the desktop version:

- database access may use a local config file chosen by the user
- local config must not be packaged with public builds
- credentials should not be uploaded to Steam Cloud by default

## Import Before Live Connections

File import/export should come before live API connections.

Recommended order:

1. Manual internal presets
2. BoardSpec JSON import/export
3. CIF/POSCAR/XYZ import through optional local tooling
4. Mesh import through optional local tooling
5. Local Python bridge
6. Backend-assisted material database lookup
7. Live database workflows

This keeps the Steam release stable and avoids coupling gameplay to external services.

## Gmsh Policy

Gmsh should remain optional and external.

Reasons:

- package size can be large
- licensing and redistribution need careful review
- mesh generation can be slow
- the game should not require a meshing engine for ordinary play

If used later, Gmsh output should be converted into a BoardSpec or ResearchBoardSpec and validated before use.

## OVITO And ParaView Policy

OVITO and ParaView should be export targets, not required dependencies.

Topoboard may export:

- XYZ
- CSV
- VTK/VTU
- XDMF
- JSON metadata
- trajectory-like snapshots

Users can then inspect data in OVITO, ParaView, PyVista, or other scientific visualization tools. The game should not depend on those tools at runtime.

## Chinese Summary

專業工具負責精準材料、幾何、mesh 與高階視覺化；Topological Board Game 負責有限離散棋盤、棋類規則、Labs 操作、測量、回放與匯出。
