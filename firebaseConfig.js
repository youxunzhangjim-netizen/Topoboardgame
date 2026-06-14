// Firebase Console -> Project settings -> Your apps -> Web app -> SDK setup.
// Replace every PASTE_* value with the config from the Topoboardgame project.
// Firebase web config values identify the project; Firestore Security Rules
// provide the actual access control.
export const firebaseConfig = {
  apiKey: "AIzaSyCPvjfE_0eftxrj-HDViT02Hljj-aAqH5c",
  authDomain: "topoboardgame.firebaseapp.com",
  projectId: "topoboardgame",
  storageBucket: "topoboardgame.appspot.com",
  messagingSenderId: "533937783773",
  appId: "1:533937783773:web:18aa334256b8142038ec34"
};

export function hasFirebaseConfig() {
    return Object.values(firebaseConfig).every((value) =>
        typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_'));
}
