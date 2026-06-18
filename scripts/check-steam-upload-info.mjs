import fs from 'node:fs';
import path from 'node:path';

const localPath = path.join('steamworks', 'steam_config.local.json');
const examplePath = path.join('steamworks', 'steam_config.example.json');
const configPath = fs.existsSync(localPath) ? localPath : examplePath;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const placeholder = (value) => typeof value !== 'string' || value.length === 0 || value.startsWith('REPLACE_WITH_');
const messages = [];
let ok = true;

function requireValue(label, value, { localRequired = true } = {}) {
  if (placeholder(value)) {
    messages.push(`[missing] ${label}: ${value || '(empty)'}`);
    if (configPath === localPath || localRequired) ok = false;
  } else {
    messages.push(`[ok] ${label}: ${value}`);
  }
}

console.log(`Steam upload config: ${configPath}`);
requireValue('steamAccountName', config.steamAccountName, { localRequired: false });
requireValue('appId', String(config.appId || ''));

const depots = config.depots || {};
for (const [platform, depot] of Object.entries(depots)) {
  if (!depot?.enabled) {
    messages.push(`[skip] ${platform} depot disabled`);
    continue;
  }
  requireValue(`${platform}.depotId`, String(depot.depotId || ''));
  if (!depot.contentRoot) {
    messages.push(`[missing] ${platform}.contentRoot`);
    ok = false;
  } else {
    messages.push(`[ok] ${platform}.contentRoot: ${depot.contentRoot}`);
  }
}

for (const forbidden of ['password', 'steamPassword', 'steamGuardCode', 'twoFactorCode']) {
  if (Object.prototype.hasOwnProperty.call(config, forbidden)) {
    console.error(`[unsafe] Remove ${forbidden} from ${configPath}. Enter credentials interactively in SteamCMD/SteamPipe.`);
    ok = false;
  }
}

console.log(messages.join('\n'));

if (configPath !== localPath) {
  console.warn('\n[warn] steamworks/steam_config.local.json was not found. Copy steam_config.example.json to steam_config.local.json and fill real Steamworks App ID / depot IDs locally.');
}

if (!ok) {
  process.exit(1);
}
console.log('\nSteam account/build metadata check passed.');
