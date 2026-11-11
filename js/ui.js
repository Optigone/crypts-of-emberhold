/** DOM helpers and modal markup for Crypts of Emberhold. */

import { CLASSES, CLASS_ORDER, STAT_LABEL, SLOTS, SLOT_LABEL, xpForLevel } from "./data/classes.js";
import { SPELLS, SCHOOLS } from "./data/spells.js";
import { ITEMS, itemDisplayName, itemStats, compareItems, curseById } from "./data/items.js";
import { QUESTS, QUEST_ORDER, RELICS } from "./data/quests.js";
import { getMap } from "./data/maps.js";
import { derived, knownSpells, knownSongs, packCount, PACK_LIMIT, totalBonuses, canWear, canLearnSpell } from "./systems/rules.js";
import { listSlots } from "./systems/state.js";
import { drawPortrait, drawMonsterArt } from "./render.js";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

export function $(id) { return document.getElementById(id); }

export function setMuteIcons(muted) {
  for (const id of ["btn-mute", "btn-mute-title"]) {
    const b = $(id);
    if (b) {
      b.textContent = muted ? "🔇" : "🔊";
      b.setAttribute("aria-pressed", muted ? "true" : "false");
    }
  }
}

export function showScreen(id) {
  for (const sec of document.querySelectorAll("#app > .screen, #play-screen")) {
    sec.classList.toggle("hidden", sec.id !== id);
  }
}

export function renderPartyBar(state, sel) {
  const bar = $("party-bar");
  if (!bar || !state) return;
  bar.innerHTML = "";
  state.party.forEach((ch, i) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pc" + (i === sel ? " active" : "") + (ch.unconscious || ch.hp <= 0 ? " down" : "");
    el.dataset.idx = String(i);
    const cv = document.createElement("canvas");
    cv.width = 72; cv.height = 72;
    drawPortrait(cv.getContext("2d"), ch, 0, 0, 72);
    const meta = document.createElement("div");
    meta.className = "meta";
    const hpPct = Math.max(0, Math.round((ch.hp / Math.max(1, ch.maxHp)) * 100));
    const mpPct = ch.maxMp ? Math.max(0, Math.round((ch.mp / ch.maxMp) * 100)) : 0;
    meta.innerHTML = `<div class="name">${esc(ch.name)}</div>
      <div class="cls">L${ch.level} ${esc(CLASSES[ch.cls]?.name || ch.cls)}</div>
      <div class="bar" title="HP ${ch.hp}/${ch.maxHp}"><i style="width:${hpPct}%"></i></div>
      ${ch.maxMp ? `<div class="bar mp" title="MP ${ch.mp}/${ch.maxMp}"><i style="width:${mpPct}%"></i></div>` : ""}`;
    el.append(cv, meta);
    bar.appendChild(el);
  });
}

export function renderLog(state) {
  const log = $("log");
  if (!log || !state) return;
  const lines = state.log.slice(-8);
  log.innerHTML = lines.map((l, i) => `<div class="line${i === lines.length - 1 ? " new" : ""}">${esc(l)}</div>`).join("");
  log.scrollTop = log.scrollHeight;
}

export function renderTop(state) {
  if (!state) return;
  const map = getMap(state.mapId);
  $("where").textContent = map.name;
  $("gold-read").textContent = `${state.gold} gp`;
  const buffs = $("buffs");
  const bits = [];
  if (state.light > 0) bits.push(`Light ${state.light}`);
  if (state.levitate > 0) bits.push(`Levitate ${state.levitate}`);
  if (state.stealth > 0) bits.push(`Veil ${state.stealth}`);
  if (state.song) bits.push(SPELLS[state.song.id]?.name || "Song");
  buffs.innerHTML = bits.map((b) => `<div>${esc(b)}</div>`).join("");
}

