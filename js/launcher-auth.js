const LOG_PREFIX = '[Topoboardgame Auth]';
let onlineApiPromise = null;
let lastOnlineImportError = '';

function offlineAccountState() {
    return {
        configured: false,
        ready: false,
        onlineStatus: 'offline-unavailable',
        onlineError: lastOnlineImportError,
        accountKind: 'offline-guest',
        signedIn: false,
        isGoogle: false,
        isEmail: false,
        isVisitor: false,
        isGuest: true,
        isOfflineGuest: true,
        isAnonymous: false,
        displayName: 'Offline Guest',
        canEditDisplayName: false,
        canEditProfile: false,
        joinedDate: '',
        bio: '',
        location: '',
        favoriteGame: '',
        defaultLanguage: 'en',
        showEmail: false,
        publicEmail: '',
        allowRobotLearning: true,
        accountEmail: '',
        photoURL: null,
        emailVerified: false,
        profilePath: '',
        profileSynced: false,
        profileError: lastOnlineImportError
    };
}

function onlineUnavailableError() {
    return new Error(lastOnlineImportError || 'Online login is unavailable. Local play still works.');
}

function loadOnlineApi() {
    if (!onlineApiPromise) {
        onlineApiPromise = import('../online.js')
            .catch((error) => {
                lastOnlineImportError = String(error?.message || error || 'Online login is unavailable.');
                warnAuth('online.js could not be loaded; launcher stays in Offline Guest mode', {
                    error: lastOnlineImportError
                });
                return null;
            });
    }
    return onlineApiPromise;
}

async function callOnlineApi(name, fallback, ...args) {
    const api = await loadOnlineApi();
    if (api?.[name]) return api[name](...args);
    if (typeof fallback === 'function') return fallback(...args);
    throw onlineUnavailableError();
}

function subscribeAccountState(listener) {
    let active = true;
    let remoteUnsubscribe = null;
    listener(offlineAccountState());
    loadOnlineApi().then((api) => {
        if (!active || !api?.subscribeAccountState) return;
        remoteUnsubscribe = api.subscribeAccountState(listener);
    });
    return () => {
        active = false;
        remoteUnsubscribe?.();
    };
}

