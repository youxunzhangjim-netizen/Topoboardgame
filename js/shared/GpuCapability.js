import { EDITION } from "./EditionConfig.js";

export const GPU_CAPABILITY_LABELS = Object.freeze({
  en: {
    available: "GPU compute: available",
    unavailable: "GPU compute: unavailable",
    experimental: "GPU compute: experimental"
  },
  zh: {
    available: "GPU 運算：可用",
    unavailable: "GPU 運算：不可用",
    experimental: "GPU 運算：實驗"
  }
});

export async function detectWebGPU() {
  const hasNavigator = typeof navigator !== "undefined";
  const gpu = hasNavigator ? navigator.gpu : null;
  const available = Boolean(gpu);
  const allowedInEdition = Boolean(available && EDITION.isResearch);

  if (!available) {
    return {
      backend: "webgpu",
      available: false,
      status: "unavailable",
      experimental: false,
      allowedInEdition: false,
      adapter: null
    };
  }

  let adapter = null;
  try {
    adapter = await gpu.requestAdapter?.();
  } catch {
    adapter = null;
  }

  return {
    backend: "webgpu",
    available: Boolean(adapter || gpu),
    status: allowedInEdition ? "experimental" : "available",
    experimental: allowedInEdition,
    allowedInEdition,
    enabledByDefault: false,
    adapter: adapter
      ? {
          name: adapter.info?.description || adapter.info?.vendor || "WebGPU adapter",
          features: Array.from(adapter.features || [])
        }
      : null
  };
}

export function detectWebGL2() {
  if (typeof document === "undefined") {
    return {
      backend: "webgl2",
      available: false,
      status: "unavailable",
      reason: "No DOM canvas is available in this environment."
    };
  }

  let canvas = null;
  let gl = null;
  try {
    canvas = document.createElement("canvas");
    gl = canvas.getContext("webgl2");
  } catch {
    gl = null;
  }

  return {
    backend: "webgl2",
    available: Boolean(gl),
    status: gl ? "available" : "unavailable"
  };
}

export function getPreferredRenderBackend() {
  if (typeof navigator !== "undefined" && navigator.gpu && EDITION.isResearch) {
    return "webgpu-experimental";
  }
  if (detectWebGL2().available) return "webgl2";
  return "cpu-worker";
}

export async function getGpuCapabilityReport() {
  const webgpu = await detectWebGPU();
  const webgl2 = detectWebGL2();
  return {
    edition: EDITION.name,
    preferredBackend: getPreferredRenderBackend(),
    webgpu,
    webgl2,
    notes: [
      "WebGPU is detected only as an optional future research backend.",
      "Gameplay and online fairness-critical logic remain CPU/worker based."
    ]
  };
}

export function formatGpuCapabilityStatus(report, lang = "en") {
  const table = String(lang || "").toLowerCase().startsWith("zh")
    ? GPU_CAPABILITY_LABELS.zh
    : GPU_CAPABILITY_LABELS.en;
  const status = report?.webgpu?.status || "unavailable";
  return table[status] || table.unavailable;
}
