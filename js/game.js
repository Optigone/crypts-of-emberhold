/** Game loop, exploration, shops, and input for Crypts of Emberhold. */

import { CLASSES, CLASS_ORDER, QUICK_PARTY, rollClassStats } from "./data/classes.js";
import { SPELLS } from "./data/spells.js";
import { ITEMS, makeItem, itemDisplayName, SHOP_ARMS, SHOP_MAGE, rollLoot } from "./data/items.js";
import { RUMORS, QUESTS } from "./data/quests.js";
import { DIRS, getTile, mulberry32 } from "./data/gen.js";
import { getMap, eventAt, isWalkable, looksLikeWall, resolveSpawn, warmupAllMaps, THEMES } from "./data/maps.js";
import { pickEncounter, spawnMonster } from "./data/monsters.js";
import {
  makeCharacter, derived, partyHasLight, partyHasLevitate, livingParty, wipeCheck,
  healChar, cleanseChar, liftCursesOn, knownSpells, canLearnSpell, giveItem, firstPackSpace,
  packCount, PACK_LIMIT, canWear, equipItem, unequipSlot, identifyItem, recalo, roll,
  partyHasKey, takeKey, findItemInParty
} from "./systems/rules.js";
import {
  newGameState, visitCell, revealFloor, revealAround, isVisited, pushLog, addRelic,
  saveToSlot, loadFromSlot, listSlots, downloadSave, importSaveString, settings, saveSettings, cloneState
} from "./systems/state.js";
import {
  createCombat, combatStartTurn, playerAction, enemyAct, advanceAfterAction, applySpell, currentActor
} from "./systems/combat.js";
import { renderView, renderAutomap, renderMinimap, renderCompass, drawPortrait, drawAppIcon } from "./render.js";
import { playTheme, stopMusic, toggleMuted, setMuted, isMuted, resume, sfx, sfxName } from "./audio.js";
import * as ui from "./ui.js";

let state = null;
let screen = "title";
let modal = null;
let combat = null;
let sel = 0;
let draftParty = [];
let draft = null; // { name, cls, stats, hue }
let inspectUid = null;
let inspectSpell = null;
let shopStock = [];
let shopMode = null;
let combatPhase = "act";
let combatPick = null;
let running = false;
let lastTs = 0;
let anim = { px: 0, py: 0, dir: 0, from: null, t: 1 };
let rng = Math.random;
let seedRng = Math.random;

export function getState() {
  return {
    screen,
    modal,
    sel,
    combatActive: !!(combat && combat.active),
    combat: combat ? { ...combat, monsters: combat.monsters } : null,
    game: state ? snapshot() : null,
    muted: isMuted(),
    draftParty: draftParty.length,
    title: document.title
  };
}

function snapshot() {
  return {
    mapId: state.mapId, x: state.x, y: state.y, dir: state.dir,
    gold: state.gold, steps: state.steps, light: state.light, levitate: state.levitate,
    party: state.party, flags: state.flags, log: state.log.slice(-5),
    name: state.name, relics: state.flags.relics
  };
}

function rngf() { return seedRng(); }

function bindRng(seed) {
  seedRng = mulberry32((seed >>> 0) || 1);
  rng = rngf;
}

export function init() {
  warmupAllMaps();
  const icon = document.getElementById("title-icon");
  if (icon) drawAppIcon(icon.getContext("2d"), icon.width);
  ui.setMuteIcons(isMuted());
  bindTitle();
  bindCreate();
  bindPlay();
  bindModal();
  bindKeys();
  showTitle();
  if (!running) {
    running = true;
    requestAnimationFrame(frame);
  }
}

function showTitle() {
  screen = "title";
  modal = null;
  ui.closeModal();
  ui.showScreen("title-screen");
  playTheme("title");
}

function bindTitle() {
  ui.$("btn-new").onclick = () => { resume(); sfx.menu(); openCreate([]); };
  ui.$("btn-quick").onclick = () => { resume(); sfx.menu(); startQuick(); };
  ui.$("btn-continue").onclick = () => { resume(); sfx.menu(); openSaveModal(true); };
  ui.$("btn-help").onclick = () => { resume(); sfx.menu(); showHelp(); };
  ui.$("btn-mute-title").onclick = () => { resume(); flipMute(); };
}

function flipMute() {
  const v = toggleMuted();
  ui.setMuteIcons(v);
}

function openCreate(party) {
  draftParty = party.slice();
  draft = null;
  screen = "create";
  ui.showScreen("create-screen");
  ui.$("creator").classList.add("hidden");
  ui.renderCreateParty(draftParty);
  playTheme("town");
}

function bindCreate() {
  ui.$("btn-create-back").onclick = () => showTitle();
  ui.$("btn-create-start").onclick = () => {
    if (!draftParty.length) { ui.$("create-hint").textContent = "You need at least one companion."; return; }
    beginAdventure(draftParty);
  };
  ui.$("btn-add-char").onclick = () => startDraft();
  ui.$("btn-fill-quick").onclick = () => {
    sfx.menu();
    const r = mulberry32((Math.random() * 1e9) >>> 0);
    draftParty = QUICK_PARTY.map((p) => makeCharacter({ ...p }, r));
    ui.renderCreateParty(draftParty);
  };
  ui.$("btn-reroll").onclick = () => {
    if (!draft) return;
    sfx.menu();
    draft.stats = rollClassStats(draft.cls, Math.random);
    ui.renderStatRow(draft.stats);
  };
  ui.$("btn-accept-char").onclick = () => {
    if (!draft || draftParty.length >= 6) return;
    const name = (ui.$("char-name").value || "").trim() || CLASSES[draft.cls].name;
    draftParty.push(makeCharacter({ name, cls: draft.cls, stats: draft.stats, hue: draft.hue }, Math.random));
    sfx.save();
    draft = null;
    ui.$("creator").classList.add("hidden");
    ui.renderCreateParty(draftParty);
  };
  ui.$("btn-cancel-char").onclick = () => { draft = null; ui.$("creator").classList.add("hidden"); };
  ui.$("class-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cls]");
    if (!b || !draft) return;
    draft.cls = b.dataset.cls;
    draft.stats = rollClassStats(draft.cls, Math.random);
    ui.renderClassGrid(draft.cls);
    ui.renderStatRow(draft.stats);
  });
  ui.$("party-slots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    draftParty.splice(Number(b.dataset.remove), 1);
    ui.renderCreateParty(draftParty);
  });
}

function startDraft() {
  if (draftParty.length >= 6) return;
  draft = { name: "", cls: "warrior", stats: rollClassStats("warrior", Math.random), hue: Math.floor(Math.random() * 360) };
  ui.$("creator").classList.remove("hidden");
  ui.$("char-name").value = "";
  ui.renderClassGrid(draft.cls);
  ui.renderStatRow(draft.stats);
}

export function startQuick() {
  const r = mulberry32((Math.random() * 1e9) >>> 0);
  const party = QUICK_PARTY.map((p) => makeCharacter({ ...p }, r));
  beginAdventure(party);
}

function beginAdventure(party) {
  const seed = (Math.random() * 0xffffffff) >>> 0;
  bindRng(seed);
  state = newGameState({ party, seed, name: "The Ember Company" });
  giveItem(state.party[0], makeItem("torch", { identified: true, qty: 4 }, rng));
  sel = 0;
  inspectUid = null;
  enterPlay();
  pushLog(state, "You stand in the plaza of Emberhold. The temple flame is very small now.");
}

function enterPlay() {
  screen = "play";
  ui.showScreen("play-screen");
  fitView();
  syncHud();
  anim = { px: state.x, py: state.y, dir: state.dir, t: 1 };
  const map = getMap(state.mapId);
  playTheme(map.music || (map.kind === "town" ? "town" : "dungeon"));
}