export function renderCreateParty(party) {
  const box = $("party-slots");
  box.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const ch = party[i];
    const el = document.createElement("div");
    el.className = "slot-card" + (ch ? "" : " empty");
    if (!ch) {
      el.innerHTML = `<b>Empty place</b><div class="sub" style="color:var(--muted)">Waiting for a companion</div>`;
    } else {
      el.innerHTML = `<b>${esc(ch.name)}</b>
        <div style="color:var(--muted)">${esc(CLASSES[ch.cls].name)} · L${ch.level}</div>
        <div style="color:var(--muted);font-size:0.8rem">STR ${ch.str}  INT ${ch.int}  DEX ${ch.dex}<br>CON ${ch.con}  WIS ${ch.wis}  CHA ${ch.cha}</div>
        <button type="button" class="btn tiny btn-ghost" data-remove="${i}">Remove</button>`;
    }
    box.appendChild(el);
  }
}

export function renderClassGrid(selected) {
  const box = $("class-grid");
  box.innerHTML = "";
  for (const id of CLASS_ORDER) {
    const c = CLASSES[id];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "class-card" + (selected === id ? " selected" : "");
    b.dataset.cls = id;
    b.innerHTML = `<h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>`;
    box.appendChild(b);
  }
}

export function renderStatRow(stats) {
  const box = $("stat-row");
  box.innerHTML = "";
  if (!stats) return;
  for (const [k, label] of Object.entries(STAT_LABEL)) {
    const d = document.createElement("div");
    d.className = "stat-block";
    d.innerHTML = `<b>${stats[k]}</b><span>${label.slice(0, 3).toUpperCase()}</span>`;
    box.appendChild(d);
  }
}

export function openModal(title, html) {
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = html;
  $("modal").classList.remove("hidden");
}

export function closeModal() {
  $("modal").classList.add("hidden");
  $("modal-body").innerHTML = "";
}

export function isModalOpen() {
  return !$("modal").classList.contains("hidden");
}

export function inventoryHtml(state, sel, inspectUid) {
  const ch = state.party[sel];
  const tabs = state.party.map((c, i) =>
    `<button type="button" data-sel="${i}" class="${i === sel ? "on" : ""}">${esc(c.name)}</button>`
  ).join("");
  const eq = SLOTS.map((slot) => {
    const it = ch.equipment[slot];
    return `<div class="eq-slot"><b>${SLOT_LABEL[slot]}</b>${it ? esc(itemDisplayName(it)) : "<span style='color:var(--muted)'>—</span>"}
      ${it ? `<button type="button" class="btn tiny" data-unequip="${slot}">Unequip</button>` : ""}</div>`;
  }).join("");
  const items = ch.pack.map((it) => {
    const on = it.uid === inspectUid ? "on" : "";
    return `<button type="button" class="item-row ${on}" data-inspect="${it.uid}">
      <span class="left"><span class="name">${esc(itemDisplayName(it))}</span>
      <span class="sub">${esc(ITEMS[it.tid]?.desc || "")}</span></span>
    </button>`;
  }).join("") || `<p style="color:var(--muted)">Pack is empty (${packCount(ch)}/${PACK_LIMIT}).</p>`;

  let detail = "";
  const inspect = ch.pack.find((i) => i.uid === inspectUid) || SLOTS.map((s) => ch.equipment[s]).find((i) => i && i.uid === inspectUid);
  if (inspect) {
    const t = ITEMS[inspect.tid];
    const st = inspect.identified ? itemStats(inspect) : null;
    const slot = t?.slot === "ring" ? "ring1" : t?.slot;
    const cur = slot ? ch.equipment[slot === "ring" ? "ring1" : slot] : null;
    const rows = inspect.identified && t?.slot ? compareItems(cur && cur.uid !== inspect.uid ? cur : null, inspect) : [];
    const cmp = rows.length ? `<div class="compare"><table>${rows.map((r) =>
      `<tr><td>${esc(r.label)}</td><td>${r.a}</td><td>→</td><td>${r.b} <span class="${r.diff > 0 ? "up" : r.diff < 0 ? "down" : ""}">${r.diff > 0 ? "+" : ""}${r.diff || ""}</span></td></tr>`
    ).join("")}</table></div>` : "";
    detail = `<div class="compare">
      <b>${esc(itemDisplayName(inspect))}</b>
      <p>${esc(inspect.identified ? (t?.desc || "") : "You have not identified this yet.")}</p>
      ${inspect.identified && inspect.cursed ? `<p class="down">${esc(curseById(inspect.curseId)?.flavor || "It feels unlucky.")}</p>` : ""}
      ${cmp}
      <div class="row-actions" style="margin-top:8px">
        ${t?.slot ? `<button type="button" class="btn tiny" data-equip="${inspect.uid}">Equip</button>` : ""}
        ${t?.kind === "consumable" || t?.kind === "scroll" || t?.kind === "wand" || t?.kind === "book" ? `<button type="button" class="btn tiny" data-use="${inspect.uid}">Use</button>` : ""}
        <button type="button" class="btn tiny" data-drop="${inspect.uid}">Drop</button>
        <button type="button" class="btn tiny" data-give="${inspect.uid}">Give…</button>
      </div>
    </div>`;
  }
  const drv = derived(ch);
  return `<div class="tabs">${tabs}</div>
    <p style="color:var(--muted);margin:0 0 8px">${esc(ch.name)} · L${ch.level} ${esc(CLASSES[ch.cls].name)}
      · HP ${ch.hp}/${ch.maxHp}${ch.maxMp ? ` · MP ${ch.mp}/${ch.maxMp}` : ""} · AC ${drv.ac} · ATK ${drv.atk}
      · XP ${ch.xp}/${xpForLevel(ch.level + 1)}</p>
    <div class="eq-grid">${eq}</div>
    <h3 style="color:var(--gold);margin:12px 0 6px">Pack (${packCount(ch)}/${PACK_LIMIT})</h3>
    <div class="list">${items}</div>
    ${detail}`;
}

