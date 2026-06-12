import { ChessGame } from './ChessGame.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new ChessGame();
    window.gameApp = app;
    window.game = app.activeGame;
});