const initAccountSession = (...args) => callOnlineApi('initAccountSession', () => offlineAccountState(), ...args);
const signInAsVisitor = (...args) => callOnlineApi('signInAsVisitor', null, ...args);
const signInWithGoogleAccount = (...args) => callOnlineApi('signInWithGoogleAccount', null, ...args);
const signInWithEmailPassword = (...args) => callOnlineApi('signInWithEmailPassword', null, ...args);
const registerWithEmailPassword = (...args) => callOnlineApi('registerWithEmailPassword', null, ...args);
const sendAccountPasswordReset = (...args) => callOnlineApi('sendAccountPasswordReset', null, ...args);
const changeAccountPassword = (...args) => callOnlineApi('changeAccountPassword', null, ...args);
const deleteCurrentAccount = (...args) => callOnlineApi('deleteCurrentAccount', null, ...args);
const signOutToGuest = (...args) => callOnlineApi('signOutToGuest', () => offlineAccountState(), ...args);
const updateUserProfileInfo = (...args) => callOnlineApi('updateUserProfileInfo', null, ...args);
const listRecentGames = (...args) => callOnlineApi('listRecentGames', () => [], ...args);
const deleteRecentGame = (...args) => callOnlineApi('deleteRecentGame', () => false, ...args);
const listFriends = (...args) => callOnlineApi('listFriends', () => [], ...args);
const saveFriendFromProfile = (...args) => callOnlineApi('saveFriendFromProfile', () => null, ...args);
const deleteFriend = (...args) => callOnlineApi('deleteFriend', () => false, ...args);

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
        emailAccount: 'Email account',
        email: 'Email',
        emailInputPlaceholder: 'you@example.com',
        password: 'Password',
        passwordPlaceholder: 'Password',
        newAccountName: 'Visible name for new account',
        emailLogin: 'Login',
        emailRegister: 'Register',
        forgotPassword: 'Forgot password?',
        resetSent: 'Password reset email sent.',
        accountSecurity: 'Account security',
        currentPassword: 'Current password',
        newPassword: 'New password',
        changePassword: 'Change',
        passwordChanged: 'Password changed.',
        passwordOnlyEmail: 'Password changes are available for email/password accounts.',
        deleteAccount: 'Delete account',
        deleteConfirm: 'Delete this account permanently? This cannot be undone.',
        accountDeleted: 'Account deleted.',
        guestStatus: 'Offline Guest is active. Local play and local robots do not need an account.',
        visitorStatus: 'Visitor mode is active. You can play online as a temporary visitor.',
        visitorStatusChecking: 'Visitor mode is active. Preparing online play...',
        visitorStatusSynced: 'Visitor mode is active. Online play is ready.',
        signedInStatus: 'Signed-in account is active. Preparing online play...',
        signedInStatusChecking: 'Signed-in account is active. Preparing online play...',
        signedInStatusSynced: 'Signed-in account is active. Online play is ready.',
        profileError: 'Sign-in succeeded, but online play setup failed: {message}',
        visitorProfileError: 'Visitor mode is active, but online play setup failed: {message}',
        note: 'Anonymous robot games may be used to improve local robots. Sign in to opt out of learning from your games.',
        working: 'Connecting...',
        error: 'Login failed: {message}',
        visibleName: 'Visible name',
        joinedDate: 'Joined',
        about: 'About',
        location: 'Location',
        favoriteGame: 'Favorite game',
        defaultLanguage: 'Default language',
        recentGames: 'Recent games',
        friends: 'Friend list',
        refreshRecentGames: 'Refresh',
        refreshFriends: 'Refresh',
        noRecentGames: 'No recent online games yet.',
        noFriends: 'No saved friends yet.',
        replay: 'Replay',
        removeHistory: 'Cancel history',
        saveFriend: 'Save friend',
        removeFriend: 'Remove friend',
        savedFriend: 'Friend saved.',
        viewProfile: 'Profile',
        opponentProfile: 'Opponent profile',
        friendProfile: 'Friend profile',
        robotHuman: 'Opponent type',
        result: 'Result',
        duration: 'Duration',
        variant: 'Variant',
        topology: 'Topology',
        showEmail: 'Show my email',
        allowRobotLearning: 'Allow robot learning from my games',
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
        emailAccount: 'Email 帳號',
        email: 'Email',
        emailInputPlaceholder: 'you@example.com',
        password: '密碼',
        passwordPlaceholder: '密碼',
        newAccountName: '新帳號顯示名稱',
        emailLogin: '登入',
        emailRegister: '註冊',
        forgotPassword: '忘記密碼？',
        resetSent: '密碼重設信已寄出。',
        accountSecurity: '帳號安全',
        currentPassword: '目前密碼',
        newPassword: '新密碼',
        changePassword: '變更',
        passwordChanged: '密碼已變更。',
        passwordOnlyEmail: '只有 Email / 密碼帳號可以在這裡變更密碼。',
        deleteAccount: '刪除帳號',
        deleteConfirm: '要永久刪除此帳號嗎？此操作無法復原。',
        accountDeleted: '帳號已刪除。',
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
        note: '匿名與機器人對局可能用於改進本機機器人。登入後可選擇不讓自己的對局被學習。',
        working: '連線中...',
        error: '登入失敗：{message}',
        visibleName: '顯示名稱',
        joinedDate: '加入日期',
        about: '簡介',
        location: '位置',
        favoriteGame: '喜歡的遊戲',
        defaultLanguage: '預設語言',
        recentGames: '最近遊戲',
        friends: '好友列表',
        refreshRecentGames: '重新整理',
        refreshFriends: '重新整理',
        noRecentGames: '還沒有最近的線上遊戲。',
        noFriends: '還沒有儲存的好友。',
        replay: '重播',
        removeHistory: '取消此歷史',
        saveFriend: '儲存好友',
        removeFriend: '移除好友',
        savedFriend: '已儲存好友。',
        viewProfile: '資料',
        opponentProfile: '對手資料',
        friendProfile: '好友資料',
        robotHuman: '對手類型',
        result: '結果',
        duration: '時間',
        variant: '變體',
        topology: '拓撲',
        showEmail: '顯示我的 email',
        allowRobotLearning: '允許用我的對局訓練機器人',
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
        defaultLanguage: state?.defaultLanguage || 'en',
        showEmail: Boolean(state?.showEmail),
        publicEmail: state?.publicEmail || '',
        accountEmail: state?.accountEmail || '',
        allowRobotLearning: state?.allowRobotLearning !== false
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