export function spellbookHtml(state, sel, inspectId) {
  const ch = state.party[sel];
  const tabs = state.party.map((c, i) =>
    `<button type="button" data-sel="${i}" class="${i === sel ? "on" : ""}">${esc(c.name)}</button>`
  ).join("");
  const spells = knownSpells(ch);
  const songs = spells.filter((s) => s.kind === "song");
  const rest = spells.filter((s) => s.kind !== "song");
  const row = (s) => `<button type="button" class="spell-row ${inspectId === s.id ? "on" : ""}" data-spell="${s.id}">
    <span class="left"><span class="name">${esc(s.name)} <span style="color:var(--gold)">${esc(s.code)}</span></span>
    <span class="sub">${esc(SCHOOLS[s.school]?.name || s.school)} · T${s.tier} · ${s.mp} MP · ${esc(s.desc)}</span></span>
  </button>`;
  const inspect = inspectId ? SPELLS[inspectId] : null;
  const canCast = inspect && ch.mp >= inspect.mp;
  let targets = "";
  if (inspect && (inspect.target === "ally" || inspect.kind === "heal")) {
    targets = `<div class="row-actions" style="margin-top:6px">${state.party.map((c, i) =>
      `<button type="button" class="btn tiny" data-cast="${inspect.id}" data-target="${i}">On ${esc(c.name)}</button>`
    ).join("")}</div>`;
  }
  const detail = inspect ? `<div class="compare">
    <b>${esc(inspect.name)} (${esc(inspect.code)})</b>
    <p>${esc(inspect.desc)}</p>
    <p style="color:var(--muted)">Cost ${inspect.mp} MP · Target: ${esc(inspect.target)}</p>
    ${canCast ? (targets || `<button type="button" class="btn tiny" data-cast="${inspect.id}">Cast / Sing</button>`) : `<p class="down">Not enough mana.</p>`}
  </div>` : "";
  return `<div class="tabs">${tabs}</div>
    <p style="color:var(--muted)">${esc(ch.name)} · MP ${ch.mp}/${ch.maxMp} · ${spells.length} known</p>
    ${songs.length ? `<h3 style="color:var(--gold)">Songs</h3><div class="list">${songs.map(row).join("")}</div>` : ""}
    <h3 style="color:var(--gold)">Spellbook</h3>
    <div class="list">${rest.length ? rest.map(row).join("") : "<p style='color:var(--muted)'>No spells yet.</p>"}</div>
    ${detail}`;
}

