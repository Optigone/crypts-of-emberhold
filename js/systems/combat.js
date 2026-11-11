/** Turn-based party combat. */

import { SPELLS } from "../data/spells.js";
import { ITEMS, rollLoot, makeItem, itemDisplayName } from "../data/items.js";
import { spawnMonster, monsterById } from "../data/monsters.js";
import {
  derived, attackRoll, damageRoll, roll, livingParty, wipeCheck, healChar, cleanseChar,
  addStatus, tickStatus, grantXp, giveItem, firstPackSpace, statusHas, recalo, liftCursesOn
} from "./rules.js";
import { addRelic, pushLog } from "./state.js";

export function createCombat(state, monsters, opts = {}) {
  const allies = [];
  return {
    active: true,
    fled: false,
    won: false,
    lost: false,
    boss: !!opts.boss,
    theme: opts.theme || "crypt",
    monsters,
    summons: allies,
    round: 1,
    queue: [],
    cursor: 0,
    waiting: true, // waiting on player action for current actor
    actor: null,
    log: opts.ambush ? ["Ambushed!"] : ["Enemies approach!"],
    lootPending: null,
    resultNotes: []
  };
}

function allFoes(combat) {
  return combat.monsters.filter((m) => m.hp > 0 && !m.fled);
}

function allAllies(state, combat) {
  return [
    ...state.party.map((c, i) => ({ type: "char", ch: c, index: i })),
    ...combat.summons.filter((s) => s.hp > 0).map((s, i) => ({ type: "summon", ch: s, index: i }))
  ].filter((a) => a.type !== "char" || (!a.ch.unconscious && a.ch.hp > 0));
}

export function buildQueue(state, combat, rng) {
  const q = [];
  for (const a of allAllies(state, combat)) {
    const init = a.type === "char" ? derived(a.ch).init : (a.ch.hit || 10) + 8;
    q.push({ side: "ally", ref: a, init: init + Math.floor(rng() * 6) });
  }
  for (let i = 0; i < combat.monsters.length; i++) {
    const m = combat.monsters[i];
    if (m.hp <= 0 || m.fled) continue;
    q.push({ side: "foe", ref: { type: "mon", mon: m, index: i }, init: (m.hit || 0) + 8 + Math.floor(rng() * 6) - (m.slow || 0) * 3 });
  }
  q.sort((a, b) => b.init - a.init);
  combat.queue = q;
  combat.cursor = 0;
}

export function currentActor(combat) {
  return combat.queue[combat.cursor] || null;
}

export function combatStartTurn(state, combat, rng) {
  if (!combat.queue.length) buildQueue(state, combat, rng);
  // skip dead
  while (combat.cursor < combat.queue.length) {
    const a = combat.queue[combat.cursor];
    if (!actorAlive(a, combat, state)) {
      combat.cursor++;
      continue;
    }
    combat.actor = a;
    combat.waiting = a.side === "ally" && a.ref.type === "char";
    return a;
  }
  // next round
  combat.round++;
  tickRound(state, combat, rng);
  buildQueue(state, combat, rng);
  return combatStartTurn(state, combat, rng);
}

function actorAlive(a, combat, state) {
  if (a.side === "foe") return a.ref.mon.hp > 0 && !a.ref.mon.fled;
  if (a.ref.type === "summon") return a.ref.ch.hp > 0;
  return !a.ref.ch.unconscious && a.ref.ch.hp > 0;
}

function tickRound(state, combat, rng) {
  for (const ch of state.party) {
    tickStatus(ch);
    ch.parry = false;
    if (ch.poison > 0 && !ch.unconscious) {
      const d = 1 + Math.floor(rng() * 3);
      ch.hp = Math.max(0, ch.hp - d);
      clog(combat, `${ch.name} suffers from poison (${d}).`);
      if (ch.hp <= 0) drop(ch, combat);
    }
    const vig = ch.status?.find((s) => s.regen);
    if (vig && !ch.unconscious) healChar(ch, vig.regen);
  }
  // bard song aura
  if (state.song && state.song.kind === "combat" || (state.song && SPELLS[state.song.id])) {
    const song = SPELLS[state.song.id];
    if (song?.effect?.auraDamage) {
      for (const m of allFoes(combat)) {
        const d = roll(rng, song.effect.auraDamage);
        m.hp -= d;
        if (m.hp <= 0) clog(combat, `${m.name} is overwhelmed by the song!`);
      }
    }
    if (song?.effect?.sleepChance) {
      for (const m of allFoes(combat)) {
        if (rng() < song.effect.sleepChance && !m.tags?.includes("construct")) {
          m.sleep = Math.max(m.sleep || 0, 1);
          clog(combat, `${m.name} looks sleepy...`);
        }
      }
    }
  }
  for (const m of combat.monsters) {
    if (m.sleep > 0) m.sleep--;
    if (m.confuse > 0) m.confuse--;
    if (m.slow > 0) m.slow--;
    if (m.web > 0) m.web--;
  }
  combat.summons = combat.summons.filter((s) => {
    s.rounds = (s.rounds ?? 6) - 1;
    return s.hp > 0 && s.rounds > 0;
  });
}