function normalizeProfileLanguage(value) {
    return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (match) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}

function formatDuration(seconds = 0) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
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
    const languageLabel = document.getElementById('launcherProfileLanguageLabel');
    const languageSelect = document.getElementById('launcherProfileLanguageSelect');
    const recentGames = document.getElementById('launcherRecentGames');
    const recentGamesLabel = document.getElementById('launcherRecentGamesLabel');
    const recentGamesRefresh = document.getElementById('launcherRecentGamesRefresh');
    const recentGamesList = document.getElementById('launcherRecentGamesList');
    const recentGameProfile = document.getElementById('launcherRecentGameProfile');
    const friends = document.getElementById('launcherFriends');
    const friendsLabel = document.getElementById('launcherFriendsLabel');
    const friendsRefresh = document.getElementById('launcherFriendsRefresh');
    const friendsList = document.getElementById('launcherFriendsList');
    const friendProfile = document.getElementById('launcherFriendProfile');
    const showEmailLabel = document.getElementById('launcherProfileShowEmailLabel');
    const showEmailInput = document.getElementById('launcherProfileShowEmailInput');
    const publicEmailInput = document.getElementById('launcherProfilePublicEmailInput');
    const robotLearningLabel = document.getElementById('launcherProfileRobotLearningLabel');
    const robotLearningInput = document.getElementById('launcherProfileRobotLearningInput');
    const emailAuthPanel = document.getElementById('launcherEmailAuthPanel');
    const emailAuthTitle = document.getElementById('launcherEmailAuthTitle');
    const emailLabel = document.getElementById('launcherEmailLabel');
    const emailInput = document.getElementById('launcherEmailInput');
    const emailPasswordLabel = document.getElementById('launcherEmailPasswordLabel');
    const emailPasswordInput = document.getElementById('launcherEmailPasswordInput');
    const emailDisplayNameLabel = document.getElementById('launcherEmailDisplayNameLabel');
    const emailDisplayNameInput = document.getElementById('launcherEmailDisplayNameInput');
    const emailLoginButton = document.getElementById('launcherEmailLoginButton');
    const emailRegisterButton = document.getElementById('launcherEmailRegisterButton');
    const passwordResetButton = document.getElementById('launcherPasswordResetButton');
    const emailAuthStatus = document.getElementById('launcherEmailAuthStatus');
    const accountSecurityPanel = document.getElementById('launcherAccountSecurityPanel');
    const securityTitle = document.getElementById('launcherSecurityTitle');
    const currentPasswordLabel = document.getElementById('launcherCurrentPasswordLabel');
    const currentPasswordInput = document.getElementById('launcherCurrentPasswordInput');
    const newPasswordLabel = document.getElementById('launcherNewPasswordLabel');
    const newPasswordInput = document.getElementById('launcherNewPasswordInput');
    const changePasswordButton = document.getElementById('launcherChangePasswordButton');
    const deleteAccountButton = document.getElementById('launcherDeleteAccountButton');
    const accountSecurityStatus = document.getElementById('launcherAccountSecurityStatus');

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
        languageLabel: !languageLabel,
        languageSelect: !languageSelect,
        recentGames: !recentGames,
        recentGamesLabel: !recentGamesLabel,
        recentGamesRefresh: !recentGamesRefresh,
        recentGamesList: !recentGamesList,
        recentGameProfile: !recentGameProfile,
        friends: !friends,
        friendsLabel: !friendsLabel,
        friendsRefresh: !friendsRefresh,
        friendsList: !friendsList,
        friendProfile: !friendProfile,
        showEmailLabel: !showEmailLabel,
        showEmailInput: !showEmailInput,
        publicEmailInput: !publicEmailInput,
        robotLearningLabel: !robotLearningLabel,
        robotLearningInput: !robotLearningInput,
        emailAuthPanel: !emailAuthPanel,
        emailAuthTitle: !emailAuthTitle,
        emailLabel: !emailLabel,
        emailInput: !emailInput,
        emailPasswordLabel: !emailPasswordLabel,
        emailPasswordInput: !emailPasswordInput,
        emailDisplayNameLabel: !emailDisplayNameLabel,
        emailDisplayNameInput: !emailDisplayNameInput,
        emailLoginButton: !emailLoginButton,
        emailRegisterButton: !emailRegisterButton,
        passwordResetButton: !passwordResetButton,
        emailAuthStatus: !emailAuthStatus,
        accountSecurityPanel: !accountSecurityPanel,
        securityTitle: !securityTitle,
        currentPasswordLabel: !currentPasswordLabel,
        currentPasswordInput: !currentPasswordInput,
        newPasswordLabel: !newPasswordLabel,
        newPasswordInput: !newPasswordInput,
        changePasswordButton: !changePasswordButton,
        deleteAccountButton: !deleteAccountButton,
        accountSecurityStatus: !accountSecurityStatus
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
    let emailBusy = false;
    let securityBusy = false;
    let lastInlineError = '';
    let lastNameMessage = '';
    let lastEmailMessage = '';
    let lastSecurityMessage = '';
    let recentBusy = false;
    let recentGameItems = [];
    let friendBusy = false;
    let friendItems = [];
    let lastRecentUid = '';
    let lastFriendsUid = '';
    let appliedLanguageUid = '';

    const renderOpponentProfile = (profile = {}) => {
        if (!recentGameProfile) return;
        if (!profile || !Object.keys(profile).length) {
            recentGameProfile.hidden = true;
            recentGameProfile.textContent = '';
            return;
        }
        const lines = [
            `<strong>${escapeHtml(t('opponentProfile'))}: ${escapeHtml(profile.displayName || 'Player')}</strong>`,
            profile.joinedDate ? `${escapeHtml(t('joinedDate'))}: ${escapeHtml(profile.joinedDate)}` : '',
            profile.location ? `${escapeHtml(t('location'))}: ${escapeHtml(profile.location)}` : '',
            profile.favoriteGame ? `${escapeHtml(t('favoriteGame'))}: ${escapeHtml(profile.favoriteGame)}` : '',
            profile.showEmail && profile.publicEmail ? `${escapeHtml(t('showEmail'))}: ${escapeHtml(profile.publicEmail)}` : '',
            profile.bio ? escapeHtml(profile.bio) : ''
        ].filter(Boolean);
        recentGameProfile.innerHTML = lines.join('<br>');
        recentGameProfile.hidden = false;
    };

    const renderFriendProfile = (profile = {}) => {
        if (!friendProfile) return;
        if (!profile || !Object.keys(profile).length) {
            friendProfile.hidden = true;
            friendProfile.textContent = '';
            return;
        }
        const lines = [
            `<strong>${escapeHtml(t('friendProfile'))}: ${escapeHtml(profile.displayName || 'Player')}</strong>`,
            profile.joinedDate ? `${escapeHtml(t('joinedDate'))}: ${escapeHtml(profile.joinedDate)}` : '',
            profile.location ? `${escapeHtml(t('location'))}: ${escapeHtml(profile.location)}` : '',
            profile.favoriteGame ? `${escapeHtml(t('favoriteGame'))}: ${escapeHtml(profile.favoriteGame)}` : '',
            profile.showEmail && profile.publicEmail ? `${escapeHtml(t('showEmail'))}: ${escapeHtml(profile.publicEmail)}` : '',
            profile.bio ? escapeHtml(profile.bio) : ''
        ].filter(Boolean);
        friendProfile.innerHTML = lines.join('<br>');
        friendProfile.hidden = false;
    };

    const renderRecentGames = () => {
        if (!recentGamesList) return;
        recentGamesLabel.textContent = t('recentGames');
        recentGamesRefresh.textContent = recentBusy ? t('working') : t('refreshRecentGames');
        recentGamesRefresh.disabled = recentBusy || busy;
        if (!latestState?.signedIn) {
            recentGames.hidden = true;
            return;
        }
        recentGames.hidden = false;
        if (!recentGameItems.length) {
            recentGamesList.innerHTML = `<p>${escapeHtml(t('noRecentGames'))}</p>`;
            return;
        }
        recentGamesList.innerHTML = recentGameItems.map((game) => `
            <article class="launcher-recent-game" data-game-id="${escapeHtml(game.id)}">
                <div class="launcher-recent-game-main">
                    <button class="launcher-profile-link" type="button" data-profile-id="${escapeHtml(game.id)}">${escapeHtml(game.opponent || 'Opponent')}</button>
                    <strong>${escapeHtml(game.result || '')}</strong>
                </div>
                <div class="launcher-recent-game-meta">
                    <span>${escapeHtml(t('robotHuman'))}: ${escapeHtml(game.opponentType || 'Human')}</span>
                    <span>${escapeHtml(t('duration'))}: ${escapeHtml(formatDuration(game.durationSec))}</span>
                    <span>${escapeHtml(t('variant'))}: ${escapeHtml(game.variant || '')}</span>
                    <span>${escapeHtml(t('topology'))}: ${escapeHtml(game.topology || '')}</span>
                </div>
                <div class="launcher-recent-actions">
                    <a href="${escapeHtml(game.replayUrl || '#')}">${escapeHtml(t('replay'))}</a>
                    ${game.opponentUid ? `<button type="button" data-friend-game-id="${escapeHtml(game.id)}">${escapeHtml(t('saveFriend'))}</button>` : ''}
                    <button type="button" data-delete-id="${escapeHtml(game.id)}">${escapeHtml(t('removeHistory'))}</button>
                </div>
            </article>
        `).join('');
    };

    const refreshRecentGames = async () => {
        if (!latestState?.signedIn || recentBusy) return;
        recentBusy = true;
        renderRecentGames();
        try {
            recentGameItems = await listRecentGames({ max: 12 });
        } catch (error) {
            warnAuth('listRecentGames() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            recentBusy = false;
            renderRecentGames();
        }
    };

    const renderFriends = () => {
        if (!friendsList) return;
        friendsLabel.textContent = t('friends');
        friendsRefresh.textContent = friendBusy ? t('working') : t('refreshFriends');
        friendsRefresh.disabled = friendBusy || busy;
        if (!latestState?.signedIn) {
            friends.hidden = true;
            return;
        }
        friends.hidden = false;
        if (!friendItems.length) {
            friendsList.innerHTML = `<p>${escapeHtml(t('noFriends'))}</p>`;
            return;
        }
        friendsList.innerHTML = friendItems.map((friend) => `
            <article class="launcher-recent-game" data-friend-id="${escapeHtml(friend.id)}">
                <div class="launcher-recent-game-main">
                    <button class="launcher-profile-link" type="button" data-friend-profile-id="${escapeHtml(friend.id)}">${escapeHtml(friend.displayName || 'Player')}</button>
                    <strong>${escapeHtml(friend.favoriteGame || friend.location || '')}</strong>
                </div>
                <div class="launcher-recent-game-meta">
                    ${friend.joinedDate ? `<span>${escapeHtml(t('joinedDate'))}: ${escapeHtml(friend.joinedDate)}</span>` : ''}
                    ${friend.location ? `<span>${escapeHtml(t('location'))}: ${escapeHtml(friend.location)}</span>` : ''}
                    ${friend.favoriteGame ? `<span>${escapeHtml(t('favoriteGame'))}: ${escapeHtml(friend.favoriteGame)}</span>` : ''}
                    ${friend.showEmail && friend.publicEmail ? `<span>${escapeHtml(t('showEmail'))}: ${escapeHtml(friend.publicEmail)}</span>` : ''}
                </div>
                <div class="launcher-recent-actions">
                    <button type="button" data-friend-profile-id="${escapeHtml(friend.id)}">${escapeHtml(t('viewProfile'))}</button>
                    <button type="button" data-remove-friend-id="${escapeHtml(friend.id)}">${escapeHtml(t('removeFriend'))}</button>
                </div>
            </article>
        `).join('');
    };

    const refreshFriends = async () => {
        if (!latestState?.signedIn || friendBusy) return;
        friendBusy = true;
        renderFriends();
        try {
            friendItems = await listFriends({ max: 40 });
        } catch (error) {
            warnAuth('listFriends() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            friendBusy = false;
            renderFriends();
        }
    };

    const refreshDisplayNameEditor = () => {
        const canEdit = Boolean(latestState?.canEditDisplayName);
        displayNameEditor.hidden = !canEdit;
        displayNameLabel.textContent = t('visibleName');
        joinedDateLabel.textContent = t('joinedDate');
        bioLabel.textContent = t('about');
        locationLabel.textContent = t('location');
        favoriteLabel.textContent = t('favoriteGame');
        languageLabel.textContent = t('defaultLanguage');
        showEmailLabel.textContent = t('showEmail');
        robotLearningLabel.textContent = t('allowRobotLearning');
        displayNameInput.placeholder = t('namePlaceholder');
        bioInput.placeholder = t('bioPlaceholder');
        locationInput.placeholder = t('locationPlaceholder');
        favoriteInput.placeholder = t('favoritePlaceholder');
        publicEmailInput.placeholder = t('emailPlaceholder');
        displayNameSave.textContent = nameBusy ? t('savingName') : t('saveName');
        displayNameSave.disabled = busy || nameBusy || !canEdit;
        [displayNameInput, bioInput, locationInput, favoriteInput, languageSelect, showEmailInput, robotLearningInput].forEach((input) => {
            input.disabled = busy || nameBusy || !canEdit;
        });
        publicEmailInput.disabled = busy || nameBusy || !canEdit || !showEmailInput.checked;
        if (canEdit && document.activeElement !== displayNameInput) {
            displayNameInput.value = latestState?.displayName || '';
        }
        if (canEdit && document.activeElement !== bioInput) bioInput.value = latestState?.bio || '';
        if (canEdit && document.activeElement !== locationInput) locationInput.value = latestState?.location || '';
        if (canEdit && document.activeElement !== favoriteInput) favoriteInput.value = latestState?.favoriteGame || '';
        if (canEdit && document.activeElement !== languageSelect) languageSelect.value = normalizeProfileLanguage(latestState?.defaultLanguage || 'en');
        if (canEdit && document.activeElement !== showEmailInput) showEmailInput.checked = Boolean(latestState?.showEmail);
        if (canEdit && document.activeElement !== robotLearningInput) robotLearningInput.checked = latestState?.allowRobotLearning !== false;
        if (canEdit && document.activeElement !== publicEmailInput) publicEmailInput.value = latestState?.publicEmail || latestState?.accountEmail || '';
        publicEmailInput.disabled = busy || nameBusy || !canEdit || !showEmailInput.checked;
        joinedDateValue.textContent = latestState?.joinedDate || '-';
        displayNameStatus.textContent = lastNameMessage;
    };

    const refreshEmailAuthPanel = () => {
        const signedIn = Boolean(latestState?.signedIn);
        emailAuthPanel.hidden = signedIn;
        emailAuthTitle.textContent = t('emailAccount');
        emailLabel.textContent = t('email');
        emailPasswordLabel.textContent = t('password');
        emailDisplayNameLabel.textContent = t('newAccountName');
        emailInput.placeholder = t('emailInputPlaceholder');
        emailPasswordInput.placeholder = t('passwordPlaceholder');
        emailDisplayNameInput.placeholder = t('namePlaceholder');
        emailLoginButton.textContent = emailBusy ? t('working') : t('emailLogin');
        emailRegisterButton.textContent = emailBusy ? t('working') : t('emailRegister');
        passwordResetButton.textContent = t('forgotPassword');
        [emailInput, emailPasswordInput, emailDisplayNameInput, emailLoginButton, emailRegisterButton, passwordResetButton].forEach((element) => {
            element.disabled = busy || emailBusy || signedIn;
        });
        emailAuthStatus.textContent = lastEmailMessage;
    };

    const refreshAccountSecurityPanel = () => {
        const signedIn = Boolean(latestState?.signedIn);
        const canUsePassword = Boolean(latestState?.isEmail);
        accountSecurityPanel.hidden = !signedIn;
        securityTitle.textContent = t('accountSecurity');
        currentPasswordLabel.textContent = t('currentPassword');
        newPasswordLabel.textContent = t('newPassword');
        currentPasswordInput.placeholder = t('currentPassword');
        newPasswordInput.placeholder = t('newPassword');
        changePasswordButton.textContent = securityBusy ? t('working') : t('changePassword');
        deleteAccountButton.textContent = securityBusy ? t('working') : t('deleteAccount');
        currentPasswordInput.hidden = !canUsePassword;
        currentPasswordLabel.hidden = !canUsePassword;
        newPasswordInput.hidden = !canUsePassword;
        newPasswordLabel.hidden = !canUsePassword;
        changePasswordButton.hidden = !canUsePassword;
        [currentPasswordInput, newPasswordInput, changePasswordButton, deleteAccountButton].forEach((element) => {
            element.disabled = busy || securityBusy || !signedIn || (element !== deleteAccountButton && !canUsePassword);
        });
        accountSecurityStatus.textContent = canUsePassword || !signedIn
            ? lastSecurityMessage
            : (lastSecurityMessage || t('passwordOnlyEmail'));
    };

    const render = (state = latestState) => {
        latestState = state || latestState || { signedIn: false, isVisitor: false };
        globalThis.TopoboardgameAccountState = summarizeState(latestState);
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
        refreshEmailAuthPanel();
        refreshAccountSecurityPanel();
        googleButton.hidden = signedIn;
        visitorButton.hidden = signedIn || visitor;
        logoutButton.hidden = !signedIn && !visitor;
        googleButton.disabled = busy;
        visitorButton.disabled = busy;
        logoutButton.disabled = busy;
        root.dataset.account = latestState.accountKind || (signedIn ? 'google' : (visitor ? 'visitor' : 'offline-guest'));
        root.dataset.profile = latestState.profileError ? 'error' : (latestState.profileSynced ? 'synced' : 'idle');
        renderRecentGames();
        renderFriends();
        if (signedIn && latestState.uid && appliedLanguageUid !== latestState.uid && latestState.defaultLanguage) {
            appliedLanguageUid = latestState.uid;
            globalThis.setTopoboardgameLanguage?.(latestState.defaultLanguage, { source: 'account-default' });
        }
        if (signedIn && latestState.uid && lastRecentUid !== latestState.uid) {
            lastRecentUid = latestState.uid;
            refreshRecentGames();
        }
        if (signedIn && latestState.uid && lastFriendsUid !== latestState.uid) {
            lastFriendsUid = latestState.uid;
            refreshFriends();
        }
        if (!signedIn) {
            lastRecentUid = '';
            lastFriendsUid = '';
            recentGameItems = [];
            friendItems = [];
            renderOpponentProfile(null);
            renderFriendProfile(null);
        }
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

    emailLoginButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || emailBusy) return;
        emailBusy = true;
        lastInlineError = '';
        lastEmailMessage = '';
        render();
        try {
            const nextState = await signInWithEmailPassword({
                email: emailInput.value,
                password: emailPasswordInput.value
            });
            latestState = nextState;
            emailPasswordInput.value = '';
        } catch (error) {
            lastEmailMessage = cleanFirebaseError(error);
            warnAuth('signInWithEmailPassword() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            emailBusy = false;
            render();
        }
    });

    emailRegisterButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || emailBusy) return;
        emailBusy = true;
        lastInlineError = '';
        lastEmailMessage = '';
        render();
        try {
            const nextState = await registerWithEmailPassword({
                email: emailInput.value,
                password: emailPasswordInput.value,
                displayName: emailDisplayNameInput.value
            });
            latestState = nextState;
            emailPasswordInput.value = '';
        } catch (error) {
            lastEmailMessage = cleanFirebaseError(error);
            warnAuth('registerWithEmailPassword() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            emailBusy = false;
            render();
        }
    });

    passwordResetButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || emailBusy) return;
        emailBusy = true;
        lastEmailMessage = '';
        render();
        try {
            await sendAccountPasswordReset(emailInput.value);
            lastEmailMessage = t('resetSent');
        } catch (error) {
            lastEmailMessage = cleanFirebaseError(error);
            warnAuth('sendAccountPasswordReset() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            emailBusy = false;
            render();
        }
    });

    changePasswordButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || securityBusy) return;
        securityBusy = true;
        lastSecurityMessage = '';
        render();
        try {
            await changeAccountPassword({
                currentPassword: currentPasswordInput.value,
                newPassword: newPasswordInput.value
            });
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            lastSecurityMessage = t('passwordChanged');
        } catch (error) {
            lastSecurityMessage = cleanFirebaseError(error);
            warnAuth('changeAccountPassword() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            securityBusy = false;
            render();
        }
    });

    deleteAccountButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (busy || securityBusy || !latestState?.signedIn) return;
        if (!window.confirm(t('deleteConfirm'))) return;
        securityBusy = true;
        lastSecurityMessage = '';
        render();
        try {
            const nextState = await deleteCurrentAccount({
                currentPassword: currentPasswordInput.value
            });
            latestState = nextState;
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            lastInlineError = t('accountDeleted');
        } catch (error) {
            lastSecurityMessage = cleanFirebaseError(error);
            warnAuth('deleteCurrentAccount() threw', String(error?.stack || error?.message || error || ''));
        } finally {
            securityBusy = false;
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
            defaultLanguage: normalizeProfileLanguage(languageSelect.value),
            showEmail: Boolean(showEmailInput.checked),
            publicEmail: showEmailInput.checked ? cleanProfileText(publicEmailInput.value || latestState?.accountEmail || '', 120) : '',
            allowRobotLearning: Boolean(robotLearningInput.checked)
        };
        latestState = { ...latestState, ...requestedProfile };
        render();
        try {
            const nextState = await updateUserProfileInfo(requestedProfile);
            latestState = { ...nextState, displayName: nextState?.displayName || requestedName };
            globalThis.setTopoboardgameLanguage?.(requestedProfile.defaultLanguage, { source: 'account-save' });
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
    languageSelect.addEventListener('change', () => {
        globalThis.setTopoboardgameLanguage?.(languageSelect.value, { source: 'account-select-preview' });
    });
    recentGamesRefresh.addEventListener('click', (event) => {
        event.preventDefault();
        refreshRecentGames();
    });
    friendsRefresh.addEventListener('click', (event) => {
        event.preventDefault();
        refreshFriends();
    });
    recentGamesList.addEventListener('click', async (event) => {
        const profileButton = event.target.closest('button[data-profile-id]');
        if (profileButton) {
            const item = recentGameItems.find((game) => game.id === profileButton.dataset.profileId);
            renderOpponentProfile(item?.opponentProfile || {});
            return;
        }
        const friendButton = event.target.closest('button[data-friend-game-id]');
        if (friendButton) {
            const item = recentGameItems.find((game) => game.id === friendButton.dataset.friendGameId);
            if (!item?.opponentProfile) return;
            friendButton.disabled = true;
            const saved = await saveFriendFromProfile(item.opponentProfile, {
                gameId: item.id,
                roomId: item.roomId
            });
            if (saved) {
                lastNameMessage = t('savedFriend');
                friendItems = [saved, ...friendItems.filter((friend) => friend.id !== saved.id)];
                renderFriendProfile(saved);
                renderFriends();
            }
            friendButton.disabled = false;
            render();
            return;
        }
        const deleteButton = event.target.closest('button[data-delete-id]');
        if (!deleteButton) return;
        const id = deleteButton.dataset.deleteId;
        deleteButton.disabled = true;
        await deleteRecentGame(id);
        recentGameItems = recentGameItems.filter((game) => game.id !== id);
        renderOpponentProfile(null);
        renderRecentGames();
    });
    friendsList.addEventListener('click', async (event) => {
        const profileButton = event.target.closest('button[data-friend-profile-id]');
        if (profileButton) {
            const item = friendItems.find((friend) => friend.id === profileButton.dataset.friendProfileId);
            renderFriendProfile(item || {});
            return;
        }
        const deleteButton = event.target.closest('button[data-remove-friend-id]');
        if (!deleteButton) return;
        const id = deleteButton.dataset.removeFriendId;
        deleteButton.disabled = true;
        await deleteFriend(id);
        friendItems = friendItems.filter((friend) => friend.id !== id);
        renderFriendProfile(null);
        renderFriends();
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
