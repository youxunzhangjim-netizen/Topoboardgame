import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join('steamworks', 'steam_config.local.json');
if (!fs.existsSync(configPath)) {
  console.error('Missing steamworks/steam_config.local.json. Copy steamworks/steam_config.example.json and fill your real Steamworks App ID / depot IDs locally.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const placeholder = (value) => typeof value !== 'string' || value.length === 0 || value.startsWith('REPLACE_WITH_');
if (placeholder(String(config.appId || ''))) {
  console.error('Missing real Steam appId in steam_config.local.json.');
  process.exit(1);
}

const outDir = path.join('steamworks', 'generated');
fs.mkdirSync(outDir, { recursive: true });

const enabledDepots = Object.entries(config.depots || {}).filter(([, depot]) => depot?.enabled);
if (!enabledDepots.length) {
  console.error('No enabled depots in steam_config.local.json.');
  process.exit(1);
}

for (const [platform, depot] of enabledDepots) {
  if (placeholder(String(depot.depotId || ''))) {
    console.error(`Missing real depotId for ${platform}.`);
    process.exit(1);
  }
  const depotVdf = `"DepotBuildConfig"
{
    "DepotID" "${depot.depotId}"
    "ContentRoot" "${depot.contentRoot || config.contentRoot || '../release'}"
    "FileMapping"
    {
        "LocalPath" "**"
        "DepotPath" "."
        "recursive" "1"
    }
}
`;
  fs.writeFileSync(path.join(outDir, `depot_${platform}.vdf`), depotVdf);
}

const depotLines = enabledDepots
  .map(([platform, depot]) => `        "${depot.depotId}" "steamworks/generated/depot_${platform}.vdf"`)
  .join('\n');

const appVdf = `"AppBuild"
{
    "AppID" "${config.appId}"
    "Desc" "${config.description || 'Topoboardgame build'}"
    "BuildOutput" "${config.buildOutput || '../steamworks/build-output'}"
    "ContentRoot" "${config.contentRoot || '../release'}"
    "SetLive" "${config.setLiveBranch || ''}"
    "Preview" "0"
    "Local" ""
    "Depots"
    {
${depotLines}
    }
}
`;
fs.writeFileSync(path.join(outDir, 'app_build_topoboardgame.vdf'), appVdf);

console.log(`Generated SteamPipe VDF files in ${outDir}`);
console.log('Use the Steamworks SDK ContentBuilder / SteamPipe command-line tools with steamworks/generated/app_build_topoboardgame.vdf.');
