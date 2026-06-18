# Topoboardgame Privacy Policy

_Last updated: 2026-06-18_

This privacy policy describes how Topoboardgame handles data in the website, local desktop app, online play, local robot modes, and research/self-play tools.

## Summary

- Local play and local robot play do not require an account.
- Guest online play may use Firebase Anonymous Authentication.
- Optional Google login may be used for persistent online identity and future user statistics.
- Local self-play/training data is stored locally on the user's device unless the user deliberately exports or uploads it.
- We do not sell personal data.

## Data we may process

### Local/offline modes

For Local, Local Robot, and local research/training modes, the app can run without login. Generated self-play data, model training data, logs, and statistics are stored locally in folders such as:

```text
local-data/
local-models/
```

These local files are not automatically uploaded by the app.

### Online modes

When online features are used, the app may use Firebase services for authentication, online rooms, and game state synchronization. Depending on the chosen login method, Firebase Authentication may process:

- Firebase user ID (UID)
- anonymous guest account ID
- Google display name
- Google profile photo URL
- email address associated with Google login
- basic sign-in metadata

Online room data may include:

- room ID
- selected game/mode/topology/lattice
- player UID or guest UID
- moves played
- timestamps
- game status

### Optional future statistics

If the user signs in with Google and stats recording is enabled, the app may store user-linked statistics such as win/loss counts, games played, robot/evaluation settings, and aggregate performance summaries.

## Firebase

Topoboardgame uses Firebase Authentication and may use Cloud Firestore for online rooms and user profiles. Firebase is provided by Google. Google's Firebase documentation describes Firebase Authentication as a service for sign-in and onboarding.

## Raw research datasets

Raw self-play datasets can be very large and are meant for local research use. They should not be committed to GitHub or included in normal player builds unless intentionally published as a research dataset with a separate dataset license.

## User choices

Users can:

- play locally without logging in;
- continue as a guest for online play;
- sign in with Google for persistent identity;
- stop using online features and continue with local/offline modes.

## Contact

For privacy or licensing questions, contact the project owner through the repository or the commercial-license contact listed in `COMMERCIAL_LICENSE_REQUEST.md`.
