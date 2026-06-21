const STORAGE_KEY = 'topoboardgame:robot-learning-records';
const MAX_RECORDS = 400;

function safeRead() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function safeWrite(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    // Local learning cache is optional; ignore full or blocked storage.
  }
}

function accountAllowsLearning() {
  const state = globalThis.TopoboardgameAccountState || null;
  if (!state?.signedIn) return true;
  return state.allowRobotLearning !== false;
}

function compactRecord(record = {}) {
  return {
    id: record.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    source: record.source || 'anonymous-robot-play',
    gameType: String(record.gameType || record.game || 'unknown').slice(0, 40),
    variant: String(record.variant || '').slice(0, 60),
    topology: String(record.topology || '').slice(0, 60),
    mode: String(record.mode || '').slice(0, 40),
    robot: String(record.robot || record.robotName || 'local').slice(0, 60),
    player: String(record.player || '').slice(0, 20),
    moves: Array.isArray(record.moves) ? record.moves.slice(-260) : [],
    result: record.result || null,
    winner: record.winner || null,
    turnCount: Number(record.turnCount || record.moves?.length || 0) || 0,
    createdAt: new Date().toISOString()
  };
}

export function canRecordRobotLearning() {
  return accountAllowsLearning();
}

export function recordRobotLearningGame(record = {}) {
  if (!canRecordRobotLearning()) return false;
  const records = safeRead();
  records.push(compactRecord(record));
  safeWrite(records);
  return true;
}

export function recordRobotLearningMove(record = {}) {
  const move = {
    player: record.player || record.side || '',
    action: record.action || record.move || null,
    result: record.result || null,
    score: record.score ?? null,
    createdAt: new Date().toISOString()
  };
  return recordRobotLearningGame({
    ...record,
    source: record.source || 'robot-move',
    moves: [move],
    turnCount: 1
  });
}

export function listRobotLearningRecords() {
  return safeRead();
}

export function clearRobotLearningRecords() {
  safeWrite([]);
}

globalThis.TopoboardgameRobotLearning = {
  canRecord: canRecordRobotLearning,
  record: recordRobotLearningGame,
  recordMove: recordRobotLearningMove,
  list: listRobotLearningRecords,
  clear: clearRobotLearningRecords
};