function bindPlay() {
  ui.$("btn-mute").onclick = () => { resume(); flipMute(); };
  ui.$("pad-fwd").onclick = () => tryMove(0);
  ui.$("pad-back").onclick = () => tryMove(2);
  ui.$("pad-tl").onclick = () => turn(-1);
  ui.$("pad-tr").onclick = () => turn(1);
  ui.$("pad-sl").onclick = () => tryMove(3);
  ui.$("pad-sr").onclick = () => tryMove(1);
  ui.$("pad-act").onclick = () => interact();
  ui.$("btn-map").onclick = () => openMap();
  ui.$("btn-inv").onclick = () => openInv();
  ui.$("btn-spells").onclick = () => openSpells();
  ui.$("btn-quests").onclick = () => openQuests();
  ui.$("btn-camp").onclick = () => openMenu();
  ui.$("btn-search").onclick = () => search();
  ui.$("btn-menu").onclick = () => openMenu();
  ui.$("party-bar").addEventListener("click", (e) => {
    const pc = e.target.closest(".pc");
    if (!pc) return;
    sel = Number(pc.dataset.idx);
    syncHud();
    if (modal === "inv") openInv();
    if (modal === "spells") openSpells();
  });
  window.addEventListener("resize", fitView);
}

function bindModal() {
  ui.$("btn-modal-close").onclick = () => {
    if (combat && combat.active) return;
    closeMod();
  };
  ui.$("modal-body").addEventListener("click", onModalClick);
}

function bindKeys() {
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const k = e.key;
    if (k === "m" || k === "M") { if (screen === "play" && !combat?.active) openMap(); }
    else if (k === "i" || k === "I") { if (screen === "play" && !combat?.active) openInv(); }
    else if (k === "b" || k === "B") { if (screen === "play" && !combat?.active) openSpells(); }
    else if (k === "l" || k === "L") { if (screen === "play" && !combat?.active) openQuests(); }
    else if (k === "f" || k === "F") { if (screen === "play" && !combat?.active) search(); }
    else if (k === "Escape") {
      if (combat && combat.active) return;
      if (ui.isModalOpen()) closeMod();
      else if (screen === "play") openMenu();
    } else if (k === " " || k === "Enter") {
      if (screen === "play" && !ui.isModalOpen()) { e.preventDefault(); interact(); }
    } else if (["ArrowUp", "w", "W"].includes(k)) { e.preventDefault(); if (canWalkKeys()) tryMove(0); }
    else if (["ArrowDown", "s", "S"].includes(k)) { e.preventDefault(); if (canWalkKeys()) tryMove(2); }
    else if (["ArrowLeft", "a", "A"].includes(k)) { e.preventDefault(); if (canWalkKeys()) turn(-1); }
    else if (["ArrowRight", "d", "D"].includes(k)) { e.preventDefault(); if (canWalkKeys()) turn(1); }
    else if (k === "q" || k === "Q") { if (canWalkKeys()) tryMove(3); }
    else if (k === "e" || k === "E") { if (canWalkKeys()) tryMove(1); }
    else if (/^[1-9]$/.test(k)) { handleNumber(Number(k)); }
  });
}

function canWalkKeys() {
  return screen === "play" && !ui.isModalOpen() && !(combat && combat.active);
}

function handleNumber(n) {
  if (combat && combat.active && combatPhase === "act") {
    const map = { 1: "fight", 2: "parry", 3: "cast", 4: "sing", 5: "use", 6: "run" };
    if (map[n]) doCombat({ type: map[n] });
  }
}

function ctxFlags() {
  return {
    secretsFound: new Set(state.flags.secrets),
    unlocked: new Set(state.flags.unlocked)
  };
}

function lightOn() {
  return partyHasLight(state.party, state.light);
}

export function tryMove(rel) {
  if (!state || (combat && combat.active) || screen !== "play") return false;
  resume();
  const dir = (state.dir + rel) % 4;
  const nx = state.x + DIRS[dir].x;
  const ny = state.y + DIRS[dir].y;
  const map = getMap(state.mapId);
  const ctx = ctxFlags();
  if (!isWalkable(map, nx, ny, ctx)) {
    // bump into door / secret / locked / wall
    const ev = eventAt(map, nx, ny);
    const ch = getTile(map.grid, nx, ny);
    if (ch === "+" || ev?.type === "door" || ev?.type === "gate" || ev?.type === "stairs") {
      return handleFrontEvent(nx, ny, ev);
    }
    if (ch === "L" || ev?.type === "locked") return tryUnlock(nx, ny, ev);
    if (ch === "s") {
      pushLog(state, "A solid wall.");
      sfx.bump();
      syncHud();
      return false;
    }
    sfx.bump();
    pushLog(state, "You cannot go that way.");
    syncHud();
    return false;
  }
  // walk
  anim = { from: { x: state.x, y: state.y }, t: 0 };
  state.x = nx; state.y = ny;
  state.steps++;
  tickWalk();
  visitCell(state, state.mapId, nx, ny, 1);
  sfx.step();
  afterStep();
  syncHud();
  return true;
}

export function turn(delta) {
  if (!state || (combat && combat.active) || screen !== "play") return;
  resume();
  state.dir = (state.dir + delta + 4) % 4;
  sfx.menu();
  const map = getMap(state.mapId);
  const fx = state.x + DIRS[state.dir].x;
  const fy = state.y + DIRS[state.dir].y;
  const ev = eventAt(map, fx, fy);
  if (ev?.type === "wallsign") pushLog(state, ev.text);
  syncHud();
}

function tickWalk() {
  if (state.light > 0) state.light--;
  if (state.levitate > 0) state.levitate--;
  if (state.stealth > 0) state.stealth--;
  if (state.song && state.song.remaining != null) {
    state.song.remaining--;
    if (state.song.remaining <= 0) state.song = null;
  }
  if (state.encounterGrace > 0) state.encounterGrace--;
  for (const ch of state.party) {
    const d = derived(ch);
    if (d.mpDrain && ch.mp > 0) ch.mp = Math.max(0, ch.mp - d.mpDrain);
  }
}

function afterStep() {
  const map = getMap(state.mapId);
  const ch = getTile(map.grid, state.x, state.y);
  const ev = eventAt(map, state.x, state.y);

  if (ch === "^") {
    state.dir = Math.floor(rng() * 4);
    pushLog(state, "The floor twists. You are turned about!");
    sfx.spell();
  }
  if (ch === "o") {
    if (partyHasLevitate(state.party, state.levitate)) {
      pushLog(state, "You drift safely over a pit.");
    } else {
      const dmg = 4 + Math.floor(rng() * 5);
      for (const c of state.party) {
        if (c.unconscious) continue;
        c.hp = Math.max(0, c.hp - dmg);
        if (c.hp <= 0) c.unconscious = true;
      }
      pushLog(state, `The party drops into a pit and clambers out, bruised (−${dmg} HP).`);
      sfx.hit();
      if (wipeCheck(state.party)) return gameOver();
    }
  }
  if (ch === "~" && map.kind !== "town") {
    pushLog(state, "You wade through cold water.");
  }
  if (ev?.type === "trap" && !state.flags.chests.includes(ev.once + "_disarmed")) {
    if (!state.flags.chests.includes(ev.once)) {
      const dmg = ev.kind === "snare" ? 3 + Math.floor(rng() * 4) : 5 + Math.floor(rng() * 6);
      const t = state.party[0];
      t.hp = Math.max(0, t.hp - dmg);
      if (t.hp <= 0) t.unconscious = true;
      state.flags.chests.push(ev.once);
      pushLog(state, `A hidden ${ev.kind} goes off! ${t.name} takes ${dmg} harm.`);
      sfx.hit();
    }
  }
  if (ev?.type === "sign") pushLog(state, ev.text);
  if (ev?.type === "npc") { /* wait for interact */ }
  if (ev?.type === "stairs" || ev?.type === "gate" || ev?.type === "door") {
    // auto-prompt
    handleFrontEvent(state.x, state.y, ev);
    return;
  }
  if (ev?.type === "boss" && !state.flags.bosses.includes(ev.once) && !state.flags.bosses.includes(ev.monster)) {
    beginFight([spawnMonster(ev.monster, rng)], { boss: true, theme: map.encounter || map.theme });
    return;
  }
  maybeEncounter(map);
}