export function questsHtml(state) {
  const rel = RELICS.map((r) =>
    `<span class="chip ${state.flags.relics.includes(r) ? "on" : ""}">${esc(r)}</span>`
  ).join(" ");
  const items = QUEST_ORDER.map((id) => {
    const q = QUESTS[id];
    const step = state.flags.quests[id];
    const status = step == null ? "Not started" : step >= q.steps.length ? "Complete" : `Step ${(step || 0) + 1}`;
    const cur = step == null ? q.steps[0] : q.steps[Math.min(step, q.steps.length - 1)];
    return `<div class="slot-card"><b>${esc(q.name)}</b>
      <div style="color:var(--muted)">${esc(q.giver)} · ${esc(status)}</div>
      <p>${esc(cur)}</p></div>`;
  }).join("");
  return `<p>Heartflame shards recovered:</p><div class="row-actions">${rel}</div>
    <p style="color:var(--muted)">${state.flags.relics.length} / 5. ${state.flags.crown_open ? "The temple's sealed door stands open." : state.flags.ashen_open ? "The Ashen Pass is unlocked." : ""}</p>
    ${items}`;
}

export function saveHtml(slots, currentName) {
  const rows = slots.map((s) => {
    if (s.empty) {
      return `<div class="save-slot"><span class="left"><span class="name">Slot ${s.slot}</span><span class="sub">Empty</span></span>
        <button type="button" class="btn tiny" data-save="${s.slot}">Save here</button></div>`;
    }
    const when = s.savedAt ? new Date(s.savedAt).toLocaleString() : "";
    const party = (s.party || []).map((p) => p.name).join(", ");
    return `<div class="save-slot"><span class="left">
      <span class="name">Slot ${s.slot}: ${esc(s.name)}</span>
      <span class="sub">${esc(s.mapId || "")} · ${s.gold ?? 0} gp · ${s.relics || 0} shards · ${esc(when)}<br>${esc(party)}</span>
    </span>
    <span class="row-actions">
      <button type="button" class="btn tiny" data-save="${s.slot}">Overwrite</button>
      <button type="button" class="btn tiny btn-primary" data-load="${s.slot}">Load</button>
    </span></div>`;
  }).join("");
  return `<p>Company name: <b>${esc(currentName || "The Ember Company")}</b></p>
    <div class="list">${rows}</div>
    <div class="row-actions" style="margin-top:12px">
      <button type="button" class="btn" id="btn-export">Export Save</button>
      <button type="button" class="btn" id="btn-import">Import Save</button>
    </div>
    <p style="color:var(--muted);font-size:0.85rem">Export downloads a .json file you can keep or move to another device. Import loads one of those files.</p>
    <input type="file" id="import-file" accept="application/json,.json" class="hidden">`;
}