function drop(ch, combat) {
  ch.hp = 0;
  ch.unconscious = true;
  clog(combat, `${ch.name} falls unconscious!`);
}

function clog(combat, msg) {
  combat.log.push(msg);
  if (combat.log.length > 60) combat.log.splice(0, combat.log.length - 40);
}

export function advanceAfterAction(state, combat, rng) {
  checkEnd(state, combat, rng);
  if (!combat.active) return;
  combat.cursor++;
  combatStartTurn(state, combat, rng);
  if (combat.active && combat.actor && combat.actor.side === "foe") {
    // resolved by caller via enemyAct, or we can do it here
  }
}

function checkEnd(state, combat, rng) {
  if (wipeCheck(state.party)) {
    combat.active = false;
    combat.lost = true;
    clog(combat, "The party has fallen...");
    return;
  }
  if (!allFoes(combat).length) {
    combat.active = false;
    combat.won = true;
    const notes = finishVictory(state, combat, rng);
    combat.resultNotes = notes;
  }
}

function finishVictory(state, combat, rng) {
  const notes = [];
  let xp = 0, gold = 0;
  const items = [];
  const already = new Set(state.flags.bosses || []);
  // unique items already owned
  const owned = new Set();
  for (const ch of [...state.party, ...state.roster]) {
    for (const it of ch.pack) if (ITEMS[it.tid]?.unique) owned.add(it.tid);
    for (const k of Object.keys(ch.equipment)) {
      const it = ch.equipment[k];
      if (it && ITEMS[it.tid]?.unique) owned.add(it.tid);
    }
  }
  for (const m of combat.monsters) {
    if (m.fled) continue;
    xp += m.xp || 0;
    if (m.gold) gold += roll(rng, m.gold);
    if (m.loot) {
      const L = rollLoot(m.loot, rng, owned);
      gold += L.gold;
      items.push(...L.items);
    }
    if (m.relic && !state.flags.relics.includes(relicIdFromItem(m.relic))) {
      const it = makeItem(m.relic, { identified: true }, rng);
      items.push(it);
      addRelic(state, relicIdFromItem(m.relic));
      notes.push(`You recover ${it.tid ? itemDisplayName(it) : m.relic}!`);
    }
    if (m.artifact && !owned.has(m.artifact)) {
      items.push(makeItem(m.artifact, { identified: true }, rng));
      notes.push(`You find a legendary relic!`);
    }
    if (m.boss) {
      if (!state.flags.bosses.includes(m.id)) state.flags.bosses.push(m.id);
    }
  }
  // small standard loot if nothing
  if (!items.length && rng() < 0.4) {
    const L = rollLoot((combat.theme || "overworld") === "overworld" ? "overworld" : (combat.theme + "-minor"), rng, owned);
    // theme-minor may not exist
    gold += L.gold;
    items.push(...L.items);
  }
  state.gold += gold;
  for (const it of items) {
    const dest = firstPackSpace(state.party);
    if (dest) giveItem(dest, it);
  }
  const lvlNotes = grantXp(state.party, xp);
  notes.unshift(`Victory! +${xp} experience, +${gold} gold.`);
  if (items.length) notes.push("Loot: " + items.map(itemDisplayName).join(", ") + ".");
  notes.push(...lvlNotes);
  combat.lootPending = { xp, gold, items };
  return notes;
}

function relicIdFromItem(tid) {
  const map = { shard_spark: "spark", shard_living: "living", shard_bell: "bell", shard_green: "green", shard_cinder: "cinder" };
  return map[tid] || tid;
}