function maybeEncounter(map) {
  if (map.safe) return;
  if (state.encounterGrace > 0) return;
  if (combat && combat.active) return;
  let chance = 0.055 + (map.danger || 0) * 0.02;
  if (state.stealth > 0) chance *= 0.3;
  if (rng() < chance) {
    const band = map.danger || 0;
    const foes = pickEncounter(map.encounter || map.theme, band, rng);
    beginFight(foes, { theme: map.encounter || map.theme });
  }
}

function handleFrontEvent(x, y, ev) {
  ev = ev || eventAt(getMap(state.mapId), x, y);
  if (!ev) return false;
  if (ev.type === "door") {
    if (ev.place === "cryptgate") return travelTo("crypt_1", "entrance");
    return openPlace(ev.place, ev.label);
  }
  if (ev.type === "gate") {
    if (ev.require && !state.flags[ev.require]) {
      pushLog(state, ev.lockedText || "The way is shut.");
      sfx.bump();
      syncHud();
      return false;
    }
    sfx.door();
    return travelTo(ev.to, ev.spawn, ev.x, ev.y, ev.dir);
  }
  if (ev.type === "stairs") {
    sfx.stairs();
    return travelTo(ev.to, ev.spawn, ev.x, ev.y, ev.dir);
  }
  if (ev.type === "chest") return openChest(ev);
  if (ev.type === "npc") {
    pushLog(state, `${ev.name}: "${ev.text}"`);
    if (ev.name.includes("Nila")) bumpQuest("mossdeep_plea", 1);
    if (ev.name.includes("Leafwarden")) bumpQuest("thornwood_pact", 1);
    syncHud();
    return true;
  }
  if (ev.type === "wallsign" || ev.type === "sign") {
    pushLog(state, ev.text);
    syncHud();
    return true;
  }
  if (ev.type === "locked") return tryUnlock(x, y, ev);
  return false;
}


function ensureLight(map) {
  if (!map) return;
  if (map.light === "day") return;
  if (state.light > 0 || partyHasLight(state.party, state.light)) return;
  const found = findItemInParty(state.party, (it) => ITEMS[it.tid]?.use === "torch");
  if (found) {
    consume(found.ch, found.item);
    state.light = Math.max(state.light, 70);
    pushLog(state, "You light a torch.");
    sfx.fire();
  }
}

function travelTo(mapId, spawn, x, y, dir) {
  const dest = getMap(mapId);
  const pos = (x != null) ? { x, y, dir: dir ?? state.dir } : resolveSpawn(dest, spawn, dest.start);
  state.mapId = mapId;
  state.x = pos.x;
  state.y = pos.y;
  state.dir = pos.dir ?? 0;
  state.encounterGrace = 8;
  visitCell(state, mapId, state.x, state.y, 1);
  ensureLight(dest);
  pushLog(state, `You enter ${dest.name}.`);
  anim = { from: null, t: 1 };
  playTheme(dest.music || "dungeon");
  syncHud();
  return true;
}

export function interact() {
  if (!state || (combat && combat.active) || screen !== "play") return false;
  resume();
  const map = getMap(state.mapId);
  const here = eventAt(map, state.x, state.y);
  if (here && handleFrontEvent(state.x, state.y, here)) return true;
  const fx = state.x + DIRS[state.dir].x;
  const fy = state.y + DIRS[state.dir].y;
  const ev = eventAt(map, fx, fy);
  const ch = getTile(map.grid, fx, fy);
  if (ch === "L" || ev?.type === "locked") return tryUnlock(fx, fy, ev);
  if (ev && handleFrontEvent(fx, fy, ev)) return true;
  // wall sign stored on adjacent wall cell
  if (ev?.type === "wallsign") { pushLog(state, ev.text); syncHud(); return true; }
  // any sign facing
  if (looksLikeWall(map, fx, fy, ctxFlags())) {
    pushLog(state, "A plain wall.");
    sfx.bump();
    syncHud();
    return false;
  }
  pushLog(state, "There's nothing special here.");
  syncHud();
  return false;
}

function tryUnlock(x, y, ev) {
  ev = ev || eventAt(getMap(state.mapId), x, y) || { key: "bronze" };
  const key = ev.key || "bronze";
  const tag = state.mapId + ":" + x + "," + y;
  if (state.flags.unlocked.includes(tag)) return travelThroughDoor();
  if (partyHasKey(state.party, key)) {
    takeKey(state.party, key);
    state.flags.unlocked.push(tag);
    pushLog(state, `The ${key} key turns. The door opens.`);
    sfx.unlock();
    syncHud();
    return true;
  }
  pushLog(state, "The door is locked.");
  sfx.bump();
  syncHud();
  return false;
}

function travelThroughDoor() { return true; }

export function search() {
  if (!state || (combat && combat.active) || screen !== "play") return;
  resume();
  const map = getMap(state.mapId);
  const bonus = state.party.reduce((n, c) => n + (c.cls === "rogue" && !c.unconscious ? 2 + Math.floor(c.level / 3) : 0), 0);
  const chance = Math.min(0.95, 0.45 + bonus * 0.12);
  let found = false;
  const cells = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [DIRS[state.dir].x, DIRS[state.dir].y]];
  for (const [dx, dy] of cells) {
    const x = state.x + dx, y = state.y + dy;
    const ch = getTile(map.grid, x, y);
    const ev = eventAt(map, x, y);
    const tag = map.id + ":" + x + "," + y;
    if (ch === "s" && !state.flags.secrets.includes(tag)) {
      if (rng() < chance) {
        state.flags.secrets.push(tag);
        pushLog(state, "A hidden door! The stone sits a little proud of the wall.");
        sfx.unlock();
        found = true;
      }
    }
    if (ev?.type === "trap" && !state.flags.chests.includes(ev.once) && !state.flags.chests.includes(ev.once + "_disarmed")) {
      if (rng() < chance) {
        state.flags.chests.push(ev.once + "_disarmed");
        state.flags.chests.push(ev.once);
        pushLog(state, "You find and make safe a hidden trap.");
        sfx.menu();
        found = true;
      }
    }
  }
  // song of revelation auto-search
  if (!found) pushLog(state, "You search the nearby stones. Nothing new reveals itself.");
  syncHud();
}

function openChest(ev) {
  if (ev.once && state.flags.chests.includes(ev.once)) {
    pushLog(state, "The chest is empty.");
    syncHud();
    return true;
  }
  const loot = ev.loot || "overworld";
  const owned = new Set();
  const L = rollLoot(loot, rng, owned);
  state.gold += L.gold;
  const names = [];
  for (const it of L.items) {
    const dest = firstPackSpace(state.party);
    if (dest) giveItem(dest, it);
    names.push(itemDisplayName(it));
  }
  if (ev.once) state.flags.chests.push(ev.once);
  pushLog(state, `You open the chest. ${L.gold} gp` + (names.length ? `, ${names.join(", ")}` : "") + ".");
  sfx.chest();
  if (L.gold) sfx.coin();
  syncHud();
  return true;
}

