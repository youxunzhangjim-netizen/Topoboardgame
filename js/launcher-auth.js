import {
    initAccountSession,
    signInWithGoogleAccount,
    signOutToGuest,
    subscribeAccountState
} from '../online.js';

const TEXT = {
    en: {
        guest: 'Guest',
        login: 'Login',
        signedIn: 'Signed in',
        logout: 'Return to Guest',
        google: 'Sign in with Google',
        guestStatus: 'Guest mode is active. Local play and local robots do not need an account.',
        signedInStatus: 'Google account is active. Future online rooms and saved statistics can be linked to this user.',
        note: 'Google login links future online rooms and saved statistics to your account.',
        working: 'Connecting...',
        error: 'Login failed: {message}'
    },
    zh: {
        guest: 'Guest',
        login: '登入',
        signedIn: '已登入',
        logout: '回到 Guest',
        google: '使用 Google 登入',
        guestStatus: '目前為 Guest 模式。本機遊玩與本機機器人不需要帳號。',
        signedInStatus: 'Google 帳號已啟用。未來線上房間與儲存統計可綁定到這個使用者。',
        note: 'Google 登入會把未來線上房間與儲存統計綁定到你的帳號。',
        working: '連線中...',
        error: '登入失敗：{message}'
    }
};

function currentLanguage() {
    const lang = String(document.documentElement.lang || navigator.language || 'en').toLowerCase();
    return lang.startsWith('zh') ? 'zh' : 'en';
}

function t(key, params = {}) {
    const value = TEXT[currentLanguage()]?.[key] || TEXT.en[key] || key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

function cleanFirebaseError(error) {
    const message = String(error?.message || error || 'Unknown error');
    return message
        .replace(/^Firebase:\s*/i, '')
        .replace(/\s*\([^)]*\)\.?$/g, '')
        .trim();
}

function installLauncherAuth() {
    const root = document.getElementById('launcherAccount');
    const button = document.getElementById('launcherAccountButton');
    const menu = document.getElementById('launcherAccountMenu');
    const name = document.getElementById('launcherAccountName');
    const action = document.getElementById('launcherAccountAction');
    const status = document.getElementById('launcherAccountStatus');
    const googleButton = document.getElementById('launcherGoogleLoginButton');
    const logoutButton = document.getElementById('launcherLogoutButton');
    const note = document.getElementById('launcherAccountNote');
    if (!root || !button || !menu || !name || !action || !status || !googleButton || !logoutButton || !note) return;

    let latestState = null;
    let busy = false;

    const render = (state = latestState) => {
        latestState = state || latestState || { signedIn: false };
        const signedIn = Boolean(latestState.signedIn);
        name.textContent = signedIn ? (latestState.displayName || 'Player') : t('guest');
        action.textContent = signedIn ? t('signedIn') : t('login');
        status.textContent = signedIn ? t('signedInStatus') : t('guestStatus');
        googleButton.textContent = busy ? t('working') : t('google');
        logoutButton.textContent = t('logout');
        note.textContent = t('note');
        googleButton.hidden = signedIn;
        logoutButton.hidden = !signedIn;
        googleButton.disabled = busy;
        logoutButton.disabled = busy;
        root.dataset.account = signedIn ? 'google' : 'guest';
    };

    const setError = (error) => {
        status.textContent = t('error', { message: cleanFirebaseError(error) });
    };

    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        menu.hidden = expanded;
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.launcher-account')) return;
        button.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    });

    googleButton.addEventListener('click', async () => {
        busy = true;
        render();
        try {
            await signInWithGoogleAccount();
            button.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
        } catch (error) {
            setError(error);
        } finally {
            busy = false;
            render();
        }
    });

    logoutButton.addEventListener('click', async () => {
        busy = true;
        render();
        try {
            await signOutToGuest();
        } catch (error) {
            setError(error);
        } finally {
            busy = false;
            render();
        }
    });

    subscribeAccountState(render);
    window.addEventListener('languagechange', () => render());
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    initAccountSession().catch(setError);
    render({ signedIn: false });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installLauncherAuth, { once: true });
} else {
    installLauncherAuth();
}