/** Player action for the current character. */
export function playerAction(state, combat, action, rng) {
  const actor = combat.actor;
  if (!actor || actor.side !== "ally" || actor.ref.type !== "char") {
    return { ok: false, reason: "Not your turn." };
  }
  const ch = actor.ref.ch;
  if (statusHas(ch, "sleep")) {
    clog(combat, `${ch.name} is asleep!`);
    return { ok: true, slept: true };
  }
  let result;
  switch (action.type) {
    case "fight": result = actFight(ch, combat, action.target, rng, state); break;
    case "parry": result = actParry(ch, combat); break;
    case "cast": result = actCast(ch, combat, action.spell, action.target, rng, state); break;
    case "sing": result = actSing(ch, combat, action.spell, rng, state); break;
    case "use": result = actUse(ch, combat, action.itemUid, action.target, rng, state); break;
    case "run": result = actRun(state, combat, rng); break;
    default: return { ok: false, reason: "Unknown action." };
  }
  return result;
}

function pickFoe(combat, index) {
  const foes = allFoes(combat);
  if (!foes.length) return null;
  if (index == null || index < 0) return foes[0];
  return foes[Math.min(index, foes.length - 1)];
}

function pickAlly(state, index) {
  const list = state.party;
  if (index == null) return list.find((c) => !c.unconscious) || list[0];
  return list[Math.max(0, Math.min(index, list.length - 1))];
}

function actFight(ch, combat, targetIdx, rng, state) {
  const mon = pickFoe(combat, targetIdx);
  if (!mon) return { ok: false, reason: "No target." };
  const drv = derived(ch);
  const backstab = ch.cls === "rogue" && (combat.round === 1 || statusHas(ch, "backstab"));
  const ar = attackRoll(drv, mon.ac, rng, { hitBonus: backstab ? 3 : 0 });
  if (!ar.hit) {
    clog(combat, `${ch.name} attacks ${mon.name}... and misses!`);
    return { ok: true, miss: true };
  }
  const dmg = damageRoll(drv.atk, rng, {
    crit: ar.crit,
    backstab,
    elem: drv.elem,
    resist: mon.resists
  });
  mon.hp -= dmg;
  let extra = "";
  if (ar.crit) extra = " A fine strike!";
  if (backstab) extra += " A sharp surprise!";
  clog(combat, `${ch.name} hits ${mon.name} for ${dmg}.${extra}`);
  if (mon.hp <= 0) clog(combat, `${mon.name} is defeated!`);
  if (statusHas(ch, "backstab")) ch.status = ch.status.filter((s) => s.id !== "backstab");
  return { ok: true, dmg };
}

function actParry(ch, combat) {
  ch.parry = true;
  clog(combat, `${ch.name} takes a defensive stance.`);
  return { ok: true };
}

function actCast(ch, combat, spellId, target, rng, state, fromWand) {
  const spell = SPELLS[spellId];
  if (!spell) return { ok: false, reason: "Unknown spell." };
  if (!fromWand && !ch.spells.includes(spellId)) return { ok: false, reason: `${ch.name} does not know that spell.` };
  if (!fromWand && ch.mp < spell.mp) return { ok: false, reason: "Not enough mana." };
  if (!fromWand) ch.mp -= spell.mp;
  clog(combat, `${ch.name} casts ${spell.name} (${spell.code})!`);
  applySpell(spell, ch, combat, target, rng, state, true);
  return { ok: true };
}

function actSing(ch, combat, spellId, rng, state) {
  const spell = SPELLS[spellId];
  if (!spell || spell.kind !== "song") return { ok: false, reason: "That is not a song." };
  if (!ch.spells.includes(spellId)) return { ok: false, reason: "Unknown song." };
  if (ch.mp < spell.mp) return { ok: false, reason: "Not enough mana." };
  ch.mp -= spell.mp;
  state.song = { id: spellId, casterId: ch.id, remaining: spell.effect.duration || 99, kind: spell.explore ? "explore" : "combat" };
  // apply party buffs
  applySpell(spell, ch, combat, "party", rng, state, true);
  clog(combat, `${ch.name} sings ${spell.name}!`);
  return { ok: true };
}

