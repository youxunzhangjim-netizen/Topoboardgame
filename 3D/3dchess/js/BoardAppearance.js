export const CHESS_3D_BOARD_THEMES = [
    { key: 'topoboard', label: 'Topoboard Glass', light: 0xd7e8df, dark: 0x31434c, swatches: ['#d7e8df', '#31434c'] },
    { key: 'classic', label: 'Classic Slate', light: 0xf1f5f9, dark: 0x334155, swatches: ['#f1f5f9', '#334155'] },
    { key: 'brown', label: 'Warm Brown', light: 0xe9d8d0, dark: 0x5b4b43, swatches: ['#e9d8d0', '#5b4b43'] },
    { key: 'green', label: 'Research Green', light: 0xdde7e3, dark: 0x35524a, swatches: ['#dde7e3', '#35524a'] },
    { key: 'blue', label: 'Deep Blue', light: 0xd9e2ec, dark: 0x1e3a8a, swatches: ['#d9e2ec', '#1e3a8a'] }
];

const STORAGE_KEY = '3dchess:boardAppearance';

export function selectedBoardThemeIndex() {
    const value = Number(globalThis.topoboardgame3DChessBoardThemeIndex ?? globalThis.localStorage?.getItem(STORAGE_KEY) ?? 0);
    return Number.isInteger(value) && value >= 0 && value < CHESS_3D_BOARD_THEMES.length ? value : 0;
}

export function boardThemeColors(index = selectedBoardThemeIndex()) {
    return CHESS_3D_BOARD_THEMES[index] || CHESS_3D_BOARD_THEMES[0];
}

export function setBoardThemeIndex(index) {
    const parsed = Number(index);
    const safe = Number.isInteger(parsed) && parsed >= 0 && parsed < CHESS_3D_BOARD_THEMES.length ? parsed : 0;
    globalThis.topoboardgame3DChessBoardThemeIndex = safe;
    try { globalThis.localStorage?.setItem(STORAGE_KEY, String(safe)); } catch { /* ignore storage */ }
    globalThis.dispatchEvent?.(new CustomEvent('topoboardgame:3dchess-board-theme', { detail: { index: safe } }));
    return boardThemeColors(safe);
}
