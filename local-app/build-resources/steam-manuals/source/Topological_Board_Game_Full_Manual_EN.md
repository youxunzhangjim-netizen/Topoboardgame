# Topological Board Game - Full Manual

Language: English

Topological Board Game is a board-game and research platform where familiar rules are played on unfamiliar spaces. Chess, Go, Reversi, Jump / Chinese Checkers, and Hex keep their original game identity, while topology, dimension, boundary conditions, lattice choices, robots, online rooms, and time-layer modes change the board on which those rules live.

## 1. Main Launcher

- Players enter normal game pages for quick play.
- Researchers enter Labs for reproducible discrete topological dynamics experiments.
- Life World is separate from Labs and focuses on cellular automata, artificial life, ecology, and species interaction.
- The globe icon switches English and Traditional Chinese.
- Home returns to the main launcher from game pages.

## 2. Common Interface

- Game board: the central interactive area.
- Game Controls: mode, board size, topology, boundary, lattice, robot, online, and new-game controls.
- Status card: current turn, winner, counts, clocks, warnings, or connection state.
- Move history: past moves and, in +1D modes, pending or replayed events.
- Chat panel: available in online pages.
- Camera controls: rotate, zoom, slice, focus, and reset options where available.

## 3. Input Controls

- 2D boards: click or tap a valid cell, intersection, or piece.
- 3D boards: rotate the board, then click the visible target site or face.
- 4D boards: select slices or projected layers, then choose a visible site.
- Mobile: tap controls; pinch or drag on supported boards.
- If a click seems blocked, rotate or zoom so the intended site is visible.

## 4. Board Spaces

- Standard open board: edges stop at the board boundary.
- Cylinder: one pair of opposite edges wraps.
- Torus: both edge directions wrap.
- Mobius strip: one edge wraps with a flip.
- Klein bottle: one direction wraps normally and the other wraps with orientation reversal.
- Sphere: a closed surface board, sometimes with pole sites or geodesic-style links.
- Projective plane / RP-style boundary: opposite boundary points are identified with reversal when supported.
- R3 / voxel volume: a 3D board volume.
- T3 / periodic volume: R3 with periodic boundary conditions.
- RBC / random boundary: a fixed random boundary connection map.

## 5. Lattices

- Square: the standard grid.
- Triangular: diagonal connections create triangular local cells.
- Honeycomb: hexagon-cell graph; Go usually plays on vertices, while Reversi and Hex may use faces depending on the page.
- BCC, FCC, HCP, and other 3D lattices: 3D neighbor structures where supported.
- Lattice choices change adjacency, legal paths, captures, flips, and connection tests.

## 6. Chess Rules

- Objective: checkmate the opponent king.
- King: moves one step in any legal adjacent direction and may not move into check.
- Queen: moves along legal straight lines.
- Rook: moves along orthogonal legal lines.
- Bishop: moves along diagonal legal lines.
- Knight: moves in the page's legal knight pattern.
- Pawn: advances according to the selected chess page rules and captures diagonally where supported.
- A move is illegal if it leaves your king in check.
- In topological and higher-dimensional boards, the displayed graph or geometry determines which directions and connections are legal.

## 7. Go Rules

- Objective: control more territory after captures and scoring.
- Stones are placed on intersections or graph vertices.
- A liberty is an adjacent empty point on the board graph.
- A connected group with no liberties is captured.
- Suicide, ko, superko, pass, komi, and scoring follow the selected page settings.
- On non-square topological boards, liberties and territories are counted through graph connectivity, not through a flat picture.
- Final scoring should label black and white territory clearly and include captures, komi, and dead-stone handling where the page supports it.

## 8. Reversi Rules

- Objective: finish with more discs than the opponent.
- A legal move places a disc so that one or more connected lines of opponent discs are bracketed between the new disc and an existing friendly disc.
- Bracketed discs flip to the player who moved.
- If no legal move exists, the turn may pass according to page rules.
- On topological boards, flip lines follow the board graph and available directions.
- For surface boards, some pages place discs on faces rather than vertices; follow the board explanation shown beside the controls.