function actUse(ch, combat, uid, target, rng, state) {
  const item = ch.pack.find((i) => i.uid === uid);
  if (!item) return { ok: false, reason: "Item not in pack." };
  const t = ITEMS[item.tid];
  if (!t) return { ok: false, reason: "Unknown item." };
  if (t.kind === "wand") {
    if (!item.charges) return { ok: false, reason: "The wand is spent." };
    item.charges--;
    const r = actCast(ch, combat, t.spell, target, rng, state, true);
    if (item.charges <= 0) clog(combat, `The ${t.name} crumbles, spent.`);
    return r;
  }
  if (t.kind === "consumable" || t.kind === "scroll") {
    const ally = pickAlly(state, target);
    useConsumable(item, t, ally, ch, combat, state, rng);
    return { ok: true };
  }
  return { ok: false, reason: "Cannot use that in combat." };
}

function useConsumable(item, t, ally, owner, combat, state, rng) {
  if (t.use === "heal" || t.use === "both") {
    const amt = roll(rng, t.heal);
    const got = healChar(ally, amt);
    clog(combat, `${ally.name} is mended for ${got}.`);
  }
  if (t.use === "mana" || t.use === "both") {
    const amt = roll(rng, t.mana);
    ally.mp = Math.min(ally.maxMp, ally.mp + amt);
    clog(combat, `${ally.name} recovers ${amt} mana.`);
  }
  if (t.use === "cleanse") {
    cleanseChar(ally);
    clog(combat, `${ally.name} feels clear again.`);
  }
  if (t.use === "identify") {
    clog(combat, "There's no time to study an item in mid-fight.");
    return;
  }
  item.qty = (item.qty || 1) - 1;
  if (item.qty <= 0) {
    const i = owner.pack.indexOf(item);
    if (i >= 0) owner.pack.splice(i, 1);
  }
}

function actRun(state, combat, rng) {
  if (combat.boss) {
    clog(combat, "There is no running from this foe.");
    return { ok: true, ran: false };
  }
  const avgDex = livingParty(state.party).reduce((s, c) => s + derived(c).init, 0) / Math.max(1, livingParty(state.party).length);
  const avgHit = allFoes(combat).reduce((s, m) => s + m.hit, 0) / Math.max(1, allFoes(combat).length);
  const bonus = state.song && SPELLS[state.song.id]?.effect?.runBonus ? SPELLS[state.song.id].effect.runBonus : 0;
  const chance = Math.min(0.85, Math.max(0.15, 0.45 + (avgDex - avgHit - 8) * 0.03 + bonus));
  if (rng() < chance) {
    combat.active = false;
    combat.fled = true;
    clog(combat, "You slip away!");
    return { ok: true, ran: true };
  }
  clog(combat, "You cannot find an opening to flee!");
  return { ok: true, ran: false };
}

