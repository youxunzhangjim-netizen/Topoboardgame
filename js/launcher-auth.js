import {
    initAccountSession,
    signInAsVisitor,
    signInWithGoogleAccount,
    signOutToGuest,
    subscribeAccountState,
    updateUserProfileInfo
} from '../online.js';

const LOG_PREFIX = '[Topoboardgame Auth]';

const TEXT = {
    en: {
        guest: 'Offline Guest',
        visitor: 'Visitor',
        login: 'Login',
        signedIn: 'Signed in',
        logout: 'Logout',
        returnOffline: 'Return to Offline Guest',
        google: 'Sign in with Google',
        visitorButton: 'Continue as Visitor',
        guestStatus: 'Offline Guest is active. Local play and local robots do not need an account.',
        visitorStatus: 'Visitor mode is active. You can play online as a temporary visitor.',
        visitorStatusChecking: 'Visitor mode is active. Preparing online play...',
        visitorStatusSynced: 'Visitor mode is active. Online play is ready.',
        signedInStatus: 'Signed-in account is active. Preparing online play...',
        signedInStatusChecking: 'Signed-in account is active. Preparing online play...',
        signedInStatusSynced: 'Signed-in account is active. Online play is ready.',
        profileError: 'Sign-in succeeded, but online play setup failed: {message}',
        visitorProfileError: 'Visitor mode is active, but online play setup failed: {message}',
        note: 'Google login connects online rooms and saved statistics to your account. Visitor mode is temporary.',
        working: 'Connecting...',
        error: 'Login failed: {message}',
        visibleName: 'Visible name',
        joinedDate: 'Joined',
        about: 'About',
        location: 'Location',
        favoriteGame: 'Favorite game',
        showEmail: 'Show my email for research contact',
        namePlaceholder: 'Name shown to opponents',
        bioPlaceholder: 'Short public profile',
        locationPlaceholder: 'City or region',
        favoritePlaceholder: 'Go, Jump, Chess...',
        emailPlaceholder: 'Email shown only when enabled',
        saveName: 'Save',
        savingName: 'Saving...',
        nameSaved: 'Profile saved.',
        nameOnlySignedIn: 'Sign in before editing your profile.'
    },
    zh: {
        guest: '離線 Guest',
        visitor: '訪客',
        login: '登入',
        signedIn: '已登入',
        logout: '登出',
        returnOffline: '回到離線 Guest',
        google: '使用 Google 登入',
        visitorButton: '以訪客繼續',
        guestStatus: '目前為離線 Guest 模式。本機遊玩與本機機器人不需要帳號。',
        visitorStatus: '訪客模式已啟用。你可以用臨時訪客身分進行線上遊玩。',
        visitorStatusChecking: '訪客模式已啟用。正在準備線上遊玩...',
        visitorStatusSynced: '訪客模式已啟用。線上遊玩已準備完成。',
        signedInStatus: '帳號登入已啟用。正在準備線上遊玩...',
        signedInStatusChecking: '帳號登入已啟用。正在準備線上遊玩...',
        signedInStatusSynced: '帳號登入已啟用。線上遊玩已準備完成。',
        profileError: '登入成功，但線上遊玩設定失敗：{message}',
        visitorProfileError: '訪客模式已啟用，但線上遊玩設定失敗：{message}',
        note: 'Google 登入會把線上房間與儲存統計連到你的帳號。訪客模式是臨時身分。',
        working: '連線中...',
        error: '登入失敗：{message}',
        visibleName: '顯示名稱',
        joinedDate: '加入日期',
        about: '簡介',
        location: '位置',
        favoriteGame: '喜歡的遊戲',
        showEmail: '顯示我的 email 供研究聯絡',
        namePlaceholder: '對手會看到的名稱',
        bioPlaceholder: '簡短的公開簡介',
        locationPlaceholder: '城市或地區',
        favoritePlaceholder: '圍棋、跳棋、象棋...',
        emailPlaceholder: '只有啟用時才顯示的 email',
        saveName: '儲存',
        savingName: '儲存中...',
        nameSaved: '個人資料已儲存。',
        nameOnlySignedIn: '請先登入再編輯個人資料。'
    }
};

function logAuth(message, payload) {
    try {
        if (payload === undefined) console.log(LOG_PREFIX, message);
        else console.log(LOG_PREFIX, message, payload);
    } catch {
        // Ignore console failures in unusual embedded browsers.
    }
}

