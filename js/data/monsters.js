/** Monsters, bosses, and summons. Art is drawn in render.js by `art` id. Teen-friendly: no gore. */

export const MONSTERS = {
  // —— Crypts ——
  crypt_rat: {
    id: "crypt_rat", name: "Crypt Rat", art: "rat", theme: "crypt",
    hp: 8, ac: 3, atk: 3, hit: 1, xp: 6, gold: [0, 3],
    skills: {}, resists: {}, tags: ["beast"], loot: null,
    desc: "A bold, overgrown rat."
  },
  skeleton: {
    id: "skeleton", name: "Skeleton", art: "skeleton", theme: "crypt",
    hp: 16, ac: 5, atk: 5, hit: 2, xp: 14, gold: [1, 8],
    skills: {}, resists: { holy: -30, shock: -10, ice: 20 }, tags: ["undead"],
    desc: "Old bones in a rusted helm, held together by stubborn magic."
  },
  bone_guard: {
    id: "bone_guard", name: "Restless Guard", art: "skeleton_helm", theme: "crypt",
    hp: 24, ac: 8, atk: 7, hit: 3, xp: 24, gold: [4, 14],
    skills: { parry: 0.2 }, resists: { holy: -30, ice: 20 }, tags: ["undead"],
    desc: "A taller skeleton in a dented breastplate."
  },
  shade: {
    id: "shade", name: "Shade", art: "shade", theme: "crypt",
    hp: 18, ac: 6, atk: 6, hit: 2, xp: 20, gold: [0, 6],
    skills: { drain: 0.2 }, resists: { holy: -40, force: 20, fire: 10 }, tags: ["undead", "shadow"],
    desc: "A cloaked figure of soft violet dusk."
  },
  crypt_warden: {
    id: "crypt_warden", name: "The Crypt Warden", art: "warden", theme: "crypt",
    hp: 90, ac: 10, atk: 12, hit: 5, xp: 160, gold: [40, 80],
    skills: { smash: 0.25, call: "skeleton" }, resists: { holy: -20, ice: 20 }, tags: ["undead", "boss"],
    boss: true, relic: "shard_spark", loot: "crypt-major",
    desc: "Warden of the first vault, a tall knight of bone and iron."
  },

  // —— Mossdeep ——
  cave_bat: {
    id: "cave_bat", name: "Cave Bat", art: "bat", theme: "cave",
    hp: 10, ac: 6, atk: 4, hit: 3, xp: 8, gold: [0, 2],
    skills: { swift: true }, resists: {}, tags: ["beast"],
    desc: "A flapping cave bat, more startle than threat."
  },
  green_slime: {
    id: "green_slime", name: "Green Slime", art: "slime", theme: "cave",
    hp: 20, ac: 3, atk: 5, hit: 1, xp: 14, gold: [0, 4],
    skills: { spit: 0.2 }, resists: { shock: 40, force: -20 }, tags: ["ooze"],
    desc: "A wobbling green pudding with a cheerful bubble."
  },
  cave_beetle: {
    id: "cave_beetle", name: "Cave Beetle", art: "beetle", theme: "cave",
    hp: 22, ac: 9, atk: 6, hit: 2, xp: 16, gold: [1, 6],
    skills: {}, resists: { fire: 10 }, tags: ["beast"],
    desc: "A beetle the size of a helm, with a polished shell."
  },
  sporecap: {
    id: "sporecap", name: "Sporecap", art: "mushroom", theme: "cave",
    hp: 16, ac: 4, atk: 4, hit: 1, xp: 15, gold: [0, 5],
    skills: { poison: 0.25 }, resists: { ice: -20 }, tags: ["plant"],
    desc: "A walking mushroom that puffs sleepy spores."
  },
  grotto_spider: {
    id: "grotto_spider", name: "Grotto Spider", art: "spider", theme: "cave",
    hp: 26, ac: 7, atk: 8, hit: 4, xp: 22, gold: [2, 8],
    skills: { poison: 0.2, web: 0.15 }, resists: {}, tags: ["beast"],
    desc: "A big cave spider. Its eyes are like little lanterns."
  },
  grotto_queen: {
    id: "grotto_queen", name: "The Grotto Queen", art: "queen_spider", theme: "cave",
    hp: 120, ac: 11, atk: 13, hit: 6, xp: 220, gold: [60, 110],
    skills: { poison: 0.3, call: "grotto_spider", web: 0.2 }, resists: {}, tags: ["beast", "boss"],
    boss: true, relic: "shard_living", loot: "cave-major",
    desc: "A great, jewel-backed spider who rules the lower caves."
  },

  // —— Sunken Watchtower ——
  bog_frog: {
    id: "bog_frog", name: "Bog Frog", art: "frog", theme: "water",
    hp: 14, ac: 5, atk: 5, hit: 2, xp: 12, gold: [0, 4],
    skills: { tongue: 0.2 }, resists: { fire: 20, shock: -20 }, tags: ["beast"],
    desc: "A frog the size of a dog, with a booming croak."
  },
  rust_crab: {
    id: "rust_crab", name: "Rust Crab", art: "crab", theme: "water",
    hp: 28, ac: 11, atk: 8, hit: 2, xp: 22, gold: [3, 12],
    skills: {}, resists: { fire: 20, shock: -30 }, tags: ["beast"],
    desc: "A crab in a shell like old iron."
  },
  drowned: {
    id: "drowned", name: "Drowned Watch", art: "drowned", theme: "water",
    hp: 30, ac: 7, atk: 9, hit: 3, xp: 28, gold: [4, 14],
    skills: {}, resists: { fire: 20, shock: -20, holy: -20 }, tags: ["undead"],
    desc: "A soaked, silent watchman still making his rounds."
  },
  bell_haunt: {
    id: "bell_haunt", name: "Bell Haunt", art: "bellwisp", theme: "water",
    hp: 24, ac: 8, atk: 7, hit: 4, xp: 26, gold: [0, 8],
    skills: { ring: 0.25 }, resists: { force: 20, holy: -20 }, tags: ["shadow"],
    desc: "A pale wisp that tolls like a far-off bell."
  },
  bellwight: {
    id: "bellwight", name: "The Bellwight", art: "bellwight", theme: "water",
    hp: 140, ac: 12, atk: 14, hit: 6, xp: 260, gold: [70, 130],
    skills: { ring: 0.3, call: "bell_haunt" }, resists: { fire: 20, shock: -20, holy: -15 }, tags: ["undead", "boss"],
    boss: true, relic: "shard_bell", loot: "water-major",
    desc: "The last keeper of the sunken bell, wrapped in drowned banners."
  },

  // —— Thornwood ——
  wolf: {
    id: "wolf", name: "Grey Wolf", art: "wolf", theme: "wood",
    hp: 20, ac: 6, atk: 8, hit: 4, xp: 16, gold: [0, 3],
    skills: { pack: true }, resists: {}, tags: ["beast"],
    desc: "A lean forest wolf."
  },
  briar_sprite: {
    id: "briar_sprite", name: "Briar Sprite", art: "sprite", theme: "wood",
    hp: 16, ac: 9, atk: 6, hit: 5, xp: 18, gold: [2, 10],
    skills: { drowse: 0.15 }, resists: { fire: -20 }, tags: ["fey"],
    desc: "A tiny twig-person with leaf-bright eyes."
  },
  vinewhip: {
    id: "vinewhip", name: "Vine Whip", art: "vine", theme: "wood",
    hp: 32, ac: 5, atk: 9, hit: 3, xp: 24, gold: [0, 6],
    skills: { tangle: 0.25 }, resists: { fire: -30, shock: 20 }, tags: ["plant"],
    desc: "A knot of walking brambles."
  },
  owlbeast: {
    id: "owlbeast", name: "Owlbeast", art: "owlbeast", theme: "wood",
    hp: 36, ac: 8, atk: 11, hit: 5, xp: 32, gold: [4, 12],
    skills: {}, resists: {}, tags: ["beast"],
    desc: "A solemn, broad-winged forest guardian."
  },
  briar_hag: {
    id: "briar_hag", name: "The Briar Hag", art: "hag", theme: "wood",
    hp: 155, ac: 13, atk: 15, hit: 7, xp: 300, gold: [80, 150],
    skills: { tangle: 0.3, call: "briar_sprite", poison: 0.2 }, resists: { fire: -20 }, tags: ["fey", "boss"],
    boss: true, relic: "shard_green", loot: "wood-major",
    desc: "An old forest-woman in a cloak of roses and thorns. Stern, not cruel."
  },

  // —— Emberforge ——
  fire_imp: {
    id: "fire_imp", name: "Fire Imp", art: "imp", theme: "fire",
    hp: 18, ac: 7, atk: 8, hit: 4, xp: 20, gold: [2, 10],
    skills: { spark: 0.3 }, resists: { fire: 70, ice: -30 }, tags: ["elemental"],
    desc: "A small, grinning cinder with little horns."
  },
  cinder_bat: {
    id: "cinder_bat", name: "Cinder Bat", art: "cinderbat", theme: "fire",
    hp: 16, ac: 8, atk: 7, hit: 5, xp: 18, gold: [0, 6],
    skills: { swift: true }, resists: { fire: 50, ice: -20 }, tags: ["elemental", "beast"],
    desc: "A bat of soot and sparks."
  },
  ash_golem: {
    id: "ash_golem", name: "Ash Golem", art: "golem", theme: "fire",
    hp: 50, ac: 12, atk: 12, hit: 3, xp: 40, gold: [6, 16],
    skills: { smash: 0.2 }, resists: { fire: 40, shock: 20, force: -20 }, tags: ["construct"],
    desc: "A hulking figure of packed ash and kiln-brick."
  },
  magma_bug: {
    id: "magma_bug", name: "Magma Bug", art: "magmabug", theme: "fire",
    hp: 28, ac: 10, atk: 10, hit: 3, xp: 28, gold: [3, 12],
    skills: { spark: 0.2 }, resists: { fire: 60, ice: -30 }, tags: ["elemental"],
    desc: "A beetle with a belly like a little stove."
  },
  cinder_colossus: {
    id: "cinder_colossus", name: "The Cinder Colossus", art: "colossus", theme: "fire",
    hp: 200, ac: 14, atk: 18, hit: 7, xp: 400, gold: [100, 180],
    skills: { smash: 0.3, spark: 0.3 }, resists: { fire: 70, ice: -25 }, tags: ["construct", "elemental", "boss"],
    boss: true, relic: "shard_cinder", loot: "fire-major",
    desc: "A walking furnace in the shape of a giant, kind-eyed and terrible."
  },

  // —— Hollow Crown ——
  hollow_soldier: {
    id: "hollow_soldier", name: "Hollow Soldier", art: "hollow", theme: "crown",
    hp: 40, ac: 11, atk: 13, hit: 6, xp: 36, gold: [6, 16],
    skills: { parry: 0.15 }, resists: { holy: -20 }, tags: ["undead", "shadow"],
    desc: "Armor walking with no one inside, visor dark."
  },
  night_moth: {
    id: "night_moth", name: "Night Moth", art: "moth", theme: "crown",
    hp: 22, ac: 9, atk: 9, hit: 6, xp: 24, gold: [0, 8],
    skills: { drowse: 0.2 }, resists: { holy: -10 }, tags: ["beast", "shadow"],
    desc: "A moth as wide as a shield, wings like star-maps."
  },
  echo_mage: {
    id: "echo_mage", name: "Echo Mage", art: "echo", theme: "crown",
    hp: 34, ac: 8, atk: 8, hit: 4, xp: 40, gold: [10, 24],
    skills: { missile: 0.45, drowse: 0.15 }, resists: { force: 20 }, tags: ["shadow"],
    desc: "A faded caster whose spells arrive a breath late."
  },
  crown_guard: {
    id: "crown_guard", name: "Crown Guard", art: "crownguard", theme: "crown",
    hp: 55, ac: 14, atk: 15, hit: 7, xp: 50, gold: [10, 22],
    skills: { parry: 0.25, smash: 0.15 }, resists: { holy: -10, force: 10 }, tags: ["shadow"],
    desc: "A tall warden in gold-dark plate."
  },
  hollow_king: {
    id: "hollow_king", name: "The Hollow King", art: "king", theme: "crown",
    hp: 280, ac: 16, atk: 20, hit: 9, xp: 800, gold: [200, 350],
    skills: { smash: 0.25, missile: 0.25, call: "hollow_soldier", fright: 0.15 },
    resists: { holy: -15, fire: 20, force: 15 }, tags: ["shadow", "boss"],
    boss: true, loot: "crown-major", artifact: "art_lyre",
    desc: "The stolen crown sits on a king of dusk and regret. He is proud, and very tired."
  },

  // —— Overworld ——
  brigand: {
    id: "brigand", name: "Brigand", art: "brigand", theme: "overworld",
    hp: 18, ac: 6, atk: 6, hit: 2, xp: 12, gold: [4, 14],
    skills: {}, resists: {}, tags: ["human"],
    desc: "A road-thief in a patched cloak."
  },
  boar: {
    id: "boar", name: "Wild Boar", art: "boar", theme: "overworld",
    hp: 22, ac: 5, atk: 7, hit: 2, xp: 14, gold: [0, 2],
    skills: { smash: 0.2 }, resists: {}, tags: ["beast"],
    desc: "A bristly boar with little patience."
  },
  field_slime: {
    id: "field_slime", name: "Meadow Slime", art: "slime_yellow", theme: "overworld",
    hp: 12, ac: 3, atk: 4, hit: 1, xp: 8, gold: [0, 3],
    skills: {}, resists: { shock: 30 }, tags: ["ooze"],
    desc: "A sunny yellow puddle on the move."
  },

  // —— Summons (allied) ——
  flicker: {
    id: "flicker", name: "Flicker", art: "flicker", theme: "summon",
    hp: 16, ac: 8, atk: 6, hit: 4, xp: 0, gold: [0, 0],
    skills: {}, resists: { fire: 50 }, tags: ["summon", "elemental"], ally: true,
    desc: "A friendly ember-wisp."
  },
  guardian: {
    id: "guardian", name: "Guardian", art: "guardian", theme: "summon",
    hp: 40, ac: 14, atk: 10, hit: 3, xp: 0, gold: [0, 0],
    skills: { parry: 0.3 }, resists: { fire: 20 }, tags: ["summon", "construct"], ally: true,
    desc: "A squat sentinel of stone and light."
  },
  emberspirit: {
    id: "emberspirit", name: "Ember Spirit", art: "emberspirit", theme: "summon",
    hp: 50, ac: 12, atk: 14, hit: 6, xp: 0, gold: [0, 0],
    skills: { spark: 0.4 }, resists: { fire: 70 }, tags: ["summon", "elemental"], ally: true,
    desc: "A proud spirit of the Heartflame."
  }
};

