/** Items, enchantments, artifacts, loot tables. */

let _uid = 1;
export function nextUid() {
  return "i" + (_uid++) + "x" + Math.floor(Math.random() * 1e6).toString(36);
}

export const WEAPON_TYPES = ["dagger", "staff", "club", "sword", "axe", "mace", "spear", "hammer", "great"];

export const ITEMS = {
  // —— Weapons ——
  dagger: { id: "dagger", name: "Dagger", kind: "weapon", wtype: "dagger", slot: "weapon", atk: 2, hands: 1, value: 12, desc: "A short, quick blade." },
  staff: { id: "staff", name: "Staff", kind: "weapon", wtype: "staff", slot: "weapon", atk: 2, hands: 2, value: 10, desc: "A traveler's walking staff." },
  club: { id: "club", name: "Club", kind: "weapon", wtype: "club", slot: "weapon", atk: 3, hands: 1, value: 8, desc: "A stout length of wood." },
  shortsword: { id: "shortsword", name: "Short Sword", kind: "weapon", wtype: "sword", slot: "weapon", atk: 4, hands: 1, value: 25, desc: "A reliable sidearm." },
  mace: { id: "mace", name: "Mace", kind: "weapon", wtype: "mace", slot: "weapon", atk: 5, hands: 1, value: 30, desc: "A flanged fighting mace." },
  spear: { id: "spear", name: "Spear", kind: "weapon", wtype: "spear", slot: "weapon", atk: 5, hands: 1, value: 28, desc: "A long reaching point." },
  longsword: { id: "longsword", name: "Long Sword", kind: "weapon", wtype: "sword", slot: "weapon", atk: 7, hands: 1, value: 60, desc: "A well-balanced knight's blade." },
  axe: { id: "axe", name: "Battle Axe", kind: "weapon", wtype: "axe", slot: "weapon", atk: 8, hands: 1, value: 70, desc: "A heavy bearded axe." },
  hammer: { id: "hammer", name: "War Hammer", kind: "weapon", wtype: "hammer", slot: "weapon", atk: 8, hands: 1, value: 75, desc: "A crushing hammer." },
  greatsword: { id: "greatsword", name: "Great Sword", kind: "weapon", wtype: "great", slot: "weapon", atk: 11, hands: 2, value: 120, desc: "A two-handed blade. Cannot be used with a shield." },

  // —— Armor ——
  robe: { id: "robe", name: "Cloth Robe", kind: "armor", atype: "cloth", slot: "armor", ac: 1, value: 8, desc: "Simple traveler's cloth." },
  leather: { id: "leather", name: "Leather Jerkin", kind: "armor", atype: "leather", slot: "armor", ac: 3, value: 25, desc: "Boiled leather, quiet and light." },
  studded: { id: "studded", name: "Studded Leather", kind: "armor", atype: "leather", slot: "armor", ac: 4, value: 45, desc: "Leather reinforced with steel rivets." },
  chain: { id: "chain", name: "Chain Mail", kind: "armor", atype: "mail", slot: "armor", ac: 6, value: 90, desc: "A shirt of interlocking rings." },
  scale: { id: "scale", name: "Scale Mail", kind: "armor", atype: "mail", slot: "armor", ac: 7, value: 130, desc: "Overlapping metal scales." },
  plate: { id: "plate", name: "Plate Armor", kind: "armor", atype: "plate", slot: "armor", ac: 10, value: 250, desc: "Full plates, heavy and proud." },

  buckler: { id: "buckler", name: "Buckler", kind: "shield", slot: "shield", ac: 1, value: 15, desc: "A small off-hand shield." },
  shield: { id: "shield", name: "Kite Shield", kind: "shield", slot: "shield", ac: 2, value: 40, desc: "A solid wooden shield, iron-rimmed." },
  towershield: { id: "towershield", name: "Tower Shield", kind: "shield", slot: "shield", ac: 3, value: 90, desc: "A tall wall of wood and steel." },

  cap: { id: "cap", name: "Leather Cap", kind: "helm", slot: "helm", ac: 1, value: 12, desc: "A simple cap." },
  helm: { id: "helm", name: "Iron Helm", kind: "helm", slot: "helm", ac: 2, value: 40, desc: "An open-faced helm." },
  gloves: { id: "gloves", name: "Leather Gloves", kind: "gloves", slot: "gloves", ac: 0, value: 10, desc: "Sturdy gloves." },
  gauntlets: { id: "gauntlets", name: "Iron Gauntlets", kind: "gloves", slot: "gloves", ac: 1, value: 35, desc: "Articulated iron hands." },
  boots: { id: "boots", name: "Travel Boots", kind: "boots", slot: "boots", ac: 0, value: 12, desc: "Worn but reliable." },
  greaves: { id: "greaves", name: "Greaves", kind: "boots", slot: "boots", ac: 1, value: 35, desc: "Armored boots." },
  cloak: { id: "cloak", name: "Wool Cloak", kind: "cloak", slot: "cloak", ac: 0, value: 15, desc: "Warm against the draughts." },
  travelcloak: { id: "travelcloak", name: "Travel Cloak", kind: "cloak", slot: "cloak", ac: 1, value: 40, desc: "A heavier, weatherproof cloak." },

  // —— Jewelry (base; enchants added at creation) ——
  copperring: { id: "copperring", name: "Copper Ring", kind: "ring", slot: "ring", value: 20, desc: "A simple copper band." },
  silverring: { id: "silverring", name: "Silver Ring", kind: "ring", slot: "ring", value: 60, desc: "A fine silver ring." },
  goldring: { id: "goldring", name: "Gold Ring", kind: "ring", slot: "ring", value: 120, desc: "A gold ring, ready to hold a charm." },
  amulet: { id: "amulet", name: "Copper Amulet", kind: "amulet", slot: "amulet", value: 25, desc: "A disc on a leather cord." },
  silveramulet: { id: "silveramulet", name: "Silver Amulet", kind: "amulet", slot: "amulet", value: 80, desc: "A silver locket." },

  // —— Consumables ——
  torch: { id: "torch", name: "Torch", kind: "consumable", use: "torch", light: 70, value: 5, stack: true, desc: "Bright for many steps in the dark." },
  bread: { id: "bread", name: "Waybread", kind: "consumable", use: "heal", heal: [6, 10], value: 4, stack: true, desc: "A dense traveler's loaf." },
  potionhp: { id: "potionhp", name: "Potion of Healing", kind: "consumable", use: "heal", heal: [22, 30], value: 30, stack: true, desc: "A red, peppery tonic." },
  potionmp: { id: "potionmp", name: "Potion of Clarity", kind: "consumable", use: "mana", mana: [16, 24], value: 35, stack: true, desc: "A blue, cooling draught." },
  potionbig: { id: "potionbig", name: "Elixir", kind: "consumable", use: "both", heal: [40, 55], mana: [30, 40], value: 90, stack: true, desc: "A rare golden cordial." },
  antidote: { id: "antidote", name: "Antidote", kind: "consumable", use: "cleanse", value: 20, stack: true, desc: "Clears poison and similar ailments." },
  identscroll: { id: "identscroll", name: "Scroll of Identify", kind: "scroll", use: "identify", value: 40, stack: true, desc: "Names an unknown item in the pack." },

  // —— Wands ——
  wandmissile: { id: "wandmissile", name: "Wand of Missiles", kind: "wand", spell: "missile", charges: 20, value: 150, desc: "Casts Magic Missile. Uses a charge, not mana." },
  wandflame: { id: "wandflame", name: "Wand of Sparks", kind: "wand", spell: "spark", charges: 18, value: 140, desc: "Casts Spark." },
  wandheal: { id: "wandheal", name: "Wand of Mending", kind: "wand", spell: "minorheal", charges: 12, value: 180, desc: "Casts Minor Heal." },
  wandunlock: { id: "wandunlock", name: "Wand of Opening", kind: "wand", spell: "unlock", charges: 8, value: 160, desc: "Casts Unlock." },
  wandlight: { id: "wandlight", name: "Wand of Light", kind: "wand", spell: "light", charges: 15, value: 110, desc: "Casts Light." },
  wandfrost: { id: "wandfrost", name: "Wand of Frost", kind: "wand", spell: "icebolt", charges: 12, value: 200, desc: "Casts Ice Bolt." },

  // —— Spellbooks (teach a spell) ——
  book_flamedart: { id: "book_flamedart", name: "Spellbook: Flame Dart", kind: "book", spell: "flamedart", value: 120, desc: "Teaches Flame Dart to a student who is ready." },
  book_fireball: { id: "book_fireball", name: "Spellbook: Fireball", kind: "book", spell: "fireball", value: 280, desc: "Teaches Fireball." },
  book_icebolt: { id: "book_icebolt", name: "Spellbook: Ice Bolt", kind: "book", spell: "icebolt", value: 120, desc: "Teaches Ice Bolt." },
  book_lightning: { id: "book_lightning", name: "Spellbook: Lightning", kind: "book", spell: "lightning", value: 160, desc: "Teaches Lightning." },
  book_missile: { id: "book_missile", name: "Spellbook: Magic Missile", kind: "book", spell: "missile", value: 80, desc: "Teaches Magic Missile." },
  book_drowse: { id: "book_drowse", name: "Spellbook: Drowse", kind: "book", spell: "drowse", value: 90, desc: "Teaches Drowse." },
  book_detect: { id: "book_detect", name: "Spellbook: Detect Secret", kind: "book", spell: "detectsecret", value: 110, desc: "Teaches Detect Secret." },
  book_unlock: { id: "book_unlock", name: "Spellbook: Unlock", kind: "book", spell: "unlock", value: 110, desc: "Teaches Unlock." },
  book_levitate: { id: "book_levitate", name: "Spellbook: Levitate", kind: "book", spell: "levitate", value: 200, desc: "Teaches Levitate." },
  book_magicmap: { id: "book_magicmap", name: "Spellbook: Magic Map", kind: "book", spell: "magicmap", value: 220, desc: "Teaches Magic Map." },
  book_locate: { id: "book_locate", name: "Spellbook: Locate", kind: "book", spell: "locate", value: 130, desc: "Teaches Locate." },
  book_floorgate: { id: "book_floorgate", name: "Spellbook: Floor Gate", kind: "book", spell: "floorgate", value: 260, desc: "Teaches Floor Gate." },
  book_towngate: { id: "book_towngate", name: "Spellbook: Town Gate", kind: "book", spell: "towngate", value: 400, desc: "Teaches Town Gate." },
  book_heal: { id: "book_heal", name: "Tome: Heal", kind: "book", spell: "heal", value: 150, desc: "Teaches Heal." },
  book_circleheal: { id: "book_circleheal", name: "Tome: Circle Heal", kind: "book", spell: "circleheal", value: 260, desc: "Teaches Circle Heal." },
  book_liftcurse: { id: "book_liftcurse", name: "Tome: Lift Curse", kind: "book", spell: "liftcurse", value: 200, desc: "Teaches Lift Curse." },
  book_lifeember: { id: "book_lifeember", name: "Tome: Life Ember", kind: "book", spell: "lifeember", value: 420, desc: "Teaches Life Ember." },
  book_haste: { id: "book_haste", name: "Spellbook: Haste", kind: "book", spell: "haste", value: 240, desc: "Teaches Haste." },
  book_light: { id: "book_light", name: "Spellbook: Light", kind: "book", spell: "light", value: 50, desc: "Teaches Light." },
  book_magearmor: { id: "book_magearmor", name: "Spellbook: Mage Armor", kind: "book", spell: "magearmor", value: 90, desc: "Teaches Mage Armor." },

  // —— Keys & quest ——
  key_bronze: { id: "key_bronze", name: "Bronze Key", kind: "key", key: "bronze", value: 0, desc: "A common bronze key." },
  key_silver: { id: "key_silver", name: "Silver Key", kind: "key", key: "silver", value: 0, desc: "A silver key, cold to the touch." },
  key_gold: { id: "key_gold", name: "Gold Key", kind: "key", key: "gold", value: 0, desc: "A gold key engraved with a flame." },
  key_crypt: { id: "key_crypt", name: "Crypt Key", kind: "key", key: "crypt", value: 0, desc: "A heavy iron key from the undercity crypts." },
  shard_spark: { id: "shard_spark", name: "The First Spark", kind: "relic", relic: "spark", value: 0, unique: true, desc: "A pebble of living ember, first of the Heartflame shards." },
  shard_living: { id: "shard_living", name: "The Living Ember", kind: "relic", relic: "living", value: 0, unique: true, desc: "A warm stone webbed with root-light." },
  shard_bell: { id: "shard_bell", name: "The Bell's Heart", kind: "relic", relic: "bell", value: 0, unique: true, desc: "A bronze clapper that still hums." },
  shard_green: { id: "shard_green", name: "The Green Flame", kind: "relic", relic: "green", value: 0, unique: true, desc: "A leaf that burns and is not consumed." },
  shard_cinder: { id: "shard_cinder", name: "The Cinder Core", kind: "relic", relic: "cinder", value: 0, unique: true, desc: "A heart of cooled, sleeping fire." },

  // —— Named artifacts (unique, always identified) ——
  art_heartblade: {
    id: "art_heartblade", name: "Heartflame Blade", kind: "weapon", wtype: "sword", slot: "weapon",
    atk: 12, plus: 3, elem: "fire", hands: 1, value: 0, unique: true, artifact: true,
    desc: "A sword whose edge holds a quiet flame. Once the hearth-guard's blade, hung above the Ironhearth."
  },
  art_lyre: {
    id: "art_lyre", name: "Lyre of Emberhold", kind: "weapon", wtype: "staff", slot: "weapon",
    atk: 4, plus: 2, hands: 1, value: 0, unique: true, artifact: true, cha: 2, mp: 8,
    desc: "An antique lyre. Songs sung with it linger."
  },
  art_lantern: {
    id: "art_lantern", name: "Warden's Lantern", kind: "amulet", slot: "amulet",
    value: 0, unique: true, artifact: true, lightCarry: true, wis: 1,
    desc: "A shut lantern that never needs a flint. The halls stay gently lit."
  },
  art_crownshard: {
    id: "art_crownshard", name: "Crownshard Amulet", kind: "amulet", slot: "amulet",
    value: 0, unique: true, artifact: true, ac: 2, resist: { holy: 20, force: 20 },
    desc: "A sliver of an old royal circlet."
  },
  art_thornmail: {
    id: "art_thornmail", name: "Briar Mail", kind: "armor", atype: "mail", slot: "armor",
    ac: 8, plus: 2, value: 0, unique: true, artifact: true, thorns: 3,
    desc: "Living vine-mail. Foes who strike it feel a sting."
  },
  art_deepboots: {
    id: "art_deepboots", name: "Boots of the Deep", kind: "boots", slot: "boots",
    ac: 1, value: 0, unique: true, artifact: true, levitateCarry: true,
    desc: "Soft grey boots. Pits hold no fear while they are worn."
  }
};

