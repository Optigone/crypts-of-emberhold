/** Character classes for Crypts of Emberhold. */

export const STATS = ["str", "int", "dex", "con", "wis", "cha"];

export const STAT_LABEL = {
  str: "Strength",
  int: "Intelligence",
  dex: "Dexterity",
  con: "Constitution",
  wis: "Wisdom",
  cha: "Charm"
};

export const SLOTS = [
  "weapon", "shield", "armor", "helm", "gloves", "boots", "cloak", "ring1", "ring2", "amulet"
];

export const SLOT_LABEL = {
  weapon: "Weapon",
  shield: "Shield",
  armor: "Armor",
  helm: "Helm",
  gloves: "Gloves",
  boots: "Boots",
  cloak: "Cloak",
  ring1: "Ring",
  ring2: "Ring",
  amulet: "Amulet"
};

export const CLASSES = {
  warrior: {
    id: "warrior",
    name: "Warrior",
    title: "Warrior",
    desc: "A sturdy fighter who can wear any armor and swing the heaviest weapons. No spells, but unmatched in a melee.",
    color: "#b5523a",
    bases: { str: 16, int: 8, dex: 12, con: 15, wis: 9, cha: 10 },
    swing: { str: 3, int: 1, dex: 2, con: 3, wis: 1, cha: 1 },
    hp: 12,
    mp: 0,
    hpPer: 6,
    mpPer: 0,
    hitBonus: 1,
    armor: ["cloth", "leather", "mail", "plate"],
    weapons: ["dagger", "staff", "club", "sword", "axe", "mace", "spear", "hammer", "great"],
    shield: true,
    caster: false,
    schools: [],
    songs: false,
    skills: { melee: 1, lockpick: 0, search: 0, lore: 0 }
  },
  paladin: {
    id: "paladin",
    name: "Paladin",
    title: "Paladin",
    desc: "A sworn guardian. Strong in battle, and able to learn a few sacred spells as they grow.",
    color: "#d4c06a",
    bases: { str: 14, int: 9, dex: 10, con: 14, wis: 13, cha: 13 },
    swing: { str: 2, int: 1, dex: 1, con: 2, wis: 2, cha: 2 },
    hp: 10,
    mp: 3,
    hpPer: 5,
    mpPer: 2,
    hitBonus: 0,
    armor: ["cloth", "leather", "mail", "plate"],
    weapons: ["dagger", "staff", "club", "sword", "mace", "spear", "hammer"],
    shield: true,
    caster: true,
    schools: ["divine"],
    songs: false,
    skills: { melee: 1, lockpick: 0, search: 0, lore: 0 }
  },
  rogue: {
    id: "rogue",
    name: "Rogue",
    title: "Rogue",
    desc: "Quick hands and quicker eyes. Finds secret doors, disarms traps, picks locks, and strikes first.",
    color: "#6a8a4e",
    bases: { str: 11, int: 11, dex: 16, con: 11, wis: 10, cha: 12 },
    swing: { str: 1, int: 2, dex: 3, con: 1, wis: 1, cha: 2 },
    hp: 8,
    mp: 2,
    hpPer: 4,
    mpPer: 1,
    hitBonus: 0,
    armor: ["cloth", "leather"],
    weapons: ["dagger", "staff", "club", "sword", "spear"],
    shield: false,
    caster: true,
    schools: ["trick"],
    songs: false,
    skills: { melee: 0, lockpick: 1, search: 1, lore: 0 }
  },
  bard: {
    id: "bard",
    name: "Bard",
    title: "Bard",
    desc: "A traveler with a lyre and a sharp memory. Songs bolster the party, and lore can hint at a mystery item's nature.",
    color: "#c47ab0",
    bases: { str: 10, int: 12, dex: 13, con: 10, wis: 11, cha: 16 },
    swing: { str: 1, int: 2, dex: 2, con: 1, wis: 1, cha: 3 },
    hp: 7,
    mp: 4,
    hpPer: 3,
    mpPer: 3,
    hitBonus: 0,
    armor: ["cloth", "leather", "mail"],
    weapons: ["dagger", "staff", "club", "sword", "spear"],
    shield: false,
    caster: true,
    schools: ["song", "arcane"],
    songs: true,
    skills: { melee: 0, lockpick: 0, search: 0, lore: 1 }
  },
  mage: {
    id: "mage",
    name: "Mage",
    title: "Mage",
    desc: "A student of the eight sparks of magic. Fragile in a fight, but the one who turns a battle — and a dungeon — around.",
    color: "#5b7ec4",
    bases: { str: 8, int: 16, dex: 12, con: 8, wis: 13, cha: 11 },
    swing: { str: 1, int: 3, dex: 2, con: 1, wis: 2, cha: 1 },
    hp: 5,
    mp: 8,
    hpPer: 2,
    mpPer: 5,
    hitBonus: 0,
    armor: ["cloth"],
    weapons: ["dagger", "staff"],
    shield: false,
    caster: true,
    schools: ["arcane"],
    songs: false,
    skills: { melee: 0, lockpick: 0, search: 0, lore: 1 }
  },
  cleric: {
    id: "cleric",
    name: "Cleric",
    title: "Cleric",
    desc: "A keeper of the ember-rites. Heals, blesses, and stands firm against restless shades.",
    color: "#e8d5b0",
    bases: { str: 11, int: 10, dex: 10, con: 12, wis: 16, cha: 13 },
    swing: { str: 1, int: 1, dex: 1, con: 2, wis: 3, cha: 2 },
    hp: 8,
    mp: 6,
    hpPer: 4,
    mpPer: 4,
    hitBonus: 0,
    armor: ["cloth", "leather", "mail"],
    weapons: ["dagger", "staff", "club", "mace", "hammer"],
    shield: true,
    caster: true,
    schools: ["divine"],
    songs: false,
    skills: { melee: 0, lockpick: 0, search: 0, lore: 0 }
  }
};

