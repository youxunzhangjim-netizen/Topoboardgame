import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function readEnv(name) {
  const text = readFileSync(join(root, name), 'utf8');
  const entries = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) throw new Error(`${name}: invalid env line "${rawLine}"`);
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (!key.startsWith('VITE_')) throw new Error(`${name}: ${key} is not a public VITE_* build flag`);
    entries[key] = value;
  }
  return entries;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", got "${actual}"`);
  }
}

const web = readEnv('.env.web-lite');
const steam = readEnv('.env.steam-stable');
const research = readEnv('.env.research-dev');

assertEqual(web.VITE_TBG_EDITION, 'web-lite', 'web-lite edition id');
assertEqual(steam.VITE_TBG_EDITION, 'steam-stable', 'steam-stable edition id');
assertEqual(research.VITE_TBG_EDITION, 'research-dev', 'research-dev edition id');

assertEqual(web.VITE_TBG_ENABLE_ONLINE, 'true', 'web-lite online enabled');
assertEqual(steam.VITE_TBG_ENABLE_ONLINE, 'true', 'steam-stable online enabled');
assertEqual(research.VITE_TBG_ENABLE_ONLINE, 'false', 'research-dev online disabled by default');

assertEqual(web.VITE_TBG_ONLINE_ENV, 'prod', 'web-lite online env');
assertEqual(steam.VITE_TBG_ONLINE_ENV, 'prod', 'steam-stable online env');
assertEqual(web.VITE_TBG_ONLINE_POOL, 'global', 'web-lite online pool');
assertEqual(steam.VITE_TBG_ONLINE_POOL, 'global', 'steam-stable online pool');

assertEqual(web.VITE_TBG_ONLINE_ENV, steam.VITE_TBG_ONLINE_ENV, 'web-lite and steam-stable must share online env');
assertEqual(web.VITE_TBG_ONLINE_POOL, steam.VITE_TBG_ONLINE_POOL, 'web-lite and steam-stable must share online pool');

assertEqual(web.VITE_TBG_ENABLE_RESEARCH_BRIDGE, 'false', 'web-lite research bridge disabled');
assertEqual(steam.VITE_TBG_ENABLE_RESEARCH_BRIDGE, 'false', 'steam-stable research bridge disabled');
assertEqual(web.VITE_TBG_ENABLE_MATERIAL_DATABASES, 'false', 'web-lite material databases disabled');
assertEqual(steam.VITE_TBG_ENABLE_MATERIAL_DATABASES, 'false', 'steam-stable material databases disabled');

console.log('Edition env verification passed: web-lite and steam-stable share prod/global online rooms.');
