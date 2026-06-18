import fs from 'node:fs';
import path from 'node:path';

const required = [
  'LICENSE.md',
  'EULA.md',
  'PRIVACY_POLICY.md',
  'THIRD_PARTY_NOTICES.md',
  'FIREBASE_SETUP.md',
  'PREUPLOAD_FINAL_CHECKLIST.md',
  'docs/steam/STEAM_UPLOAD_GUIDE.md',
  'docs/steam/STEAM_ASSET_MANIFEST.md',
  'docs/steam/STORE_PAGE_DRAFT.md',
  'local-app/build-resources/icon.png',
  'local-app/build-resources/icon.ico',
  'steamworks/assets/shortcut_icon_256.png',
  'steamworks/assets/shortcut_icon.ico',
  'steamworks/assets/app_icon_184.jpg'
];

let ok = true;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`[missing] ${file}`);
    ok = false;
  } else {
    console.log(`[ok] ${file}`);
  }
}

const dangerous = [
  'node_modules',
  'local-data/selfplay'
];

for (const file of dangerous) {
  if (fs.existsSync(file)) {
    console.warn(`[warn] generated/local folder exists: ${file} — do not commit raw generated files`);
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts || {};
const wantedScripts = ['verify:local-robots', 'verify:research', 'verify:ml', 'build', 'desktop:dir'];
for (const s of wantedScripts) {
  if (!scripts[s]) {
    console.warn(`[warn] package.json script not found: ${s}`);
  }
}

if (!ok) {
  process.exit(1);
}
console.log('\nPreupload file structure check passed.');
