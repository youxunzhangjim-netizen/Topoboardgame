import { ONLINE_CONFIG } from "./OnlineConfig.js";

const MATCH_KEY_FIELDS = [
  "gameFamily",
  "dimension",
  "boardSpace",
  "topology",
  "lattice",
  "boundary",
  "size",
  "ruleset",
  "rulesetVersion",
  "timeMode",
  "spacetime",
  "futureDelay",
  "pastWindow",
  "periodMode",
  "period",
  "periodOn",
  "periodOff",
  "ageMode",
  "noiseMode",
  "labsMode"
];

function normalizeValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(normalizeValue).join("x");
  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .map((key) => `${normalizeValue(key)}=${normalizeValue(value[key])}`)
      .join(",");
  }
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.:+-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildOnlineMatchKey(settings = {}) {
  const parts = [`protocol=${ONLINE_CONFIG.roomProtocolVersion}`];
  for (const field of MATCH_KEY_FIELDS) {
    const normalized = normalizeValue(settings[field]);
    if (normalized) parts.push(`${field}=${normalized}`);
  }
  return parts.join("|");
}

export function currentSpaceTimeMatchFields(app = {}) {
  let params = null;
  try {
    params = new URLSearchParams(globalThis.location?.search || "");
  } catch {
    params = new URLSearchParams("");
  }
  const spacetime = params.get("spacetime") || "";
  const settings = app.__spaceTimeSettings || globalThis.hexApp?.__spaceTimeSettings || {};
  if (!spacetime && !settings.mode) return {};
  const timeMode = settings.mode || params.get("timeMode") || params.get("time") || "";
  return {
    spacetime,
    timeMode,
    futureDelay: settings.delayTicks ?? params.get("delay") ?? "",
    pastWindow: settings.rewriteWindow ?? params.get("pastWindow") ?? params.get("rewriteWindow") ?? "",
    periodMode: settings.periodMode || params.get("periodMode") || "",
    period: params.get("period") || "",
    periodOn: settings.periodOn ?? params.get("periodOn") ?? "",
    periodOff: settings.periodOff ?? params.get("periodOff") ?? "",
    ageMode: settings.ageMode || params.get("ageMode") || "",
    noiseMode: settings.noiseMode || params.get("noiseMode") || ""
  };
}

export function onlineMatchKeyFields() {
  return [...MATCH_KEY_FIELDS];
}
