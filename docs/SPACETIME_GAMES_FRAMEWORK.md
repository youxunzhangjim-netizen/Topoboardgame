# 2+1D / 3+1D Space-Time Games Framework

Space-Time Games are first-class game layers next to 2D, 3D, and 4D. They are not a single special preset page. The launcher exposes 2+1D and 3+1D cards with Chess, Go, Reversi, and Jump options.

## Scope

Ordinary 2D / 3D / 4D Chess, Go, Reversi, and Jump keep their normal board rules. Time-dependent controls such as age, decay, rhythm, delayed action, and noise are reserved for the +1D modes.

Physics-only concepts such as momentum walks and Hamiltonian-inspired evolution are kept under Strategy & Systems Labs links. They are not shown as ordinary 2+1D / 3+1D game modes.

## General game presets

Each family has 2+1D and 3+1D variants:

- Chess: delayed action, periodic pieces, age / decay. No noise option.
- Go: delayed placement, periodic stones, age / decay. Optional noise is allowed.
- Reversi: delayed placement/flip, periodic pieces, age / decay. Optional noise is allowed.
- Jump: delayed step/jump, periodic jump pieces, age / decay. No noise option.

## Shared files

- `spacetime/index.html`
- `spacetime/js/TimeEngine.js`
- `spacetime/js/TimePiece.js`
- `spacetime/js/Scheduler.js`
- `spacetime/js/SpaceTimeRules.js`
- `spacetime/js/SpaceTimeUI.js`
- `spacetime/js/presets.js`

## Supported time fields

The reusable engine supports turn number, discrete timestep `dt`, age, lifetime/death, birth, delayed hidden actions, period/phase activation, cooldown, charge markers, hidden state, noise hooks, and internal fields such as spin, parity, energy, charge, species, and momentum for lab use.

## Player-facing explanation

Space-Time Games turn time into a strategic resource. Pieces can charge, wait, decay, vanish, reappear, or move according to rhythm and hidden plans.

## Research-facing explanation

These modes provide playable models of dynamical systems, delayed actions, periodic driving, hidden information, internal states, decay, and time-dependent rules on different topological spaces, while physics-only momentum/Hamiltonian tools remain in Strategy & Systems Labs.
