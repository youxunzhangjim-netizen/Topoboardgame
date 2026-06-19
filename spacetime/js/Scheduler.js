export class Scheduler {
  constructor(events = []) {
    this.events = [];
    for (const event of events) this.schedule(event);
  }

  schedule(event = {}) {
    if (!Number.isFinite(Number(event.turn))) throw new Error('Scheduled events require a numeric turn.');
    const entry = {
      id: event.id || `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      turn: Number(event.turn),
      type: event.type || 'custom',
      pieceId: event.pieceId || null,
      payload: event.payload ? structuredClone(event.payload) : {},
      hidden: Boolean(event.hidden)
    };
    this.events.push(entry);
    this.events.sort((a, b) => a.turn - b.turn || a.id.localeCompare(b.id));
    return entry;
  }

  due(turn) {
    const ready = [];
    const waiting = [];
    for (const event of this.events) (event.turn <= turn ? ready : waiting).push(event);
    this.events = waiting;
    return ready;
  }

  clear() {
    this.events = [];
  }

  toJSON({ revealHidden = true } = {}) {
    return this.events.map((event) => {
      if (revealHidden || !event.hidden) return structuredClone(event);
      return { id: event.id, turn: event.turn, type: event.type, pieceId: event.pieceId, hidden: true, payload: { hidden: true } };
    });
  }

  import(events = []) {
    this.clear();
    for (const event of events) this.schedule(event);
  }
}
