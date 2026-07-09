import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildOnlineMatchKey } from "../js/shared/OnlineMatchKey.js";
import { canJoinRoom } from "../js/shared/OnlineCompatibility.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

const webLite = readJson("configs/editions/web-lite.json");
const steamStable = readJson("configs/editions/steam-stable.json");

assert.equal(webLite.online.pool, "global", "web-lite must use the global online pool");
assert.equal(steamStable.online.pool, "global", "steam-stable must use the global online pool");
assert.equal(webLite.online.clientKind, "web", "web-lite clientKind must be web");
assert.equal(steamStable.online.clientKind, "steam", "steam-stable clientKind must be steam");

const sharedSettings = {
  gameFamily: "go",
  dimension: 2,
  boardSpace: "torus",
  topology: "torus",
  lattice: "square",
  boundary: "periodic",
  size: "9x9",
  ruleset: "go",
  rulesetVersion: 1,
  timeMode: "none",
  spacetime: "none"
};

const webMatchKey = buildOnlineMatchKey({
  ...sharedSettings,
  edition: "web-lite",
  clientKind: "web"
});
const steamMatchKey = buildOnlineMatchKey({
  ...sharedSettings,
  edition: "steam-stable",
  clientKind: "steam"
});

assert.equal(webMatchKey, steamMatchKey, "same game settings must produce the same match key");
assert.equal(webMatchKey.includes("web"), false, "match key must not include web");
assert.equal(webMatchKey.includes("steam"), false, "match key must not include steam");
assert.equal(webMatchKey.includes("edition"), false, "match key must not include edition");
assert.equal(webMatchKey.includes("clientKind"), false, "match key must not include clientKind");

const localConfig = {
  roomProtocolVersion: 1,
  onlinePool: "global",
  clientKind: "web",
  matchKey: webMatchKey,
  gameKey: "2d-go"
};

const compatibleSteamRoom = {
  roomProtocolVersion: 1,
  onlinePool: "global",
  clientKind: "steam",
  matchKey: steamMatchKey,
  gameKey: "2d-go"
};

assert.equal(
  canJoinRoom(localConfig, compatibleSteamRoom).ok,
  true,
  "different clientKind should be allowed for compatible rooms"
);

assert.equal(
  canJoinRoom(localConfig, { ...compatibleSteamRoom, roomProtocolVersion: 999 }).ok,
  false,
  "protocol version mismatch must be rejected"
);

assert.equal(
  canJoinRoom(localConfig, { ...compatibleSteamRoom, onlinePool: "research" }).ok,
  false,
  "online pool mismatch must be rejected"
);

console.log("Online crossplay config verification passed.");
