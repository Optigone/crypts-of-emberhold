/** Game state, new game, and save / load / export / import. */

import { CLASSES, QUICK_PARTY, rollClassStats } from "../data/classes.js";
import { makeItem } from "../data/items.js";
import { QUEST_ORDER, QUESTS, RELICS, RELIC_ITEMS } from "../data/quests.js";
import { getMap, resolveSpawn } from "../data/maps.js";
import { makeCharacter, recalo } from "./rules.js";
import { mulberry32, hashSeed } from "../data/gen.js";

export const SAVE_VERSION = 1;
export const SLOT_COUNT = 5;
export const LS_PREFIX = "emberhold-slot-";
export const LS_SETTINGS = "emberhold-settings";
export const LS_LAST = "emberhold-last-slot";

export function settings() {
  try {
    return JSON.parse(localStorage.getItem(LS_SETTINGS) || "{}");
  } catch {
    return {};
  }
}

export function saveSettings(partial) {
  const cur = { ...settings(), ...partial };
  localStorage.setItem(LS_SETTINGS, JSON.stringify(cur));
  return cur;
}

export function emptyFlags() {
  return {
    quests: {},          // id -> step index (0 = seen, etc.)  -1 not started, 0+ step
    relics: [],          // relic ids collected
    unlocked: [],        // "map:x,y" doors
    secrets: [],         // "map:x,y"
    chests: [],          // once ids taken
    bosses: [],          // boss ids defeated
    identified: [],
    npcs: [],            // talked
    ashen_open: false,
    crown_open: false,
    victory: false,
    intro: false
  };
}

export function emptyMemory() {
  return {}; // mapId -> { visited: ["x,y",...], seen }
}

export function newGameState(opts = {}) {
  const seed = opts.seed ?? (Math.floor(Math.random() * 0xffffffff) >>> 0);
  const rng = mulberry32(seed);
  const party = opts.party || QUICK_PARTY.map((p) => makeCharacter({ ...p, hue: Math.floor(rng() * 360) }, rng));
  const mapId = opts.mapId || "town";
  const map = getMap(mapId);
  const spawn = opts.spawn || resolveSpawn(map, "start", map.start);
  const state = {
    version: SAVE_VERSION,
    seed,
    steps: 0,
    turns: 0,
    gold: opts.gold ?? 220,
    party,
    roster: opts.roster || [],
    mapId,
    x: spawn.x,
    y: spawn.y,
    dir: spawn.dir ?? 0,
    light: 0,
    levitate: 0,
    stealth: 0,
    song: null,          // { id, casterId, remaining }
    flags: emptyFlags(),
    memory: emptyMemory(),
    log: ["The streets of Emberhold are quiet. The temple flame is very small now."],
    shopSeen: {},
    encounterGrace: 6,
    name: opts.name || "The Ember Company"
  };
  visitCell(state, state.mapId, state.x, state.y);
  return state;
}

export function visitCell(state, mapId, x, y, radius = 0) {
  if (!state.memory[mapId]) state.memory[mapId] = { visited: {} };
  const mem = state.memory[mapId];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      mem.visited[(x + dx) + "," + (y + dy)] = true;
    }
  }
  mem.visited[x + "," + y] = true;
}

export function revealFloor(state, mapId) {
  const map = getMap(mapId);
  if (!state.memory[mapId]) state.memory[mapId] = { visited: {} };
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const ch = map.grid[y][x];
      if (ch !== "#" && ch !== "T") state.memory[mapId].visited[x + "," + y] = true;
      // also mark walls adjacent to floors so the outline is complete
      if (ch !== "#" && ch !== "T") {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          state.memory[mapId].visited[(x + dx) + "," + (y + dy)] = true;
        }
      }
    }
  }
}

export function revealAround(state, mapId, x, y, r) {
  const map = getMap(mapId);
  if (!state.memory[mapId]) state.memory[mapId] = { visited: {} };
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < map.w && yy < map.h) {
        state.memory[mapId].visited[xx + "," + yy] = true;
      }
    }
  }
}

