/** Stats, equipment, leveling, identification, and combat math. */

import { CLASSES, STATS, SLOTS, statMod, maxHpFor, maxMpFor, xpForLevel, LEVEL_CAP, rollClassStats } from "../data/classes.js";
import { ITEMS, makeItem, itemStats, itemDisplayName, curseById, STARTING_GEAR } from "../data/items.js";
import { SPELLS, startingSpells as startSpells, canLearnSpell, spellsForClass as classSpells } from "../data/spells.js";

// Re-export learn helpers from spells through rules for a single import site.
export { canLearnSpell, itemDisplayName, itemStats, statMod, SLOTS, STATS };

let _cid = 1;
export function nextCid() {
  return "c" + (_cid++) + "x" + Math.floor(Math.random() * 1e5).toString(36);
}

export function makeCharacter(opts, rng = Math.random) {
  const cls = opts.cls;
  const def = CLASSES[cls];
  if (!def) throw new Error("Unknown class " + cls);
  const stats = opts.stats || rollClassStats(cls, rng);
  const level = opts.level || 1;
  const ch = {
    id: opts.id || nextCid(),
    name: (opts.name || def.name).slice(0, 16),
    cls,
    hue: opts.hue ?? Math.floor(rng() * 360),
    level,
    xp: opts.xp ?? 0,
    str: stats.str, int: stats.int, dex: stats.dex, con: stats.con, wis: stats.wis, cha: stats.cha,
    hp: 1, maxHp: 1, mp: 0, maxMp: 0,
    status: [],
    equipment: { weapon: null, shield: null, armor: null, helm: null, gloves: null, boots: null, cloak: null, ring1: null, ring2: null, amulet: null },
    pack: [],
    spells: opts.spells || startSpells(cls),
    unconscious: false,
    poison: 0,
    trained: { str: 0, dex: 0, con: 0 }
  };
  recalo(ch);
  ch.hp = ch.maxHp;
  ch.mp = ch.maxMp;
  if (!opts.noGear) {
    const gear = STARTING_GEAR[cls] || {};
    for (const [slot, tid] of Object.entries(gear)) {
      const it = makeItem(tid, { identified: true }, rng);
      ch.equipment[slot] = it;
    }
    // a couple of supplies
    if (cls === "mage" || cls === "cleric" || cls === "paladin" || cls === "bard") {
      ch.pack.push(makeItem("potionmp", { identified: true, qty: 1 }, rng));
    }
    ch.pack.push(makeItem("potionhp", { identified: true, qty: 1 }, rng));
  }
  return ch;
}

export function recalo(ch) {
  const extras = totalBonuses(ch);
  ch.maxHp = maxHpFor(ch.cls, ch.level, ch.con + (extras.stats.con || 0)) + (extras.stats.hp || 0);
  ch.maxMp = maxMpFor(ch.cls, ch.level, ch.int + (extras.stats.int || 0), ch.wis + (extras.stats.wis || 0), ch.cha + (extras.stats.cha || 0)) + (extras.stats.mp || 0);
  if (ch.hp > ch.maxHp) ch.hp = ch.maxHp;
  if (ch.mp > ch.maxMp) ch.mp = ch.maxMp;
}

export function totalBonuses(ch) {
  const acc = { atk: 0, ac: 0, hit: 0, elem: null, resist: {}, stats: {}, lightCarry: false, levitateCarry: false, thorns: 0, mpDrain: 0, cursed: [] };
  for (const slot of SLOTS) {
    const it = ch.equipment[slot];
    if (!it) continue;
    const st = itemStats(it);
    acc.atk += st.atk;
    acc.ac += st.ac;
    acc.hit += st.hit;
    if (st.elem && slot === "weapon") acc.elem = st.elem;
    acc.thorns += st.thorns;
    acc.mpDrain += st.mpDrain;
    acc.lightCarry = acc.lightCarry || st.lightCarry;
    acc.levitateCarry = acc.levitateCarry || st.levitateCarry;
    if (st.cursed) acc.cursed.push({ slot, item: it, curse: st.curse });
    for (const [k, v] of Object.entries(st.resist || {})) acc.resist[k] = (acc.resist[k] || 0) + v;
    for (const [k, v] of Object.entries(st.stats || {})) acc.stats[k] = (acc.stats[k] || 0) + v;
  }
  for (const s of ch.status) {
    if (s.ac) acc.ac += s.ac;
    if (s.hit) acc.hit += s.hit;
    if (s.damage) acc.atk += s.damage;
    if (s.resist && s.amount) acc.resist[s.resist] = (acc.resist[s.resist] || 0) + s.amount;
  }
  return acc;
}

export function effectiveStat(ch, stat) {
  const b = totalBonuses(ch);
  return ch[stat] + (b.stats[stat] || 0);
}

