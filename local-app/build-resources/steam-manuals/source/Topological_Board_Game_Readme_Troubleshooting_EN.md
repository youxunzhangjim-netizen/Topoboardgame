# Topological Board Game - README And Troubleshooting

Language: English

This file is for Steam users who need installation, account, online-room, display, performance, or reset help.

## 1. Installation

- Install the game from Steam.
- Launch from the Steam Library.
- If Windows SmartScreen appears during testing builds, confirm that the publisher and folder are expected.
- Keep the game installed in a normal writable Steam library folder.

## 2. Supported Platforms

- Windows 64-bit is the primary build target.
- macOS 64-bit and Linux builds may be distributed when the Steam depot includes them.
- Android is not a Steam desktop build target unless a separate mobile release is prepared.

## 3. Display And Controls

- Use Reset Camera if a board is off screen.
- Use zoom sliders, mouse wheel, or pinch gestures where available.
- On mobile-sized windows, controls may stack vertically.
- If text overlaps, switch to a wider window or reduce browser/app zoom.

## 4. Online Account Help

- Email/password login requires Firebase Email/Password sign-in to be enabled in the Firebase console.
- If the message says "This sign-in method is not enabled yet," open Firebase Console, Authentication, Sign-in method, and enable Email/Password.
- Password reset requires the user to enter the registered email.
- Account deletion should be used carefully because online identity data may be lost.

## 5. Online Rooms

- Check internet connection.
- Use the same game family, board mode, and room code.
- If room state seems stale, leave and recreate the room.
- Some experimental modes may disable online play until safe synchronization exists.

## 6. Robot Mode

- Robot difficulty can affect speed.
- Stronger levels may think longer.
- If a robot is too slow, reduce board size or choose a lower level.

## 7. Firebase Configuration

- Website deployments need public Firebase web config values.
- Vite builds should use variables like VITE_FIREBASE_API_KEY.
- Local preview may warn about missing config if the environment file is absent.
- Production and Preview variables should both be set in the hosting provider when needed.

## 8. Steam Build Files

- Steam app id: use the app id assigned in Steamworks.
- Depot content must point to the built game folder.
- Upload through Steamworks ContentBuilder.
- Keep capsule art, icons, manuals, privacy policy, EULA, and third-party notices available.

## 9. Performance

- 3D, 4D, large Go boards, large Life scans, and research plots can be heavy.
- Reduce board size, lattice complexity, or visual opacity.
- Close other GPU-heavy apps.
- Research-grade scans can be generated offline with Python and imported as data when needed.

## 10. Reset Local Data

- Browser/local app settings can include language, room settings, notebooks, and saved experiments.
- Use in-game reset buttons first.
- If necessary, clear site/app storage from the browser or app webview.
- Export important notebooks before clearing storage.

## 11. Known Limitations

- Some advanced topological boards are visual approximations of mathematical spaces.
- Some Labs models are toy or estimator-level demonstrations, not calibrated physical simulations.
- Some online synchronization paths are disabled for experimental time rewriting modes.

## 12. Getting Help

- Read the Full Manual for detailed rules.
- Read the Quick Start Guide for short usage steps.
- Use the online manual link on the Steam Basic Info tab for the latest website documentation.