function warnAuth(message, payload) {
    try {
        if (payload === undefined) console.warn(LOG_PREFIX, message);
        else console.warn(LOG_PREFIX, message, payload);
    } catch {
        // Ignore console failures in unusual embedded browsers.
    }
}

function errorAuth(message, payload) {
    try {
        if (payload === undefined) console.error(LOG_PREFIX, message);
        else console.error(LOG_PREFIX, message, payload);
    } catch {
        // Ignore console failures in unusual embedded browsers.
    }
}

function currentLanguage() {
    const lang = String(document.documentElement.lang || navigator.language || 'en').toLowerCase();
    return lang.startsWith('zh') ? 'zh' : 'en';
}

function t(key, params = {}) {
    const value = TEXT[currentLanguage()]?.[key] || TEXT.en[key] || key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

function cleanFirebaseError(error) {
    const code = String(error?.code || '');
    if (/auth\/unauthorized-domain/i.test(code)) {
        return 'This website is not allowed to use Google sign-in yet.';
    }
    if (/auth\/operation-not-allowed/i.test(code)) {
        return 'This sign-in method is not enabled yet.';
    }
    if (/auth\/popup-blocked/i.test(code)) {
        return 'The browser blocked the Google popup. Allow popups or try again.';
    }
    if (/auth\/popup-closed-by-user/i.test(code)) {
        return 'The Google login popup was closed before completion.';
    }
    const message = String(error?.message || error || 'Unknown error');
    return message
        .replace(/^Firebase:\s*/i, '')
        .replace(/Cloud Firestore/gi, 'the online service')
        .replace(/Firestore/gi, 'online service')
        .replace(/firebase/gi, 'online service')
        .replace(/profile/gi, 'online play')
        .replace(/\s*\([^)]*\)\.?$/g, '')
        .trim();
}

function accountStatusText(kindKey, state) {
    if (state?.profileError) {
        if (kindKey === 'visitorStatus') {
            return t('visitorProfileError', { message: cleanFirebaseError(state.profileError) });
        }
        return t('profileError', { message: cleanFirebaseError(state.profileError) });
    }
    if (state?.profileSynced) {
        return t(`${kindKey}Synced`);
    }
    if (state?.uid) {
        return t(`${kindKey}Checking`);
    }
    return t(kindKey);
}

function summarizeState(state) {
    return {
        configured: Boolean(state?.configured),
        ready: Boolean(state?.ready),
        accountKind: state?.accountKind || 'unknown',
        signedIn: Boolean(state?.signedIn),
        isVisitor: Boolean(state?.isVisitor),
        isOfflineGuest: Boolean(state?.isOfflineGuest),
        uid: state?.uid || null,
        profilePath: state?.profilePath || '',
        profileSynced: Boolean(state?.profileSynced),
        profileError: state?.profileError || '',
        displayName: state?.displayName || '',
        canEditDisplayName: Boolean(state?.canEditDisplayName),
        joinedDate: state?.joinedDate || '',
        bio: state?.bio || '',
        location: state?.location || '',
        favoriteGame: state?.favoriteGame || '',
        showEmail: Boolean(state?.showEmail),
        publicEmail: state?.publicEmail || '',
        accountEmail: state?.accountEmail || ''
    };
}

