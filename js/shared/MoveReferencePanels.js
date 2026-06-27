const REFERENCE_TITLE_PATTERNS = [
    /move\s*history/i,
    /rules?/i,
    /piece\s*symbols?/i,
    /game\s*guide/i,
    /guide\s*book/i,
    /遊戲指南/u,
    /指南書/u,
    /走法/u,
    /走法記錄/u,
    /走法紀錄/u,
    /紀錄/u,
    /規則/u,
    /棋子符號/u
];

function textOf(element) {
    return String(element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isReferencePanel(element) {
    if (!element) return false;
    if (element.matches?.('.game-control-guide,.game-guide-book')) return true;
    if (element.querySelector?.('#moveHistory,.move-history,.rules-text,.piece-legend')) return true;
    const title = element.querySelector('h2,h3,strong');
    const text = textOf(title);
    return REFERENCE_TITLE_PATTERNS.some((pattern) => pattern.test(text));
}

function installStyles() {
    if (document.getElementById('reference-panel-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'reference-panel-layout-style';
    style.textContent = `
        .reference-panels-below-board {
            display: grid;
            grid-column: 1 / -1;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
            gap: 14px;
            align-self: start;
            min-width: 0;
            width: 100%;
            margin-top: 14px;
        }
        .reference-panels-below-board > * {
            min-width: 0;
            max-width: 100%;
        }
        .reference-panels-below-board > .game-control-guide,
        .reference-panels-below-board > .game-guide-book {
            grid-column: 1 / -1;
            margin-top: 0;
        }
        .reference-panels-below-board .move-history {
            max-height: min(280px, 42vh);
        }
        .reference-panels-below-board .analysis-output {
            max-height: 260px;
            overflow: auto;
        }
        @media (max-width: 640px) {
            .reference-panels-below-board {
                grid-template-columns: 1fr;
                gap: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

function referenceTargetHost(shell, playArea, sidebars) {
    const lastSidebar = [...sidebars].at(-1);
    return { parent: shell, after: lastSidebar || playArea };
}

function createTarget(shell, playArea, sidebars) {
    let target = shell.querySelector(':scope > .reference-panels-below-board')
        || playArea.querySelector(':scope > .reference-panels-below-board');
    const { parent, after } = referenceTargetHost(shell, playArea, sidebars);
    if (target) {
        if (target.parentElement !== parent) {
            if (after) after.insertAdjacentElement('afterend', target);
            else parent.appendChild(target);
        } else if (after && target.previousElementSibling !== after) {
            after.insertAdjacentElement('afterend', target);
        } else if (!after) {
            parent.appendChild(target);
        }
        return target;
    }
    target = document.createElement('section');
    target.className = 'reference-panels-below-board';
    target.setAttribute('aria-label', 'Reference panels');
    if (after) after.insertAdjacentElement('afterend', target);
    else parent.appendChild(target);
    return target;
}

function restoreActionPanels(sidebars, target) {
    const sidebar = [...sidebars].at(-1);
    if (!sidebar || !target) return;
    const actionPanels = target.querySelectorAll(':scope > .robot-panel, :scope > .panel.robot-panel, :scope > .chat-panel, :scope > .panel.chat-panel');
    for (const panel of actionPanels) sidebar.appendChild(panel);
}

export function moveReferencePanelsBelowBoard() {
    installStyles();
    const shell = document.querySelector('.app-shell, .main-content, .jump-shell');
    if (!shell) return;
    const playArea = shell.querySelector(':scope > .play-area, :scope > .board-wrapper, :scope > .jump-board-panel');
    const sidebars = shell.querySelectorAll(':scope > .sidebar, :scope > aside.sidebar, :scope > .jump-side, :scope > aside.jump-side');
    if (!playArea || !sidebars.length) return;
    const target = createTarget(shell, playArea, sidebars);
    for (const sidebar of sidebars) {
        const candidates = [...sidebar.children].filter((child) => {
            if (child.matches?.('.online-controls,.control-group,.controls,.jump-card:first-of-type,.robot-panel,.chat-panel')) return false;
            return isReferencePanel(child);
        });
        for (const panel of candidates) target.appendChild(panel);
    }
    restoreActionPanels(sidebars, target);
    if (!target.children.length) target.remove();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveReferencePanelsBelowBoard, { once: true });
} else {
    moveReferencePanelsBelowBoard();
}

window.setTimeout(moveReferencePanelsBelowBoard, 250);
window.setTimeout(moveReferencePanelsBelowBoard, 900);

window.addEventListener('resize', () => {
    window.clearTimeout(moveReferencePanelsBelowBoard.resizeTimer);
    moveReferencePanelsBelowBoard.resizeTimer = window.setTimeout(moveReferencePanelsBelowBoard, 120);
});