export const MYSTERY_NAMES = {
  weapon: ["a glimmering blade", "a runed weapon", "a faintly humming arm", "an old, fine weapon", "a peculiar blade"],
  armor: ["a shimmering garment", "a curiously light mail", "etched armor", "a strange jerkin", "fine, unmarked armor"],
  shield: ["a marked shield", "a gleaming shield", "an unusual shield"],
  helm: ["a curious helm", "a runed cap", "an odd helm"],
  gloves: ["odd gloves", "runed gloves", "fine gauntlets"],
  boots: ["curious boots", "light, fine boots", "marked boots"],
  cloak: ["a whispering cloak", "a cloak with a hidden clasp", "a fine, odd cloak"],
  ring: ["a peculiar ring", "a runed ring", "a humming band", "a stone-set ring"],
  amulet: ["a dusty amulet", "a sealed locket", "a carved pendant", "a warm amulet"],
  wand: ["a carved wand", "a wand of unknown wood", "a tapering rod"]
};

export const CURSES = [
  { id: "itchy", name: "Itchy", ac: -1, flavor: "It just doesn't sit right." },
  { id: "burden", name: "Burdened", dex: -2, flavor: "Heavier than it looks." },
  { id: "gloom", name: "Gloom", hit: -2, flavor: "A small, unlucky mood clings to it." },
  { id: "thirst", name: "Thirsting", mpDrain: 1, flavor: "It drinks a little mana as you walk." },
  { id: "fumble", name: "Fumbling", atk: -2, flavor: "The balance is just a bit off." }
];

