# Firebase Multiplayer Setup

1. In Firebase Authentication, enable the **Anonymous** sign-in provider.
2. Create a Cloud Firestore database.
3. Register a Web app in the `Topoboardgame` Firebase project.
4. Replace the `PASTE_*` values in `firebaseConfig.js`.
5. Publish the contents of `firestore.rules` in Firestore's Rules tab.
6. Add `youxunzhangjim-netizen.github.io` under Authentication > Settings > Authorized domains if it is not already present.

The 2D Chess page imports Firebase directly from Google's browser CDN. It does
not require Node.js, npm, a bundler, or a server process.

The current rules enforce authenticated room membership, turn ownership, and
monotonic move numbers. The board itself is still validated by the clients.
Commercial anti-cheat requires trusted server-side move validation.
# Firebase deployment

The browser app uses Firebase Anonymous Authentication and Cloud Firestore.

1. In Firebase Console, enable **Authentication > Sign-in method > Anonymous**.
2. Create the default **Cloud Firestore** database.
3. Install the CLI with `npm install --global firebase-tools`.
4. Authenticate with `firebase login`.
5. From this repository, deploy the rules with:

   `firebase deploy --only firestore:rules`

GitHub Pages hosts the static files; Firebase supplies rooms, matchmaking,
state synchronization, waiting counts, and room chat.
