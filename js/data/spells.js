/** Spells, songs, and how they are learned. */

export const SCHOOLS = {
  fire: { name: "Fire", color: "#e07030" },
  ice: { name: "Frost", color: "#7ec8e8" },
  shock: { name: "Storm", color: "#e8d45a" },
  force: { name: "Force", color: "#c0a0e8" },
  mind: { name: "Mind", color: "#d080c0" },
  light: { name: "Light", color: "#f0e0a0" },
  utility: { name: "Weaving", color: "#80c0a0" },
  summon: { name: "Summoning", color: "#e09060" },
  buff: { name: "Warding", color: "#80a0d0" },
  divine: { name: "Sacred", color: "#f0e8c8" },
  song: { name: "Song", color: "#e090b8" },
  trick: { name: "Trickery", color: "#8aaa60" }
};

function S(def) {
  return def;
}

export const SPELLS = {
  // —— FIRE ——
  spark: S({
    id: "spark", name: "Spark", code: "SPRK", school: "fire", tier: 1, mp: 2,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 1 },
    desc: "A bright ember leaps at one foe.",
    effect: { damage: [4, 7], elem: "fire" }
  }),
  flamedart: S({
    id: "flamedart", name: "Flame Dart", code: "FDART", school: "fire", tier: 2, mp: 5,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 4 },
    desc: "A dart of concentrated fire.",
    effect: { damage: [9, 16], elem: "fire" }
  }),
  fireball: S({
    id: "fireball", name: "Fireball", code: "FBALL", school: "fire", tier: 3, mp: 10,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 8 },
    desc: "A blooming sphere of flame around the enemy line.",
    effect: { damage: [12, 20], elem: "fire" }
  }),
  inferno: S({
    id: "inferno", name: "Inferno", code: "INFR", school: "fire", tier: 4, mp: 16,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 13 },
    desc: "The air itself catches fire.",
    effect: { damage: [20, 32], elem: "fire" }
  }),

  // —— ICE ——
  chill: S({
    id: "chill", name: "Chill", code: "CHIL", school: "ice", tier: 1, mp: 2,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 1 },
    desc: "A sting of frost.",
    effect: { damage: [3, 6], elem: "ice", slow: 1 }
  }),
  icebolt: S({
    id: "icebolt", name: "Ice Bolt", code: "IBLT", school: "ice", tier: 2, mp: 5,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 4 },
    desc: "A spear of ice.",
    effect: { damage: [8, 15], elem: "ice", slow: 1 }
  }),
  frostnova: S({
    id: "frostnova", name: "Frost Nova", code: "FNOV", school: "ice", tier: 3, mp: 10,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 8 },
    desc: "A ring of cold bursts from the caster.",
    effect: { damage: [10, 18], elem: "ice", slow: 2 }
  }),
  blizzard: S({
    id: "blizzard", name: "Blizzard", code: "BLIZ", school: "ice", tier: 4, mp: 16,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 13 },
    desc: "A howling storm of ice.",
    effect: { damage: [18, 30], elem: "ice", slow: 2 }
  }),

  // —— STORM ——
  zap: S({
    id: "zap", name: "Zap", code: "ZAP", school: "shock", tier: 1, mp: 3,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 2 },
    desc: "A snap of lightning.",
    effect: { damage: [5, 9], elem: "shock" }
  }),
  lightning: S({
    id: "lightning", name: "Lightning", code: "LTNG", school: "shock", tier: 2, mp: 7,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 5 },
    desc: "A forked bolt from the ceiling of the world.",
    effect: { damage: [12, 20], elem: "shock" }
  }),
  chainbolt: S({
    id: "chainbolt", name: "Chain Bolt", code: "CHBN", school: "shock", tier: 3, mp: 12,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 9 },
    desc: "Lightning leaps from foe to foe.",
    effect: { damage: [11, 18], elem: "shock" }
  }),
  thunderstorm: S({
    id: "thunderstorm", name: "Thunderstorm", code: "TSTM", school: "shock", tier: 4, mp: 18,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 14 },
    desc: "The hall fills with rolling thunder.",
    effect: { damage: [22, 34], elem: "shock" }
  }),

  // —— FORCE ——
  missile: S({
    id: "missile", name: "Magic Missile", code: "MMIS", school: "force", tier: 1, mp: 3,
    kind: "attack", target: "enemy", classes: ["mage", "bard"], learnLevel: { mage: 1, bard: 4 },
    desc: "A dart of force that never misses.",
    effect: { damage: [5, 8], elem: "force", alwaysHit: true }
  }),
  forcepulse: S({
    id: "forcepulse", name: "Force Pulse", code: "FPUL", school: "force", tier: 2, mp: 6,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 5 },
    desc: "A shove of raw will.",
    effect: { damage: [10, 16], elem: "force" }
  }),
  shatter: S({
    id: "shatter", name: "Shatter", code: "SHTR", school: "force", tier: 3, mp: 10,
    kind: "attack", target: "enemy", classes: ["mage"], learnLevel: { mage: 9 },
    desc: "Especially harsh to stone and construct foes.",
    effect: { damage: [14, 22], elem: "force", vsConstruct: 1.6 }
  }),
  starfall: S({
    id: "starfall", name: "Starfall", code: "STAR", school: "force", tier: 4, mp: 18,
    kind: "attack", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 15 },
    desc: "Shards of night-sky force rain down.",
    effect: { damage: [20, 32], elem: "force" }
  }),

  // —— MIND ——
  drowse: S({
    id: "drowse", name: "Drowse", code: "DRWS", school: "mind", tier: 1, mp: 4,
    kind: "status", target: "enemy", classes: ["mage", "bard"], learnLevel: { mage: 2, bard: 3 },
    desc: "One enemy may nod off for a few turns.",
    effect: { sleep: 3, chance: 0.7 }
  }),
  confuse: S({
    id: "confuse", name: "Confuse", code: "CONF", school: "mind", tier: 2, mp: 6,
    kind: "status", target: "enemy", classes: ["mage"], learnLevel: { mage: 6 },
    desc: "A foe may strike its own side, or simply stand bewildered.",
    effect: { confuse: 3, chance: 0.6 }
  }),
  fright: S({
    id: "fright", name: "Fright", code: "FRGT", school: "mind", tier: 3, mp: 8,
    kind: "status", target: "enemy", classes: ["mage", "bard"], learnLevel: { mage: 8, bard: 9 },
    desc: "A foe may lose heart and flee the fight.",
    effect: { flee: true, chance: 0.55 }
  }),
  masssleep: S({
    id: "masssleep", name: "Mass Drowse", code: "MDRW", school: "mind", tier: 4, mp: 14,
    kind: "status", target: "all-enemies", classes: ["mage"], learnLevel: { mage: 12 },
    desc: "A lullaby of magic rolls over the enemy line.",
    effect: { sleep: 3, chance: 0.5 }
  }),

  // —— LIGHT / UTILITY ——
  light: S({
    id: "light", name: "Light", code: "LGHT", school: "light", tier: 1, mp: 2,
    kind: "utility", target: "world", classes: ["mage", "cleric", "paladin", "bard"],
    learnLevel: { mage: 1, cleric: 1, paladin: 3, bard: 2 },
    desc: "Kindles a soft wandering glow for many steps.",
    effect: { light: 80 }
  }),
  lantern: S({
    id: "lantern", name: "Lantern", code: "LANT", school: "light", tier: 2, mp: 5,
    kind: "utility", target: "world", classes: ["mage", "cleric"],
    learnLevel: { mage: 4, cleric: 5 },
    desc: "A long-burning magical lantern.",
    effect: { light: 220 }
  }),
  holylight: S({
    id: "holylight", name: "Holy Light", code: "HLYL", school: "divine", tier: 1, mp: 3,
    kind: "attack", target: "enemy", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 1, paladin: 3 },
    desc: "A clean radiance. Especially bright to restless shades.",
    effect: { damage: [4, 8], elem: "holy", vsUndead: 1.7, light: 20 }
  }),
  detectsecret: S({
    id: "detectsecret", name: "Detect Secret", code: "DSEC", school: "utility", tier: 2, mp: 5,
    kind: "utility", target: "world", classes: ["mage", "rogue", "bard"],
    learnLevel: { mage: 3, rogue: 5, bard: 6 },
    desc: "Reveals hidden doors near the party.",
    effect: { detectSecret: 8 }
  }),
  unlock: S({
    id: "unlock", name: "Unlock", code: "UNLK", school: "utility", tier: 2, mp: 5,
    kind: "utility", target: "world", classes: ["mage", "rogue"],
    learnLevel: { mage: 3, rogue: 4 },
    desc: "Opens a locked door or chest in front of you.",
    effect: { unlock: true }
  }),
  levitate: S({
    id: "levitate", name: "Levitate", code: "LEVT", school: "utility", tier: 3, mp: 8,
    kind: "utility", target: "world", classes: ["mage"],
    learnLevel: { mage: 7 },
    desc: "The party drifts safely over pits for a while.",
    effect: { levitate: 50 }
  }),
  magicmap: S({
    id: "magicmap", name: "Magic Map", code: "MMAP", school: "utility", tier: 3, mp: 10,
    kind: "utility", target: "world", classes: ["mage", "bard"],
    learnLevel: { mage: 6, bard: 8 },
    desc: "Reveals the layout of the current floor.",
    effect: { magicMap: true }
  }),
  locate: S({
    id: "locate", name: "Locate", code: "LOCT", school: "utility", tier: 2, mp: 6,
    kind: "utility", target: "world", classes: ["mage", "cleric", "bard"],
    learnLevel: { mage: 4, cleric: 6, bard: 5 },
    desc: "A gentle tug toward the nearest stairs or quest mark.",
    effect: { locate: true }
  }),
  floorgate: S({
    id: "floorgate", name: "Floor Gate", code: "FGAT", school: "utility", tier: 3, mp: 12,
    kind: "utility", target: "world", classes: ["mage"],
    learnLevel: { mage: 9 },
    desc: "Steps the party to this floor's upward stairs.",
    effect: { floorGate: true }
  }),
  towngate: S({
    id: "towngate", name: "Town Gate", code: "TGAT", school: "utility", tier: 4, mp: 16,
    kind: "utility", target: "world", classes: ["mage", "cleric"],
    learnLevel: { mage: 11, cleric: 13 },
    desc: "Opens a door of light back to Emberhold's plaza.",
    effect: { townGate: true }
  }),
  wizardeye: S({
    id: "wizardeye", name: "Wizard Eye", code: "WEYE", school: "utility", tier: 3, mp: 8,
    kind: "utility", target: "world", classes: ["mage"],
    learnLevel: { mage: 7 },
    desc: "Marks nearby unexplored halls on the auto-map.",
    effect: { wizardEye: 10 }
  }),

  // —— SUMMON ——
  flicker: S({
    id: "flicker", name: "Summon Flicker", code: "FLKR", school: "summon", tier: 2, mp: 6,
    kind: "summon", target: "self", classes: ["mage"],
    learnLevel: { mage: 5 },
    desc: "Calls a tiny ember-wisp to fight beside you for a while.",
    effect: { summon: "flicker", rounds: 6 }
  }),
  guardian: S({
    id: "guardian", name: "Summon Guardian", code: "GRDN", school: "summon", tier: 3, mp: 12,
    kind: "summon", target: "self", classes: ["mage", "cleric"],
    learnLevel: { mage: 10, cleric: 11 },
    desc: "A stone-and-light sentinel joins the fight.",
    effect: { summon: "guardian", rounds: 6 }
  }),
  emberspirit: S({
    id: "emberspirit", name: "Ember Spirit", code: "ESPR", school: "summon", tier: 4, mp: 16,
    kind: "summon", target: "self", classes: ["mage"],
    learnLevel: { mage: 14 },
    desc: "A proud spirit of the Heartflame enters the fray.",
    effect: { summon: "emberspirit", rounds: 7 }
  }),

  // —— ARCANE BUFFS ——
  magearmor: S({
    id: "magearmor", name: "Mage Armor", code: "MARM", school: "buff", tier: 1, mp: 4,
    kind: "buff", target: "ally", classes: ["mage"],
    learnLevel: { mage: 2 },
    desc: "A shimmer of force improves one ally's armor.",
    effect: { ac: 3, duration: 12 }
  }),
  haste: S({
    id: "haste", name: "Haste", code: "HAST", school: "buff", tier: 3, mp: 8,
    kind: "buff", target: "ally", classes: ["mage", "bard"],
    learnLevel: { mage: 8, bard: 10 },
    desc: "One ally acts with startling speed.",
    effect: { haste: true, duration: 8 }
  }),
  veil: S({
    id: "veil", name: "Veil", code: "VEIL", school: "buff", tier: 3, mp: 8,
    kind: "utility", target: "world", classes: ["mage", "rogue"],
    learnLevel: { mage: 8, rogue: 9 },
    desc: "The party walks more quietly. Fewer wandering fights for a time.",
    effect: { stealth: 60 }
  }),

  // —— DIVINE HEALS / BUFFS ——
  minorheal: S({
    id: "minorheal", name: "Minor Heal", code: "MHEL", school: "divine", tier: 1, mp: 3,
    kind: "heal", target: "ally", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 1, paladin: 2 },
    desc: "Closes small wounds.",
    effect: { heal: [8, 14] }
  }),
  heal: S({
    id: "heal", name: "Heal", code: "HEAL", school: "divine", tier: 2, mp: 6,
    kind: "heal", target: "ally", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 4, paladin: 6 },
    desc: "A firm restoration.",
    effect: { heal: [18, 28] }
  }),
  greatheal: S({
    id: "greatheal", name: "Great Heal", code: "GHEL", school: "divine", tier: 3, mp: 10,
    kind: "heal", target: "ally", classes: ["cleric"],
    learnLevel: { cleric: 8 },
    desc: "Mends even grave hurts.",
    effect: { heal: [36, 52] }
  }),
  circleheal: S({
    id: "circleheal", name: "Circle Heal", code: "CHEL", school: "divine", tier: 3, mp: 12,
    kind: "heal", target: "party", classes: ["cleric"],
    learnLevel: { cleric: 9 },
    desc: "Warm light washes over the whole party.",
    effect: { heal: [12, 20] }
  }),
  restore: S({
    id: "restore", name: "Restore", code: "RSTR", school: "divine", tier: 4, mp: 16,
    kind: "heal", target: "ally", classes: ["cleric"],
    learnLevel: { cleric: 13 },
    desc: "Fully mends one companion.",
    effect: { healFull: true, cleanse: true }
  }),
  bless: S({
    id: "bless", name: "Bless", code: "BLES", school: "divine", tier: 1, mp: 3,
    kind: "buff", target: "party", classes: ["cleric", "paladin", "bard"],
    learnLevel: { cleric: 1, paladin: 2, bard: 4 },
    desc: "Steadies every weapon arm.",
    effect: { hit: 2, duration: 12 }
  }),
  protection: S({
    id: "protection", name: "Protection", code: "PROT", school: "divine", tier: 2, mp: 5,
    kind: "buff", target: "party", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 3, paladin: 5 },
    desc: "A quiet ward over the party.",
    effect: { ac: 2, duration: 12 }
  }),
  resistflame: S({
    id: "resistflame", name: "Resist Flame", code: "RFLM", school: "divine", tier: 2, mp: 5,
    kind: "buff", target: "party", classes: ["cleric", "mage"],
    learnLevel: { cleric: 4, mage: 6 },
    desc: "Skin shrugs off fire for a time.",
    effect: { resist: "fire", amount: 50, duration: 16 }
  }),
  resistfrost: S({
    id: "resistfrost", name: "Resist Frost", code: "RFRS", school: "divine", tier: 2, mp: 5,
    kind: "buff", target: "party", classes: ["cleric", "mage"],
    learnLevel: { cleric: 4, mage: 6 },
    desc: "Warmth holds against biting cold.",
    effect: { resist: "ice", amount: 50, duration: 16 }
  }),
  turnshade: S({
    id: "turnshade", name: "Turn Shade", code: "TSHA", school: "divine", tier: 2, mp: 6,
    kind: "attack", target: "all-enemies", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 3, paladin: 4 },
    desc: "A bright word that unravels restless shades.",
    effect: { damage: [8, 14], elem: "holy", vsUndead: 2.0, onlyUndead: true }
  }),
  smite: S({
    id: "smite", name: "Smite", code: "SMIT", school: "divine", tier: 3, mp: 8,
    kind: "attack", target: "enemy", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 7, paladin: 7 },
    desc: "A focused blow of sacred fire.",
    effect: { damage: [16, 26], elem: "holy" }
  }),
  cleanse: S({
    id: "cleanse", name: "Cleanse", code: "CLNS", school: "divine", tier: 2, mp: 4,
    kind: "heal", target: "ally", classes: ["cleric", "paladin"],
    learnLevel: { cleric: 3, paladin: 5 },
    desc: "Lifts poison, sleep, and similar ailments.",
    effect: { cleanse: true }
  }),
  liftcurse: S({
    id: "liftcurse", name: "Lift Curse", code: "LCUR", school: "divine", tier: 3, mp: 8,
    kind: "heal", target: "ally", classes: ["cleric"],
    learnLevel: { cleric: 7 },
    desc: "Frees a companion from a cursed item's hold.",
    effect: { liftCurse: true }
  }),
  lifeember: S({
    id: "lifeember", name: "Life Ember", code: "LIFE", school: "divine", tier: 4, mp: 14,
    kind: "heal", target: "ally", classes: ["cleric"],
    learnLevel: { cleric: 11 },
    desc: "A spark of the Heartflame stirs an unconscious friend.",
    effect: { revive: 0.4 }
  }),
  sanctuary: S({
    id: "sanctuary", name: "Sanctuary", code: "SANC", school: "divine", tier: 3, mp: 10,
    kind: "buff", target: "party", classes: ["cleric"],
    learnLevel: { cleric: 9 },
    desc: "A firm sacred shield around everyone.",
    effect: { ac: 4, duration: 8 }
  }),

  // —— TRICKERY (rogue) ——
  shadowstep: S({
    id: "shadowstep", name: "Shadowstep", code: "SHST", school: "trick", tier: 2, mp: 5,
    kind: "buff", target: "self", classes: ["rogue"],
    learnLevel: { rogue: 4 },
    desc: "The next strike is especially sharp.",
    effect: { backstab: true, duration: 3 }
  }),
  smokeveil: S({
    id: "smokeveil", name: "Smoke Veil", code: "SMKV", school: "trick", tier: 3, mp: 6,
    kind: "utility", target: "world", classes: ["rogue"],
    learnLevel: { rogue: 7 },
    desc: "A puff of shadow helps the party slip away or sneak.",
    effect: { stealth: 40, runBonus: 0.3 }
  }),

  // —— BARD SONGS (kind: song; sung in combat or while exploring) ——
  songcourage: S({
    id: "songcourage", name: "Song of Courage", code: "SCRG", school: "song", tier: 1, mp: 3,
    kind: "song", target: "party", classes: ["bard"],
    learnLevel: { bard: 1 },
    desc: "A marching tune that lifts every weapon.",
    effect: { hit: 2, damage: 2, duration: 99 },
    explore: false
  }),
  songwarding: S({
    id: "songwarding", name: "Song of Warding", code: "SWRD", school: "song", tier: 1, mp: 3,
    kind: "song", target: "party", classes: ["bard"],
    learnLevel: { bard: 1 },
    desc: "A low harmony that thickens the air like armor.",
    effect: { ac: 3, duration: 99 },
    explore: false
  }),
  songvigor: S({
    id: "songvigor", name: "Song of Vigor", code: "SVIG", school: "song", tier: 2, mp: 4,
    kind: "song", target: "party", classes: ["bard"],
    learnLevel: { bard: 3 },
    desc: "A warm refrain. The party slowly mends.",
    effect: { regen: 2, duration: 99 },
    explore: true
  }),
  songswift: S({
    id: "songswift", name: "Song of Swiftness", code: "SSWF", school: "song", tier: 3, mp: 6,
    kind: "song", target: "party", classes: ["bard"],
    learnLevel: { bard: 6 },
    desc: "Quick measures. Everyone moves a little sooner.",
    effect: { haste: true, duration: 99 },
    explore: false
  }),
  songlullaby: S({
    id: "songlullaby", name: "Lullaby", code: "LULL", school: "song", tier: 2, mp: 5,
    kind: "song", target: "all-enemies", classes: ["bard"],
    learnLevel: { bard: 4 },
    desc: "A soft air that may lull foes each round.",
    effect: { sleepChance: 0.25, duration: 99 },
    explore: false
  }),
  songreveal: S({
    id: "songreveal", name: "Song of Revelation", code: "SREV", school: "song", tier: 3, mp: 5,
    kind: "song", target: "world", classes: ["bard"],
    learnLevel: { bard: 5 },
    desc: "Notes that ring against hidden stone. Secrets and halls show themselves as you walk.",
    effect: { revealWalk: true, detectSecret: 2, duration: 80 },
    explore: true
  }),
  songember: S({
    id: "songember", name: "Song of the Ember", code: "SEMB", school: "song", tier: 3, mp: 6,
    kind: "song", target: "party", classes: ["bard"],
    learnLevel: { bard: 7 },
    desc: "An old Emberhold hymn. Fire rolls off the party, and a spark stings foes.",
    effect: { resist: "fire", amount: 40, auraDamage: [2, 4], duration: 99 },
    explore: false
  }),
  songreturn: S({
    id: "songreturn", name: "Song of Returning", code: "SRET", school: "song", tier: 4, mp: 6,
    kind: "song", target: "world", classes: ["bard"],
    learnLevel: { bard: 10 },
    desc: "A pathfinding air that eases retreat and whispers the way to stairs.",
    effect: { runBonus: 0.25, locate: true, duration: 80 },
    explore: true
  })
};