export function applySpell(spell, caster, combat, target, rng, state, inCombat) {
  const fx = spell.effect || {};
  // world effects are handled by the game layer; combat effects here
  if (fx.damage && inCombat) {
    const targets = resolveTargets(combat, state, spell.target, target);
    for (const mon of targets) {
      if (!mon || mon.hp == null) continue;
      if (fx.onlyUndead && !mon.tags?.includes("undead")) {
        clog(combat, `${mon.name} is unaffected.`);
        continue;
      }
      let mult = 1;
      if (fx.vsUndead && mon.tags?.includes("undead")) mult *= fx.vsUndead;
      if (fx.vsConstruct && mon.tags?.includes("construct")) mult *= fx.vsConstruct;
      const dmg = damageRoll(0, rng, { elem: fx.elem, resist: mon.resists, vs: true, mult });
      // use spell damage range instead of weapon atk
      const base = roll(rng, fx.damage);
      let final = Math.max(1, Math.round(base * mult));
      if (fx.elem && mon.resists) {
        const res = mon.resists[fx.elem] || 0;
        final = Math.max(1, Math.round(final * (1 - res / 100)));
      }
      if (fx.alwaysHit === false) { /* not used */ }
      mon.hp -= final;
      clog(combat, `${mon.name} takes ${final} ${fx.elem || ""} damage.`.replace("  ", " "));
      if (fx.slow) mon.slow = Math.max(mon.slow || 0, fx.slow);
      if (mon.hp <= 0) clog(combat, `${mon.name} is defeated!`);
    }
  }
  if (fx.sleep && inCombat) {
    for (const mon of resolveTargets(combat, state, spell.target, target)) {
      if (!mon || mon.hp == null) continue;
      if (mon.tags?.includes("construct")) continue;
      if (rng() < (fx.chance ?? 0.6)) {
        mon.sleep = fx.sleep;
        clog(combat, `${mon.name} dozes off.`);
      } else clog(combat, `${mon.name} stays alert.`);
    }
  }
  if (fx.confuse && inCombat) {
    for (const mon of resolveTargets(combat, state, spell.target, target)) {
      if (!mon || mon.hp == null) continue;
      if (rng() < (fx.chance ?? 0.5)) {
        mon.confuse = fx.confuse;
        clog(combat, `${mon.name} looks bewildered.`);
      }
    }
  }
  if (fx.flee && inCombat) {
    for (const mon of resolveTargets(combat, state, spell.target, target)) {
      if (!mon || mon.hp == null || mon.boss) continue;
      if (rng() < (fx.chance ?? 0.5)) {
        mon.fled = true;
        mon.hp = 0;
        clog(combat, `${mon.name} loses heart and flees!`);
      } else clog(combat, `${mon.name} stands firm.`);
    }
  }
  if (fx.heal || fx.healFull) {
    const allies = resolveAllyTargets(state, spell.target, target, caster);
    for (const a of allies) {
      if (fx.healFull) {
        a.unconscious = false;
        a.hp = a.maxHp;
        clog(combat, `${a.name} is fully restored.`);
      } else {
        const amt = roll(rng, fx.heal);
        const got = healChar(a, amt);
        clog(combat, `${a.name} is healed for ${got}.`);
      }
      if (fx.cleanse) cleanseChar(a);
    }
  }
  if (fx.cleanse && !fx.heal && !fx.healFull) {
    for (const a of resolveAllyTargets(state, spell.target, target, caster)) {
      cleanseChar(a);
      clog(combat, `${a.name} is cleansed.`);
    }
  }
  if (fx.liftCurse) {
    const allies = resolveAllyTargets(state, spell.target, target, caster);
    for (const a of allies) {
      const n = liftCursesOn(a);
      clog(combat, n ? `A curse lifts from ${a.name}.` : `${a.name} was not cursed.`);
    }
  }
  if (fx.revive) {
    const allies = resolveAllyTargets(state, spell.target, target, caster);
    for (const a of allies) {
      if (a.unconscious || a.hp <= 0) {
        a.unconscious = false;
        a.hp = Math.max(1, Math.floor(a.maxHp * (fx.revive || 0.4)));
        clog(combat, `${a.name} stirs and rises!`);
      }
    }
  }
  if (fx.ac || fx.hit || fx.haste || fx.damage && spell.kind === "buff" || fx.resist && spell.kind !== "song") {
    if (spell.kind === "buff" || spell.kind === "song") {
      const allies = resolveAllyTargets(state, spell.target === "all-enemies" ? "party" : spell.target, target, caster);
      for (const a of allies) {
        addStatus(a, {
          id: spell.id,
          name: spell.name,
          duration: fx.duration || 8,
          ac: fx.ac, hit: fx.hit, damage: fx.damage && spell.kind !== "attack" ? fx.damage : undefined,
          haste: fx.haste, regen: fx.regen, resist: fx.resist, amount: fx.amount, backstab: fx.backstab
        });
      }
    }
  }
  if (fx.summon && inCombat) {
    const mon = spawnMonster(fx.summon, rng);
    mon.ally = true;
    mon.rounds = fx.rounds || 6;
    combat.summons.push(mon);
    clog(combat, `${mon.name} appears in a swirl of light!`);
  }
  return fx;
}

function resolveTargets(combat, state, kind, target) {
  const foes = allFoes(combat);
  if (kind === "all-enemies") return foes;
  if (kind === "enemy" || kind === "enemy-group") return [pickFoe(combat, target)].filter(Boolean);
  return [];
}

function resolveAllyTargets(state, kind, target, caster) {
  if (kind === "party") return state.party.slice();
  if (kind === "self") return [caster];
  if (kind === "ally") return [pickAlly(state, target)];
  if (kind === "world") return [];
  return [caster];
}