## 9. Jump / Chinese Checkers Rules

- Objective: move your pieces into the target camp.
- A normal move goes to an adjacent empty site.
- A jump crosses an occupied neighboring site and lands on the empty site beyond it when the path is legal.
- Chain jumps may continue when supported.
- Topology changes the graph, so legal jumps follow shown connections.
- Robot turns should animate step by step so players can see the path.

## 10. Hex Rules

- Players are Blue and Orange.
- A move fills one empty Hex unit.
- Blue connects its two target zones.
- Orange connects its two target zones.
- There is no flipping, capture, movement, or pass by default.
- Standard 2D Hex usually uses a honeycomb-style cell board.
- Other topological Hex boards use explicit target zones or seams, not imaginary physical edges.
- A win is detected by graph connectivity through the player's filled cells.

## 11. Robots

- Robot mode lets a local player face the computer.
- Difficulty levels may change search depth, evaluation, rollout count, or heuristic strength.
- Stronger robots may use more time.
- If a robot move feels too fast to understand, use pages that expose animation speed or replay history.

## 12. Online Play

- Use Find Match for matchmaking when supported.
- Use Room controls to create or join a room.
- Online play depends on Firebase configuration.
- Email/password accounts require Email/Password sign-in to be enabled in Firebase Authentication.
- If online mode is developing for a feature, the page should say so clearly.

## 13. +1D Time Modes

### Future Mode

- A player chooses an action now.
- The action is scheduled for a future tick.
- The original board-game rule is checked when the action resolves.
- If legal at resolve time, it applies.
- If illegal at resolve time, it fails and should be shown in history.

### Past Mode

- Moves normally resolve immediately.
- A recent resolved event can be rewritten inside a fixed rewrite window.
- The rewrite replaces an event, then the timeline replays.
- If validation fails, the rewrite is rejected with a clear conflict message.
- No branch timeline is shown in the current UI.

### Past+Future Mode

- Players can schedule future actions and rewrite recent past actions.
- Later events are replayed and revalidated.
- Pending future actions may be cancelled or rescheduled before they resolve.

### Age And Go Time Period

- Age mode and noise can modify supported +1D games except where disabled.
- Go Time Period is a Go-specific time-period mode and should not be mixed into other games.
- Age counters and period counters are separate UI concepts.

## 14. Life World

- Life World is for cellular automata, artificial life, evolution, ecology, and species interaction.
- Basic play: Start, Step, Reset, Random seed, Draw, Erase, Inspect, species selection, and board size.
- Research controls: geometry, lattice, dimension, rule preset, B/S custom rule, neighborhood, noise, age, mutation, max generations, pattern JSON, observables, phase scanning, topology comparison, and experiment notebook.
- R3 Life uses a full 3D voxel volume.
- T3 periodic and RBC are R3 boundary-condition choices, not separate Life geometries.

## 15. Labs

- Labs is a research platform for discrete topological dynamics.
- It separates physics, mathematics, information, topology, graph dynamics, and research export from game progression.
- Labs pages emphasize topology, state space, local rule, dynamics, observables, experiment configuration, results, reproducibility, and export.
- Labs does not contain biological Life World models.

## 16. Saving And Export

- Many pages support JSON export/import.
- Labs and Life World may export observables, snapshots, experiment configs, CSV time series, or notebook entries.
- Keep exported files if you need reproducibility across versions.

## 17. Performance Tips

- Reduce board size for slow 3D or 4D boards.
- Prefer simpler lattices for older devices.
- Use WebGL-capable browsers and updated GPU drivers.
- For research scans, Web Workers or offline Python tools can improve responsiveness.

## 18. Support

Use the README and Troubleshooting PDF for installation, account, online, and reset help. For Steam Basic Info online manuals, use a documentation-only support URL. Do not link to the playable web launcher. The Steam version is the official desktop release.
