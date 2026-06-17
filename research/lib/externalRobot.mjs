import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export class ExternalRobotProcess {
  constructor(commandLine, { name = 'external' } = {}) {
    if (!commandLine) throw new Error('ExternalRobotProcess requires a command line.');
    this.name = name;
    const parts = splitCommand(commandLine);
    this.child = spawn(parts[0], parts.slice(1), { stdio: ['pipe', 'pipe', 'inherit'] });
    this.pending = new Map();
    this.buffer = '';
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => this.handleData(chunk));
    this.child.on('exit', (code) => {
      for (const { reject } of this.pending.values()) reject(new Error(`${name} exited with code ${code}`));
      this.pending.clear();
    });
  }
  handleData(chunk) {
    this.buffer += chunk;
    let index;
    while ((index = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); }
      catch { continue; }
      const requestId = msg.requestId;
      const slot = this.pending.get(requestId);
      if (!slot) continue;
      this.pending.delete(requestId);
      slot.resolve(msg);
    }
  }
  requestMove(payload, timeoutMs = 5000) {
    const requestId = randomUUID();
    const message = { ...payload, type: 'move', requestId };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`${this.name} timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      this.pending.set(requestId, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject });
      this.child.stdin.write(`${JSON.stringify(message)}\n`);
    });
  }
  close() {
    try { this.child.stdin.end(); } catch {}
    try { this.child.kill(); } catch {}
  }
}

function splitCommand(commandLine) {
  const out = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < commandLine.length; i += 1) {
    const ch = commandLine[i];
    if ((ch === '"' || ch === "'") && !quote) { quote = ch; continue; }
    if (quote === ch) { quote = null; continue; }
    if (!quote && /\s/.test(ch)) {
      if (current) { out.push(current); current = ''; }
      continue;
    }
    current += ch;
  }
  if (current) out.push(current);
  return out;
}