export function enemyAct(state, combat, rng) {
  const actor = combat.actor;
  if (!actor || actor.side !== "foe") return { ok: false };
  const mon = actor.ref.mon;
  if (mon.sleep > 0) {
    clog(combat, `${mon.name} is asleep.`);
    return { ok: true };
  }
  if (mon.web > 0) {
    clog(combat, `${mon.name} is tangled and struggles free.`);
    mon.web = 0;
    return { ok: true };
  }
  const targets = livingParty(state.party);
  if (!targets.length) return { ok: true };
  if (mon.confuse > 0 && rng() < 0.5) {
    clog(combat, `${mon.name} is bewildered and misses the turn.`);
    return { ok: true };
  }
  // skill picks
  const sk = mon.skills || {};
  if (sk.call && rng() < 0.2 && combat.monsters.filter((m) => m.hp > 0).length < 5) {
    const pup = spawnMonster(sk.call, rng);
    pup.hp = Math.max(4, Math.floor(pup.hp * 0.7));
    pup.maxHp = pup.hp;
    combat.monsters.push(pup);
    clog(combat, `${mon.name} calls a ${pup.name}!`);
    return { ok: true };
  }
  if (sk.missile && rng() < sk.missile) {
    const t = targets[Math.floor(rng() * targets.length)];
    const dmg = roll(rng, 6, 12);
    applyMonDmg(t, dmg, combat, mon, "a dart of force");
    return { ok: true };
  }
  if (sk.spark && rng() < sk.spark) {
    const t = targets[Math.floor(rng() * targets.length)];
    const dmg = roll(rng, 5, 11);
    applyMonDmg(t, dmg, combat, mon, "a spark of fire");
    return { ok: true };
  }
  if (sk.drowse && rng() < sk.drowse) {
    const t = targets[Math.floor(rng() * targets.length)];
    if (rng() < 0.45) {
      addStatus(t, { id: "sleep", name: "Asleep", duration: 2 });
      clog(combat, `${mon.name} lulls ${t.name} to sleep!`);
    } else clog(combat, `${mon.name} tries to lull ${t.name}, who stays awake.`);
    return { ok: true };
  }
  if (sk.poison && rng() < sk.poison) {
    const t = targets[Math.floor(rng() * targets.length)];
    const dmg = Math.max(1, mon.atk - 2 + roll(rng, 1, 4));
    applyMonDmg(t, dmg, combat, mon, "a venomous strike");
    if (t.hp > 0 && rng() < 0.5) {
      t.poison = Math.max(t.poison, 3);
      clog(combat, `${t.name} is poisoned!`);
    }
    return { ok: true };
  }
  if (sk.web && rng() < sk.web) {
    const t = targets[Math.floor(rng() * targets.length)];
    addStatus(t, { id: "web", name: "Tangled", duration: 1, ac: -2 });
    clog(combat, `${mon.name} tangles ${t.name}!`);
    return { ok: true };
  }
  if (sk.fright && rng() < sk.fright) {
    clog(combat, `${mon.name} looms fearsomely! The party holds together.`);
    return { ok: true };
  }
  if (sk.ring && rng() < sk.ring) {
    clog(combat, `${mon.name} tolls a haunting note!`);
    for (const t of targets) {
      applyMonDmg(t, roll(rng, 4, 8), combat, mon, "the ringing");
    }
    return { ok: true };
  }
  if (sk.spit && rng() < sk.spit) {
    const t = targets[Math.floor(rng() * targets.length)];
    applyMonDmg(t, roll(rng, 3, 7), combat, mon, "a glob of slime");
    return { ok: true };
  }
  // default melee — prefers front (index 0-2)
  const front = targets.slice(0, Math.min(3, targets.length));
  const t = front[Math.floor(rng() * front.length)];
  const smash = sk.smash && rng() < sk.smash;
  const drv = { hit: mon.hit, atk: mon.atk };
  const ar = attackRoll(drv, derived(t).ac, rng, { hitBonus: smash ? 2 : 0 });
  if (!ar.hit) {
    clog(combat, `${mon.name} attacks ${t.name}... and misses!`);
    return { ok: true };
  }
  let dmg = damageRoll(mon.atk, rng, { crit: ar.crit, resist: derived(t).resist });
  if (smash) dmg = Math.floor(dmg * 1.3);
  applyMonDmg(t, dmg, combat, mon, smash ? "a heavy blow" : "a strike");
  const thorns = derived(t).thorns;
  if (thorns && mon.hp > 0) {
    mon.hp -= thorns;
    clog(combat, `${mon.name} is pricked for ${thorns}!`);
  }
  return { ok: true };
}

function applyMonDmg(t, dmg, combat, mon, how) {
  t.hp -= dmg;
  clog(combat, `${mon.name} hits ${t.name} with ${how} for ${dmg}.`);
  if (t.hp <= 0) drop(t, combat);
}

export function summarizeFoes(combat) {
  return allFoes(combat).map((m) => ({
    name: m.name, hp: m.hp, maxHp: m.maxHp, art: m.art, boss: !!m.boss, sleep: m.sleep, tags: m.tags
  }));
}
