import { createPiece, MAIN_ROW, BOARD_WIDTH, BOARD_HEIGHT, HOME_ROWS, PAWN_DIR } from '../BoardSetup.js';
import {
  KLEIN_BOARD_WIDTH,
  KLEIN_BOARD_HEIGHT,
  createKleinInitialPieces,
  kleinIsPromotionSquare,
  KLEIN_PAWN_DIR
} from '../KleinBottleConfig.js';
import {
  SPHERE_BOARD_WIDTH,
  SPHERE_BOARD_HEIGHT,
  createSphereInitialPieces,
  sphereResolveTarget,
  sphereIsPromotionSquare,
  SPHERE_PAWN_DIR
} from '../SphereConfig.js';
import {
  RP2_BOARD_WIDTH,
  RP2_BOARD_HEIGHT,
  rp2Antipode,
  rp2CentralFiles,
  rp2SideSupportFiles,
  rp2PawnFiles,
  rp2IsPromotionSquare,
  RP2_HOME_ROWS,
  RP2_PAWN_DIR,
  RP2_KING_ROW_TYPES
} from './RP2HeadlessConfig.js';
import { SeededRandom } from '../../../../js/probability/SeededRandom.js';

const CUBE_SIZE = 8;
const TORUS_HEIGHT = 14;
const TORUS_HOME_ROWS = { white: 9, black: 2 };
const HOME_SHEETS = { white: 0, black: 1 };
const MOBIUS_HOME_ROWS = { white: HOME_ROWS.white, black: HOME_ROWS.white };
const PROMOTION_TYPES = ['Q', 'R', 'B', 'N'];

function wrap(value, size) { return ((value % size) + size) % size; }
function reflect(value, size) {
  if (size <= 1) return 0;
  let v = value;
  while (v < 0 || v >= size) {
    if (v < 0) v = -v - 1;
    if (v >= size) v = (2 * size) - v - 1;
  }
  return v;
}
function clonePiece(piece) { return piece ? { ...piece } : null; }
function other(color) { return color === 'white' ? 'black' : 'white'; }
function key3(x, y, z) { return `${x},${y},${z}`; }
function key2(x, y, sheet = 0) { return `${sheet},${y},${x}`; }
function normalizeText(value) { return String(value || '').toLowerCase().replace(/[\s_-]+/g, ''); }

export function normalize3DChessMode(options = {}) {
  const raw = normalizeText(options.variant || options.geometry || options.topology || options.boundary || 'cube');
  if (['cube', 'r3', 'open', 'forbidden', 'standard'].includes(raw)) return { variant: 'cube', boundaryCondition: 'forbidden' };
  if (['t3', 'periodic', 'pbc', 'periodiccube', 'toruscube'].includes(raw)) return { variant: 'cube', boundaryCondition: 'periodic' };
  if (['reflection', 'reflective', 'mirror'].includes(raw)) return { variant: 'cube', boundaryCondition: 'reflection' };
  if (['random', 'rbc', 'r3random'].includes(raw)) return { variant: 'cube', boundaryCondition: 'random' };
  if (['t2', 'torus', 'flat torus', 'torus2d'].includes(raw)) return { variant: 'torus', boundaryCondition: 'periodic' };
  if (['mobius', 'möbius'].includes(raw)) return { variant: 'mobius', boundaryCondition: 'mobius' };
  if (['klein', 'kleinbottle'].includes(raw)) return { variant: 'klein', boundaryCondition: 'klein_bottle' };
  if (['sphere', 's2'].includes(raw)) return { variant: 'sphere', boundaryCondition: 'sphere' };
  if (['rp2', 'projective', 'projectiveplane'].includes(raw)) return { variant: 'rp2', boundaryCondition: 'rp2' };
  return { variant: 'cube', boundaryCondition: 'forbidden' };
}

function cubeRandomExitKey(x, y, z, dx, dy, dz) {
  return `${x},${y},${z}:${Math.sign(dx)},${Math.sign(dy)},${Math.sign(dz)}`;
}

function cubeBoundaryTargets(size = CUBE_SIZE) {
  const targets = [];
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (x === 0 || y === 0 || z === 0 || x === size - 1 || y === size - 1 || z === size - 1) targets.push([x, y, z]);
      }
    }
  }
  return targets;
}

