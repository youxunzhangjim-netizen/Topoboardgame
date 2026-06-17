export function assertNoShellContinuationTokens(argv = process.argv.slice(2)) {
  const bad = argv.find((token) => token === '\\' || token === '/' || token === '`');
  if (!bad) return;
  console.error('Command-line syntax error: found a stray line-continuation token ' + JSON.stringify(bad) + '.');
  console.error('In PowerShell, do not use Linux/macOS \\ for line continuation. Use one single line, or end each continued line with the PowerShell backtick character ` .');
  console.error('Example: npm run research:selfplay -- --game 2dchess --boundary periodic --games 100 --out local-data/selfplay/test.jsonl');
  process.exit(2);
}

export function parseArgs(argv = process.argv.slice(2)) {
  assertNoShellContinuationTokens(argv);
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      (args._ ||= []).push(token);
      continue;
    }
    const eq = token.indexOf('=');
    if (eq >= 0) {
      args[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

export function numberArg(args, key, fallback, { min = -Infinity, max = Infinity, integer = true } = {}) {
  let value = Number(args[key]);
  if (!Number.isFinite(value)) value = fallback;
  if (integer) value = Math.floor(value);
  return Math.max(min, Math.min(max, value));
}

export function stringArg(args, key, fallback = '') {
  const value = args[key];
  return value === undefined || value === null || value === true ? fallback : String(value);
}

export function boolArg(args, key, fallback = false) {
  const value = args[key];
  if (value === undefined) return fallback;
  if (value === true) return true;
  const text = String(value).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(text);
}
