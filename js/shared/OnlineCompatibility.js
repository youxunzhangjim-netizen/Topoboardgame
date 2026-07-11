const TEXT = Object.freeze({
  "Room does not exist.": {
    en: "Room does not exist.",
    zh: "房間不存在。"
  },
  "Online protocol version mismatch.": {
    en: "Online version mismatch. Please update the game.",
    zh: "線上版本不相容，請更新遊戲。"
  },
  "Online pool mismatch.": {
    en: "Room settings do not match this game mode.",
    zh: "房間設定與目前遊戲模式不一致。"
  },
  "Room settings do not match this game mode.": {
    en: "Room settings do not match this game mode.",
    zh: "房間設定與目前遊戲模式不一致。"
  },
  "Room is full.": {
    en: "Room is full.",
    zh: "房間已滿。"
  },
  "Website and Steam players can join the same compatible rooms.": {
    en: "Website and Steam players can join the same compatible rooms.",
    zh: "網站版與 Steam 版玩家可以加入相容的同一房間。"
  },
  "Same online rooms are shared between website and Steam players.": {
    en: "Same online rooms are shared between website and Steam players.",
    zh: "網站版與 Steam 版玩家共用相同線上房間。"
  },
  "Online Pool: Global": {
    en: "Online Pool: Global",
    zh: "線上池：Global"
  },
  "Crossplay: Website + Steam": {
    en: "Crossplay: Website + Steam",
    zh: "跨平台：網站 + Steam"
  },
  "Client: Website": {
    en: "Client: Website",
    zh: "客戶端：網站"
  },
  "Client: Steam": {
    en: "Client: Steam",
    zh: "客戶端：Steam"
  },
  "Compatible Room": {
    en: "Compatible Room",
    zh: "相容房間"
  },
  "Version Mismatch": {
    en: "Version Mismatch",
    zh: "版本不相容"
  },
  "Room Protocol": {
    en: "Room Protocol",
    zh: "房間協定"
  }
});

function languageKey(lang = "en") {
  return lang === "zh" || lang === "zh-TW" || lang === "zh-Hant" ? "zh" : "en";
}

function roomOccupantUids(room = {}) {
  return new Set([
    room.players?.waiting,
    room.players?.white,
    room.players?.black
  ].filter(Boolean));
}

function isFullForLocalPlayer(localConfig = {}, room = {}) {
  const uid = localConfig.uid || localConfig.playerUid || "";
  const occupants = roomOccupantUids(room);
  if (uid && occupants.has(uid)) return false;
  if (room.status === "waiting") return false;
  return Boolean(room.players?.white && room.players?.black);
}

export function canJoinRoom(localConfig = {}, room) {
  const problems = [];

  if (!room) {
    problems.push("Room does not exist.");
  }

  if (room && room.roomProtocolVersion !== localConfig.roomProtocolVersion) {
    problems.push("Online protocol version mismatch.");
  }

  if (room && room.onlinePool && room.onlinePool !== localConfig.onlinePool) {
    problems.push("Online pool mismatch.");
  }

  if (room && localConfig.gameKey && room.gameKey && room.gameKey !== localConfig.gameKey) {
    problems.push("Room settings do not match this game mode.");
  }

  if (room && localConfig.matchKey && room.matchKey && room.matchKey !== localConfig.matchKey) {
    problems.push("Room settings do not match this game mode.");
  }

  if (room && (localConfig.uid || localConfig.playerUid) && isFullForLocalPlayer(localConfig, room)) {
    problems.push("Room is full.");
  }

  // Do NOT reject because clientKind differs.
  // Website and Steam crossplay is allowed when protocol, pool, and game settings match.

  return {
    ok: problems.length === 0,
    problems: [...new Set(problems)]
  };
}

export function getJoinRoomProblemMessage(result, lang = "en") {
  if (result.ok) return "";

  const language = languageKey(lang);
  return result.problems
    .map((problem) => TEXT[problem]?.[language] || problem)
    .join(language === "zh" ? "；" : "; ");
}

export function onlineCompatibilityText(key, lang = "en") {
  const language = languageKey(lang);
  return TEXT[key]?.[language] || key;
}

export function formatOnlineStatusMetadata(metadata = {}, lang = "en") {
  const language = languageKey(lang);
  const pool = String(metadata.onlinePool || "global");
  const protocol = metadata.roomProtocolVersion || 1;
  const clientKind = String(metadata.clientKind || "web").toLowerCase();
  const clientLabel = clientKind === "steam" ? "Client: Steam" : "Client: Website";
  const parts = [
    pool === "global"
      ? onlineCompatibilityText("Online Pool: Global", language)
      : `${language === "zh" ? "線上池：" : "Online Pool: "}${pool}`,
    onlineCompatibilityText("Crossplay: Website + Steam", language),
    onlineCompatibilityText(clientLabel, language),
    `${onlineCompatibilityText("Room Protocol", language)} ${protocol}`
  ];

  if (metadata.includeRoomStatus) {
    const roomLabel = metadata.versionMismatch || metadata.compatible === false
      ? "Version Mismatch"
      : "Compatible Room";
    parts.push(onlineCompatibilityText(roomLabel, language));
  }

  parts.push(onlineCompatibilityText("Same online rooms are shared between website and Steam players.", language));
  return parts.join(" · ");
}
