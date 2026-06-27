# Life World User Guide

Life World is the cellular-automata part of Topoboard. It can be played like a sandbox game: draw living cells, start time, watch patterns grow or disappear, and try challenges with one or more species.

## Basic Play

1. Choose a Life mode.
2. Pick Play controls unless you want the research tools.
3. Choose Draw, Erase, or Inspect.
4. Click or drag on the board to place or remove cells.
5. Use Start, Step, Reset, or Random seed from the toolbar.

The current beginner gameplay is unchanged: Start/Pause runs the automaton, Step advances one generation, Reset clears the board, and Random seed fills the board with a fresh starting pattern.

## Neighborhoods

Moore neighborhood means a cell sees nearby cells in every direction. On a square 2D board with radius 1, this is the familiar eight-neighbor Life rule.

Von Neumann neighborhood means a cell sees only axis-aligned neighbors. On a square 2D board with radius 1, this is up, down, left, and right.

Lattice nearest-neighbor mode follows the selected lattice instead of assuming square-grid directions. It is useful for triangular, honeycomb, and 3D lattices where "nearest" depends on the lattice geometry.

## Topology Choices

Topology controls what happens at the edge of the board.

- R2 open plane: edges stop; cells outside the board do not exist.
- T2 torus: left connects to right and top connects to bottom.
- Cylinder: one direction wraps and the other direction stays open.
- Mobius strip: one wrap flips orientation.
- Klein bottle: both directions wrap, with one direction flipped.
- Sphere S2 and RP2 projective plane: the visible board represents a curved or identified surface.
- R3 voxel, T3 periodic voxel, random/RBC 3D, and reflective 3D: 3D volume versions with open, periodic, randomized, or reflective boundary behavior.

Topology matters because the same local rule can survive, die, oscillate, or spread differently when edges connect in different ways.

## Patterns

The Pattern Library gives quick starting shapes such as a single cell, block, blinker, glider, random cloud, and two-species seed battle. Some patterns are disabled when the current dimension or neighborhood does not support them.

Pattern JSON import/export is still available for saving or sharing exact board states.

## Species Competition

With multiple species, living cells carry a species color. Births usually follow the dominant nearby species, while mutation and noise controls can create changes. Two-player modes use this to make local territory and survival meaningful.

## What To Watch

The Research view includes observables, but players can still use them as feedback:

- Population and density show how full the board is.
- Birth and death rates show whether the pattern is expanding or collapsing.
- Detected structures labels extinction, stable states, oscillators, moving candidates, or chaotic/unclassified behavior.
- Entropy and cluster size help explain whether cells are scattered or grouped.

## Mobile Tips

Use the Play tab for the compact controls. Research tools stay available, but large scans and comparison panels are easier on a desktop screen.
