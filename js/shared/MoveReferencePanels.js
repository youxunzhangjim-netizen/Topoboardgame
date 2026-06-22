const REFERENCE_TITLE_PATTERNS = [
    /move\s*history/i,
    /rules?/i,
    /robot\s*&?\s*analysis/i,
    /online\s*chat/i,
    /piece\s*symbols?/i
];
const MOBILE_RULES_BELOW_CONTROLS_QUERY = '(max-width: 980px)';

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
            display: grid;
            gap: 14px;
            align-self: start;
            min-width: 0;
            margin-top: 14px;
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
    `;
    document.head.appendChild(style);
}

function referenceTargetHost(shell, playArea, sidebars) {
    const isMobile = window.matchMedia?.(MOBILE_RULES_BELOW_CONTROLS_QUERY).matches;
    if (isMobile) {
        const lastSidebar = [...sidebars].at(-1);
        if (lastSidebar?.parentElement) return { parent: lastSidebar.parentElement, after: lastSidebar };
    }
    return { parent: playArea, after: null };
}

function createTarget(shell, playArea, sidebars) {
    let target = shell.querySelector(':scope > .reference-panels-below-board')
        || playArea.querySelector(':scope > .reference-panels-below-board');
    const { parent, after } = referenceTargetHost(shell, playArea, sidebars);
    if (target) {
        if (after && target.previousElementSibling !== after) {
            after.insertAdjacentElement('afterend', target);
        } else if (!after && target.parentElement !== parent) {
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

window.addEventListener('resize', () => {
    window.clearTimeout(moveReferencePanelsBelowBoard.resizeTimer);
    moveReferencePanelsBelowBoard.resizeTimer = window.setTimeout(moveReferencePanelsBelowBoard, 120);
});