export const ENCHANT_ELEMS = ["fire", "ice", "shock", "holy"];
export const ENCHANT_STAT = ["str", "int", "dex", "con", "wis", "cha"];

export function template(id) {
  return ITEMS[id] || null;
}

export function makeItem(tid, opts = {}, rng = Math.random) {
  const t = ITEMS[tid];
  if (!t) throw new Error("Unknown item " + tid);
  const item = {
    uid: nextUid(),
    tid,
    identified: opts.identified ?? true,
    cursed: !!(opts.cursed),
    curseId: opts.curseId || (opts.cursed ? CURSES[Math.floor(rng() * CURSES.length)].id : null),
    plus: opts.plus ?? t.plus ?? 0,
    elem: opts.elem ?? t.elem ?? null,
    charges: opts.charges ?? t.charges ?? null,
    qty: opts.qty ?? 1,
    stuck: false,
    bonus: opts.bonus ? { ...opts.bonus } : (t.str || t.int || t.dex || t.con || t.wis || t.cha || t.hp || t.mp || t.ac || t.resist || t.hit ? pickInnateBonus(t) : null)
  };
  if (opts.resist) item.resist = { ...opts.resist };
  else if (t.resist) item.resist = { ...t.resist };
  if (opts.hit != null) item.hit = opts.hit;
  if (t.unique || t.artifact) {
    item.identified = true;
    item.cursed = false;
    item.curseId = null;
  }
  return item;
}

