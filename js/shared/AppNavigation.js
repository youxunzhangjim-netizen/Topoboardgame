import { EDITION } from './EditionConfig.js';

function isExternalHref(path) {
  return /^(?:https?:|mailto:|tel:|#)/i.test(String(path || ''));
}

export function resolveGameHref(path) {
  if (isExternalHref(path)) return String(path);

  const clean = String(path || '').replace(/^\/+/, '');
  if (!clean) return './';

  if (EDITION.isSteam) return `./${clean}`;
  if (EDITION.isWebLite) return `./${clean}`;
  return `./${clean}`;
}

export function navigateToGame(path) {
  window.location.href = resolveGameHref(path);
}

if (typeof window !== 'undefined') {
  window.TopoboardgameNavigation = Object.freeze({
    resolveGameHref,
    navigateToGame
  });
}
