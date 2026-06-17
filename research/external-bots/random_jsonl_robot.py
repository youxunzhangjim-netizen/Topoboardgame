#!/usr/bin/env python3
import json, random, sys

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
    except Exception:
        continue
    legal = msg.get('legalMoves') or []
    move = random.choice(legal) if legal else None
    print(json.dumps({
        'requestId': msg.get('requestId'),
        'moveId': (move or {}).get('id') or (move or {}).get('moveId'),
        'score': 0,
        'nodes': 0
    }), flush=True)