function cleanDisplayName(value) {
    const cleaned = String(value || '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 24);
    return cleaned || 'Player';
}

function cleanProfileText(value, maxLength) {
    return String(value || '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function elementSummary(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect?.();
    const style = element instanceof Element ? getComputedStyle(element) : null;
    return {
        tag: element.tagName || '',
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        hidden: Boolean(element.hidden),
        disabled: Boolean(element.disabled),
        display: style?.display || '',
        visibility: style?.visibility || '',
        pointerEvents: style?.pointerEvents || '',
        rect: rect ? {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        } : null
    };
}

function pointInsideRect(event, rect) {
    return Boolean(rect)
        && event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;
}

function installLauncherAuth() {
    logAuth('launcher-auth.js loaded; installing account UI', {
        readyState: document.readyState,
        href: location.href
    });

    const root = document.getElementById('launcherAccount');
    const button = document.getElementById('launcherAccountButton');
    const menu = document.getElementById('launcherAccountMenu');
    const name = document.getElementById('launcherAccountName');
    const action = document.getElementById('launcherAccountAction');
    const status = document.getElementById('launcherAccountStatus');
    const googleButton = document.getElementById('launcherGoogleLoginButton');
    const visitorButton = document.getElementById('launcherVisitorLoginButton');
    const logoutButton = document.getElementById('launcherLogoutButton');
    const note = document.getElementById('launcherAccountNote');
    const displayNameEditor = document.getElementById('launcherDisplayNameEditor');
    const displayNameLabel = document.getElementById('launcherDisplayNameLabel');
    const displayNameInput = document.getElementById('launcherDisplayNameInput');
    const displayNameSave = document.getElementById('launcherDisplayNameSave');
    const displayNameStatus = document.getElementById('launcherDisplayNameStatus');
    const joinedDateLabel = document.getElementById('launcherJoinedDateLabel');
    const joinedDateValue = document.getElementById('launcherJoinedDateValue');
    const bioLabel = document.getElementById('launcherProfileBioLabel');
    const bioInput = document.getElementById('launcherProfileBioInput');
    const locationLabel = document.getElementById('launcherProfileLocationLabel');
    const locationInput = document.getElementById('launcherProfileLocationInput');
    const favoriteLabel = document.getElementById('launcherProfileFavoriteLabel');
    const favoriteInput = document.getElementById('launcherProfileFavoriteInput');
    const showEmailLabel = document.getElementById('launcherProfileShowEmailLabel');
    const showEmailInput = document.getElementById('launcherProfileShowEmailInput');
    const publicEmailInput = document.getElementById('launcherProfilePublicEmailInput');

    const missing = {
        root: !root,
        button: !button,
        menu: !menu,
        name: !name,
        action: !action,
        status: !status,
        googleButton: !googleButton,
        visitorButton: !visitorButton,
        logoutButton: !logoutButton,
        note: !note,
        displayNameEditor: !displayNameEditor,
        displayNameLabel: !displayNameLabel,
        displayNameInput: !displayNameInput,
        displayNameSave: !displayNameSave,
        displayNameStatus: !displayNameStatus,
        joinedDateLabel: !joinedDateLabel,
        joinedDateValue: !joinedDateValue,
        bioLabel: !bioLabel,
        bioInput: !bioInput,
        locationLabel: !locationLabel,
        locationInput: !locationInput,
        favoriteLabel: !favoriteLabel,
        favoriteInput: !favoriteInput,
        showEmailLabel: !showEmailLabel,
        showEmailInput: !showEmailInput,
        publicEmailInput: !publicEmailInput
    };
    if (Object.values(missing).some(Boolean)) {
        warnAuth('account UI install stopped because one or more elements are missing', missing);
        return;
    }

    logAuth('account UI elements found; binding event listeners', {
        accountButton: elementSummary(button),
        googleButton: elementSummary(googleButton),
        visitorButton: elementSummary(visitorButton),
        logoutButton: elementSummary(logoutButton),
        menu: elementSummary(menu)
    });

    let latestState = null;
    let busy = false;
    let nameBusy = false;
    let lastInlineError = '';
    let lastNameMessage = '';

    const refreshDisplayNameEditor = () => {
        const canEdit = Boolean(latestState?.canEditDisplayName);
        displayNameEditor.hidden = !canEdit;
        displayNameLabel.textContent = t('visibleName');
        joinedDateLabel.textContent = t('joinedDate');
        bioLabel.textContent = t('about');
        locationLabel.textContent = t('location');
        favoriteLabel.textContent = t('favoriteGame');
        showEmailLabel.textContent = t('showEmail');
        displayNameInput.placeholder = t('namePlaceholder');
        bioInput.placeholder = t('bioPlaceholder');
        locationInput.placeholder = t('locationPlaceholder');
        favoriteInput.placeholder = t('favoritePlaceholder');
        publicEmailInput.placeholder = t('emailPlaceholder');
        displayNameSave.textContent = nameBusy ? t('savingName') : t('saveName');
        displayNameSave.disabled = busy || nameBusy || !canEdit;
        [displayNameInput, bioInput, locationInput, favoriteInput, showEmailInput].forEach((input) => {
            input.disabled = busy || nameBusy || !canEdit;
        });
        publicEmailInput.disabled = busy || nameBusy || !canEdit || !showEmailInput.checked;
        if (canEdit && document.activeElement !== displayNameInput) {
            displayNameInput.value = latestState?.displayName || '';
        }
        if (canEdit && document.activeElement !== bioInput) bioInput.value = latestState?.bio || '';
        if (canEdit && document.activeElement !== locationInput) locationInput.value = latestState?.location || '';
        if (canEdit && document.activeElement !== favoriteInput) favoriteInput.value = latestState?.favoriteGame || '';
        if (canEdit && document.activeElement !== showEmailInput) showEmailInput.checked = Boolean(latestState?.showEmail);
        if (canEdit && document.activeElement !== publicEmailInput) publicEmailInput.value = latestState?.publicEmail || latestState?.accountEmail || '';
        publicEmailInput.disabled = busy || nameBusy || !canEdit || !showEmailInput.checked;
        joinedDateValue.textContent = latestState?.joinedDate || '-';
        displayNameStatus.textContent = lastNameMessage;
    };

    const render = (state = latestState) => {
        latestState = state || latestState || { signedIn: false, isVisitor: false };
        const signedIn = Boolean(latestState.signedIn);
        const visitor = Boolean(latestState.isVisitor);
        name.textContent = signedIn
            ? (latestState.displayName || 'Player')
            : (visitor ? t('visitor') : t('guest'));
        action.textContent = signedIn ? t('signedIn') : (visitor ? t('visitor') : t('login'));
        status.textContent = lastInlineError || (signedIn
            ? accountStatusText('signedInStatus', latestState)
            : (visitor ? accountStatusText('visitorStatus', latestState) : t('guestStatus')));
        googleButton.textContent = busy ? t('working') : t('google');
        visitorButton.textContent = busy ? t('working') : t('visitorButton');
        logoutButton.textContent = signedIn ? t('logout') : t('returnOffline');
        note.textContent = t('note');
        refreshDisplayNameEditor();
        googleButton.hidden = signedIn;
        visitorButton.hidden = signedIn || visitor;
        logoutButton.hidden = !signedIn && !visitor;
        googleButton.disabled = busy;
        visitorButton.disabled = busy;
        logoutButton.disabled = busy;
        root.dataset.account = latestState.accountKind || (signedIn ? 'google' : (visitor ? 'visitor' : 'offline-guest'));
        root.dataset.profile = latestState.profileError ? 'error' : (latestState.profileSynced ? 'synced' : 'idle');
    };

    const setError = (error) => {
        lastInlineError = t('error', { message: cleanFirebaseError(error) });
        warnAuth('showing login error in account menu', {
            message: lastInlineError,
            raw: String(error?.stack || error?.message || error || '')
        });
        render();
    };

    button.addEventListener('click', (event) => {
        logAuth('account button click handler entered', {
            defaultPrevented: event.defaultPrevented,
            target: elementSummary(event.target),
            button: elementSummary(button),
            menu: elementSummary(menu)
        });
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        menu.hidden = expanded;
        logAuth('account menu toggled', { expanded: !expanded, menu: elementSummary(menu) });
    });

    document.addEventListener('pointerdown', (event) => {
        const rootRect = root.getBoundingClientRect();
        const googleRect = googleButton.getBoundingClientRect();
        if (!pointInsideRect(event, rootRect) && !pointInsideRect(event, googleRect)) return;
        const topElement = document.elementFromPoint(event.clientX, event.clientY);
        logAuth('pointerdown inside account area', {
            x: Math.round(event.clientX),
            y: Math.round(event.clientY),
            target: elementSummary(event.target),
            elementFromPoint: elementSummary(topElement),
            googleButton: elementSummary(googleButton),
            menu: elementSummary(menu),
            root: elementSummary(root)
        });
    }, true);

    document.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('.launcher-account')) return;
        button.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    });

    visitorButton.addEventListener('click', async (event) => {
        logAuth('visitor onClick handler entered', {
            defaultPrevented: event.defaultPrevented,
            target: elementSummary(event.target),
            button: elementSummary(visitorButton)
        });
        event.preventDefault();
        if (busy) {
            logAuth('visitor click ignored because auth UI is busy');
            return;
        }
        busy = true;
        lastInlineError = '';
        render();
        try {
            logAuth('calling signInAsVisitor()');
            const nextState = await signInAsVisitor();
            logAuth('signInAsVisitor() resolved', summarizeState(nextState));
            latestState = nextState;
        } catch (error) {
            warnAuth('signInAsVisitor() threw', String(error?.stack || error?.message || error || ''));
            setError(error);
        } finally {
            busy = false;
            render();
        }
    });

    displayNameSave.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || nameBusy) return;
        if (!latestState?.canEditDisplayName) {
            lastNameMessage = t('nameOnlySignedIn');
            render();
            return;
        }
        nameBusy = true;
        lastNameMessage = '';
        const requestedName = cleanDisplayName(displayNameInput.value);
        const requestedProfile = {
            displayName: requestedName,
            bio: cleanProfileText(bioInput.value, 140),
            location: cleanProfileText(locationInput.value, 40),
            favoriteGame: cleanProfileText(favoriteInput.value, 40),
            showEmail: Boolean(showEmailInput.checked),
            publicEmail: showEmailInput.checked ? cleanProfileText(publicEmailInput.value || latestState?.accountEmail || '', 120) : ''
        };
        latestState = { ...latestState, ...requestedProfile };
        render();
        try {
            const nextState = await updateUserProfileInfo(requestedProfile);
            latestState = { ...nextState, displayName: nextState?.displayName || requestedName };
            lastNameMessage = t('nameSaved');
            logAuth('updateUserProfileInfo() resolved', summarizeState(nextState));
        } catch (error) {
            lastNameMessage = cleanFirebaseError(error);
            warnAuth('updateUserProfileInfo() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            nameBusy = false;
            render();
        }
    });

    displayNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            displayNameSave.click();
        }
    });
    [locationInput, favoriteInput].forEach((input) => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                displayNameSave.click();
            }
        });
    });
    showEmailInput.addEventListener('change', () => {
        publicEmailInput.disabled = busy || nameBusy || !latestState?.canEditDisplayName || !showEmailInput.checked;
        if (showEmailInput.checked && !publicEmailInput.value) publicEmailInput.value = latestState?.accountEmail || '';
    });

    googleButton.addEventListener('click', (event) => {
        logAuth('google click reached capture listener', {
            defaultPrevented: event.defaultPrevented,
            isTrusted: event.isTrusted,
            target: elementSummary(event.target),
            currentTarget: elementSummary(event.currentTarget),
            button: elementSummary(googleButton)
        });
    }, true);

    googleButton.addEventListener('click', async (event) => {
        logAuth('google onClick handler FIRST LINE', {
            defaultPrevented: event.defaultPrevented,
            isTrusted: event.isTrusted,
            target: elementSummary(event.target),
            currentTarget: elementSummary(event.currentTarget),
            button: elementSummary(googleButton),
            latestState: summarizeState(latestState)
        });
        event.preventDefault();
        if (busy) {
            logAuth('google click ignored because auth UI is busy');
            return;
        }
        busy = true;
        lastInlineError = '';
        render();
        try {
            logAuth('calling signInWithGoogleAccount() from google click handler');
            const nextState = await signInWithGoogleAccount({ source: 'launcher-google-button' });
            logAuth('signInWithGoogleAccount() resolved in google click handler', summarizeState(nextState));
            latestState = nextState;
        } catch (error) {
            warnAuth('signInWithGoogleAccount() threw in google click handler', String(error?.stack || error?.message || error || ''));
            setError(error);
        } finally {
            busy = false;
            render();
            logAuth('google click handler finished', {
                button: elementSummary(googleButton),
                latestState: summarizeState(latestState)
            });
        }
    });

    logoutButton.addEventListener('click', async (event) => {
        logAuth('logout onClick handler entered', {
            defaultPrevented: event.defaultPrevented,
            target: elementSummary(event.target),
            button: elementSummary(logoutButton)
        });
        event.preventDefault();
        if (busy) {
            logAuth('logout click ignored because auth UI is busy');
            return;
        }
        busy = true;
        lastInlineError = '';
        render();
        try {
            const nextState = await signOutToGuest();
            logAuth('signOutToGuest() resolved', summarizeState(nextState));
            latestState = nextState;
        } catch (error) {
            warnAuth('signOutToGuest() threw', String(error?.stack || error?.message || error || ''));
            setError(error);
        } finally {
            busy = false;
            render();
        }
    });

    subscribeAccountState((state) => {
        logAuth('subscribeAccountState emitted', summarizeState(state));
        latestState = state;
        render(state);
    });
    window.addEventListener('languagechange', () => render());
    new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    initAccountSession()
        .then((state) => logAuth('initAccountSession() completed', summarizeState(state)))
        .catch(setError);
    render({ signedIn: false, isVisitor: false, accountKind: 'offline-guest' });
    logAuth('account UI event listeners attached');
}

if (document.readyState === 'loading') {
    logAuth('document still loading; waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', installLauncherAuth, { once: true });
} else {
    installLauncherAuth();
}