function openPlace(place, label) {
  sfx.door();
  pushLog(state, `You enter ${label || place}.`);
  if (place === "shop") return openShop("arms");
  if (place === "mage") return openShop("mage");
  if (place === "temple") return openTemple();
  if (place === "inn") return openInn();
  if (place === "guild") return openGuild();
  syncHud();
  return true;
}

function priceOf(tid, item) {
  const t = ITEMS[tid];
  let v = t?.value || 10;
  if (item) {
    v += (item.plus || 0) * 40;
    if (item.elem) v += 50;
    if (item.bonus) v += 40;
    if (t.kind === "wand") v = Math.floor(v * ((item.charges || 0) / Math.max(1, t.charges || 1)));
  }
  return Math.max(1, v);
}

function buildShop(mode) {
  const list = mode === "mage" ? SHOP_MAGE : SHOP_ARMS;
  return list.map((tid) => {
    const item = makeItem(tid, { identified: true }, rng);
    return { tid, item, price: priceOf(tid, item) };
  });
}

function openShop(mode) {
  shopMode = mode;
  shopStock = buildShop(mode);
  modal = "shop";
  const title = mode === "mage" ? "Quill's Tower" : "Voss's Arms & Wares";
  const flavor = mode === "mage"
    ? "Magister Quill peers over a stack of tomes. \"Spells are not pets. Buy only what you can keep.\""
    : "Voss the smith nods at a rack of honest steel. \"If it breaks, bring it back. I'll scold it.\"";
  ui.openModal(title, ui.shopHtml(title, flavor, shopStock, state.gold, mode));
}

function openTemple() {
  modal = "temple";
  ui.openModal("Temple of the Ember", ui.templeHtml(state));
}
function openInn() {
  modal = "inn";
  ui.openModal("The Warm Hearth Inn", ui.innHtml());
}
function openGuild() {
  modal = "guild";
  ui.openModal("The Ember Company", ui.guildHtml(state));
}

export function openMap() {
  if (!state) return;
  modal = "map";
  ui.openModal("Auto-map", `<canvas id="map-canvas" width="720" height="520" style="width:100%;height:auto;background:#0c0a0e;border-radius:4px"></canvas>
    <p style="color:var(--muted);font-size:0.85rem">Fills in as you explore. Magic Map reveals a whole floor. The gold mark is you; the line is the way you face.</p>`);
  paintMap();
}
function paintMap() {
  const c = document.getElementById("map-canvas");
  if (!c || !state) return;
  renderAutomap(c.getContext("2d"), state, {});
}

export function openInv() {
  if (!state) return;
  modal = "inv";
  ui.openModal("Pack & Gear", ui.inventoryHtml(state, sel, inspectUid));
}
export function openSpells() {
  if (!state) return;
  modal = "spells";
  ui.openModal("Spellbook", ui.spellbookHtml(state, sel, inspectSpell));
}
export function openQuests() {
  if (!state) return;
  modal = "quests";
  ui.openModal("Quest Journal", ui.questsHtml(state));
}
function openMenu() {
  modal = "menu";
  ui.openModal("Camp / Menu", ui.menuHtml());
}
function showHelp() {
  modal = "help";
  ui.openModal("How to Play", ui.helpHtml());
}
function openSaveModal(fromTitle) {
  modal = fromTitle ? "save-title" : "save";
  ui.openModal("Save / Load / Export", ui.saveHtml(listSlots(), state?.name));
}

function closeMod() {
  if (combat && combat.active) return;
  modal = null;
  shopMode = null;
  combatPick = null;
  const closeBtn = ui.$("btn-modal-close");
  if (closeBtn) closeBtn.classList.remove("hidden");
  ui.closeModal();
}

function onModalClick(e) {
  const t = e.target.closest("[data-sel],[data-inspect],[data-equip],[data-unequip],[data-use],[data-drop],[data-give],[data-spell],[data-cast],[data-buy],[data-service],[data-save],[data-load],[data-nav],[data-cact],[data-foe],[data-pick-spell],[data-pick-item],[data-pick-ally],[data-add],[data-park],[id]");
  if (e.target.id === "btn-export" || e.target.closest("#btn-export")) return doExport();
  if (e.target.id === "btn-import" || e.target.closest("#btn-import")) return doImportPick();
  if (!t) return;
  const d = t.dataset;
  if (d.sel != null) { sel = Number(d.sel); inspectUid = null; inspectSpell = null; refreshModal(); return; }
  if (d.inspect) { inspectUid = d.inspect; refreshModal(); return; }
  if (d.unequip) return doUnequip(d.unequip);
  if (d.equip) return doEquip(d.equip);
  if (d.use) return doUseItem(d.use);
  if (d.drop) return doDrop(d.drop);
  if (d.give) return doGive(d.give);
  if (d.spell) { inspectSpell = d.spell; refreshModal(); return; }
  if (d.cast) return castFromBook(d.cast, d.target != null ? Number(d.target) : undefined);
  if (d.buy != null) return doBuy(Number(d.buy));
  if (d.service) return doService(d.service);
  if (d.save) return doSave(Number(d.save));
  if (d.load) return doLoad(Number(d.load));
  if (d.nav) return doNav(d.nav);
  if (d.cact) return doCombat({ type: d.cact });
  if (d.foe != null && combatPick) return finishCombatPick(Number(d.foe));
  if (d.pickSpell) return finishSpellPick(d.pickSpell);
  if (d.pickItem) return finishItemPick(d.pickItem);
  if (d.pickAlly != null) return finishAllyPick(Number(d.pickAlly));
  if (d.add != null) return rosterAdd(Number(d.add));
  if (d.park != null) return rosterPark(Number(d.park));
}

function refreshModal() {
  if (modal === "inv") openInv();
  else if (modal === "spells") openSpells();
  else if (modal === "quests") openQuests();
  else if (modal === "shop") openShop(shopMode);
  else if (modal === "temple") openTemple();
  else if (modal === "inn") openInn();
  else if (modal === "guild") openGuild();
  else if (modal === "save" || modal === "save-title") openSaveModal(modal === "save-title");
  else if (modal === "combat") drawCombat();
  else if (modal === "map") { openMap(); }
}