function createCubeRandomBoundaryMap(seed = 'headless-3dchess-rbc', size = CUBE_SIZE) {
  const rng = new SeededRandom(seed);
  const targets = cubeBoundaryTargets(size);
  const entries = [];
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dz = -1; dz <= 1; dz += 1) {
              if (!dx && !dy && !dz) continue;
              if (x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size && z + dz >= 0 && z + dz < size) continue;
              let target = targets[rng.integer(targets.length)] || [x, y, z];
              if (targets.length > 1 && target[0] === x && target[1] === y && target[2] === z) {
                const index = targets.findIndex(([tx, ty, tz]) => tx === x && ty === y && tz === z);
                target = targets[(index + 1) % targets.length];
              }
              entries.push([cubeRandomExitKey(x, y, z, dx, dy, dz), target]);
            }
          }
        }
      }
    }
  }
  return entries;
}

export class Headless3DChessGame {
  constructor(options = {}) {
    const mode = normalize3DChessMode(options);
    this.variant = mode.variant;
    this.boundaryCondition = mode.boundaryCondition;
    this.lattice = options.lattice || 'chess3d';
    this.size = this.variant === 'cube' ? CUBE_SIZE : null;
    this.randomBoundarySeed = options.seed || 'headless-3dchess-rbc';
    this.randomBoundaryMap = new Map();
    this.currentPlayer = 'white';
    this.gameOver = false;
    this.winner = null;
    this.draw = false;
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.enPassantTarget = null;
    this.gameStarted = false;
    this.setupBoard3D();
  }

  get dimension() { return this.variant === 'cube' ? 3 : 2; }

  defaultBoundaryCondition() { return this.boundaryCondition; }
  opponentOf(color) { return other(color); }

  boardWidth() {
    if (this.variant === 'klein') return KLEIN_BOARD_WIDTH;
    if (this.variant === 'sphere') return SPHERE_BOARD_WIDTH;
    if (this.variant === 'rp2') return RP2_BOARD_WIDTH;
    return BOARD_WIDTH;
  }
  boardHeight() {
    if (this.variant === 'torus') return TORUS_HEIGHT;
    if (this.variant === 'klein') return KLEIN_BOARD_HEIGHT;
    if (this.variant === 'sphere') return SPHERE_BOARD_HEIGHT;
    if (this.variant === 'rp2') return RP2_BOARD_HEIGHT;
    return BOARD_HEIGHT;
  }
  depth() { return this.variant === 'cube' ? CUBE_SIZE : (this.variant === 'mobius' ? 2 : 1); }

  createEmptyBoard() {
    return Array.from({ length: this.depth() }, () => Array.from({ length: this.boardHeight() }, () => Array(this.boardWidth()).fill(null)));
  }

  setupBoard3D() {
    this.board = this.createEmptyBoard();
    if (this.variant === 'cube') return this.setupCubeBoard();
    if (this.variant === 'torus') return this.setupTorusBoard();
    if (this.variant === 'mobius') return this.setupMobiusBoard();
    if (this.variant === 'klein') return this.setupConfigPieces(createKleinInitialPieces(), KLEIN_PAWN_DIR);
    if (this.variant === 'sphere') return this.setupConfigPieces(createSphereInitialPieces(), SPHERE_PAWN_DIR);
    if (this.variant === 'rp2') return this.setupRP2Board();
  }

  setupCubeBoard() {
    if (this.boundaryCondition === 'random') {
      this.randomBoundaryMap = new Map(createCubeRandomBoundaryMap(this.randomBoundarySeed, CUBE_SIZE));
    }
    for (let x = 0; x < CUBE_SIZE; x += 1) {
      this.placePiece(x, 0, 0, 'white', MAIN_ROW[x]);
      this.placePiece(x, 1, 0, 'white', 'P');
      this.placePiece(x, 0, 1, 'white', 'P');
      this.placePiece(x, 1, 1, 'white', 'P');
      this.placePiece(x, 7, 7, 'black', MAIN_ROW[x]);
      this.placePiece(x, 6, 7, 'black', 'P');
      this.placePiece(x, 7, 6, 'black', 'P');
      this.placePiece(x, 6, 6, 'black', 'P');
    }
  }

