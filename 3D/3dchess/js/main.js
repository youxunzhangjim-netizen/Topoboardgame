import { ChessGame } from './ChessGame.js';
import { installChess3DRobot } from './robot/Chess3DRobot.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new ChessGame();
    window.gameApp = app;
    window.game = app.activeGame;
    installChess3DRobot(app);
});
