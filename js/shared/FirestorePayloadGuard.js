export const FIRESTORE_WARN_BYTES = 500 * 1024;
export const FIRESTORE_MAX_BYTES = 1024 * 1024;

export const FIRESTORE_LARGE_DATA_MESSAGE = Object.freeze({
  en: "Large research data should be exported locally, not stored online.",
  zh: "大型研究資料應匯出到本機，不應存入線上房間。"
});

const FORBIDDEN_LARGE_KEYS = new Set([
  "boardSpec",
  "researchBoardSpec",
  "mesh",
  "meshes",
  "geometry",
  "vertices",
  "faces",
  "fullLabExport",
  "rawJsonl",
  "jsonl",
  "trainingData",
  "selfplay",
  "largeTimeline",
  "snapshots",
  "labExport",
  "researchExport"
]);

function byteLength(text) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(String(text)).byteLength;
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(String(text), "utf8");
  }
  return unescape(encodeURIComponent(String(text))).length;
}

function safeStringify(value) {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, entry) => {
    if (typeof entry === "bigint") return String(entry);
    if (typeof entry === "function" || typeof entry === "symbol") return undefined;
    if (entry && typeof entry === "object") {
      if (seen.has(entry)) return "[Circular]";
      seen.add(entry);
    }
    return entry;
  });
}

function collectForbiddenKeys(value, path = "$", hits = []) {
  if (!value || typeof value !== "object") return hits;
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, 32);
    for (let index = 0; index < limit; index += 1) {
      collectForbiddenKeys(value[index], `${path}[${index}]`, hits);
    }
    if (value.length > limit) hits.push({ key: "[large-array]", path, count: value.length });
    return hits;
  }

  for (const key of Object.keys(value)) {
    const nextPath = `${path}.${key}`;
    if (FORBIDDEN_LARGE_KEYS.has(key)) {
      hits.push({ key, path: nextPath });
    }
    collectForbiddenKeys(value[key], nextPath, hits);
  }
  return hits;
}

export function estimateFirestorePayloadBytes(value) {
  const json = safeStringify(value);
  return byteLength(json ?? "null");
}

export function classifyFirestorePayload(value, options = {}) {
  const warnBytes = Number(options.warnBytes) || FIRESTORE_WARN_BYTES;
  const maxBytes = Number(options.maxBytes) || FIRESTORE_MAX_BYTES;
  const sizeBytes = estimateFirestorePayloadBytes(value);
  const forbiddenKeys = collectForbiddenKeys(value);
  const errors = [];
  const warnings = [];

  if (sizeBytes > maxBytes) {
    errors.push(`Firestore payload is ${sizeBytes} bytes, above the 1 MiB hard limit.`);
  } else if (sizeBytes > warnBytes) {
    errors.push(`Firestore payload is ${sizeBytes} bytes, above the 500 KiB online safety limit.`);
  }

  if (forbiddenKeys.length > 0 && options.blockForbiddenKeys) {
    errors.push(`Payload contains fields that must be exported locally instead of written online: ${forbiddenKeys.map((hit) => hit.path).slice(0, 8).join(", ")}.`);
  } else if (forbiddenKeys.length > 0 && sizeBytes > warnBytes / 4) {
    errors.push(`Payload contains research/heavy fields: ${forbiddenKeys.map((hit) => hit.path).slice(0, 8).join(", ")}.`);
  } else if (forbiddenKeys.length > 0) {
    warnings.push(`Payload contains heavy-field names: ${forbiddenKeys.map((hit) => hit.path).slice(0, 8).join(", ")}.`);
  }

  return {
    ok: errors.length === 0,
    sizeBytes,
    warnBytes,
    maxBytes,
    errors,
    warnings,
    forbiddenKeys
  };
}

export function firestorePayloadWarningText(lang = "en") {
  return String(lang || "").toLowerCase().startsWith("zh")
    ? FIRESTORE_LARGE_DATA_MESSAGE.zh
    : FIRESTORE_LARGE_DATA_MESSAGE.en;
}

export function assertFirestorePayloadSafe(value, options = {}) {
  const result = classifyFirestorePayload(value, options);
  if (result.ok) return result;

  const context = options.context ? `${options.context}: ` : "";
  const message = `${context}${firestorePayloadWarningText(options.language)} ${result.errors.join(" ")}`;
  const error = new Error(message);
  error.name = "FirestorePayloadTooLargeError";
  error.sizeBytes = result.sizeBytes;
  error.warnBytes = result.warnBytes;
  error.maxBytes = result.maxBytes;
  error.context = options.context || "";
  error.details = result;
  throw error;
}