function pickInnateBonus(t) {
  const b = {};
  for (const s of ["str", "int", "dex", "con", "wis", "cha", "hp", "mp", "ac", "hit", "lightCarry", "levitateCarry", "thorns"]) {
    if (t[s] != null) b[s] = t[s];
  }
  return Object.keys(b).length ? b : null;
}

export function applyRandomEnchant(item, rng, power = 1) {
  if (ITEMS[item.tid]?.unique) return item;
  const roll = rng();
  if (roll < 0.45 * power) item.plus = Math.min(5, (item.plus || 0) + 1 + (rng() < 0.25 * power ? 1 : 0) + (rng() < 0.08 * power ? 1 : 0));
  if (rng() < 0.18 * power && ITEMS[item.tid]?.kind === "weapon") {
    item.elem = ENCHANT_ELEMS[Math.floor(rng() * ENCHANT_ELEMS.length)];
  }
  if (rng() < 0.2 * power) {
    item.bonus = item.bonus || {};
    const s = ENCHANT_STAT[Math.floor(rng() * ENCHANT_STAT.length)];
    item.bonus[s] = (item.bonus[s] || 0) + 1;
  }
  if (rng() < 0.08 * power) {
    item.resist = item.resist || {};
    const e = ENCHANT_ELEMS[Math.floor(rng() * ENCHANT_ELEMS.length)];
    item.resist[e] = (item.resist[e] || 0) + 15 + Math.floor(rng() * 15);
  }
  if (rng() < 0.08 * power) item.cursed = true, item.curseId = CURSES[Math.floor(rng() * CURSES.length)].id;
  if (item.plus || item.elem || item.bonus || item.resist || item.cursed) item.identified = false;
  return item;
}

