#!/usr/bin/env node
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
for await (const line of rl) {
  const text = line.trim();
  if (!text) continue;
  let msg;
  try { msg = JSON.parse(text); }
  catch { continue; }
  const legal = Array.isArray(msg.legalMoves) ? msg.legalMoves : [];
  const move = legal.length ? legal[Math.floor(Math.random() * legal.length)] : null;
  console.log(JSON.stringify({ requestId: msg.requestId, moveId: move?.id || move?.moveId || null, score: 0, nodes: 0 }));
}
