import {
  RP2_BOARD_WIDTH,
  RP2_BOARD_HEIGHT,
  RP2_HOME_ROWS,
  RP2_KING_ROW_TYPES,
  RP2_PAWN_DIR,
  rp2Antipode,
  rp2CentralFiles,
  rp2SideSupportFiles,
  rp2PawnFiles
} from '../RP2Config.js';

export {
  RP2_BOARD_WIDTH,
  RP2_BOARD_HEIGHT,
  RP2_HOME_ROWS,
  RP2_KING_ROW_TYPES,
  RP2_PAWN_DIR,
  rp2Antipode,
  rp2CentralFiles,
  rp2SideSupportFiles,
  rp2PawnFiles
};

export function rp2IsPromotionSquare(color, x, y, width = RP2_BOARD_WIDTH, height = RP2_BOARD_HEIGHT) {
  const whiteRow = RP2_HOME_ROWS.white;
  const blackRow = RP2_HOME_ROWS.black;
  const central = rp2CentralFiles(width);
  if (color === 'white') return Number(y) === blackRow && central.includes(Number(x));
  return Number(y) === whiteRow && central.includes(Number(x));
}
