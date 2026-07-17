# Life Research Mode

## 1. Purpose

Life Research Mode is a finite discrete playground for cellular automata, ecology, lattice defects, domain walls, and lattice-breaking experiments. It lets users study how local update rules interact with topology, neighborhood choice, species labels, stochasticity, and intentionally modified connectivity.

The mode is designed for reproducible experiments: choose a board, rule, seed, initial pattern, optional defect layer, and observables, then export JSON or CSV for later comparison.

## 2. What It Is Not

Life Research Mode is not a professional materials solver, a high-precision dislocation dynamics simulator, or a calibrated physical model. Defects, dislocations, grain boundaries, and inclusions are represented as finite discrete changes to a cellular automaton substrate.

The useful claim is modest: these tools help explore qualitative behavior and finite graph observables. Quantitative materials claims require dedicated validation and external scientific software.

## 3. Initial Patterns

- Random: uniform or clustered stochastic seeding controlled by a deterministic seed.
- Seed: one or more compact living-cell colonies.
- Droplet: a filled circular or spherical active region.
- Domain wall: two phases or species separated by an interface.
- Stripe: alternating bands of activity or phase labels.
- Ring: an annular front of active cells.
- Wavefront: a propagating or expanding front-like initial state.
- Crystal patch: a local ordered seed such as checkerboard, triangular, or hex-like patches.
- Grain boundary seed: two regions with different orientation labels or weakened cross-boundary interactions.
- Defect pair: two marked impurities or defect centers.
- Dislocation dipole: a toy pair of opposite edge-dislocation cores represented by local connectivity changes.

All research presets should support deterministic seeds when randomness is used.

## 4. Defects

- Vacancy: removes or deactivates selected sites so they cannot become alive.
- Impurity: leaves a site active but applies a local rule or weight modifier.
- Pinned site: fixes a site as alive, dead, or assigned to a species.
- Crack: removes neighbor interactions across a path or line.
- Grain boundary: labels regions with different orientation tags and can weaken cross-boundary interactions.
- Edge dislocation: approximates a missing or shifted half-plane in a 2D lattice through local edge changes and Burgers-vector metadata.
- Screw dislocation: a developing 3D placeholder until full helical seam support is implemented.
- Inclusion: a circular, spherical, or region-based local modifier such as an obstacle, nutrient patch, poison patch, or alternate phase.
- Slip line: a line where neighbor interactions are weakened or shifted.

Defects modify the substrate and local interactions. They are not ordinary living cells.

## 5. Observables

- Cluster count: number of connected living components.
- Interface length: number of neighboring pairs with different states or species.
- Domain wall length: interface length excluding empty-living boundaries.
- Defect count: number of enabled defect objects.
- Crack length: number of blocked or modified crack edges.
- Dislocation core count: number of marked dislocation defects.
- Front velocity estimate: optional finite-difference estimate when history is available.

These are finite discrete observables, not continuum measurements.

## 6. Safety

Large boards can run slowly. Normal mode uses conservative limits; Research mode allows larger experiments but warns before expensive runs. Unsupported defect/lattice combinations are disabled rather than allowed to freeze the page.

If an initial pattern fails, the UI falls back to a safe clustered or colony preset. If a defect layer fails validation, the defect layer is disabled while Life continues running. JSON and CSV export are available for reproducibility.

## Chinese Summary

- Life Research Mode = Life 研究模式
- Initial Pattern = 初始圖案
- Defect Layer = 缺陷層
- Domain Wall = 相域牆
- Droplet = 液滴
- Dislocation = 位錯
- Grain Boundary = 晶界

Life 研究模式是一個有限離散平台，用於探索細胞自動機、生態、相域牆、缺陷與破壞晶格的局部規則。它不宣稱是高精度材料模擬器；缺陷與位錯在此是圖與格點連接上的離散近似。大型棋盤會觸發安全限制，不能支援的缺陷會被停用，以避免白屏或卡死。