export const CLASS_ORDER = ["warrior", "paladin", "rogue", "bard", "mage", "cleric"];

export const XP_TABLE = [
  0, 0, 120, 350, 700, 1200, 1900, 2900, 4300, 6200, 8700,
  12000, 16200, 21500, 28000, 36000, 46000, 58000, 73000, 91000, 113000
];

export const LEVEL_CAP = 20;

export function xpForLevel(level) {
  if (level <= 1) return 0;
  if (level >= XP_TABLE.length) return XP_TABLE[XP_TABLE.length - 1] + (level - 20) * 25000;
  return XP_TABLE[level];
}

export function statMod(score) {
  return Math.floor((score - 10) / 2);
}

export function rollClassStats(cls, rng) {
  const def = CLASSES[cls];
  const stats = {};
  for (const s of STATS) {
    const swing = def.swing[s];
    const delta = Math.floor(rng() * (swing * 2 + 1)) - swing;
    stats[s] = Math.max(6, Math.min(18, def.bases[s] + delta));
  }
  return stats;
}

export function maxHpFor(cls, level, con) {
  const def = CLASSES[cls];
  const bonus = statMod(con);
  return Math.max(1, def.hp + bonus + (level - 1) * (def.hpPer + Math.max(0, bonus)));
}

export function maxMpFor(cls, level, intel, wis, cha) {
  const def = CLASSES[cls];
  if (def.mp === 0 && def.mpPer === 0) return 0;
  let drive = intel;
  if (cls === "cleric" || cls === "paladin") drive = wis;
  if (cls === "bard") drive = cha;
  const bonus = statMod(drive);
  return Math.max(0, def.mp + bonus + (level - 1) * (def.mpPer + Math.max(0, Math.floor(bonus / 2))));
}

export const QUICK_PARTY = [
  { name: "Rowan", cls: "warrior" },
  { name: "Miriam", cls: "paladin" },
  { name: "Tess", cls: "rogue" },
  { name: "Cadence", cls: "bard" },
  { name: "Aldric", cls: "mage" },
  { name: "Bramble", cls: "cleric" }
];
