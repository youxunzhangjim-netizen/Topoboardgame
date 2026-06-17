# Topoboardgame External Robot Protocol

This protocol lets a local or research runner call an external robot written in Python, Rust, C++, Julia, JavaScript, or any other language.

The process is persistent. It reads one JSON object per line from stdin and writes one JSON object per line to stdout.

## Request

```json
{
  "type": "move",
  "requestId": "uuid",
  "game": "2dchess",
  "player": "white",
  "gameIndex": 0,
  "ply": 12,
  "depth": 2,
  "options": {
    "boundary": "random",
    "lattice": "square"
  },
  "legalMoves": [
    { "id": "6,4->4,4", "label": "♙ e2 → e4" }
  ],
  "state": {}
}
```

The robot must **only** return a move from `legalMoves`. The research runner validates the move again before applying it.

## Response

```json
{
  "requestId": "same uuid",
  "moveId": "6,4->4,4",
  "score": 12.5,
  "nodes": 340
}
```

Returning a full `move` object is also allowed, but `moveId` is preferred.

## Example commands

JavaScript random robot:

```bash
npm run research:selfplay -- --game 2dchess --botA externalA --externalA "node research/external-bots/random-jsonl-robot.mjs" --games 100
```

Python random robot:

```bash
npm run research:selfplay -- --game 2dgo --botA externalA --externalA "python3 research/external-bots/random_jsonl_robot.py" --games 100
```