export function helpHtml() {
  return `<div class="help">
    <p>Crypts of Emberhold is a first-person dungeon adventure. Walk the town, the wilds, and the halls below. Gather a party of six, recover five shards of the Heartflame, and face the Hollow King.</p>
    <h3 style="color:var(--gold)">On a computer</h3>
    <p><kbd>W</kbd> / <kbd>↑</kbd> step forward · <kbd>S</kbd> / <kbd>↓</kbd> step back · <kbd>A</kbd> / <kbd>←</kbd> turn left · <kbd>D</kbd> / <kbd>→</kbd> turn right · <kbd>Q</kbd> / <kbd>E</kbd> sidestep</p>
    <p><kbd>Space</kbd> or <kbd>Enter</kbd> interact · <kbd>F</kbd> search · <kbd>M</kbd> map · <kbd>I</kbd> pack · <kbd>B</kbd> spellbook · <kbd>L</kbd> quests · <kbd>Esc</kbd> close / menu · <kbd>1</kbd>–<kbd>9</kbd> choose a menu action</p>
    <h3 style="color:var(--gold)">On a phone</h3>
    <p>Use the D-pad to step and turn. The gold button in the middle interacts. Map, Pack, Spells, Quests, Search, and Camp are along the sides. Add the page to your Home Screen for a full-screen app that works offline.</p>
    <h3 style="color:var(--gold)">Adventure</h3>
    <p>Buy gear at Voss's shop, spells at Quill's Tower, healing at the temple, and rest at the inn. The graveyard crypt begins the first descent. Light dark halls with torches or the Light spell. Search to find secret doors. Identify mystery items at the mage or with a scroll. Cursed gear is annoying, not frightening — the temple can lift it.</p>
    <p>In a fight: Fight, Parry, Cast, Sing, Use an item, or Run. Bards keep a song going to bolster the party.</p>
  </div>`;
}

export function shopHtml(title, flavor, stock, gold, mode) {
  const rows = stock.map((row, i) => {
    const name = row.item ? itemDisplayName(row.item) : ITEMS[row.tid]?.name;
    return `<button type="button" class="shop-row" data-buy="${i}">
      <span class="left"><span class="name">${esc(name)}</span><span class="sub">${esc(ITEMS[row.tid]?.desc || "")}</span></span>
      <span class="gold-tag">${row.price} gp</span>
    </button>`;
  }).join("") || `<p style="color:var(--muted)">Nothing in stock.</p>`;
  return `<p>${esc(flavor)}</p>
    <p>Your purse: <span class="gold-tag">${gold} gp</span></p>
    <div class="list">${rows}</div>
    ${mode === "mage" ? `<div class="row-actions" style="margin-top:10px">
      <button type="button" class="btn" data-service="identify">Identify an item (25 gp)</button>
    </div>` : ""}
    <p style="color:var(--muted);font-size:0.85rem;margin-top:10px">Tip: open Pack to sell items (from the shop, use the Sell button below).</p>
    <button type="button" class="btn" data-service="sell">Sell from a pack</button>`;
}

export function templeHtml(state) {
  const down = state.party.filter((c) => c.unconscious || c.hp <= 0).length;
  const hurt = state.party.some((c) => c.hp < c.maxHp || c.mp < c.maxMp || c.poison || c.status?.length);
  const healCost = 15 * state.party.length;
  return `<p>Brother Halden tends a flame no larger than a candle. The temple smells of wax and old stone.</p>
    <div class="row-actions">
      <button type="button" class="btn" data-service="talk">Speak with Halden</button>
      <button type="button" class="btn" data-service="heal">Heal the party (${healCost} gp)</button>
      <button type="button" class="btn" data-service="cure">Cure ailments (30 gp)</button>
      <button type="button" class="btn" data-service="rez" ${down ? "" : "disabled"}>Resurrect (${down} × 100 gp)</button>
      <button type="button" class="btn" data-service="uncurse">Lift curses (80 gp)</button>
      ${state.flags.crown_open ? `<button type="button" class="btn btn-primary" data-service="crown">Enter the Hollow Crown</button>` : ""}
    </div>
    <p style="color:var(--muted)">${hurt ? "Some among you could use a blessing." : "The party looks well enough."} Shards: ${state.flags.relics.length}/5.</p>`;
}

