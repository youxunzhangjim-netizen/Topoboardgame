const REFERENCE_TITLE_PATTERNS = [
    /move\s*history/i,
    /rules?/i,
    /robot\s*&?\s*analysis/i,
    /online\s*chat/i,
    /piece\s*symbols?/i
];

function textOf(element) {
    return String(element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isReferencePanel(element) {
    if (!element) return false;
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
            grid-column: 1;
            display: grid;
            gap: 14px;
            align-self: start;
            min-width: 0;
        }
        .reference-panels-below-board > * {
            min-width: 0;
        }
        .reference-panels-below-board .move-history {
            max-height: 240px;
        }
        .reference-panels-below-board .robot-analysis,
        .reference-panels-below-board .analysis-output,
        .reference-panels-below-board .chat-messages {
            max-height: 260px;
            overflow: auto;
        }
        @media (max-width: 980px) {
            .reference-panels-below-board {
                grid-column: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

function createTarget(playArea, shell) {
    let target = shell.querySelector(':scope > .reference-panels-below-board');
    if (target) return target;
    target = document.createElement('section');
    target.className = 'reference-panels-below-board';
    target.setAttribute('aria-label', 'Reference panels');
    shell.appendChild(target);
    return target;
}

export function moveReferencePanelsBelowBoard() {
    installStyles();
    const shell = document.querySelector('.app-shell, .main-content, .jump-shell');
    if (!shell) return;
    const playArea = shell.querySelector(':scope > .play-area, :scope > .board-wrapper, :scope > .jump-board-panel');
    const sidebars = shell.querySelectorAll(':scope > .sidebar, :scope > aside.sidebar, :scope > .jump-side, :scope > aside.jump-side');
    if (!playArea || !sidebars.length) return;
    const target = createTarget(playArea, shell);
    for (const sidebar of sidebars) {
        const candidates = [...sidebar.children].filter((child) => {
            if (child.matches?.('.online-controls,.control-group,.controls,.jump-card:first-of-type')) return false;
            return isReferencePanel(child);
        });
        for (const panel of candidates) target.appendChild(panel);
    }
    if (!target.children.length) target.remove();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveReferencePanelsBelowBoard, { once: true });
} else {
    moveReferencePanelsBelowBoard();
}
