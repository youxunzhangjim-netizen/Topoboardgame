const PROBLEM_MESSAGES = Object.freeze({
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
  "Website and Steam players can join the same compatible rooms.": {
    en: "Website and Steam players can join the same compatible rooms.",
    zh: "網站版與 Steam 版玩家可以加入相容的同一房間。"
  }
});

export function canJoinRoom(localConfig, room) {
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

  // Do NOT reject because clientKind differs.
  // Website and Steam crossplay is allowed when protocol, pool, and game settings match.

  return {
    ok: problems.length === 0,
    problems: [...new Set(problems)]
  };
}

export function getJoinRoomProblemMessage(result, lang = "en") {
  if (result.ok) return "";

  const language = lang === "zh" || lang === "zh-TW" || lang === "zh-Hant" ? "zh" : "en";
  return result.problems
    .map((problem) => PROBLEM_MESSAGES[problem]?.[language] || problem)
    .join(language === "zh" ? "；" : "; ");
}

export function onlineCompatibilityText(key, lang = "en") {
  const language = lang === "zh" || lang === "zh-TW" || lang === "zh-Hant" ? "zh" : "en";
  return PROBLEM_MESSAGES[key]?.[language] || key;
}