  setupTorusBoard() {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      for (const color of ['white', 'black']) {
        const homeRow = TORUS_HOME_ROWS[color];
        this.setPiece(x, homeRow, 0, createPiece(color, MAIN_ROW[x]));
        for (const row of [homeRow + PAWN_DIR[color], homeRow - PAWN_DIR[color]].filter((r) => r >= 0 && r < TORUS_HEIGHT)) {
          const pawn = createPiece(color, 'P');
          pawn.pawnDirection = row < homeRow ? -1 : row > homeRow ? 1 : PAWN_DIR[color];
          this.setPiece(x, row, 0, pawn);
        }
      }
    }
  }

  setupMobiusBoard() {
    for (const color of ['white', 'black']) {
      const sheet = HOME_SHEETS[color];
      const homeRow = MOBIUS_HOME_ROWS[color];
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        this.setPiece(x, homeRow, sheet, createPiece(color, MAIN_ROW[x]));
        for (const row of [homeRow + PAWN_DIR[color], homeRow - PAWN_DIR[color]].filter((r) => r >= 0 && r < BOARD_HEIGHT)) {
          const pawn = createPiece(color, 'P');
          pawn.pawnDirection = row < homeRow ? -1 : row > homeRow ? 1 : PAWN_DIR[color];
          this.setPiece(x, row, sheet, pawn);
        }
      }
    }
  }

  setupConfigPieces(pieces, pawnDir) {
    for (const { color, type, x, y } of pieces) {
      const piece = createPiece(color, type);
      if (type === 'P') piece.pawnDirection = pawnDir[color] || PAWN_DIR[color];
      this.setPiece(x, y, 0, piece);
    }
  }

  setupRP2Board() {
    const homeRow = RP2_HOME_ROWS.white;
    const white = [];
    for (const y of [homeRow - 1, homeRow + 1]) for (const x of rp2PawnFiles()) white.push({ x, y, type: 'P' });
    for (const x of rp2SideSupportFiles()) white.push({ x, y: homeRow, type: 'P' });
    rp2CentralFiles().forEach((x, index) => white.push({ x, y: homeRow, type: RP2_KING_ROW_TYPES[index] }));
    for (const p of white) {
      const w = createPiece('white', p.type);
      if (p.type === 'P') w.pawnDirection = RP2_PAWN_DIR.white;
      this.setPiece(p.x, p.y, 0, w);
      const mirror = rp2Antipode(p.x, p.y);
      const b = createPiece('black', p.type);
      if (p.type === 'P') b.pawnDirection = RP2_PAWN_DIR.black;
      this.setPiece(mirror.x, mirror.y, 0, b);
    }
  }

  placePiece(x, y, z, color, type) { this.setPiece(x, y, z, createPiece(color, type)); }

  validCells() {
    const out = [];
    for (let z = 0; z < this.depth(); z += 1) for (let y = 0; y < this.boardHeight(); y += 1) for (let x = 0; x < this.boardWidth(); x += 1) {
      if (this.isValidCell(x, y, z)) out.push({ x, y, ...(this.variant === 'cube' ? { z } : { sheet: z }) });
    }
    return out;
  }

  isValidCell(x, y, z = 0) {
    if (this.variant === 'sphere') return y >= 1 && y <= this.boardHeight() - 2 && x >= 0 && x < this.boardWidth() && z === 0;
    return z >= 0 && z < this.depth() && x >= 0 && x < this.boardWidth() && y >= 0 && y < this.boardHeight();
  }
  inBounds(x, y, z = 0) { return this.isValidCell(x, y, z); }

  canonicalCoord(x, y, layer = 0) {
    if (this.variant === 'cube') return { x: Number(x), y: Number(y), z: Number(layer) };
    const coord = this.resolveSurfaceTarget(x, y, layer, 0, 0);
    return { x: coord?.x ?? Number(x), y: coord?.y ?? Number(y), sheet: coord?.sheet ?? 0 };
  }

  getPiece(x, y, layer = 0) {
    const coord = this.variant === 'cube' ? { x, y, z: layer } : this.canonicalCoord(x, y, layer);
    const z = coord.z ?? coord.sheet ?? 0;
    if (!this.isValidCell(coord.x, coord.y, z)) return null;
    return this.board[z]?.[coord.y]?.[coord.x] || null;
  }

  setPiece(x, y, layer, piece) {
    const coord = this.variant === 'cube' ? { x, y, z: layer } : this.canonicalCoord(x, y, layer);
    const z = coord.z ?? coord.sheet ?? 0;
    if (!this.isValidCell(coord.x, coord.y, z)) return;
    this.board[z][coord.y][coord.x] = piece;
  }

  sameCoord(a, b) {
    if (!a || !b) return false;
    return Number(a.x) === Number(b.x) && Number(a.y) === Number(b.y) && Number(a.z ?? a.sheet ?? 0) === Number(b.z ?? b.sheet ?? 0);
  }

  coordKey(c) { return this.variant === 'cube' ? key3(c.x, c.y, c.z ?? 0) : key2(c.x, c.y, c.sheet ?? 0); }
  uniqueMoves(moves) {
    const seen = new Set();
    return moves.filter((move) => {
      if (!move) return false;
      const key = this.coordKey(move);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getLegalMoves(x, y, layer = 0) {
    const piece = this.getPiece(x, y, layer);
    if (!piece || piece.color !== this.currentPlayer) return [];
    const origin = this.variant === 'cube' ? { x, y, z: layer } : this.canonicalCoord(x, y, layer);
    // Headless research generation intentionally uses pseudo-legal moves from the exact topology map.
    // This keeps self-play fast enough for thousands of games; terminal king capture/checkmate is handled after moves.
    return this.uniqueMoves(this.getPseudoMoves(origin.x, origin.y, origin.z ?? origin.sheet ?? 0, { forAttack: false }));
  }

  getPseudoMoves(x, y, layer = 0, { forAttack = false } = {}) {
    const piece = this.getPiece(x, y, layer);
    if (!piece) return [];
    if (this.variant === 'cube') return this.getCubePseudoMoves(x, y, layer, piece, forAttack);
    return this.getSurfacePseudoMoves(x, y, layer, piece, forAttack);
  }

  getCubePseudoMoves(x, y, z, piece, forAttack) {
    if (piece.type === 'P') return this.getCubePawnMoves(x, y, z, forAttack);
    if (piece.type === 'R') return this.getCubeLineMoves(x, y, z, [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], forAttack);
    if (piece.type === 'B') return this.getCubeLineMoves(x, y, z, this.cubeBishopDirections(), forAttack);
    if (piece.type === 'Q') return this.getCubeLineMoves(x, y, z, [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1], ...this.cubeBishopDirections()], forAttack);
    if (piece.type === 'N') return this.getCubeKnightMoves(x, y, z, forAttack);
    if (piece.type === 'K') return this.getCubeKingMoves(x, y, z, forAttack);
    return [];
  }

  cubeBishopDirections() {
    const dirs = [];
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) for (let dz = -1; dz <= 1; dz += 1) {
      const active = [dx, dy, dz].filter(Boolean).length;
      if (active >= 2) dirs.push([dx, dy, dz]);
    }
    return dirs;
  }

  getCubePawnMoves(x, y, z, forAttack) {
    const piece = this.getPiece(x, y, z);
    const dir = piece.color === 'white' ? 1 : -1;
    const moves = [];
    if (!forAttack) {
      for (const [dx, dy, dz] of [[dir,0,0],[0,dir,0],[0,0,dir]]) {
        const one = this.resolveCubeTarget(x + dx, y + dy, z + dz, x, y, z, [dx,dy,dz]);
        if (one && !this.getPiece(one.x, one.y, one.z)) {
          moves.push({ ...one, capture: false });
          const two = this.resolveCubeTarget(x + 2*dx, y + 2*dy, z + 2*dz, x, y, z, [dx,dy,dz]);
          if (!piece.hasMoved && two && !this.sameCoord({x,y,z}, two) && !this.getPiece(two.x, two.y, two.z)) moves.push({ ...two, capture: false });
        }
      }
    }
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) for (let dz = -1; dz <= 1; dz += 1) {
      if ([dx,dy,dz].filter(Boolean).length < 2) continue;
      const target = this.resolveCubeTarget(x + dx, y + dy, z + dz, x, y, z, [dx,dy,dz]);
      if (!target) continue;
      if (forAttack) { moves.push({ ...target, capture: true }); continue; }
      const targetPiece = this.getPiece(target.x, target.y, target.z);
      if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'K') moves.push({ ...target, capture: true });
    }
    return this.uniqueMoves(moves);
  }

  getCubeLineMoves(x, y, z, directions, forAttack) {
    const piece = this.getPiece(x, y, z);
    const moves = [];
    for (const direction of directions) {
      let [dx, dy, dz] = direction;
      let cx = x, cy = y, cz = z;
      const seen = new Set();
      for (let steps = 0; steps < CUBE_SIZE * 2; steps += 1) {
        const next = this.nextCubeLineStep(cx, cy, cz, dx, dy, dz);
        if (!next) break;
        ({ x: cx, y: cy, z: cz, dx, dy, dz } = next);
        if (cx === x && cy === y && cz === z) break;
        const stateKey = `${cx},${cy},${cz},${dx},${dy},${dz}`;
        if (seen.has(stateKey)) break;
        seen.add(stateKey);
        const target = this.getPiece(cx, cy, cz);
        if (!target) { moves.push({ x: cx, y: cy, z: cz, capture: false }); continue; }
        if (target.color !== piece.color && (forAttack || target.type !== 'K')) moves.push({ x: cx, y: cy, z: cz, capture: true });
        break;
      }
    }
    return moves;
  }

  getCubeKnightMoves(x, y, z, forAttack) {
    const piece = this.getPiece(x, y, z);
    const moves = [];
    const offsets = new Set();
    for (const dx of [-2,-1,0,1,2]) for (const dy of [-2,-1,0,1,2]) for (const dz of [-2,-1,0,1,2]) {
      if ([Math.abs(dx), Math.abs(dy), Math.abs(dz)].sort((a,b)=>b-a).join(',') === '2,1,0') offsets.add(`${dx},${dy},${dz}`);
    }
    for (const o of offsets) {
      const [dx, dy, dz] = o.split(',').map(Number);
      const target = this.resolveCubeTarget(x + dx, y + dy, z + dz, x, y, z, [dx,dy,dz]);
      if (!target || this.sameCoord({x,y,z}, target)) continue;
      this.addLeaperMove(moves, target, piece, forAttack);
    }
    return this.uniqueMoves(moves);
  }

  getCubeKingMoves(x, y, z, forAttack) {
    const piece = this.getPiece(x, y, z);
    const moves = [];
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) for (let dz = -1; dz <= 1; dz += 1) {
      if (!dx && !dy && !dz) continue;
      if ((this.boundaryCondition === 'forbidden' || this.boundaryCondition === 'periodic') && Math.abs(dx) === 1 && Math.abs(dy) === 1 && Math.abs(dz) === 1) continue;
      const target = this.resolveCubeTarget(x + dx, y + dy, z + dz, x, y, z, [dx,dy,dz]);
      if (!target || this.sameCoord({x,y,z}, target)) continue;
      this.addLeaperMove(moves, target, piece, forAttack);
    }
    return this.uniqueMoves(moves);
  }

  nextCubeLineStep(x, y, z, dx, dy, dz) {
    if (this.boundaryCondition === 'forbidden') {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      return this.inBounds(nx, ny, nz) ? { x: nx, y: ny, z: nz, dx, dy, dz } : null;
    }
    if (this.boundaryCondition === 'periodic') return { x: wrap(x + dx, CUBE_SIZE), y: wrap(y + dy, CUBE_SIZE), z: wrap(z + dz, CUBE_SIZE), dx, dy, dz };
    if (this.boundaryCondition === 'random') {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (this.inBounds(nx, ny, nz)) return { x: nx, y: ny, z: nz, dx, dy, dz };
      const target = this.randomBoundaryTarget(x, y, z, dx, dy, dz);
      return target ? { ...target, dx, dy, dz } : null;
    }
    let nx = x + dx, ny = y + dy, nz = z + dz, ndx = dx, ndy = dy, ndz = dz;
    if (nx < 0 || nx >= CUBE_SIZE) { ndx *= -1; nx = reflect(nx, CUBE_SIZE); }
    if (ny < 0 || ny >= CUBE_SIZE) { ndy *= -1; ny = reflect(ny, CUBE_SIZE); }
    if (nz < 0 || nz >= CUBE_SIZE) { ndz *= -1; nz = reflect(nz, CUBE_SIZE); }
    return { x: nx, y: ny, z: nz, dx: ndx, dy: ndy, dz: ndz };
  }

  resolveCubeTarget(x, y, z, fromX = null, fromY = null, fromZ = null, direction = null) {
    if (this.boundaryCondition === 'forbidden') return this.inBounds(x, y, z) ? { x, y, z } : null;
    if (this.boundaryCondition === 'periodic') return { x: wrap(x, CUBE_SIZE), y: wrap(y, CUBE_SIZE), z: wrap(z, CUBE_SIZE) };
    if (this.boundaryCondition === 'random') {
      if (this.inBounds(x, y, z)) return { x, y, z };
      if (![fromX, fromY, fromZ].every(Number.isInteger)) return null;
      const [dx, dy, dz] = direction || [x - fromX, y - fromY, z - fromZ];
      return this.randomBoundaryTarget(fromX, fromY, fromZ, dx, dy, dz);
    }
    return { x: reflect(x, CUBE_SIZE), y: reflect(y, CUBE_SIZE), z: reflect(z, CUBE_SIZE) };
  }

  randomBoundaryTarget(x, y, z, dx, dy, dz) {
    const target = this.randomBoundaryMap.get(cubeRandomExitKey(x, y, z, dx, dy, dz));
    return target ? { x: target[0], y: target[1], z: target[2] } : null;
  }

  getSurfacePseudoMoves(x, y, sheet, piece, forAttack) {
    if (piece.type === 'P') return this.getSurfacePawnMoves(x, y, sheet, forAttack);
    if (piece.type === 'R') return this.getSurfaceLineMoves(x, y, sheet, [[1,0],[-1,0],[0,1],[0,-1]], forAttack);
    if (piece.type === 'B') return this.getSurfaceLineMoves(x, y, sheet, [[1,1],[1,-1],[-1,1],[-1,-1]], forAttack);
    if (piece.type === 'Q') return this.getSurfaceLineMoves(x, y, sheet, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], forAttack);
    if (piece.type === 'N') return this.getSurfaceKnightMoves(x, y, sheet, forAttack);
    if (piece.type === 'K') return this.getSurfaceKingMoves(x, y, sheet, forAttack);
    return [];
  }

  getSurfacePawnMoves(x, y, sheet, forAttack) {
    const piece = this.getPiece(x, y, sheet);
    const direction = piece.pawnDirection || (piece.color === 'white' ? 1 : -1);
    const moves = [];
    for (const dx of [-1, 1]) {
      const target = this.resolveSurfaceTarget(x + dx, y + direction, sheet, dx, direction);
      if (!target?.valid) continue;
      if (forAttack) { moves.push({ ...target, capture: true }); continue; }
      const targetPiece = this.getPiece(target.x, target.y, target.sheet);
      if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'K') moves.push({ ...target, capture: true });
    }
    if (forAttack) return this.uniqueMoves(moves);
    const one = this.resolveSurfaceTarget(x, y + direction, sheet, 0, direction);
    if (one?.valid && !this.sameCoord({x,y,sheet}, one) && !this.getPiece(one.x, one.y, one.sheet)) {
      moves.push({ ...one, capture: false });
      const two = this.resolveSurfaceTarget(one.x, one.y + direction, one.sheet, 0, direction);
      if (two?.valid && !piece.hasMoved && !this.sameCoord({x,y,sheet}, two) && !this.getPiece(two.x, two.y, two.sheet) && this.variant !== 'torus') moves.push({ ...two, capture: false });
    }
    return this.uniqueMoves(moves);
  }

  getSurfaceLineMoves(x, y, sheet, directions, forAttack) {
    const piece = this.getPiece(x, y, sheet);
    const moves = [];
    for (const [startDx, startDy] of directions) {
      let dx = startDx, dy = startDy, cx = x, cy = y, currentSheet = sheet;
      const seen = new Set();
      const limit = this.boardWidth() * this.boardHeight() * Math.max(1, this.depth()) * 2;
      for (let step = 0; step < limit; step += 1) {
        const target = this.resolveSurfaceTarget(cx + dx, cy + dy, currentSheet, dx, dy);
        if (!target?.valid) break;
        cx = target.x; cy = target.y; currentSheet = target.sheet; dx = target.dx ?? dx; dy = target.dy ?? dy;
        if (this.sameCoord(target, {x,y,sheet})) break;
        const stateKey = `${currentSheet},${cx},${cy},${dx},${dy}`;
        if (seen.has(stateKey)) break;
        seen.add(stateKey);
        const targetPiece = this.getPiece(cx, cy, currentSheet);
        if (!targetPiece) { moves.push({ ...target, capture: false }); continue; }
        if (targetPiece.color !== piece.color && (forAttack || targetPiece.type !== 'K')) moves.push({ ...target, capture: true });
        break;
      }
    }
    return this.uniqueMoves(moves);
  }

  getSurfaceKnightMoves(x, y, sheet, forAttack) {
    const piece = this.getPiece(x, y, sheet);
    const moves = [];
    for (const [dx, dy] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const target = this.resolveSurfaceTarget(x + dx, y + dy, sheet, dx, dy);
      if (!target?.valid || this.sameCoord({x,y,sheet}, target)) continue;
      this.addLeaperMove(moves, target, piece, forAttack);
    }
    return this.uniqueMoves(moves);
  }

  getSurfaceKingMoves(x, y, sheet, forAttack) {
    const piece = this.getPiece(x, y, sheet);
    const moves = [];
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      if (!dx && !dy) continue;
      const target = this.resolveSurfaceTarget(x + dx, y + dy, sheet, dx, dy);
      if (!target?.valid || this.sameCoord({x,y,sheet}, target)) continue;
      this.addLeaperMove(moves, target, piece, forAttack);
    }
    return this.uniqueMoves(moves);
  }

  resolveSurfaceTarget(x, y, sheet = 0, dx = 0, dy = 0) {
    const w = this.boardWidth(), h = this.boardHeight();
    if (this.variant === 'torus') return { x: wrap(x, w), y: wrap(y, h), sheet: 0, valid: true, dx, dy };
    if (this.variant === 'mobius') {
      let nx = x, ny = y, ns = Number(sheet) === 1 ? 1 : 0, ndx = dx;
      if (nx < 0 || nx >= w) { nx = wrap(nx, w); ns = 1 - ns; ndx = -ndx; }
      if (ny < 0 || ny >= h) return { x: nx, y: ny, sheet: ns, valid: false, dx: ndx, dy };
      return { x: nx, y: ny, sheet: ns, valid: true, dx: ndx, dy };
    }
    if (this.variant === 'klein') {
      let nx = wrap(x, w); let crossings = Math.floor(y / h); let ny = wrap(y, h);
      if (wrap(crossings, 2) === 1) nx = w - 1 - nx;
      return { x: nx, y: ny, sheet: 0, valid: true, dx, dy };
    }
    if (this.variant === 'sphere') return { ...sphereResolveTarget(x, y, w, h), dx, dy };
    if (this.variant === 'rp2') {
      let nx = x, ny = y;
      if (nx < 0 || nx >= w) { nx = wrap(nx, w); ny = h - 1 - ny; }
      if (ny < 0 || ny >= h) { ny = wrap(ny, h); nx = w - 1 - nx; }
      return { x: nx, y: ny, sheet: 0, valid: nx >= 0 && nx < w && ny >= 0 && ny < h, dx, dy };
    }
    return null;
  }

  addLeaperMove(moves, target, piece, forAttack) {
    const layer = target.z ?? target.sheet ?? 0;
    const targetPiece = this.getPiece(target.x, target.y, layer);
    if (!targetPiece) { moves.push({ ...target, capture: false }); return; }
    if (targetPiece.color !== piece.color && (forAttack || targetPiece.type !== 'K')) moves.push({ ...target, capture: true });
  }

  wouldLeaveKingInCheck(from, move) {
    const piece = this.getPiece(from.x, from.y, from.z ?? from.sheet ?? 0);
    if (!piece) return true;
    const toLayer = move.z ?? move.sheet ?? 0;
    const fromLayer = from.z ?? from.sheet ?? 0;
    const captured = this.getPiece(move.x, move.y, toLayer);
    this.setPiece(move.x, move.y, toLayer, piece);
    this.setPiece(from.x, from.y, fromLayer, null);
    const inCheck = this.isInCheck(piece.color);
    this.setPiece(from.x, from.y, fromLayer, piece);
    this.setPiece(move.x, move.y, toLayer, captured);
    return inCheck;
  }

  isInCheck(color) {
    const king = this.findKing(color);
    if (!king) return true;
    return this.isSquareAttacked(king.x, king.y, king.z ?? king.sheet ?? 0, other(color));
  }

  isSquareAttacked(x, y, layer, byColor) {
    for (const coord of this.validCells()) {
      const piece = this.getPiece(coord.x, coord.y, coord.z ?? coord.sheet ?? 0);
      if (!piece || piece.color !== byColor) continue;
      const attacks = this.getPseudoMoves(coord.x, coord.y, coord.z ?? coord.sheet ?? 0, { forAttack: true });
      if (attacks.some((m) => Number(m.x) === Number(x) && Number(m.y) === Number(y) && Number(m.z ?? m.sheet ?? 0) === Number(layer))) return true;
    }
    return false;
  }

  findKing(color) {
    for (const coord of this.validCells()) {
      const piece = this.getPiece(coord.x, coord.y, coord.z ?? coord.sheet ?? 0);
      if (piece?.color === color && piece.type === 'K') return coord;
    }
    return null;
  }

  hasLegalMoves(color) {
    const saved = this.currentPlayer;
    this.currentPlayer = color;
    try {
      return this.validCells().some((coord) => this.getPiece(coord.x, coord.y, coord.z ?? coord.sheet ?? 0)?.color === color && this.getLegalMoves(coord.x, coord.y, coord.z ?? coord.sheet ?? 0).length > 0);
    } finally { this.currentPlayer = saved; }
  }

  checkGameEnd() {
    const hasKings = ['white', 'black'].every((color) => this.findKing(color));
    if (!hasKings) {
      this.gameOver = true;
      this.winner = this.findKing('white') ? 'white' : this.findKing('black') ? 'black' : 'draw';
      this.draw = this.winner === 'draw';
      return;
    }
    if (!this.hasLegalMoves(this.currentPlayer)) {
      this.gameOver = true;
      this.winner = this.isInCheck(this.currentPlayer) ? other(this.currentPlayer) : 'draw';
      this.draw = this.winner === 'draw';
    }
  }

  applyMove(move) {
    const from = move.from;
    const fromLayer = from.z ?? from.sheet ?? 0;
    const legal = this.getLegalMoves(from.x, from.y, fromLayer);
    const to = move.to;
    const chosen = legal.find((candidate) => Number(candidate.x) === Number(to.x) && Number(candidate.y) === Number(to.y) && Number(candidate.z ?? candidate.sheet ?? 0) === Number(to.z ?? to.sheet ?? 0));
    if (!chosen) return { ok: false, error: 'illegal-move' };
    const piece = this.getPiece(from.x, from.y, fromLayer);
    const toLayer = chosen.z ?? chosen.sheet ?? 0;
    const captured = this.getPiece(chosen.x, chosen.y, toLayer);
    this.setPiece(from.x, from.y, fromLayer, null);
    const moving = { ...piece, hasMoved: true };
    if (moving.type === 'P' && this.isPromotionSquare(moving.color, chosen.x, chosen.y, toLayer)) {
      moving.type = move.promotion || 'Q';
      moving.display = moving.color === 'white' ? moving.type : moving.type.toLowerCase();
    }
    this.setPiece(chosen.x, chosen.y, toLayer, moving);
    if (captured) this.capturedPieces[moving.color]?.push?.(captured.type || captured.display || '?');
    this.moveHistory.push({ from: { ...from }, to: { ...chosen }, piece: { ...piece }, capturedPiece: captured ? { ...captured } : null });
    this.currentPlayer = other(this.currentPlayer);
    this.checkGameEnd();
    return { ok: true, move: { from, to: chosen, piece, capturedPiece: captured } };
  }

  isPromotionSquare(color, x, y, layer = 0) {
    if (this.variant === 'cube') {
      return color === 'white' ? (y === 7 && layer >= 5) || (layer === 7 && y >= 5) : (y === 0 && layer <= 2) || (layer === 0 && y <= 2);
    }
    if (this.variant === 'klein') return kleinIsPromotionSquare(color, x, y);
    if (this.variant === 'sphere') return sphereIsPromotionSquare(color, x, y);
    if (this.variant === 'rp2') return rp2IsPromotionSquare(color, x, y);
    const targetHome = this.variant === 'mobius' ? (color === 'white' ? { sheet: 1, row: MOBIUS_HOME_ROWS.black } : { sheet: 0, row: MOBIUS_HOME_ROWS.white }) : { sheet: 0, row: TORUS_HOME_ROWS[other(color)] };
    return Number(layer) === targetHome.sheet && Number(y) === targetHome.row;
  }

  exportState() {
    return {
      variant: this.variant,
      boundaryCondition: this.boundaryCondition,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      draw: this.draw,
      board: this.board.map((layer) => layer.map((row) => row.map(clonePiece))),
      capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces))
    };
  }
}

export function createHeadless3DChessGame(options = {}) {
  return new Headless3DChessGame(options);
}