export function derived(ch) {
  const b = totalBonuses(ch);
  const dex = effectiveStat(ch, "dex");
  const str = effectiveStat(ch, "str");
  const cls = CLASSES[ch.cls];
  return {
    ac: 8 + statMod(dex) + b.ac + (ch.parry ? 3 : 0),
    atk: b.atk + Math.max(0, statMod(str)),
    hit: (cls.hitBonus || 0) + statMod(dex) + b.hit + Math.floor(ch.level / 3),
    elem: b.elem,
    resist: b.resist,
    thorns: b.thorns,
    lightCarry: b.lightCarry,
    levitateCarry: b.levitateCarry,
    mpDrain: b.mpDrain,
    init: dex + (statusHas(ch, "haste") ? 8 : 0)
  };
}

export function statusHas(ch, id) {
  return (ch.status || []).some((s) => s.id === id);
}

export function addStatus(ch, status) {
  ch.status = (ch.status || []).filter((s) => s.id !== status.id);
  ch.status.push({ ...status });
}

export function tickStatus(ch) {
  ch.status = (ch.status || []).filter((s) => {
    if (s.duration == null) return true;
    s.duration -= 1;
    return s.duration > 0;
  });
}

export function canWear(ch, item) {
  const t = ITEMS[item.tid];
  if (!t || !t.slot) return { ok: false, reason: "That cannot be equipped." };
  const cls = CLASSES[ch.cls];
  if (t.wtype && !cls.weapons.includes(t.wtype)) {
    return { ok: false, reason: `${cls.name}s cannot use that weapon.` };
  }
  if (t.atype && !cls.armor.includes(t.atype)) {
    return { ok: false, reason: `${cls.name}s cannot wear that armor.` };
  }
  if (t.slot === "shield" && !cls.shield) {
    return { ok: false, reason: `${cls.name}s cannot use shields.` };
  }
  if (t.hands === 2 && t.slot === "weapon") {
    // allowed; will unequip shield
  }
  return { ok: true, slot: t.slot };
}

export function equipItem(ch, item, preferSlot) {
  const check = canWear(ch, item);
  if (!check.ok) return check;
  const t = ITEMS[item.tid];
  let slot = preferSlot;
  if (!slot) {
    if (t.slot === "ring") {
      slot = !ch.equipment.ring1 ? "ring1" : (!ch.equipment.ring2 ? "ring2" : "ring1");
    } else slot = t.slot;
  }
  const removed = [];
  if (ch.equipment[slot]) {
    if (ch.equipment[slot].cursed && ch.equipment[slot].stuck) {
      return { ok: false, reason: `${itemDisplayName(ch.equipment[slot])} is cursed and will not come off.` };
    }
    removed.push(ch.equipment[slot]);
  }
  if (t.hands === 2 && ch.equipment.shield) {
    if (ch.equipment.shield.cursed && ch.equipment.shield.stuck) {
      return { ok: false, reason: "A cursed shield is in the way." };
    }
    removed.push(ch.equipment.shield);
    ch.equipment.shield = null;
  }
  if (t.slot === "shield" && ch.equipment.weapon && ITEMS[ch.equipment.weapon.tid]?.hands === 2) {
    if (ch.equipment.weapon.cursed && ch.equipment.weapon.stuck) {
      return { ok: false, reason: "A two-handed cursed weapon is in the way." };
    }
    removed.push(ch.equipment.weapon);
    ch.equipment.weapon = null;
  }
  ch.equipment[slot] = item;
  if (item.cursed) item.stuck = true;
  recalo(ch);
  return { ok: true, slot, removed };
}

export function unequipSlot(ch, slot) {
  const it = ch.equipment[slot];
  if (!it) return { ok: false, reason: "Nothing there." };
  if (it.cursed && it.stuck) return { ok: false, reason: `${itemDisplayName(it)} is cursed and will not come off.` };
  ch.equipment[slot] = null;
  recalo(ch);
  return { ok: true, item: it };
}

export function liftCursesOn(ch) {
  let n = 0;
  for (const slot of SLOTS) {
    const it = ch.equipment[slot];
    if (it && it.cursed) {
      it.cursed = false;
      it.stuck = false;
      it.curseId = null;
      it.identified = true;
      n++;
    }
  }
  recalo(ch);
  return n;
}

export function identifyItem(item) {
  item.identified = true;
  return itemDisplayName(item);
}

export function grantXp(party, amount) {
  const alive = party.filter((c) => !c.unconscious && c.hp > 0);
  const share = alive.length ? Math.floor(amount / alive.length) : 0;
  const notes = [];
  for (const ch of alive) {
    ch.xp += share;
    let guard = 0;
    while (ch.level < LEVEL_CAP && ch.xp >= xpForLevel(ch.level + 1) && guard++ < 10) {
      notes.push(...levelUp(ch));
    }
  }
  return notes;
}

