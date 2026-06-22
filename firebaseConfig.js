// Firebase Console -> Project settings -> Your apps -> Web app -> SDK setup.
// Vercel/Vite builds read these from VITE_FIREBASE_* environment variables.
// Firebase web config values identify the project; Firestore Security Rules
// provide the actual access control.
const viteEnv = import.meta.env || {};
const runtimeConfig = globalThis.__TOPOBOARDGAME_FIREBASE__ || {};

function configValue(viteValue, runtimeKey, envKey) {
    const value = viteValue ?? runtimeConfig[runtimeKey] ?? runtimeConfig[envKey] ?? '';
    return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

export const firebaseConfig = {
  apiKey: configValue(viteEnv.VITE_FIREBASE_API_KEY, 'apiKey', 'VITE_FIREBASE_API_KEY'),
  authDomain: configValue(viteEnv.VITE_FIREBASE_AUTH_DOMAIN, 'authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: configValue(viteEnv.VITE_FIREBASE_PROJECT_ID, 'projectId', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: configValue(viteEnv.VITE_FIREBASE_STORAGE_BUCKET, 'storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: configValue(viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID, 'messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: configValue(viteEnv.VITE_FIREBASE_APP_ID, 'appId', 'VITE_FIREBASE_APP_ID'),
  measurementId: configValue(viteEnv.VITE_FIREBASE_MEASUREMENT_ID, 'measurementId', 'VITE_FIREBASE_MEASUREMENT_ID')
};

export function hasFirebaseConfig() {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    return required.every((key) => {
        const value = firebaseConfig[key];
        return typeof value === 'string'
            && value.length > 0
            && !value.startsWith('PASTE_')
            && !value.startsWith('REPLACE_');
    });
}