function doUnequip(slot) {
  const ch = state.party[sel];
  const r = unequipSlot(ch, slot);
  if (!r.ok) { pushLog(state, r.reason); sfx.error(); }
  else {
    if (packCount(ch) >= PACK_LIMIT) { giveItem(firstPackSpace(state.party), r.item); }
    else giveItem(ch, r.item);
    sfx.menu();
  }
  syncHud(); refreshModal();
}
function doEquip(uid) {
  const ch = state.party[sel];
  const idx = ch.pack.findIndex((i) => i.uid === uid);
  if (idx < 0) return;
  const it = ch.pack[idx];
  const r = equipItem(ch, it);
  if (!r.ok) { pushLog(state, r.reason); sfx.error(); }
  else {
    ch.pack.splice(idx, 1);
    for (const rem of r.removed) giveItem(ch, rem);
    if (it.cursed) { pushLog(state, `${itemDisplayName(it)} feels unlucky, and will not come off. The temple can help.`); sfx.curse(); }
    else sfx.menu();
  }
  syncHud(); refreshModal();
}
function doUseItem(uid) {
  const ch = state.party[sel];
  const item = ch.pack.find((i) => i.uid === uid);
  if (!item) return;
  const t = ITEMS[item.tid];
  if (t.kind === "book") {
    const r = canLearnSpell(ch, t.spell);
    if (!r.ok) { pushLog(state, r.reason); sfx.error(); }
    else {
      ch.spells.push(t.spell);
      consume(ch, item);
      pushLog(state, `${ch.name} learns ${SPELLS[t.spell].name}!`);
      sfx.spell();
    }
  } else if (t.use === "torch") {
    state.light = Math.max(state.light, t.light || 70);
    consume(ch, item);
    pushLog(state, "You light a torch.");
    sfx.fire();
  } else if (t.use === "heal" || t.use === "both" || t.use === "mana" || t.use === "cleanse") {
    if (t.use === "heal" || t.use === "both") healChar(ch, roll(rng, t.heal));
    if (t.use === "mana" || t.use === "both") ch.mp = Math.min(ch.maxMp, ch.mp + roll(rng, t.mana));
    if (t.use === "cleanse") cleanseChar(ch);
    consume(ch, item);
    pushLog(state, `${ch.name} uses ${t.name}.`);
    sfx.heal();
  } else if (t.use === "identify") {
    const mystery = ch.pack.find((i) => !i.identified && i.uid !== item.uid);
    if (!mystery) { pushLog(state, "Nothing in this pack needs identifying."); sfx.error(); }
    else {
      const name = identifyItem(mystery);
      consume(ch, item);
      pushLog(state, `The scroll names it: ${name}.`);
      sfx.spell();
    }
  } else if (t.kind === "wand") {
    if (!item.charges) { pushLog(state, "The wand is spent."); sfx.error(); }
    else {
      item.charges--;
      const sp = SPELLS[t.spell];
      applyWorldSpell(ch, sp, sel);
      if (item.charges <= 0) consume(ch, item);
    }
  } else {
    pushLog(state, "You can't use that here.");
  }
  syncHud(); refreshModal();
}
function consume(ch, item) {
  item.qty = (item.qty || 1) - 1;
  if (item.qty <= 0) {
    const i = ch.pack.indexOf(item);
    if (i >= 0) ch.pack.splice(i, 1);
  }
}
function doDrop(uid) {
  const ch = state.party[sel];
  const i = ch.pack.findIndex((x) => x.uid === uid);
  if (i < 0) return;
  const it = ch.pack.splice(i, 1)[0];
  pushLog(state, `You leave ${itemDisplayName(it)} behind.`);
  sfx.menu();
  inspectUid = null;
  syncHud(); refreshModal();
}
function doGive(uid) {
  const from = state.party[sel];
  const i = from.pack.findIndex((x) => x.uid === uid);
  if (i < 0) return;
  const other = state.party.find((c, idx) => idx !== sel && packCount(c) < PACK_LIMIT);
  if (!other) { pushLog(state, "No companion has pack space."); sfx.error(); return; }
  const it = from.pack.splice(i, 1)[0];
  giveItem(other, it);
  pushLog(state, `${from.name} gives ${itemDisplayName(it)} to ${other.name}.`);
  inspectUid = null;
  syncHud(); refreshModal();
}

function castFromBook(id, target) {
  const ch = state.party[sel];
  const sp = SPELLS[id];
  if (!sp) return;
  if (ch.mp < sp.mp) { pushLog(state, "Not enough mana."); sfx.error(); refreshModal(); return; }
  if (sp.kind === "attack" || (sp.target === "enemy" && sp.kind !== "utility")) {
    pushLog(state, "There is no foe to use that on. Save it for a fight.");
    sfx.error();
    return;
  }
  ch.mp -= sp.mp;
  if (sp.kind === "song") {
    state.song = { id: sp.id, casterId: ch.id, remaining: sp.effect.duration || 80, kind: "explore" };
    sfx.sing();
    pushLog(state, `${ch.name} sings ${sp.name}.`);
  } else sfx.spell();
  applyWorldSpell(ch, sp, target ?? sel);
  syncHud(); refreshModal();
}

export function applyWorldSpell(ch, sp, targetIdx) {
  const fx = sp.effect || {};
  const ally = state.party[targetIdx] || ch;
  if (fx.light) { state.light = Math.max(state.light, fx.light); pushLog(state, "A soft light gathers around the party."); }
  if (fx.levitate) { state.levitate = Math.max(state.levitate, fx.levitate); pushLog(state, "Your steps grow strangely light."); }
  if (fx.stealth) { state.stealth = Math.max(state.stealth, fx.stealth); pushLog(state, "The party walks more quietly."); }
  if (fx.detectSecret) {
    const map = getMap(state.mapId);
    let n = 0;
    const r = fx.detectSecret;
    for (let y = state.y - r; y <= state.y + r; y++) {
      for (let x = state.x - r; x <= state.x + r; x++) {
        if (getTile(map.grid, x, y) === "s") {
          const tag = map.id + ":" + x + "," + y;
          if (!state.flags.secrets.includes(tag)) { state.flags.secrets.push(tag); n++; }
        }
      }
    }
    pushLog(state, n ? `Hidden doors reveal themselves (${n}).` : "No hidden doors nearby.");
  }
  if (fx.unlock) {
    const map = getMap(state.mapId);
    const fx_ = state.x + DIRS[state.dir].x, fy = state.y + DIRS[state.dir].y;
    const ev = eventAt(map, fx_, fy);
    const chTile = getTile(map.grid, fx_, fy);
    if (chTile === "L" || ev?.type === "locked") {
      const tag = map.id + ":" + fx_ + "," + fy;
      if (!state.flags.unlocked.includes(tag)) state.flags.unlocked.push(tag);
      pushLog(state, "The lock clicks open.");
      sfx.unlock();
    } else pushLog(state, "There is no lock in front of you.");
  }
  if (fx.magicMap) { revealFloor(state, state.mapId); pushLog(state, "The floor's shape settles in your mind."); if (modal === "map") paintMap(); }
  if (fx.wizardEye) { revealAround(state, state.mapId, state.x, state.y, fx.wizardEye || 10); pushLog(state, "Unseen halls prickle at the edge of thought."); }
  if (fx.locate) {
    const map = getMap(state.mapId);
    let best = null, bestD = 1e9;
    for (const ev of Object.values(map.events)) {
      if (ev.type === "stairs" || ev.type === "boss" || ev.type === "gate") {
        // find coords
      }
    }
    for (const [k, ev] of Object.entries(map.events)) {
      if (ev.type === "stairs" || ev.type === "boss") {
        const [x, y] = k.split(",").map(Number);
        const d = Math.abs(x - state.x) + Math.abs(y - state.y);
        if (d < bestD) { bestD = d; best = { x, y, ev }; }
      }
    }
    if (best) {
      const dx = best.x - state.x, dy = best.y - state.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : dy < 0 ? "north" : "here");
      pushLog(state, `A tug toward the ${dir} (${best.ev.label || best.ev.type}).`);
    } else pushLog(state, "Nothing particular calls to you on this floor.");
  }
  if (fx.floorGate) {
    const map = getMap(state.mapId);
    const up = map.features?.stairsUp;
    if (up) { state.x = up.x; state.y = up.y; pushLog(state, "A door of light leaves you at the upward stair."); sfx.spell(); }
    else pushLog(state, "There is no upward stair to find.");
  }
  if (fx.townGate) {
    travelTo("town", "start");
    pushLog(state, "Emberhold's plaza rises to meet you.");
  }
  if (fx.heal) { const n = healChar(ally, roll(rng, fx.heal)); pushLog(state, `${ally.name} is healed for ${n}.`); sfx.heal(); }
  if (fx.healFull) { ally.unconscious = false; ally.hp = ally.maxHp; if (fx.cleanse) cleanseChar(ally); pushLog(state, `${ally.name} is fully restored.`); sfx.heal(); }
  if (fx.cleanse && !fx.heal && !fx.healFull) { cleanseChar(ally); pushLog(state, `${ally.name} is cleansed.`); }
  if (fx.liftCurse) { const n = liftCursesOn(ally); pushLog(state, n ? `A curse lifts from ${ally.name}.` : `${ally.name} was not cursed.`); }
  if (fx.revive) {
    if (ally.unconscious || ally.hp <= 0) {
      ally.unconscious = false;
      ally.hp = Math.max(1, Math.floor(ally.maxHp * fx.revive));
      pushLog(state, `${ally.name} stirs and rises!`);
      sfx.heal();
    }
  }
  if (fx.revealWalk) revealAround(state, state.mapId, state.x, state.y, 4);
}

