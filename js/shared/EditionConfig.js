function asBool(value) {
  return value === "true";
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const EDITION = Object.freeze({
  name: import.meta.env.VITE_TBG_EDITION || "web-lite",

  clientKind: import.meta.env.VITE_TBG_CLIENT_KIND || "web",
  onlineEnv: import.meta.env.VITE_TBG_ONLINE_ENV || "prod",
  onlinePool: import.meta.env.VITE_TBG_ONLINE_POOL || "global",

  isWebLite: import.meta.env.VITE_TBG_EDITION === "web-lite",
  isSteam: import.meta.env.VITE_TBG_EDITION === "steam-stable",
  isResearch: import.meta.env.VITE_TBG_EDITION === "research-dev",

  enableOnline: asBool(import.meta.env.VITE_TBG_ENABLE_ONLINE),
  enableSteam: asBool(import.meta.env.VITE_TBG_ENABLE_STEAM),
  enableResearchBridge: asBool(import.meta.env.VITE_TBG_ENABLE_RESEARCH_BRIDGE),
  enableResearchBridgeDetection: asBool(import.meta.env.VITE_TBG_ENABLE_RESEARCH_BRIDGE_DETECTION),
  enableMaterialDatabases: asBool(import.meta.env.VITE_TBG_ENABLE_MATERIAL_DATABASES),

  showExperimentalBoards: asBool(import.meta.env.VITE_TBG_SHOW_EXPERIMENTAL_BOARDS),
  showResearchLabs: asBool(import.meta.env.VITE_TBG_SHOW_RESEARCH_LABS),

  maxSites: asNumber(import.meta.env.VITE_TBG_MAX_SITES, 3000)
});
