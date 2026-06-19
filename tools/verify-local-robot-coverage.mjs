import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
function read(path) { return readFileSync(join(root, path), 'utf8'); }
function optionValues(html, selectId) {
  const selectMatch = html.match(new RegExp(`<select[^>]+id=["']${selectId}["'][\\s\\S]*?<\\/select>`, 'i'));
  assert.ok(selectMatch, `missing select #${selectId}`);
  return [...selectMatch[0].matchAll(/<option[^>]+value=["']([^"']+)["']/g)].map((m) => m[1]);
}
function hasAll(values, expected, label) {
  for (const value of expected) assert.ok(values.includes(value), `${label} missing option ${value}; found ${values.join(', ')}`);
}
function assertFile(path) { assert.ok(existsSync(join(root, path)), `missing file ${path}`); }
function assertText(path, patterns) {
  const text = read(path);
  for (const pattern of patterns) {
    const ok = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    assert.ok(ok, `${path} missing ${String(pattern)}`);
  }
}

assertFile('js/shared/JumpRules.js');
assertFile('js/shared/JumpRobot.js');
assertFile('2D/jump/index.html');
assertFile('3D/jump/index.html');
assertFile('4D/jump/index.html');
assertText('js/shared/JumpRules.js', [/allowMultiJump/, /captureOnJump/, /targetFillWin/, /JumpTopology/, /chooseJumpRobotMove/]);
assertText('2D/jump/index.html', ['gameModeSelect', /<option value="local">Local<\/option>/, /<option value="online">Online<\/option>/, /<option value="robot">Robot<\/option>/]);
assertText('3D/jump/index.html', ['gameModeSelect', /<option value="local">Local<\/option>/, /<option value="online">Online<\/option>/, /<option value="robot">Robot<\/option>/]);
assertText('4D/jump/index.html', ['targetAxisSelect', /<option value="local">Local<\/option>/, /<option value="online">Online<\/option>/, /<option value="robot">Robot<\/option>/]);

const checks = [
  {
    name: '2D Chess',
    html: '2D/2dchess/index.html',
    robotFiles: [
      '2D/2dchess/js/robot/ChessRobotAdapter.js',
      '2D/2dchess/js/robot/ChessEvaluator.js',
      '2D/2dchess/js/robot/ChessSearch.js',
      '2D/2dchess/js/robot/ChessRobotController.js',
      '2D/2dchess/js/robot/ChessRobotWorker.js'
    ],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      boundarySelect: ['forbidden', 'open', 'periodic', 'reflection', 'random']
    },
    robotText: [
      /iterativeDeepening|searchBestMove|chooseRobotMove/,
      /transposition|tt\b|history|killer/i,
      /random boundary|RBC|reflection|periodic/i
    ],
    searchFile: '2D/2dchess/js/robot/ChessSearch.js'
  },
  {
    name: '2D Go',
    html: '2D/2dgo/index.html',
    robotFiles: ['2D/2dgo/js/robot/GoRobot.js'],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      boundarySelect: ['open2d', 'polar', 'pbc', 'klein', 'random'],
      latticeSelect: ['square', 'honeycomb', 'triangular']
    },
    robotText: [/mcts|uct|simulation|rollout/i, /libert|capture|topology|lattice/i],
    searchFile: '2D/2dgo/js/robot/GoRobot.js'
  },
  {
    name: '2D Reversi',
    html: '2D/2dreversi/index.html',
    robotFiles: ['2D/2dreversi/js/robot/ReversiRobot.js'],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      boundarySelect: ['open2d', 'pbc', 'klein', 'random'],
      latticeSelect: ['square', 'honeycomb']
    },
    robotText: [/negamax|alpha|beta|transposition|tt/i, /frontier|anchor|stable|parity|mobility/i],
    searchFile: '2D/2dreversi/js/robot/ReversiRobot.js'
  },
  {
    name: '3D Chess',
    html: '3D/3dchess/index.html',
    robotFiles: ['3D/3dchess/js/robot/Chess3DRobot.js'],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      boardGameSelect: ['cube', 'torus', 'rp2', 'mobius', 'sphere', 'klein'],
      boundarySelect: ['forbidden', 'periodic', 'random', 'reflection', 'rp2', 'mobius', 'sphere', 'klein_bottle']
    },
    robotText: [/negamax|alpha|beta|transposition|tt/i, /sphere|klein|mobius|rp2|periodic|reflection|random/i],
    searchFile: '3D/3dchess/js/robot/Chess3DRobot.js'
  },
  {
    name: '3D Go',
    html: '3D/3dgo/index.html',
    robotFiles: ['3D/3dgo/js/robot/Go3DRobot.js'],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      goModeSelect: ['r3', 't3', 'r3_random', 't2', 'sphere', 'klein', 'mobius', 'rp2'],
      latticeSelect: ['sc', 'bcc', 'fcc', 'hcp', 'square', 'honeycomb', 'triangular']
    },
    robotText: [/mcts|uct|simulation|rollout/i, /sphere|klein|mobius|rp2|t3|t2|r3_random|hcp|bcc|fcc/i],
    searchFile: '3D/3dgo/js/robot/Go3DRobot.js'
  },
  {
    name: '3D Reversi',
    html: '3D/3dreversi/index.html',
    robotFiles: ['3D/3dreversi/js/robot/Reversi3DRobot.js'],
    selects: {
      gameModeSelect: ['local', 'robot', 'online'],
      spaceSelect: ['r3', 't3', 'r3_random', 't2', 'sphere', 'klein', 'mobius', 'rp2'],
      latticeSelect: ['square', 'hcp']
    },
    robotText: [/negamax|alpha|beta|transposition|tt/i, /frontier|anchor|surface|sphere|klein|mobius|rp2|t3|t2|r3_random|hcp/i],
    searchFile: '3D/3dreversi/js/robot/Reversi3DRobot.js'
  }
];

for (const check of checks) {
  const html = read(check.html);
  for (const file of check.robotFiles) assertFile(file);
  for (const [selectId, expected] of Object.entries(check.selects)) hasAll(optionValues(html, selectId), expected, `${check.name} #${selectId}`);
  assertText(check.searchFile, check.robotText);
  const robotModuleName = check.robotFiles[0].split('/').pop().replace('.js', '');
  console.log(`${check.name}: robot coverage ok (${robotModuleName})`);
}
console.log('Local robot coverage checks passed for 2D/3D Chess, Go, Reversi, and shared Jump games.');