export function innHtml() {
  return `<p>Ma Trindle wipes the bar with a cloth that has seen better decades. "Beds are warm, the stew is honest, and I can keep a book of your travels."</p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-service="rest">Rest the night (20 gp)</button>
      <button type="button" class="btn" data-service="talk">Hear a rumor</button>
      <button type="button" class="btn" data-service="save">Save / Load</button>
    </div>`;
}

export function guildHtml(state) {
  const roster = state.roster.map((c, i) =>
    `<div class="save-slot"><span class="left"><span class="name">${esc(c.name)}</span><span class="sub">${esc(CLASSES[c.cls].name)} L${c.level}</span></span>
     <button type="button" class="btn tiny" data-add="${i}" ${state.party.length >= 6 ? "disabled" : ""}>Add to party</button></div>`
  ).join("") || `<p style="color:var(--muted)">No one waits in the roster.</p>`;
  const party = state.party.map((c, i) =>
    `<div class="save-slot"><span class="left"><span class="name">${esc(c.name)}</span><span class="sub">${esc(CLASSES[c.cls].name)} L${c.level}</span></span>
     <button type="button" class="btn tiny" data-park="${i}" ${state.party.length <= 1 ? "disabled" : ""}>Leave in roster</button></div>`
  ).join("");
  return `<p>The Ember Company's hall is all maps, boots, and leftover pie. "If you can walk, you can sign," says the clerk.</p>
    <div class="row-actions">
      <button type="button" class="btn" data-service="talk">Ask for rumors</button>
    </div>
    <h3 style="color:var(--gold)">Active party</h3>${party}
    <h3 style="color:var(--gold)">Roster</h3>${roster}`;
}

export function combatHtml(state, combat, sel, phase, extra = "") {
  const foes = combat.monsters.filter((m) => m.hp > 0 && !m.fled);
  const art = foes[0]?.art || "shade";
  const foeList = foes.map((m, i) =>
    `<li data-foe="${i}"><span>${esc(m.name)}${m.sleep ? " (asleep)" : ""}${m.boss ? " ★" : ""}</span>
     <span class="hp">HP ${m.hp}/${m.maxHp}</span></li>`
  ).join("");
  const actor = combat.actor?.side === "ally" && combat.actor.ref.type === "char" ? combat.actor.ref.ch : null;
  const actions = actor && phase === "act" ? `<div class="actions">
      <button type="button" class="btn" data-cact="fight">1 Fight</button>
      <button type="button" class="btn" data-cact="parry">2 Parry</button>
      <button type="button" class="btn" data-cact="cast">3 Cast</button>
      <button type="button" class="btn" data-cact="sing">4 Sing</button>
      <button type="button" class="btn" data-cact="use">5 Use</button>
      <button type="button" class="btn" data-cact="run">6 Run</button>
    </div>
    <p style="color:var(--muted)">${esc(actor.name)}'s turn. HP ${actor.hp}/${actor.maxHp} · MP ${actor.mp}/${actor.maxMp}</p>` : (phase === "end" ? "" : `<p style="color:var(--muted)">Resolving…</p>`);
  const log = combat.log.slice(-8).map((l) => esc(l)).join("<br>");
  return `<div class="combat-wrap">
      <div class="foe-art">
        <canvas id="foe-canvas" width="360" height="220"></canvas>
        <ul class="foe-list">${foeList}</ul>
      </div>
      <div>
        <div class="combat-log">${log}</div>
        ${actions}
        ${extra}
      </div>
    </div>`;
}

export function paintFoeArt(art, t) {
  const c = $("foe-canvas");
  if (!c) return;
  drawMonsterArt(c.getContext("2d"), art, c.width, c.height, t);
}

export function menuHtml() {
  return `<div class="menu-col" style="width:100%">
    <button type="button" class="btn" data-nav="save">Save / Load / Export</button>
    <button type="button" class="btn" data-nav="quests">Quest Journal</button>
    <button type="button" class="btn" data-nav="help">How to Play</button>
    <button type="button" class="btn" data-nav="title">Return to Title</button>
  </div>`;
}
