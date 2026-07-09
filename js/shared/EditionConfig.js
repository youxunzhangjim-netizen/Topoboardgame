function asBool(value) {
  return value === "true";
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const BUILD_ENV = import.meta.env || {};

export const EDITION = Object.freeze({
  name: BUILD_ENV.VITE_TBG_EDITION || "web-lite",

  clientKind: BUILD_ENV.VITE_TBG_CLIENT_KIND || "web",
  onlineEnv: BUILD_ENV.VITE_TBG_ONLINE_ENV || "prod",
  onlinePool: BUILD_ENV.VITE_TBG_ONLINE_POOL || "global",

  isWebLite: BUILD_ENV.VITE_TBG_EDITION === "web-lite",
  isSteam: BUILD_ENV.VITE_TBG_EDITION === "steam-stable",
  isResearch: BUILD_ENV.VITE_TBG_EDITION === "research-dev",

  enableOnline: asBool(BUILD_ENV.VITE_TBG_ENABLE_ONLINE),
  enableSteam: asBool(BUILD_ENV.VITE_TBG_ENABLE_STEAM),
  enableResearchBridge: asBool(BUILD_ENV.VITE_TBG_ENABLE_RESEARCH_BRIDGE),
  enableResearchBridgeDetection: asBool(BUILD_ENV.VITE_TBG_ENABLE_RESEARCH_BRIDGE_DETECTION),
  enableMaterialDatabases: asBool(BUILD_ENV.VITE_TBG_ENABLE_MATERIAL_DATABASES),

  showExperimentalBoards: asBool(BUILD_ENV.VITE_TBG_SHOW_EXPERIMENTAL_BOARDS),
  showResearchLabs: asBool(BUILD_ENV.VITE_TBG_SHOW_RESEARCH_LABS),

  maxSites: asNumber(BUILD_ENV.VITE_TBG_MAX_SITES, 3000)
});