export const ENCOUNTERS = {
  crypt: {
    easy: [["crypt_rat", "crypt_rat"], ["skeleton"], ["crypt_rat", "skeleton"]],
    mid: [["skeleton", "skeleton"], ["shade"], ["bone_guard"], ["skeleton", "crypt_rat", "crypt_rat"]],
    hard: [["bone_guard", "skeleton"], ["shade", "shade"], ["bone_guard", "shade"]]
  },
  cave: {
    easy: [["cave_bat", "cave_bat"], ["green_slime"], ["cave_beetle"]],
    mid: [["green_slime", "cave_bat"], ["grotto_spider"], ["sporecap", "green_slime"]],
    hard: [["grotto_spider", "grotto_spider"], ["sporecap", "cave_beetle"], ["grotto_spider", "sporecap"]]
  },
  water: {
    easy: [["bog_frog"], ["bog_frog", "bog_frog"], ["rust_crab"]],
    mid: [["drowned"], ["rust_crab", "bog_frog"], ["bell_haunt"]],
    hard: [["drowned", "drowned"], ["bell_haunt", "rust_crab"], ["drowned", "bell_haunt"]]
  },
  wood: {
    easy: [["wolf"], ["wolf", "wolf"], ["briar_sprite"]],
    mid: [["vinewhip"], ["owlbeast"], ["briar_sprite", "wolf"]],
    hard: [["owlbeast", "wolf"], ["vinewhip", "briar_sprite"], ["owlbeast", "vinewhip"]]
  },
  fire: {
    easy: [["fire_imp"], ["cinder_bat", "cinder_bat"], ["magma_bug"]],
    mid: [["fire_imp", "fire_imp"], ["ash_golem"], ["magma_bug", "cinder_bat"]],
    hard: [["ash_golem", "fire_imp"], ["ash_golem", "magma_bug"], ["fire_imp", "fire_imp", "cinder_bat"]]
  },
  crown: {
    easy: [["night_moth"], ["hollow_soldier"], ["night_moth", "night_moth"]],
    mid: [["hollow_soldier", "night_moth"], ["echo_mage"], ["crown_guard"]],
    hard: [["crown_guard", "hollow_soldier"], ["echo_mage", "echo_mage"], ["crown_guard", "echo_mage"]]
  },
  overworld: {
    easy: [["field_slime"], ["brigand"], ["boar"]],
    mid: [["brigand", "brigand"], ["boar", "field_slime"], ["wolf"]],
    hard: [["brigand", "brigand", "brigand"], ["boar", "wolf"], ["brigand", "boar"]]
  }
};

export function monsterById(id) {
  return MONSTERS[id] || null;
}

export function spawnMonster(id, rng = Math.random) {
  const t = MONSTERS[id];
  if (!t) throw new Error("Unknown monster " + id);
  const jitter = 0.9 + rng() * 0.2;
  const hp = Math.max(1, Math.round(t.hp * jitter));
  return {
    id,
    name: t.name,
    art: t.art,
    hp,
    maxHp: hp,
    ac: t.ac,
    atk: t.atk,
    hit: t.hit,
    xp: t.xp,
    gold: t.gold,
    skills: { ...t.skills },
    resists: { ...t.resists },
    tags: [...t.tags],
    status: [],
    ally: !!t.ally,
    boss: !!t.boss,
    relic: t.relic || null,
    loot: t.loot || null,
    artifact: t.artifact || null,
    sleep: 0,
    confuse: 0,
    slow: 0,
    web: 0
  };
}

export function pickEncounter(theme, danger, rng) {
  const pack = ENCOUNTERS[theme] || ENCOUNTERS.overworld;
  const band = danger >= 2 ? pack.hard : danger >= 1 ? pack.mid : pack.easy;
  const row = band[Math.floor(rng() * band.length)];
  return row.map((id) => spawnMonster(id, rng));
}