export function mysteryName(item, rng = Math.random) {
  const kind = ITEMS[item.tid]?.kind || ITEMS[item.tid]?.slot || "weapon";
  const list = MYSTERY_NAMES[kind] || MYSTERY_NAMES.weapon;
  const i = Math.abs(hashUid(item.uid)) % list.length;
  return list[i];
}

function hashUid(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function curseById(id) {
  return CURSES.find((c) => c.id === id) || null;
}

export function itemDisplayName(item) {
  const t = ITEMS[item.tid];
  if (!t) return "unknown item";
  if (!item.identified && !t.unique) return mysteryName(item);
  if (t.unique || t.artifact) return t.name;
  if (t.kind === "consumable" || t.kind === "scroll" || t.kind === "book" || t.kind === "key" || t.kind === "relic") {
    return item.qty > 1 ? `${t.name} (${item.qty})` : t.name;
  }
  let n = t.name;
  if (item.elem) {
    const adj = { fire: "Flaming", ice: "Frost", shock: "Storm", holy: "Radiant" }[item.elem];
    n = `${adj} ${n}`;
  }
  if (item.plus) n = `${n} +${item.plus}`;
  if (item.bonus) {
    for (const s of ["str", "int", "dex", "con", "wis", "cha"]) {
      if (item.bonus[s]) n = `${n} of ${{ str: "Strength", int: "Intellect", dex: "Grace", con: "Vitality", wis: "Wisdom", cha: "Charm" }[s]}`;
    }
  }
  if (item.identified && item.cursed) n = `${n} (cursed)`;
  if (item.charges != null && (t.kind === "wand")) n = `${n} [${item.charges}]`;
  if (item.qty > 1) n = `${n} (${item.qty})`;
  return n;
}

export function itemStats(item) {
  const t = ITEMS[item.tid];
  if (!t) return { atk: 0, ac: 0 };
  const curse = item.cursed && item.identified !== false ? curseById(item.curseId) : (item.cursed ? curseById(item.curseId) : null);
  // When unidentified, bonuses still apply if equipped, but UI hides them. Combat uses real stats.
  const realCurse = item.cursed ? curseById(item.curseId) : null;
  const st = {
    atk: (t.atk || 0) + (item.plus || 0) + (item.bonus?.atk || 0) + (realCurse?.atk || 0),
    ac: (t.ac || 0) + (item.plus && (t.kind === "armor" || t.kind === "shield" || t.kind === "helm" || t.kind === "gloves" || t.kind === "boots" || t.kind === "cloak" || t.slot === "amulet") ? item.plus : 0) + (item.bonus?.ac || 0) + (realCurse?.ac || 0),
    hit: (item.hit || 0) + (item.bonus?.hit || 0) + (realCurse?.hit || 0) + (item.plus && t.kind === "weapon" ? item.plus : 0),
    elem: item.elem || t.elem || null,
    hands: t.hands || 1,
    resist: { ...(t.resist || {}), ...(item.resist || {}) },
    stats: {},
    lightCarry: !!(t.lightCarry || item.bonus?.lightCarry),
    levitateCarry: !!(t.levitateCarry || item.bonus?.levitateCarry),
    thorns: (t.thorns || 0) + (item.bonus?.thorns || 0),
    cursed: !!item.cursed,
    curse: realCurse,
    mpDrain: realCurse?.mpDrain || 0
  };
  for (const s of ["str", "int", "dex", "con", "wis", "cha", "hp", "mp"]) {
    const v = (t[s] || 0) + (item.bonus?.[s] || 0) + (realCurse?.[s] || 0);
    if (v) st.stats[s] = v;
  }
  return st;
}

export function compareItems(current, candidate) {
  const a = current ? itemStats(current) : { atk: 0, ac: 0, hit: 0, stats: {}, resist: {}, elem: null };
  const b = candidate ? itemStats(candidate) : { atk: 0, ac: 0, hit: 0, stats: {}, resist: {}, elem: null };
  const rows = [];
  const add = (label, av, bv) => {
    if ((av || 0) === 0 && (bv || 0) === 0) return;
    rows.push({ label, a: av || 0, b: bv || 0, diff: (bv || 0) - (av || 0) });
  };
  add("Attack", a.atk, b.atk);
  add("Armor", a.ac, b.ac);
  add("Hit", a.hit, b.hit);
  for (const s of ["str", "int", "dex", "con", "wis", "cha", "hp", "mp"]) {
    add(s.toUpperCase(), a.stats[s], b.stats[s]);
  }
  return rows;
}

export const STARTING_GEAR = {
  warrior: { weapon: "longsword", shield: "shield", armor: "chain", helm: "cap", boots: "boots" },
  paladin: { weapon: "mace", shield: "shield", armor: "chain", boots: "boots" },
  rogue: { weapon: "shortsword", armor: "leather", boots: "boots", gloves: "gloves" },
  bard: { weapon: "shortsword", armor: "leather", cloak: "cloak", boots: "boots" },
  mage: { weapon: "staff", armor: "robe", cloak: "cloak" },
  cleric: { weapon: "mace", shield: "buckler", armor: "leather", boots: "boots" }
};

export const SHOP_ARMS = [
  "dagger", "staff", "club", "shortsword", "mace", "spear", "longsword", "axe", "hammer", "greatsword",
  "robe", "leather", "studded", "chain", "scale", "plate",
  "buckler", "shield", "towershield", "cap", "helm", "gloves", "gauntlets", "boots", "greaves", "cloak", "travelcloak",
  "torch", "bread", "potionhp", "antidote"
];

export const SHOP_MAGE = [
  "potionmp", "potionhp", "potionbig", "identscroll", "torch",
  "wandlight", "wandmissile", "wandheal", "wandunlock",
  "book_light", "book_missile", "book_magearmor", "book_drowse", "book_detect", "book_unlock",
  "book_flamedart", "book_icebolt", "book_lightning", "book_heal", "book_locate",
  "book_levitate", "book_magicmap", "book_haste", "book_fireball", "book_circleheal",
  "book_liftcurse", "book_floorgate", "book_towngate", "book_lifeember",
  "copperring", "silverring", "amulet"
];

export const LOOT = {
  "crypt-minor": { gold: [8, 24], table: [
    { tid: "potionhp", w: 3 }, { tid: "torch", w: 3 }, { tid: "identscroll", w: 1 },
    { tid: "shortsword", w: 1, enchant: 0.5 }, { tid: "leather", w: 1, enchant: 0.4 },
    { tid: "copperring", w: 1, enchant: 0.8 }, { tid: "bread", w: 2 }
  ]},
  "crypt-major": { gold: [30, 70], table: [
    { tid: "potionhp", w: 2 }, { tid: "potionmp", w: 2 }, { tid: "longsword", w: 1, enchant: 0.7 },
    { tid: "chain", w: 1, enchant: 0.6 }, { tid: "silverring", w: 1, enchant: 1 },
    { tid: "wandlight", w: 1 }, { tid: "book_detect", w: 1 }, { tid: "key_bronze", w: 1 }
  ]},
  "cave-minor": { gold: [10, 28], table: [
    { tid: "potionhp", w: 3 }, { tid: "antidote", w: 2 }, { tid: "studded", w: 1, enchant: 0.5 },
    { tid: "spear", w: 1, enchant: 0.5 }, { tid: "amulet", w: 1, enchant: 0.7 }
  ]},
  "cave-major": { gold: [40, 90], table: [
    { tid: "potionbig", w: 1 }, { tid: "wandunlock", w: 1 }, { tid: "scale", w: 1, enchant: 0.6 },
    { tid: "book_levitate", w: 1 }, { tid: "goldring", w: 1, enchant: 1 }, { tid: "key_silver", w: 1 }
  ]},
  "water-minor": { gold: [12, 32], table: [
    { tid: "potionmp", w: 2 }, { tid: "wandfrost", w: 1 }, { tid: "mace", w: 1, enchant: 0.6 },
    { tid: "cloak", w: 1, enchant: 0.7 }
  ]},
  "water-major": { gold: [50, 100], table: [
    { tid: "book_magicmap", w: 1 }, { tid: "silveramulet", w: 1, enchant: 1 },
    { tid: "art_deepboots", w: 1, unique: true }, { tid: "potionbig", w: 2 }
  ]},
  "wood-minor": { gold: [14, 36], table: [
    { tid: "potionhp", w: 2 }, { tid: "antidote", w: 2 }, { tid: "axe", w: 1, enchant: 0.6 },
    { tid: "travelcloak", w: 1, enchant: 0.6 }
  ]},
  "wood-major": { gold: [60, 120], table: [
    { tid: "art_thornmail", w: 1, unique: true }, { tid: "book_haste", w: 1 },
    { tid: "goldring", w: 1, enchant: 1 }, { tid: "key_gold", w: 1 }
  ]},
  "fire-minor": { gold: [16, 40], table: [
    { tid: "potionhp", w: 2 }, { tid: "potionmp", w: 2 }, { tid: "hammer", w: 1, enchant: 0.7 },
    { tid: "helm", w: 1, enchant: 0.6 }
  ]},
  "fire-major": { gold: [80, 150], table: [
    { tid: "art_heartblade", w: 1, unique: true }, { tid: "book_fireball", w: 1 },
    { tid: "plate", w: 1, enchant: 0.8 }, { tid: "wandflame", w: 1 }
  ]},
  "crown-minor": { gold: [20, 50], table: [
    { tid: "potionbig", w: 2 }, { tid: "identscroll", w: 2 }, { tid: "greatsword", w: 1, enchant: 0.8 },
    { tid: "goldring", w: 1, enchant: 1 }
  ]},
  "crown-major": { gold: [120, 220], table: [
    { tid: "art_crownshard", w: 1, unique: true }, { tid: "art_lantern", w: 1, unique: true },
    { tid: "book_towngate", w: 1 }, { tid: "book_lifeember", w: 1 }
  ]},
  "overworld": { gold: [6, 20], table: [
    { tid: "bread", w: 3 }, { tid: "torch", w: 2 }, { tid: "potionhp", w: 2 },
    { tid: "shortsword", w: 1, enchant: 0.3 }, { tid: "copperring", w: 1, enchant: 0.5 }
  ]}
};

export function rollLoot(tableId, rng, alreadyUnique = new Set()) {
  const def = LOOT[tableId] || LOOT["overworld"];
  const gold = def.gold[0] + Math.floor(rng() * (def.gold[1] - def.gold[0] + 1));
  const items = [];
  const picks = 1 + (rng() < 0.45 ? 1 : 0) + (rng() < 0.15 ? 1 : 0);
  const tab = def.table;
  for (let n = 0; n < picks; n++) {
    const total = tab.reduce((s, r) => s + r.w, 0);
    let r = rng() * total;
    let row = tab[0];
    for (const x of tab) {
      r -= x.w;
      if (r <= 0) { row = x; break; }
    }
    if (row.unique && alreadyUnique.has(row.tid)) continue;
    if (ITEMS[row.tid]?.unique && alreadyUnique.has(row.tid)) continue;
    const it = makeItem(row.tid, { identified: !!ITEMS[row.tid]?.unique, qty: 1 }, rng);
    if (row.enchant) applyRandomEnchant(it, rng, row.enchant);
    if (ITEMS[row.tid]?.unique) alreadyUnique.add(row.tid);
    items.push(it);
  }
  return { gold, items };
}

export function canEquip(ch, item) {
  const t = ITEMS[item.tid];
  if (!t || !t.slot) return { ok: false, reason: "That cannot be equipped." };
  // imported here logically - caller passes class def
  return { ok: true, slot: t.slot === "ring" ? "ring1" : t.slot };
}
