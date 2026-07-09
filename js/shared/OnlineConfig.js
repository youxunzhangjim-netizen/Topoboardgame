import { EDITION } from "./EditionConfig.js";

export const ONLINE_CONFIG = Object.freeze({
  enabled: EDITION.enableOnline,
  onlineEnv: EDITION.onlineEnv,
  onlinePool: EDITION.onlinePool,
  clientKind: EDITION.clientKind,

  // Increment this only when online room/move schema changes incompatibly.
  roomProtocolVersion: 1,

  // Keep true so website and Steam players can play together.
  allowCrossClientPlay: true,

  // Keep false unless a future setting explicitly asks for platform-only matchmaking.
  sameClientKindOnly: false
});

export function getOnlineClientMetadata() {
  return {
    clientKind: ONLINE_CONFIG.clientKind,
    edition: EDITION.name,
    onlineEnv: ONLINE_CONFIG.onlineEnv,
    onlinePool: ONLINE_CONFIG.onlinePool,
    roomProtocolVersion: ONLINE_CONFIG.roomProtocolVersion,
    appVersion: globalThis.__TBG_VERSION__?.version || "unknown",
    buildCommit: globalThis.__TBG_VERSION__?.commit || "unknown"
  };
}

export function isOnlineEnabled() {
  return ONLINE_CONFIG.enabled;
}

export function shouldAllowCrossClientPlay() {
  return ONLINE_CONFIG.allowCrossClientPlay && !ONLINE_CONFIG.sameClientKindOnly;
}
