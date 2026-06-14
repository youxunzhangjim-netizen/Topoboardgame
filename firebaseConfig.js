// Firebase Console -> Project settings -> Your apps -> Web app -> SDK setup.
// Replace every PASTE_* value with the config from the Topoboardgame project.
// Firebase web config values identify the project; Firestore Security Rules
// provide the actual access control.
export const firebaseConfig = {
    apiKey: 'PASTE_API_KEY_HERE',
    authDomain: 'PASTE_AUTH_DOMAIN_HERE',
    projectId: 'PASTE_PROJECT_ID_HERE',
    storageBucket: 'PASTE_STORAGE_BUCKET_HERE',
    messagingSenderId: 'PASTE_MESSAGING_SENDER_ID_HERE',
    appId: 'PASTE_APP_ID_HERE'
};

export function hasFirebaseConfig() {
    return Object.values(firebaseConfig).every((value) =>
        typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_'));
}