export const SPELL_LIST = Object.values(SPELLS);

export function spellById(id) {
  return SPELLS[id] || null;
}

export function spellsForClass(cls, level) {
  return SPELL_LIST.filter((s) => {
    if (!s.learnLevel || s.learnLevel[cls] == null) return false;
    return level >= s.learnLevel[cls];
  });
}

export function canLearnSpell(ch, spellId) {
  const s = SPELLS[spellId];
  if (!s) return { ok: false, reason: "Unknown spell." };
  if (ch.spells.includes(spellId)) return { ok: false, reason: "Already known." };
  if (s.learnLevel && s.learnLevel[ch.cls] != null) {
    if (ch.level >= s.learnLevel[ch.cls]) return { ok: true };
    return { ok: false, reason: `${s.name} requires ${ch.cls} level ${s.learnLevel[ch.cls]}.` };
  }
  if (s.classes && s.classes.includes(ch.cls)) {
    const minTierLevel = [1, 1, 4, 8, 12][s.tier] || 1;
    if (ch.level >= minTierLevel) return { ok: true };
    return { ok: false, reason: `${s.name} requires level ${minTierLevel}.` };
  }
  return { ok: false, reason: `${ch.name} cannot learn ${s.name}.` };
}

export function startingSpells(cls) {
  return spellsForClass(cls, 1).map((s) => s.id);
}