export function isVisited(state, mapId, x, y) {
  return !!(state.memory[mapId] && state.memory[mapId].visited[x + "," + y]);
}

export function pushLog(state, msg) {
  if (!msg) return;
  state.log.push(msg);
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
}

export function flagSet(state, key, value = true) {
  state.flags[key] = value;
}

export function hasRelic(state, id) {
  return state.flags.relics.includes(id);
}

export function addRelic(state, id) {
  if (!state.flags.relics.includes(id)) state.flags.relics.push(id);
  if (state.flags.relics.length >= 4) state.flags.ashen_open = true;
  if (state.flags.relics.length >= 5) state.flags.crown_open = true;
}

export function relicCount(state) {
  return state.flags.relics.length;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function slotKey(n) {
  return LS_PREFIX + n;
}

export function listSlots() {
  const out = [];
  for (let i = 1; i <= SLOT_COUNT; i++) {
    const raw = localStorage.getItem(slotKey(i));
    if (!raw) {
      out.push({ slot: i, empty: true });
      continue;
    }
    try {
      const data = JSON.parse(raw);
      out.push({
        slot: i,
        empty: false,
        name: data.name || "Save " + i,
        savedAt: data.savedAt,
        mapId: data.state?.mapId,
        gold: data.state?.gold,
        party: (data.state?.party || []).map((c) => ({ name: c.name, cls: c.cls, level: c.level })),
        steps: data.state?.steps,
        relics: data.state?.flags?.relics?.length || 0,
        version: data.version
      });
    } catch {
      out.push({ slot: i, empty: true, corrupt: true });
    }
  }
  return out;
}

export function buildSaveBlob(state, name) {
  return {
    version: SAVE_VERSION,
    title: "Crypts of Emberhold",
    name: name || state.name || "The Ember Company",
    savedAt: new Date().toISOString(),
    state: cloneState(state)
  };
}

export function saveToSlot(state, slot, name) {
  const blob = buildSaveBlob(state, name);
  localStorage.setItem(slotKey(slot), JSON.stringify(blob));
  localStorage.setItem(LS_LAST, String(slot));
  return blob;
}

export function loadFromSlot(slot) {
  const raw = localStorage.getItem(slotKey(slot));
  if (!raw) return { ok: false, reason: "That slot is empty." };
  return parseSave(raw);
}

export function deleteSlot(slot) {
  localStorage.removeItem(slotKey(slot));
}

export function parseSave(raw) {
  let data;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, reason: "That file is not a valid save." };
  }
  if (!data || typeof data !== "object") return { ok: false, reason: "That file is not a valid save." };
  if (data.title && data.title !== "Crypts of Emberhold") {
    return { ok: false, reason: "This save belongs to a different game." };
  }
  if (!data.state || !Array.isArray(data.state.party) || !data.state.mapId) {
    return { ok: false, reason: "That save is missing party or location data." };
  }
  if (data.version && data.version > SAVE_VERSION) {
    return { ok: false, reason: "This save is from a newer version of the game." };
  }
  const state = migrate(data.state);
  return { ok: true, state, meta: { name: data.name, savedAt: data.savedAt, version: data.version } };
}

function migrate(state) {
  if (!state.flags) state.flags = emptyFlags();
  if (!state.memory) state.memory = emptyMemory();
  if (!state.log) state.log = [];
  if (!Array.isArray(state.roster)) state.roster = [];
  if (state.light == null) state.light = 0;
  if (state.levitate == null) state.levitate = 0;
  if (state.stealth == null) state.stealth = 0;
  for (const ch of state.party) recalo(ch);
  for (const ch of state.roster) recalo(ch);
  return state;
}

export function exportSaveString(state, name) {
  return JSON.stringify(buildSaveBlob(state, name), null, 2);
}

export function downloadSave(state, name) {
  const json = exportSaveString(state, name);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `emberhold-save-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return json;
}

export function importSaveString(raw) {
  return parseSave(raw);
}