function doBuy(i) {
  const row = shopStock[i];
  if (!row) return;
  if (state.gold < row.price) { pushLog(state, "Not enough gold."); sfx.error(); return; }
  const dest = firstPackSpace(state.party);
  if (!dest || packCount(dest) >= PACK_LIMIT) { pushLog(state, "Everyone's pack is full."); sfx.error(); return; }
  state.gold -= row.price;
  giveItem(dest, row.item);
  pushLog(state, `Bought ${itemDisplayName(row.item)} for ${row.price} gp (${dest.name}'s pack).`);
  sfx.coin();
  shopStock.splice(i, 1);
  syncHud(); refreshModal();
}

function doService(which) {
  if (which === "identify") {
    const found = findItemInParty(state.party, (it) => !it.identified);
    if (!found) { pushLog(state, "Nothing needs identifying."); sfx.error(); return; }
    if (state.gold < 25) { pushLog(state, "Identifying costs 25 gp."); sfx.error(); return; }
    state.gold -= 25;
    const name = identifyItem(found.item);
    pushLog(state, `Quill names it: ${name}.`);
    sfx.spell();
    syncHud(); refreshModal();
    return;
  }
  if (which === "sell") {
    modal = "inv";
    openInv();
    pushLog(state, "Open an item and drop it if you wish to be rid of it — or keep shopping. (A dedicated sell list is in Pack: use items from here after leaving, then return. For v1, sell below.)");
    // simple: convert current inspect if any... we'll add sell buttons in a compact sell view
    openSell();
    return;
  }
  if (which === "talk" && modal === "temple") return talkHalden();
  if (which === "talk" && modal === "inn") {
    const r = RUMORS[Math.floor(rng() * RUMORS.length)];
    pushLog(state, `Ma Trindle: "${r}"`);
    bumpQuest("sunken_bell", 0);
    sfx.menu();
    return;
  }
  if (which === "talk" && modal === "guild") {
    const r = RUMORS[Math.floor(rng() * RUMORS.length)];
    pushLog(state, `A clerk: "${r}"`);
    sfx.menu();
    return;
  }
  if (which === "heal") {
    const cost = 15 * state.party.length;
    if (state.gold < cost) { pushLog(state, "Not enough gold."); sfx.error(); return; }
    state.gold -= cost;
    for (const c of state.party) { if (!c.unconscious) { c.hp = c.maxHp; c.mp = c.maxMp; } }
    pushLog(state, "Warm light closes your wounds.");
    sfx.heal();
    syncHud(); refreshModal();
    return;
  }
  if (which === "cure") {
    if (state.gold < 30) { pushLog(state, "Not enough gold."); sfx.error(); return; }
    state.gold -= 30;
    for (const c of state.party) cleanseChar(c);
    pushLog(state, "Ailments lift.");
    sfx.heal();
    syncHud(); refreshModal();
    return;
  }
  if (which === "rez") {
    const down = state.party.filter((c) => c.unconscious || c.hp <= 0);
    const cost = down.length * 100;
    if (!down.length) return;
    if (state.gold < cost) { pushLog(state, "Not enough gold."); sfx.error(); return; }
    state.gold -= cost;
    for (const c of down) { c.unconscious = false; c.hp = Math.max(1, Math.floor(c.maxHp * 0.5)); }
    pushLog(state, "The fallen stir, breathing again.");
    sfx.heal();
    syncHud(); refreshModal();
    return;
  }
  if (which === "uncurse") {
    if (state.gold < 80) { pushLog(state, "Not enough gold."); sfx.error(); return; }
    let n = 0;
    for (const c of state.party) n += liftCursesOn(c);
    if (!n) { pushLog(state, "No curses to lift."); return; }
    state.gold -= 80;
    pushLog(state, "The unlucky hold is broken.");
    sfx.heal();
    syncHud(); refreshModal();
    return;
  }
  if (which === "crown") {
    closeMod();
    travelTo("crown_1", "entrance");
    return;
  }
  if (which === "rest") {
    if (state.gold < 20) { pushLog(state, "Not enough gold."); sfx.error(); return; }
    state.gold -= 20;
    for (const c of state.party) {
      if (!c.unconscious) { c.hp = c.maxHp; c.mp = c.maxMp; cleanseChar(c); }
    }
    pushLog(state, "You sleep under a thick quilt. Morning feels possible.");
    sfx.heal();
    syncHud(); refreshModal();
    return;
  }
  if (which === "save") { openSaveModal(false); return; }
}

function openSell() {
  const rows = [];
  state.party.forEach((ch, ci) => {
    ch.pack.forEach((it) => {
      const price = Math.max(1, Math.floor(priceOf(it.tid, it) / 2));
      rows.push(`<button type="button" class="shop-row" data-service="__x" data-sell-uid="${it.uid}" data-sell-who="${ci}">
        <span class="left"><span class="name">${ui.esc(ch.name)}: ${ui.esc(itemDisplayName(it))}</span></span>
        <span class="gold-tag">${price} gp</span></button>`);
    });
  });
  modal = "sell";
  ui.openModal("Sell", `<p>Voss (or Quill) will take these off your hands for half their value.</p>
    <div class="list">${rows.join("") || "<p style='color:var(--muted)'>Nothing to sell.</p>"}</div>`);
  ui.$("modal-body").onclick = null;
  // handled in a capture on click via data attributes — extend onModalClick
}

// intercept sell clicks via event delegation already on modal-body — add handler:
const _orig = onModalClick;
// We can't rebind easily; add in the same function... I'll handle data-sell-uid by patching a listener.
document.getElementById("modal-body").addEventListener("click", (e) => {
  const b = e.target.closest("[data-sell-uid]");
  if (!b) return;
  const ci = Number(b.dataset.sellWho);
  const ch = state.party[ci];
  const i = ch.pack.findIndex((x) => x.uid === b.dataset.sellUid);
  if (i < 0) return;
  const it = ch.pack.splice(i, 1)[0];
  const price = Math.max(1, Math.floor(priceOf(it.tid, it) / 2));
  state.gold += price;
  pushLog(state, `Sold ${itemDisplayName(it)} for ${price} gp.`);
  sfx.coin();
  syncHud();
  openSell();
});

