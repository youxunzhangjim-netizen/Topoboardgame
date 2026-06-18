# Auth Profiles and Steam Upload Metadata

## Why Google login can fail

Google sign-in needs Firebase Console setup, not only code:

1. Enable Firebase Authentication.
2. Enable the **Google** sign-in provider.
3. Enable **Anonymous** sign-in for visitor profiles.
4. Add your deployed domains to Authentication → Settings → Authorized domains:
   - `youxunzhangjim-netizen.github.io`
   - `localhost`
   - `127.0.0.1`
   - custom domains used later
5. Create the default Cloud Firestore database.
6. Deploy `firestore.rules`.

## Account states

| State | Firebase Auth | Firestore profile | Intended use |
|---|---|---|---|
| Offline Guest | none | none | local games and local robots |
| Visitor | anonymous auth | `users/{uid}`, `accountKind: "visitor"` | online rooms without signup |
| Google | Google provider | `users/{uid}`, `accountKind: "google"` | persistent account identity |

The launcher creates a visitor profile automatically once Firebase is available, and the **Continue as Visitor** button can explicitly create one. Google login can upgrade from a visitor account by linking the anonymous user to Google when possible.

## Steam upload metadata

Use:

```powershell
Copy-Item steamworks/steam_config.example.json steamworks/steam_config.local.json
npm run steam:check-info
npm run steam:prepare-vdf
```

`steam_config.local.json` is ignored by Git and should contain only non-password metadata: Steamworks login name, App ID, depot IDs, and branch choice. Never store Steam password or Steam Guard code in this repository.
