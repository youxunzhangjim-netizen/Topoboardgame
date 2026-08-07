import assert from 'node:assert/strict';
import { BoardSetup } from '../2D/2dchess/js/BoardSetup.js';
import {
  applyMoveToState,
  getAllLegalMoves,
  normalizeState
} from '../2D/2dchess/js/robot/ChessRobotAdapter.js';
import { chooseRobotMoveFromState } from '../2D/2dchess/js/robot/ChessSearch.js';

function moveKey(move) {
  const square = (coord) => `${String.fromCharCode(97 + coord.c)}${8 - coord.r}`;
  return `${square(move.from)}${square(move.to)}`;
}

function initialState(boundaryCondition) {
  return normalizeState({
    board: BoardSetup.createInitialBoard(),
    currentPlayer: 'white',
    boundaryCondition,
    randomBoundarySeed: '',
    randomBoundaryEntries: [],
    enPassantTarget: null,
    halfMoveClock: 0,
    positionHistory: [],
    moveHistory: [],
    gameOver: false,
    winner: null,
    draw: false
  });
}

function playByKey(state, key) {
  const legal = getAllLegalMoves(state, state.currentPlayer);
  const move = legal.find((candidate) => moveKey(candidate) === key);
  assert.ok(move, `expected ${key} to be legal for ${state.currentPlayer}`);
  return applyMoveToState(state, move);
}

function assertRobotMove(state, allowedKeys, label) {
  const result = chooseRobotMoveFromState(state, 3);
  assert.ok(result.move, `${label}: robot should choose a move`);
  const key = moveKey(result.move);
  assert.ok(
    allowedKeys.includes(key),
    `${label}: expected one of ${allowedKeys.join(', ')}, got ${key} (${result.openingBook || result.bookMoveConsidered || 'no book'})`
  );
  assert.ok(result.openingBook || result.bookMoveCommitted, `${label}: early move should come from the opening book`);
  return result;
}

for (const boundary of ['forbidden', 'open']) {
  let state = initialState(boundary);
  const firstMove = assertRobotMove(state, ['e2e4'], `${boundary} first white move`);
  assert.equal(firstMove.move.pawnDoubleJump, true, `${boundary} first white move should use the legal two-square pawn advance`);

  state = playByKey(state, 'e2e4');
  assertRobotMove(state, ['e7e5', 'c7c5'], `${boundary} black reply to 1.e4`);

  state = playByKey(state, 'e7e5');
  assertRobotMove(state, ['g1f3'], `${boundary} white develops after 1.e4 e5`);

  state = playByKey(state, 'g1f3');
  assertRobotMove(state, ['b8c6'], `${boundary} black develops after 1.e4 e5 2.Nf3`);

  state = initialState(boundary);
  state = playByKey(state, 'd2d4');
  assertRobotMove(state, ['d7d5', 'g8f6'], `${boundary} black reply to 1.d4`);

  state = initialState(boundary);
  for (const key of ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6']) {
    state = playByKey(state, key);
  }
  assertRobotMove(state, ['e1g1'], `${boundary} white castles after normal king-side development`);
}

console.log('Chess robot opening strategy verification passed.');