function talkHalden() {
  const n = state.flags.relics.length;
  bumpQuest("fading_flame", 0);
  if (n === 0) {
    bumpQuest("fading_flame", 1);
    pushLog(state, "Halden: \"The Heartflame was five shards, once. The first sleeps beneath the graveyard crypt. Bring it back, and I will tend it.\"");
  } else if (n < 4) {
    pushLog(state, `Halden: "You have ${n} shard${n > 1 ? "s" : ""}. The rest lie in Mossdeep, the fen-tower, and Thornwood. The March still sleeps."`);
    if (n >= 1) bumpQuest("fading_flame", 2);
  } else if (n === 4) {
    state.flags.ashen_open = true;
    bumpQuest("ashen_march", 1);
    pushLog(state, "Halden: \"Four shards. The northwest pass will open. The Cinder Core waits in the Emberforge. Be careful of the heat.\"");
  } else if (n >= 5 && !state.flags.victory) {
    state.flags.crown_open = true;
    bumpQuest("hollow_crown", 1);
    pushLog(state, "Halden: \"Five. The sealed door in this temple will open onto the Hollow Crown. Restore the Heartflame, and the King will have nothing left to hold.\"");
  } else {
    pushLog(state, "Halden tends the bright flame and smiles, very tired and very glad.");
  }
  sfx.menu();
  syncHud();
}

function bumpQuest(id, step) {
  const cur = state.flags.quests[id];
  if (cur == null || cur < step) state.flags.quests[id] = step;
}

function rosterAdd(i) {
  if (state.party.length >= 6) return;
  const ch = state.roster.splice(i, 1)[0];
  if (ch) state.party.push(ch);
  sfx.menu();
  refreshModal();
}
function rosterPark(i) {
  if (state.party.length <= 1) return;
  const ch = state.party.splice(i, 1)[0];
  state.roster.push(ch);
  if (sel >= state.party.length) sel = 0;
  sfx.menu();
  refreshModal();
  syncHud();
}

function doNav(nav) {
  if (nav === "save") return openSaveModal(false);
  if (nav === "quests") return openQuests();
  if (nav === "help") return showHelp();
  if (nav === "title") {
    if (combat && combat.active) return;
    closeMod();
    state = null;
    showTitle();
  }
}

export function doSave(slot) {
  if (!state) { pushLogForTitle("Start or load an adventure first."); return; }
  saveToSlot(state, slot, state.name);
  sfx.save();
  pushLog(state, `Game saved in slot ${slot}.`);
  syncHud();
  openSaveModal(modal === "save-title");
}
export function doLoad(slot) {
  const r = loadFromSlot(slot);
  if (!r.ok) { sfx.error(); alertReason(r.reason); return false; }
  state = r.state;
  bindRng(state.seed + state.steps);
  sel = 0;
  closeMod();
  enterPlay();
  pushLog(state, "The book of your travels opens again.");
  sfx.save();
  return true;
}

function alertReason(s) {
  if (state) pushLog(state, s);
  else {
    modal = "help";
    ui.openModal("Save", `<p>${ui.esc(s)}</p>`);
  }
}
function pushLogForTitle(s) { ui.openModal("Save", `<p>${ui.esc(s)}</p>`); }

export function doExport() {
  if (!state) { alertReason("Nothing to export yet."); return ""; }
  const json = downloadSave(state, state.name);
  sfx.save();
  if (state) pushLog(state, "Save file downloaded.");
  return json;
}

export function doImportPick() {
  const input = document.getElementById("import-file") || document.createElement("input");
  if (!document.getElementById("import-file")) {
    input.type = "file"; input.accept = "application/json,.json"; input.id = "import-file";
    input.className = "hidden"; document.body.appendChild(input);
  }
  input.onchange = async () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const text = await file.text();
    doImport(text);
  };
  input.click();
}

export function doImport(text) {
  const r = importSaveString(text);
  if (!r.ok) { sfx.error(); alertReason(r.reason); return { ok: false, reason: r.reason }; }
  state = r.state;
  bindRng(state.seed + state.steps);
  sel = 0;
  closeMod();
  enterPlay();
  pushLog(state, "An imported save takes root.");
  sfx.save();
  return { ok: true };
}

function beginFight(monsters, opts) {
  combat = createCombat(state, monsters, opts);
  combatPhase = "act";
  modal = "combat";
  playTheme(opts?.boss ? "boss" : "combat");
  combatStartTurn(state, combat, rng);
  sfx.hit();
  resolveUntilPlayerOrEnd();
}

function resolveUntilPlayerOrEnd() {
  let guard = 0;
  while (combat && combat.active && guard++ < 40) {
    if (combat.actor && combat.actor.side === "ally" && combat.actor.ref.type === "char") {
      combatPhase = "act";
      drawCombat();
      return;
    }
    if (combat.actor && combat.actor.side === "foe") {
      enemyAct(state, combat, rng);
      sfx.hit();
      advanceAfterAction(state, combat, rng);
      continue;
    }
    if (combat.actor && combat.actor.side === "ally" && combat.actor.ref.type === "summon") {
      // simple summon attack
      const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
      if (foes.length) {
        const m = foes[0];
        const dmg = 4 + Math.floor(rng() * 8);
        m.hp -= dmg;
        combat.log.push(`${combat.actor.ref.ch.name} strikes ${m.name} for ${dmg}.`);
      }
      advanceAfterAction(state, combat, rng);
      continue;
    }
    break;
  }
  if (combat && !combat.active) finishCombat();
  else drawCombat();
}

function drawCombat() {
  modal = "combat";
  const extra = combatPickHtml();
  ui.openModal(combat.boss ? "A Serious Foe" : "Fight!", ui.combatHtml(state, combat, sel, combatPhase, extra));
  const closeBtn = ui.$("btn-modal-close");
  if (closeBtn) closeBtn.classList.add("hidden");
  const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
  ui.paintFoeArt(foes[0]?.art || "shade", lastTs);
  syncHud();
}

function combatPickHtml() {
  if (!combatPick) return "";
  if (combatPick.mode === "foe") {
    const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
    return `<p>Choose a target:</p><div class="row-actions">${foes.map((m, i) =>
      `<button type="button" class="btn tiny" data-foe="${i}">${ui.esc(m.name)}</button>`).join("")}</div>`;
  }
  if (combatPick.mode === "spell") {
    const ch = combat.actor.ref.ch;
    const list = knownSpells(ch).filter((s) => combatPick.songs ? s.kind === "song" : s.kind !== "song");
    return `<p>Choose a ${combatPick.songs ? "song" : "spell"}:</p><div class="list">${list.map((s) =>
      `<button type="button" class="spell-row" data-pick-spell="${s.id}"><span class="left"><span class="name">${ui.esc(s.name)} (${s.code})</span><span class="sub">${s.mp} MP</span></span></button>`
    ).join("") || "<p>None known.</p>"}</div>`;
  }
  if (combatPick.mode === "item") {
    const ch = combat.actor.ref.ch;
    return `<p>Use which item?</p><div class="list">${ch.pack.map((it) =>
      `<button type="button" class="item-row" data-pick-item="${it.uid}"><span class="left"><span class="name">${ui.esc(itemDisplayName(it))}</span></span></button>`
    ).join("") || "<p>Pack is empty.</p>"}</div>`;
  }
  if (combatPick.mode === "ally") {
    return `<p>On whom?</p><div class="row-actions">${state.party.map((c, i) =>
      `<button type="button" class="btn tiny" data-pick-ally="${i}">${ui.esc(c.name)}</button>`).join("")}</div>`;
  }
  return "";
}

