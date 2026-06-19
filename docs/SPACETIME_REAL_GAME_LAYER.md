# Space-Time Game Layer

The 2+1D and 3+1D entries are now launchers into the existing 2D and 3D game pages instead of separate simplified board prototypes.

## Design

- 2+1D Chess opens `2D/2dchess/` with `?spacetime=2p1&family=chess`.
- 2+1D Go opens `2D/2dgo/` with `?spacetime=2p1&family=go`.
- 2+1D Reversi opens `2D/2dreversi/` with `?spacetime=2p1&family=reversi`.
- 2+1D Jump opens `2D/jump/` with `?spacetime=2p1&family=jump`.
- 3+1D Chess opens `3D/3dchess/` with `?spacetime=3p1&family=chess`.
- 3+1D Go opens `3D/3dgo/` with `?spacetime=3p1&family=go`.
- 3+1D Reversi opens `3D/3dreversi/` with `?spacetime=3p1&family=reversi`.
- 3+1D Jump opens `3D/jump/` with `?spacetime=3p1&family=jump`.

The shared enhancer is `js/shared/SpaceTimeGameEnhancer.js`. It adds a +1D Time Layer panel to the original game page and keeps the original renderer, pieces, legal rules, online room controls, robot controls, topology controls, boundary controls, and lattice controls.

## Ordinary game vs lab separation

Ordinary 2+1D / 3+1D games expose only common game-time controls:

- time mode
- dt
- delay turns
- frequency / period
- lifetime
- old-age warning
- optional noise for Go and Reversi only

Chess and Jump do not show noise. Spin, phase-sector observables, parity, charge, Hamiltonian walks, and momentum systems remain in Strategy & Systems Labs.

## Online matching

When the enhancer is active, the online game key and match key include the +1D layer and time-setting signature. Exported network state also contains a `spaceTime` settings block so shared rooms preserve compatible time rules.
