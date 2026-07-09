# Robot Book And Training Coverage

This note tracks the current local robot knowledge for Steam-safe builds. External engines and public research sources are used as references or optional offline teachers; they are not bundled into the Steam app.

## Current Coverage

| Game | UI Robot | Headless Self-Play | Opening Book | Strategy Book | Endgame Notes |
| --- | --- | --- | --- | --- | --- |
| Chess | yes | 2D, 3D | yes | yes | yes |
| Go | yes | 2D, 3D | yes | yes | yes |
| Reversi | yes | 2D, 3D | yes | yes | yes |
| Jump / Chinese Checkers | yes | 2D, 3D, 4D | yes | yes | yes, strategy-rule based |
| Hex / 六貫棋 | yes | 2D, 3D, 4D | yes, local priors | yes | yes, connection-rule based |

## Added Strategy Sources

- Chess uses Stockfish/Lichess-style opening and engine principles as normal-board references, with separate graph-topology rules for seam control, volume lanes, and non-flat board mobility.
- Go uses AlphaZero/KataGo-style policy-value and ownership concepts as references, plus graph-Go notes for liberties, separators, and topology-specific territory.
- Reversi uses Edax/WTHOR-style opening, parity, mobility, and exact late-game ideas, with graph-topology rules for valid rays and seam/cycle parity.
- Jump uses Chinese Checkers MCTS, reinforcement-learning, and endgame-database research as references for ladder paths, home-zone races, and replay-safe endgames.
- Hex uses MoHex/Benzene/NeuroHex research ideas as references for virtual connections, bridges, must-play cuts, edge templates, and connection endgames.

## Promotion Rule

Self-play smoke checks prove only that adapters and legal moves work. A trained model should be promoted to a public robot only after a held-out tournament against the current built-in robot and rule-engine legality verification. The interrupted 100-game run did not produce a completed model and should not be promoted.