export function levelUp(ch) {
  ch.level += 1;
  const notes = [`${ch.name} reaches level ${ch.level}!`];
  recalo(ch);
  ch.hp = ch.maxHp;
  ch.mp = ch.maxMp;
  const newly = classSpells(ch.cls, ch.level).filter((s) => s.learnLevel?.[ch.cls] === ch.level);
  for (const s of newly) {
    if (!ch.spells.includes(s.id)) {
      ch.spells.push(s.id);
      notes.push(`${ch.name} learns ${s.name} (${s.code})!`);
    }
  }
  return notes;
}

export function roll(rng, a, b) {
  if (Array.isArray(a)) return a[0] + Math.floor(rng() * (a[1] - a[0] + 1));
  return a + Math.floor(rng() * ((b ?? a) - a + 1));
}

export function attackRoll(attackerDrv, defenderAc, rng, opts = {}) {
  if (opts.alwaysHit) return { hit: true, roll: 20, crit: false };
  const r = 1 + Math.floor(rng() * 20);
  const total = r + attackerDrv.hit + (opts.hitBonus || 0);
  const need = 8 + defenderAc;
  const crit = r === 20;
  const missAuto = r === 1;
  return { hit: !missAuto && (crit || total >= need), roll: r, total, need, crit };
}

export function damageRoll(atk, rng, opts = {}) {
  let dmg = atk + roll(rng, 1, 6);
  if (opts.crit) dmg = Math.floor(dmg * 1.5) + 2;
  if (opts.backstab) dmg = Math.floor(dmg * 1.8);
  if (opts.elem && opts.resist) {
    const res = opts.resist[opts.elem] || 0;
    dmg = Math.round(dmg * (1 - res / 100));
  }
  if (opts.vs && opts.mult) dmg = Math.round(dmg * opts.mult);
  return Math.max(1, dmg);
}

export function partyHasLight(party, lightSteps) {
  if (lightSteps > 0) return true;
  return party.some((c) => !c.unconscious && derived(c).lightCarry);
}

export function partyHasLevitate(party, leviSteps) {
  if (leviSteps > 0) return true;
  return party.some((c) => !c.unconscious && derived(c).levitateCarry);
}

export function livingParty(party) {
  return party.filter((c) => !c.unconscious && c.hp > 0);
}

export function wipeCheck(party) {
  return party.every((c) => c.unconscious || c.hp <= 0);
}

export function healChar(ch, amount) {
  if (ch.unconscious && amount > 0) {
    ch.unconscious = false;
    ch.hp = Math.max(1, Math.min(ch.maxHp, amount));
    return ch.hp;
  }
  const before = ch.hp;
  ch.hp = Math.min(ch.maxHp, ch.hp + amount);
  return ch.hp - before;
}

export function cleanseChar(ch) {
  ch.poison = 0;
  ch.status = (ch.status || []).filter((s) => !["sleep", "confuse", "poison", "web", "slow"].includes(s.id));
}

export function knownSpells(ch) {
  return ch.spells.map((id) => SPELLS[id]).filter(Boolean);
}

export function knownSongs(ch) {
  return knownSpells(ch).filter((s) => s.kind === "song");
}

export function findItemInParty(party, pred) {
  for (const ch of party) {
    for (const it of ch.pack) if (pred(it, ch, "pack")) return { item: it, ch, where: "pack" };
    for (const slot of SLOTS) {
      const it = ch.equipment[slot];
      if (it && pred(it, ch, slot)) return { item: it, ch, where: slot };
    }
  }
  return null;
}

export function partyHasKey(party, key) {
  return !!findItemInParty(party, (it) => ITEMS[it.tid]?.key === key);
}

export function takeKey(party, key) {
  const found = findItemInParty(party, (it) => ITEMS[it.tid]?.key === key);
  if (!found) return false;
  const idx = found.ch.pack.indexOf(found.item);
  if (idx >= 0) found.ch.pack.splice(idx, 1);
  return true;
}

export function giveItem(ch, item) {
  if (ITEMS[item.tid]?.stack) {
    const exist = ch.pack.find((p) => p.tid === item.tid && p.identified === item.identified);
    if (exist) {
      exist.qty = (exist.qty || 1) + (item.qty || 1);
      return exist;
    }
  }
  ch.pack.push(item);
  return item;
}

export function packCount(ch) {
  return ch.pack.reduce((n, it) => n + 1, 0);
}

export const PACK_LIMIT = 16;

export function firstPackSpace(party) {
  return party.find((c) => !c.unconscious && packCount(c) < PACK_LIMIT) || party.find((c) => packCount(c) < PACK_LIMIT) || party[0];
}