export function doCombat(action) {
  if (!combat || !combat.active) return { ok: false };
  if (combatPhase !== "act" && !combatPick) return { ok: false };
  if (action.type === "fight") {
    if (action.target != null) return commitCombat({ type: "fight", target: action.target });
    const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
    if (foes.length > 1) { combatPick = { mode: "foe", action: "fight" }; drawCombat(); return { ok: true, picking: true }; }
    return commitCombat({ type: "fight", target: 0 });
  }
  if (action.type === "parry") return commitCombat({ type: "parry" });
  if (action.type === "run") return commitCombat({ type: "run" });
  if (action.type === "cast") {
    if (action.spell) return commitCombat({ type: "cast", spell: action.spell, target: action.target ?? 0 });
    combatPick = { mode: "spell", songs: false }; drawCombat(); return { ok: true, picking: true };
  }
  if (action.type === "sing") {
    if (action.spell) return commitCombat({ type: "sing", spell: action.spell });
    combatPick = { mode: "spell", songs: true }; drawCombat(); return { ok: true, picking: true };
  }
  if (action.type === "use") {
    if (action.itemUid) return commitCombat({ type: "use", itemUid: action.itemUid, target: action.target ?? sel });
    combatPick = { mode: "item" }; drawCombat(); return { ok: true, picking: true };
  }
  return commitCombat(action);
}

function finishCombatPick(foeIdx) {
  const act = combatPick;
  combatPick = null;
  if (act.action === "fight") return commitCombat({ type: "fight", target: foeIdx });
  if (act.action === "cast") return commitCombat({ type: "cast", spell: act.spell, target: foeIdx });
}

function finishSpellPick(id) {
  const sp = SPELLS[id];
  const songs = combatPick?.songs;
  if (songs) { combatPick = null; return commitCombat({ type: "sing", spell: id }); }
  if (sp.target === "ally" || sp.target === "party" || sp.kind === "heal" || sp.kind === "buff") {
    if (sp.target === "party" || sp.target === "self") { combatPick = null; return commitCombat({ type: "cast", spell: id, target: sel }); }
    combatPick = { mode: "ally", spell: id };
    drawCombat();
    return;
  }
  if (sp.target === "enemy" || sp.target === "enemy-group") {
    combatPick = { mode: "foe", action: "cast", spell: id };
    drawCombat();
    return;
  }
  combatPick = null;
  return commitCombat({ type: "cast", spell: id });
}

function finishAllyPick(i) {
  const sp = combatPick.spell;
  const item = combatPick.item;
  combatPick = null;
  if (sp) return commitCombat({ type: "cast", spell: sp, target: i });
  if (item) return commitCombat({ type: "use", itemUid: item, target: i });
}

function finishItemPick(uid) {
  const t = ITEMS[state.party.find((c) => c.pack.some((i) => i.uid === uid))?.pack.find((i) => i.uid === uid)?.tid];
  // use on ally if heal
  if (t && (t.use === "heal" || t.use === "mana" || t.use === "both" || t.use === "cleanse")) {
    combatPick = { mode: "ally", item: uid };
    drawCombat();
    return;
  }
  combatPick = null;
  return commitCombat({ type: "use", itemUid: uid, target: sel });
}

function commitCombat(action) {
  const r = playerAction(state, combat, action, rng);
  if (!r.ok) { sfx.error(); combat.log.push(r.reason); drawCombat(); return r; }
  if (action.type === "fight") sfx.hit();
  if (action.type === "cast") sfx.spell();
  if (action.type === "sing") sfx.sing();
  if (action.type === "run" && combat.fled) {
    finishCombat();
    return r;
  }
  advanceAfterAction(state, combat, rng);
  resolveUntilPlayerOrEnd();
  return r;
}

function finishCombat() {
  const result = combat;
  const map = getMap(state.mapId);
  if (result.won) {
    for (const n of result.resultNotes || []) pushLog(state, n);
    sfx.win();
    // victory over hollow king
    if (result.monsters.some((m) => m.id === "hollow_king")) {
      state.flags.victory = true;
      bumpQuest("hollow_crown", 3);
    }
    combat = null;
    closeMod();
    playTheme(map.music || "dungeon");
    if (state.flags.victory) showVictory();
  } else if (result.lost) {
    combat = null;
    gameOver();
    return;
  } else if (result.fled) {
    pushLog(state, "You slip away.");
    state.encounterGrace = 10;
    combat = null;
    closeMod();
    playTheme(map.music || "dungeon");
  } else {
    combat = null;
    closeMod();
    playTheme(map.music || "dungeon");
  }
  syncHud();
}

function showVictory() {
  modal = "victory";
  ui.openModal("The Heartflame", `<p>The Hollow King sets his crown down, very gently, and is gone. In the temple far above, a flame no larger than a candle becomes a fire you can feel through the stone.</p>
    <p>Emberhold will tell this story for a long time. The company of ${ui.esc(state.name)} will be in it.</p>
    <p class="gold-tag">You have restored the Heartflame.</p>
    <button type="button" class="btn btn-primary" data-nav="title">Return to Title</button>`);
  playTheme("victory");
}

function gameOver() {
  modal = "defeat";
  ui.openModal("The Party Falls", `<p>The last companion slumps against the stone. This is not the end of Emberhold — only of this attempt. Load a save, or begin again.</p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-nav="save">Load a Save</button>
      <button type="button" class="btn" data-nav="title">Return to Title</button>
    </div>`);
  stopMusic();
}

function fitView() {
  const wrap = document.getElementById("view-wrap");
  const c = document.getElementById("view");
  if (!wrap || !c) return;
  const r = wrap.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(320, Math.floor(r.width * dpr));
  const h = Math.max(180, Math.floor(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
}

function syncHud() {
  if (!state) return;
  ui.renderPartyBar(state, sel);
  ui.renderLog(state);
  ui.renderTop(state);
}

function frame(ts) {
  lastTs = ts;
  if (screen === "play" && state) {
    fitView();
    const c = document.getElementById("view");
    const ctx = c.getContext("2d");
    if (anim.from && anim.t < 1) anim.t = Math.min(1, anim.t + 0.14);
    const px = anim.from ? anim.from.x + (state.x - anim.from.x) * anim.t : state.x;
    const py = anim.from ? anim.from.y + (state.y - anim.from.y) * anim.t : state.y;
    renderView(ctx, state, {
      time: ts,
      hasLight: lightOn() || getMap(state.mapId).light === "day" || getMap(state.mapId).light === "dim",
      secrets: new Set(state.flags.secrets),
      unlocked: new Set(state.flags.unlocked),
      opened: new Set(state.flags.chests),
      bosses: new Set(state.flags.bosses),
      px, py, dir: state.dir
    });
    const mm = document.getElementById("minimap");
    if (mm) renderMinimap(mm.getContext("2d"), state);
    const cp = document.getElementById("compass");
    if (cp) renderCompass(cp.getContext("2d"), state.dir);
    if (modal === "combat" && combat) {
      const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
      ui.paintFoeArt(foes[0]?.art || "shade", ts);
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- Test / debug API ---------- */

export function debugTravel(mapId, spawn) {
  if (!state) startQuick();
  travelTo(mapId, spawn || "entrance");
  return { mapId: state.mapId, x: state.x, y: state.y };
}

export function debugFight(ids) {
  if (!state) startQuick();
  const list = (ids || ["skeleton"]).map((id) => spawnMonster(id, rng));
  beginFight(list, { theme: "crypt" });
  return true;
}

export function debugGive(tid, opts = {}) {
  if (!state) startQuick();
  const it = makeItem(tid, { identified: opts.identified ?? true, ...opts }, rng);
  giveItem(state.party[sel] || state.party[0], it);
  return it;
}

export function debugRefill() {
  if (!state) return;
  for (const c of state.party) {
    c.unconscious = false;
    if (c.maxMp < 8) c.maxMp = Math.max(c.maxMp, 8);
    c.hp = c.maxHp;
    c.mp = c.maxMp;
  }
}

export function forceLearn(spellId, who = 0) {

  const ch = state.party[who];
  if (ch && !ch.spells.includes(spellId)) ch.spells.push(spellId);
  return ch?.spells;
}

export { state as _state, drawAppIcon, listSlots, combat as _combat };
