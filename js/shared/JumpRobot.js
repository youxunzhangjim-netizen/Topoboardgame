import { chooseJumpRobotMove } from './JumpRules.js';
export function chooseRobotMove(game, player = game.currentPlayer) { return chooseJumpRobotMove(game, player); }
export function analyzeJumpPosition(game, player = game.currentPlayer) {
  const moves = game.allLegalMoves(player);
  const best = chooseJumpRobotMove(game, player);
  return { player, legalCount: moves.length, bestMove: best, score: game.score(player), progress: game.targetProgress(player) };
}
