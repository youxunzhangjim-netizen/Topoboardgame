export function syncLabLanguageMenu(language = 'en', root = document) {
    const normalized = language === 'zh' ? 'zh' : 'en';
    const button = root.querySelector('#labsLanguageButton');
    const current = root.querySelector('[data-labs-language-current]');
    const label = normalized === 'zh' ? '語言' : 'Language';
    if (current) current.textContent = normalized === 'zh' ? '中' : 'En';
    if (button) {
        button.setAttribute('aria-label', normalized === 'zh' ? '切換語言' : 'Change language');
        button.setAttribute('title', normalized === 'zh' ? '切換語言' : 'Change language');
    }
    root.querySelectorAll('[data-labs-lang]').forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.labsLang === normalized));
    });
    root.querySelectorAll('[data-labs-language-label]').forEach((element) => {
        element.textContent = label;
    });
}

export function installLabLanguageMenu({ select, setLanguage, root = document } = {}) {
    const button = root.querySelector('#labsLanguageButton');
    const menu = root.querySelector('#labsLanguageMenu');
    if (!button || !menu || typeof setLanguage !== 'function') {
        if (select) select.hidden = true;
        return;
    }

    if (select) select.hidden = true;

    const closeMenu = () => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
    };

    button.addEventListener('click', () => {
        const nextOpen = menu.hidden;
        menu.hidden = !nextOpen;
        button.setAttribute('aria-expanded', String(nextOpen));
    });

    root.querySelectorAll('[data-labs-lang]').forEach((option) => {
        option.addEventListener('click', () => {
            setLanguage(option.dataset.labsLang === 'zh' ? 'zh' : 'en');
            closeMenu();
        });
    });

    document.addEventListener('click', (event) => {
        if (menu.hidden || event.target.closest('[data-labs-language]')) return;
        closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });
}
