# Life World Research Guide

Life World can also be used as a small experimental lab for cellular automata on different topologies. The goal is to compare how local update rules behave when the underlying space, lattice, neighborhood, noise, age, mutation, and seed are controlled.

## Reproducible Experiment Setup

For serious comparisons, record:

- Geometry and topology.
- Lattice.
- Dimension and board size.
- Neighborhood type, metric, and radius.
- Rule preset or custom B/S rule.
- Noise, age, mutation, and species settings.
- Random seed and seed density.
- Number of generations.

The Experiment Notebook stores these locally in the browser. It does not require an account and does not use Firebase.

## Observables

The observable panel reports:

- Generation, population, density.
- Population growth rate.
- Birth rate and death rate.
- Species fractions.
- Mean age and age distribution.
- Cluster count, largest cluster, and connected component size distribution.
- Entropy and spatial correlation.
- Center of mass and radius of activity.
- Bounding box area or volume.
- Extinction time, survival time, oscillation, recurrence hash period estimate, and front velocity.
- Compression ratio proxy.
- Approximate detected structures.

Exports include rule, topology, neighborhood metadata, time-series CSV, and full experiment JSON.

## Phase Diagram Scanning

The Phase Diagram Scanner compares small sets of 2D Life-like B/S rules. It intentionally starts with a small safe subset instead of scanning all possible rules. Each rule is run across several random seeds and classified as:

- extinction,
- stable/frozen,
- oscillator,
- growing,
- chaotic/active.

The scanner uses a Web Worker when available so the UI remains responsive. If Workers are blocked, it falls back to the same computation on the main thread with the small safe defaults.

## Topology Comparison

Topology Compare runs the same rule, random seed, seed density, lattice, and neighborhood across 2 to 4 geometries. It compares final population, survival time, oscillation period, entropy, largest cluster, and extinction/survival status.

Use this when asking: "Does this rule behave differently because of the boundary identification?"

## Benchmark Helper

The performance readout in Research view runs repeated random trials and reports:

- generations per second,
- board size,
- dimension,
- average active cell count.

The main visible board still runs on the main thread for simple player interaction. Benchmark and scan workloads use Workers when possible.

## Interpreting Results Safely

Life World is an exploratory tool. Some modes are toy visualizations, some are discrete estimators, and none should be treated as a validated physical or biological model without external checks.

Use repeated seeds, fixed configuration records, exported JSON/CSV, and topology comparison before drawing conclusions.
