# Firebase Multiplayer Setup

1. In Firebase Authentication, enable the **Anonymous** sign-in provider.
2. Create a Cloud Firestore database.
3. Register a Web app in the `Topoboardgame` Firebase project.
4. In Vercel Project Settings > Environment Variables, add the Firebase Web app values: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID`.
5. Publish the contents of `firestore.rules` in Firestore's Rules tab.
6. Add `youxunzhangjim-netizen.github.io`, your Vercel preview/production domains, `localhost`, and `127.0.0.1` under Authentication > Settings > Authorized domains if they are not already present.

The browser pages import Firebase directly from Google's browser CDN. Vite/Vercel injects only variables prefixed with `VITE_`, and `firebaseConfig.js` keeps online play disabled until all required Firebase values are present.

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

GitHub Pages or Vercel hosts the static files; Firebase supplies rooms, matchmaking,
state synchronization, waiting counts, account profiles, and room chat.

## Optional account login on the launcher

The launcher now has an account button near the language control. The default state is **Guest**. Local games, local robots, and local research/training do not require login.

To make the **Login** button work:

1. Open Firebase Console → Authentication → Sign-in method.
2. Enable **Google** provider and choose a support email.
3. Keep **Anonymous** provider enabled for guest online rooms.
4. Open Authentication → Settings → Authorized domains.
5. Add these domains when needed:
   - `youxunzhangjim-netizen.github.io`
   - `localhost`
   - `127.0.0.1`
6. Deploy Firestore rules again:

```bash
firebase deploy --only firestore:rules
```

When a user signs in with Google, Topoboardgame writes/updates `users/{uid}` with a small profile record. Guest users stay the default and are not required for local play.

## Google login / visitor profile checklist

Google login fails most often for one of these Firebase-side reasons:

1. **Google provider is disabled**: Firebase Console → Authentication → Sign-in method → enable Google.
2. **Anonymous provider is disabled**: enable Anonymous too, because visitor login and online rooms use temporary visitor profiles.
3. **Authorized domain missing**: Firebase Console → Authentication → Settings → Authorized domains. Add:
   - `youxunzhangjim-netizen.github.io`
   - `localhost`
   - `127.0.0.1`
   - any custom domain used by non-Steam hosted test pages or documentation-only support pages
4. **Cloud Firestore database missing**: create the default Firestore database.
5. **Rules not deployed**: run `firebase deploy --only firestore:rules`.

Profile behavior:

- Offline Guest: no Firebase account is required for local play.
- Visitor: signs in with Firebase Anonymous Auth and writes `users/{uid}` with `accountKind: "visitor"`.
- Google: signs in or upgrades from visitor and writes `users/{uid}` with `accountKind: "google"`.
- Profile write failures do not block login; this avoids locking users out while rules are being deployed.
