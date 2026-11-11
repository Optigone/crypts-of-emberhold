/** All maps: town, overworld regions, and dungeon floors. Data-driven. */

import { generateFloor, getTile, setTile, TILE, mulberry32, hashSeed } from "./gen.js";

export const THEMES = {
  town: {
    id: "town",
    wall: ["#6a5344", "#5a4538", "#4a3a30"],
    wallHi: "#8a6e58",
    wallLine: "#2a2018",
    floor: "#5a4a3a",
    floor2: "#4a3c30",
    ceil: "#3a2e26",
    sky: null,
    fog: "#1a1410",
    door: "#3a2418",
    doorBand: "#c4a060",
    light: 1
  },
  overworld: {
    id: "overworld",
    wall: ["#2d4a28", "#245022", "#1e3a1c"],
    wallHi: "#4a7a38",
    wallLine: "#102010",
    floor: "#3d5a28",
    floor2: "#4a6a30",
    ceil: null,
    sky: ["#7ec4e8", "#c8e4f8"],
    fog: "#a8c8a0",
    door: "#3a2418",
    doorBand: "#d0b070",
    light: 1,
    trees: true
  },
  wood: {
    id: "wood",
    wall: ["#23401e", "#2a4a22", "#1a3018"],
    wallHi: "#3a6a30",
    wallLine: "#0c180c",
    floor: "#2a3a1c",
    floor2: "#324422",
    ceil: "#1a2814",
    sky: null,
    fog: "#0c180c",
    door: "#2a1c10",
    doorBand: "#6a8a40",
    light: 0.7,
    trees: true
  },
  crypt: {
    id: "crypt",
    wall: ["#4a4a52", "#3e3e46", "#32323a"],
    wallHi: "#6a6a72",
    wallLine: "#1a1a20",
    floor: "#2a2a30",
    floor2: "#222228",
    ceil: "#1c1c22",
    sky: null,
    fog: "#0a0a10",
    door: "#3a2a20",
    doorBand: "#8a7040",
    light: 0.35
  },
  cave: {
    id: "cave",
    wall: ["#3a322c", "#2e2824", "#4a4036"],
    wallHi: "#5a4e42",
    wallLine: "#181410",
    floor: "#2a241e",
    floor2: "#201c18",
    ceil: "#181410",
    sky: null,
    fog: "#100c0a",
    door: "#2a2018",
    doorBand: "#6a5a40",
    light: 0.3,
    rough: true
  },
  water: {
    id: "water",
    wall: ["#2a3a48", "#243240", "#1c2834"],
    wallHi: "#4a6a78",
    wallLine: "#0c1418",
    floor: "#1c2830",
    floor2: "#162028",
    ceil: "#121c24",
    sky: null,
    fog: "#0a1218",
    door: "#2a2018",
    doorBand: "#c0a050",
    light: 0.4
  },
  fire: {
    id: "fire",
    wall: ["#4a2a22", "#3a201a", "#5a3028"],
    wallHi: "#8a4030",
    wallLine: "#1a0c08",
    floor: "#2a1814",
    floor2: "#221410",
    ceil: "#1a100c",
    sky: null,
    fog: "#1a0c08",
    door: "#3a1810",
    doorBand: "#e07030",
    light: 0.55,
    glow: "#e07030"
  },
  crown: {
    id: "crown",
    wall: ["#2a2438", "#221c30", "#1a1628"],
    wallHi: "#5a4878",
    wallLine: "#0c0818",
    floor: "#1a1624",
    floor2: "#14101c",
    ceil: "#100c18",
    sky: null,
    fog: "#080610",
    door: "#2a2030",
    doorBand: "#d0b050",
    light: 0.3
  },
  fen: {
    id: "fen",
    wall: ["#2a3a30", "#22342c", "#1a2a24"],
    wallHi: "#3a5a48",
    wallLine: "#0c1814",
    floor: "#2a3a28",
    floor2: "#243222",
    ceil: null,
    sky: ["#6a8090", "#a8b8c0"],
    fog: "#6a8070",
    door: "#2a2018",
    doorBand: "#8a7040",
    light: 0.85,
    trees: true
  },
  ash: {
    id: "ash",
    wall: ["#3a2a28", "#2e2220", "#4a3230"],
    wallHi: "#6a3a32",
    wallLine: "#140c0c",
    floor: "#2a201c",
    floor2: "#221814",
    ceil: null,
    sky: ["#c07040", "#e8a060"],
    fog: "#804030",
    door: "#3a1810",
    doorBand: "#e07030",
    light: 0.9
  }
};

function R(...lines) {
  const w = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, "#"));
}

const TOWN_GRID = R(
  "################################",
  "#..............................#",
  "#......#########..#########....#",
  "#......#########..#########....#",
  "#......########+..+########....#",
  "#......#########..#########....#",
  "#......#########..#########....#",
  "#.............pppppp...........#",
  "#.............pppppp...........#",
  "#.............pp~~pp...........#",
  "#.............pp~~pp...........#",
  "#.............pppppp...........#",
  "#.............pppppp...........#",
  "#..............................#",
  "#......#########..#########....#",
  "#......#########..#########....#",
  "#......########+..+########....#",
  "#......#########..#########....#",
  "#......#########..#########....#",
  "#..............................#",
  "#......#########..###########..#",
  "#......#########..###########..#",
  "#......########+..###########..#",
  "#......#########..+##########..#",
  "#......#########..###########..#",
  "#......#########..###########..#",
  "#...............++.............#",
  "#...............++.............#",
  "#..............................#",
  "################################"
);

const VALE_GRID = R(
  "####################################",
  "########TTTTTTTT++TTTTTTTT##########",
  "###Tgggggggggggg,,ggggggggggggggT###",
  "###Tgggggggggggg,,ggggggggggggggT###",
  "###Tgg###########TggTTTTTggggggT###",
  "###Tgg#........#TgggggTgggTTgggT###",
  "###Tgg#........#TgggggT.c.TTgggT###",
  "###Tgg####+#####Tgg,,ggTgggTTgggT###",
  "###TgggggggggggTgg,,ggTTTTTTggggT###",
  "###TTTT+ggggggg,,,ggggggggggggggT###",
  "###Tggg#ggggggg,,#ggggggggggggggT###",
  "###Tggg#ggggggg,,#gggggTTTTTTTggT###",
  "###Tggggggggggg,,ggggggTgg.gTTggT###",
  "###Tggggggggggg,,ggggggTgggggTggT###",
  "###TTTTTTTTTggg,,ggggggTTTTTTTggT###",
  "###TgggggggTggg,,gggggggggggggggT###",
  "###TgggggggTggg,,gggggggggggggggT###",
  "###TgggggggTggg,,gggTTTTTTTTTTTTT##",
  "###TgggggggTggg,,,,+TgggggggggggT##",
  "###TgggggggTggg,,##TTgggggggggggT##",
  "###TTTTTTTTTTggg,,#################",
  "###Tgggggggggggg,,ggggggggggggggT##",
  "###Tgggggggggggg,,ggggggggggggggT##",
  "###Tgggggggggggg,,ggggggggggggggT##",
  "###TTTTTTTTTTTT++TTTTTTTTTTTTTTTT##",
  "###TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##",
  "####################################"
);

const THORN_GRID = R(
  "################################",
  "################################",
  "##TTTTTTTTTTTTTTTTTTTTTTTTTTTT##",
  "##TgggggggTggggTggggggggggggT##",
  "##TggTTTTggggggTggTTTTTgggggT##",
  "##+,,,TgggTggggg,,,TggggggggT##",
  "##TT,TTTggTggTTT,TTggTTTTTTTT##",
  "##Tgg,gggggggTgg,gggggggggggT##",
  "##Tgg,gTTTTggTgg,gTTTTT+ggggT##",
  "##Tgg,ggggTggTgg,gggggg#ggggT##",
  "##TTT,TTTTgggTgg,gTTTTTTTgggT##",
  "##Tgg,,,gggggTgg,,,gggggggggT##",
  "##TggT,TTTTTTTTTT,TTggg.ggggT##",
  "##Tggg,gggggggggg,ggggggggggT##",
  "##Tggg,ggTTTTgggg,gTTTTTTTTTT##",
  "##TTTT,TTTTTTTTTT,TTTTTTTTTTT##",
  "##Tggg,,,ggggggg,,,gggggggggT##",
  "##TggTTTTggggggTTTTgggggggggT##",
  "##TgggggggggggggggggggggggggT##",
  "##TTTTTTTTTTTTTTTTTTTTTTTTTTTT##",
  "################################"
);

const FEN_GRID = R(
  "################################",
  "##############++################",
  "###gggggggggg,,gggg~~~~ggggg####",
  "###gg~~~~~~gg,,gg~~~TT~~~ggg####",
  "###gg~TTTT~gg,,g~~~TTTT~~ggg####",
  "###gg~~~~~~g,,,~~~~T~~T~~~gg####",
  "###ggggggggg,,gg~~~T~~T~~~gg####",
  "###TTTTTTTT,,,ggg~~~~T~~~ggg####",
  "###gggggggg,,gggg~~~~~~~gggg####",
  "###gg~~~~gg,,gg~~~~###~~~~gg####",
  "###g~~~~~~g,,,~~~~#+#~~~~ggg####",
  "###g~~~~~~gg,,g~~~~#~~~~~ggg####",
  "###gg~~~~ggg,,gg~~~~~~~~gggg####",
  "###ggggggggg,,ggg~~~~ggggggg####",
  "###TTggggggg,,ggggggggggTTTT####",
  "###~~TTggggg,,,,,,,,gggTT~~~####",
  "###~~~~TTgggggg,,ggggTT~~~~~####",
  "###~~~~~~TTTTTTTTTTTT~~~~~~~####",
  "################################"
);

const ASH_GRID = R(
  "################################",
  "################################",
  "###gggg##########ggggggggggg####",
  "###gggg#........#ggg,,,,gggg####",
  "###gggg#........#ggg,##,gggg####",
  "###gggg####+#####ggg,##,gggg####",
  "###ggggggggggggggggg,,,,gggg####",
  "###gg,,,,,,,,,,ggggggggggggg####",
  "###gg,########,gg#####gggggg####",
  "###gg,########,gg#...#gggggg####",
  "###gg,,,,,,,,,,gg#...#gggggg####",
  "###gggggggg,,gggg#####gggggg####",
  "#############,gggggggggggggg####",
  "###gggggggggg,gggg,,,,gggggg####",
  "###gggg~~~~~g,gggg,##,gggggg####",
  "###ggg~~~~~~g,,,,,,##,gggggg####",
  "###gggg~~~~~gggggggggggggggg####",
  "###gggggggggggggg++++++ggggg####",
  "###gggggggggggggg######ggggg####",
  "################################"
);

export const MAP_DEFS = {
  town: {
    id: "town",
    name: "Emberhold",
    kind: "town",
    theme: "town",
    music: "town",
    light: "day",
    safe: true,
    grid: TOWN_GRID,
    start: { x: 16, y: 11, dir: 0 },
    events: {
      "15,4": { type: "door", place: "inn", label: "The Warm Hearth Inn" },
      "18,4": { type: "door", place: "temple", label: "Temple of the Ember" },
      "15,16": { type: "door", place: "shop", label: "Voss's Arms & Wares" },
      "18,16": { type: "door", place: "mage", label: "Quill's Tower" },
      "15,22": { type: "door", place: "guild", label: "The Ember Company" },
      "18,23": { type: "door", place: "cryptgate", label: "The Graveyard Crypt" },
      "16,26": { type: "gate", to: "embervale", spawn: "fromTown", label: "South Gate" },
      "17,26": { type: "gate", to: "embervale", spawn: "fromTown", label: "South Gate" },
      "16,27": { type: "gate", to: "embervale", spawn: "fromTown", label: "South Gate" },
      "17,27": { type: "gate", to: "embervale", spawn: "fromTown", label: "South Gate" },
      "16,9": { type: "sign", text: "The fountain still holds a faint warmth. The Heartflame is dying, but it is not gone." },
      "17,9": { type: "sign", text: "The fountain still holds a faint warmth. The Heartflame is dying, but it is not gone." },
      "16,10": { type: "sign", text: "A worn inscription: SIX WILL WALK WHERE ONE CANNOT." },
      "17,10": { type: "sign", text: "A worn inscription: SIX WILL WALK WHERE ONE CANNOT." },
      "16,1": { type: "sign", text: "A weathered plaque: EMBERHOLD, LAST LIGHT OF THE VALE." },
      "13,11": { type: "npc", name: "Town Crier", text: "Hear it, hear it! The temple flame wanes! Brave company wanted — see the Ember Company, or Brother Halden!" }
    },
    signs: {
      "15,7": "The Warm Hearth Inn — beds, bread, and a book for your travels.",
      "18,7": "Temple of the Ember — all are welcome, the living and the lost.",
      "15,19": "Voss's Arms & Wares — fair steel, fair prices.",
      "18,19": "Magister Quill — spells, scrolls, and second sight.",
      "15,26": "The Ember Company — adventurers' guild. Come in, come in.",
      "16,25": "South Gate — Embervale beyond."
    }
  },

  embervale: {
    id: "embervale",
    name: "Embervale",
    kind: "overworld",
    theme: "overworld",
    music: "overworld",
    light: "day",
    safe: false,
    danger: 0,
    encounter: "overworld",
    grid: VALE_GRID,
    spawns: {
      fromTown: { x: 16, y: 2, dir: 2 },
      fromThorn: { x: 17, y: 18, dir: 3 },
      fromFen: { x: 15, y: 23, dir: 0 },
      fromAsh: { x: 9, y: 8, dir: 2 },
      fromMoss: { x: 8, y: 9, dir: 1 }
    },
    events: {
      "16,1": { type: "gate", to: "town", x: 16, y: 25, dir: 0, label: "Gate to Emberhold" },
      "17,1": { type: "gate", to: "town", x: 16, y: 25, dir: 0, label: "Gate to Emberhold" },
      "7,9": { type: "stairs", to: "moss_1", spawn: "entrance", label: "Mossdeep Caverns" },
      "9,7": { type: "gate", to: "ashen", spawn: "fromVale", label: "The Ashen Pass", require: "ashen_open", lockedText: "A great stone gate. Four shards, Halden said, will wake the old fire-runes." },
      "18,18": { type: "gate", to: "thornwood", spawn: "fromVale", label: "Path to Thornwood" },
      "15,24": { type: "gate", to: "mistfen", spawn: "fromVale", label: "Path to Mistfen" },
      "16,24": { type: "gate", to: "mistfen", spawn: "fromVale", label: "Path to Mistfen" },
      "22,6": { type: "chest", loot: "overworld", once: "vale_ruins" },
      "25,12": { type: "npc", name: "Nila the Miner", text: "The lower caves have gone green-lit and strange. I dropped my lantern and didn't go back. If you've a steady party, Mossdeep is just west — and something warm is beating down there." },
      "12,3": { type: "sign", text: "A roadside stone: NORTH — Emberhold. WEST — Mossdeep. EAST — Thornwood. SOUTH — the fen." }
    }
  },

  thornwood: {
    id: "thornwood",
    name: "Thornwood",
    kind: "overworld",
    theme: "wood",
    music: "overworld",
    light: "day",
    safe: false,
    danger: 1,
    encounter: "wood",
    grid: THORN_GRID,
    spawns: {
      fromVale: { x: 3, y: 5, dir: 1 },
      fromHollow: { x: 24, y: 8, dir: 3 }
    },
    events: {
      "2,5": { type: "gate", to: "embervale", spawn: "fromThorn", label: "Back to Embervale" },
      "25,8": { type: "stairs", to: "thorn_1", spawn: "entrance", label: "Thornwood Hollow" },
      "26,12": { type: "npc", name: "The Leafwarden", text: "The Hag is not wicked, only old and angry. The Green Flame was taken into her hollow. Return it with respect, and the wood will remember you." }
    }
  },

  mistfen: {
    id: "mistfen",
    name: "Mistfen",
    kind: "overworld",
    theme: "fen",
    music: "overworld",
    light: "day",
    safe: false,
    danger: 1,
    encounter: "water",
    grid: FEN_GRID,
    spawns: {
      fromVale: { x: 15, y: 2, dir: 2 },
      fromTower: { x: 16, y: 11, dir: 2 }
    },
    events: {
      "15,1": { type: "gate", to: "embervale", spawn: "fromFen", label: "Back to Embervale" },
      "16,1": { type: "gate", to: "embervale", spawn: "fromFen", label: "Back to Embervale" },
      "16,10": { type: "stairs", to: "watch_1", spawn: "entrance", label: "The Sunken Watchtower" },
      "10,15": { type: "sign", text: "The stones sink a little underfoot. The tower still stands, somehow." }
    }
  },

  ashen: {
    id: "ashen",
    name: "The Ashen March",
    kind: "overworld",
    theme: "ash",
    music: "dungeon",
    light: "day",
    safe: false,
    danger: 2,
    encounter: "fire",
    grid: ASH_GRID,
    spawns: {
      fromVale: { x: 16, y: 17, dir: 0 },
      fromForge: { x: 12, y: 6, dir: 2 }
    },
    events: {
      "16,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "17,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "18,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "19,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "20,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "21,17": { type: "gate", to: "embervale", spawn: "fromAsh", label: "Back to Embervale" },
      "10,5": { type: "stairs", to: "forge_1", spawn: "entrance", label: "Emberforge Vaults" },
      "18,9": { type: "chest", loot: "fire-minor", once: "ash_cache" },
      "8,14": { type: "sign", text: "The ground is warm. Kiln-smoke still hangs in the air." }
    }
  }
};

/** Dungeon floor specifications (seeded + curated). */
const DUNGEONS = [
  // Temple Crypts — 3 floors
  {
    id: "crypt_1", name: "Temple Crypts, Upper Halls", kind: "dungeon", theme: "crypt", music: "dungeon",
    light: "dark", encounter: "crypt", danger: 0,
    gen: { seed: 0xC0FF01, w: 24, h: 24, rooms: 8, loops: 3, secrets: 2, chests: 3, traps: 3, spinners: 1, stairsUp: true, stairsDown: true, lootMinor: "crypt-minor", lootMajor: "crypt-major", message: "Carved in the lintel: BE KIND TO THE SLEEPING." },
    entranceFrom: { map: "town", x: 16, y: 23, dir: 3 },
    next: "crypt_2", prev: "town"
  },
  {
    id: "crypt_2", name: "Temple Crypts, The Ossuary", kind: "dungeon", theme: "crypt", music: "dungeon",
    light: "dark", encounter: "crypt", danger: 1,
    gen: { seed: 0xC0FF02, w: 24, h: 24, rooms: 9, loops: 3, secrets: 2, chests: 3, traps: 4, spinners: 1, darkZones: 1, stairsUp: true, stairsDown: true, lootMinor: "crypt-minor", lootMajor: "crypt-major", locked: { count: 1, key: "bronze" }, message: "Names, many names, cut small into the stone." },
    next: "crypt_3", prev: "crypt_1"
  },
  {
    id: "crypt_3", name: "Temple Crypts, The Warden's Vault", kind: "dungeon", theme: "crypt", music: "dungeon",
    light: "dark", encounter: "crypt", danger: 1, boss: "crypt_warden",
    gen: { seed: 0xC0FF03, w: 22, h: 22, rooms: 7, loops: 2, secrets: 1, chests: 2, traps: 3, stairsUp: true, stairsDown: false, lootMinor: "crypt-minor", lootMajor: "crypt-major", message: "A last inscription: THE SPARK IS NOT YOURS TO KEEP, ONLY TO CARRY." },
    prev: "crypt_2"
  },

  // Mossdeep — 2 floors
  {
    id: "moss_1", name: "Mossdeep Caverns, The Drip", kind: "dungeon", theme: "cave", music: "dungeon",
    light: "dark", encounter: "cave", danger: 0,
    gen: { seed: 0xA05501, w: 26, h: 24, rooms: 8, loops: 4, secrets: 2, chests: 3, traps: 2, water: 6, pits: 2, stairsUp: true, stairsDown: true, lootMinor: "cave-minor", lootMajor: "cave-major", message: "Water ticks somewhere in the dark, like a clock." },
    entranceFrom: { map: "embervale", spawn: "fromMoss" },
    next: "moss_2", prev: "embervale"
  },
  {
    id: "moss_2", name: "Mossdeep Caverns, The Queen’s Hollow", kind: "dungeon", theme: "cave", music: "dungeon",
    light: "dark", encounter: "cave", danger: 1, boss: "grotto_queen",
    gen: { seed: 0xA05502, w: 24, h: 24, rooms: 8, loops: 3, secrets: 2, chests: 3, traps: 3, water: 4, pits: 2, darkZones: 1, stairsUp: true, stairsDown: false, lootMinor: "cave-minor", lootMajor: "cave-major", message: "Silk hangs in soft curtains. Something large has passed this way." },
    prev: "moss_1"
  },

  // Sunken Watchtower — 2 floors
  {
    id: "watch_1", name: "Sunken Watchtower, The Flooded Stair", kind: "dungeon", theme: "water", music: "dungeon",
    light: "dark", encounter: "water", danger: 1,
    gen: { seed: 0xBE1101, w: 24, h: 24, rooms: 8, loops: 3, secrets: 2, chests: 3, traps: 3, water: 10, pits: 3, spinners: 1, stairsUp: true, stairsDown: true, lootMinor: "water-minor", lootMajor: "water-major", message: "A tide-mark stains the walls, higher than your head." },
    entranceFrom: { map: "mistfen", spawn: "fromTower" },
    next: "watch_2", prev: "mistfen"
  },
  {
    id: "watch_2", name: "Sunken Watchtower, The Bell Chamber", kind: "dungeon", theme: "water", music: "dungeon",
    light: "dark", encounter: "water", danger: 2, boss: "bellwight",
    gen: { seed: 0xBE1102, w: 22, h: 22, rooms: 7, loops: 2, secrets: 1, chests: 2, traps: 3, water: 8, pits: 2, stairsUp: true, stairsDown: false, lootMinor: "water-minor", lootMajor: "water-major", message: "The air hums, as if a great bell had just been struck." },
    prev: "watch_1"
  },

  // Thornwood Hollow — 2 floors
  {
    id: "thorn_1", name: "Thornwood Hollow, The Rootmaze", kind: "dungeon", theme: "wood", music: "dungeon",
    light: "dim", encounter: "wood", danger: 1,
    gen: { seed: 0x700001, w: 26, h: 26, rooms: 9, loops: 4, secrets: 2, chests: 3, traps: 3, spinners: 2, stairsUp: true, stairsDown: true, lootMinor: "wood-minor", lootMajor: "wood-major", message: "The walls are not stone. They are living wood, patient and close." },
    entranceFrom: { map: "thornwood", spawn: "fromHollow" },
    next: "thorn_2", prev: "thornwood"
  },
  {
    id: "thorn_2", name: "Thornwood Hollow, The Hag’s Bower", kind: "dungeon", theme: "wood", music: "dungeon",
    light: "dim", encounter: "wood", danger: 2, boss: "briar_hag",
    gen: { seed: 0x700002, w: 24, h: 24, rooms: 8, loops: 3, secrets: 2, chests: 3, traps: 2, stairsUp: true, stairsDown: false, lootMinor: "wood-minor", lootMajor: "wood-major", message: "Roses grow from the floorboards. They smell like rain." },
    prev: "thorn_1"
  },

  // Emberforge — 2 floors
  {
    id: "forge_1", name: "Emberforge Vaults, The Kiln Road", kind: "dungeon", theme: "fire", music: "dungeon",
    light: "dim", encounter: "fire", danger: 2,
    gen: { seed: 0xF0E601, w: 26, h: 24, rooms: 8, loops: 3, secrets: 2, chests: 3, traps: 4, pits: 3, spinners: 1, stairsUp: true, stairsDown: true, lootMinor: "fire-minor", lootMajor: "fire-major", message: "The floor is warm. Old tools hang on the walls, unused." },
    entranceFrom: { map: "ashen", spawn: "fromForge" },
    next: "forge_2", prev: "ashen"
  },
  {
    id: "forge_2", name: "Emberforge Vaults, The Heartkiln", kind: "dungeon", theme: "fire", music: "dungeon",
    light: "dim", encounter: "fire", danger: 2, boss: "cinder_colossus",
    gen: { seed: 0xF0E602, w: 24, h: 24, rooms: 7, loops: 2, secrets: 1, chests: 2, traps: 3, pits: 2, stairsUp: true, stairsDown: false, lootMinor: "fire-minor", lootMajor: "fire-major", message: "A vast hearth sleeps here. Something still tends it." },
    prev: "forge_1"
  },

  // Hollow Crown — 3 floors
  {
    id: "crown_1", name: "The Hollow Crown, The Dusk Courts", kind: "dungeon", theme: "crown", music: "dungeon",
    light: "dark", encounter: "crown", danger: 2,
    gen: { seed: 0xC20001, w: 26, h: 26, rooms: 9, loops: 4, secrets: 2, chests: 3, traps: 4, spinners: 2, darkZones: 1, stairsUp: true, stairsDown: true, lootMinor: "crown-minor", lootMajor: "crown-major", locked: { count: 1, key: "gold" }, message: "Banners hang in a wind that is not there." },
    entranceFrom: { map: "town", x: 21, y: 5, dir: 2 },
    next: "crown_2", prev: "town"
  },
  {
    id: "crown_2", name: "The Hollow Crown, The Quiet Galleries", kind: "dungeon", theme: "crown", music: "dungeon",
    light: "dark", encounter: "crown", danger: 2,
    gen: { seed: 0xC20002, w: 26, h: 26, rooms: 9, loops: 3, secrets: 2, chests: 3, traps: 4, pits: 2, darkZones: 2, stairsUp: true, stairsDown: true, lootMinor: "crown-minor", lootMajor: "crown-major", message: "Portraits with no faces. They are not frightening. They are sad." },
    next: "crown_3", prev: "crown_1"
  },
  {
    id: "crown_3", name: "The Hollow Crown, The Throne of Dusk", kind: "dungeon", theme: "crown", music: "boss",
    light: "dark", encounter: "crown", danger: 2, boss: "hollow_king",
    gen: { seed: 0xC20003, w: 22, h: 22, rooms: 6, loops: 2, secrets: 1, chests: 2, traps: 2, stairsUp: true, stairsDown: false, lootMinor: "crown-minor", lootMajor: "crown-major", message: "A crown of dim gold waits on an empty chair." },
    prev: "crown_2"
  }
];

for (const d of DUNGEONS) {
  MAP_DEFS[d.id] = d;
}

export const MAP_IDS = Object.keys(MAP_DEFS);

const cache = new Map();

function emptyEvents() {
  return {};
}

export function compileMap(id) {
  if (cache.has(id)) return cache.get(id);
  const def = MAP_DEFS[id];
  if (!def) throw new Error("Unknown map " + id);
  let grid, features, rooms, secrets;
  const events = { ...(def.events || {}) };

  if (def.grid) {
    grid = def.grid.slice();
    features = { stairsUp: null, stairsDown: null, chests: [], pits: [], spinners: [], traps: [], dark: [], water: [], locked: [], messages: [] };
    rooms = [];
    secrets = [];
    // Harvest implicit features from the grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ch = grid[y][x];
        if (ch === "c") features.chests.push({ x, y });
        if (ch === "o") features.pits.push({ x, y });
        if (ch === "^") features.spinners.push({ x, y });
        if (ch === "~" && def.kind !== "town") features.water.push({ x, y });
        if (ch === "<") features.stairsUp = { x, y };
        if (ch === ">") features.stairsDown = { x, y };
      }
    }
    if (def.signs) {
      for (const [k, text] of Object.entries(def.signs)) {
        const [x, y] = k.split(",").map(Number);
        events[k] = events[k] || { type: "wallsign", text, x, y };
      }
    }
  } else if (def.gen) {
    const built = generateFloor(def.gen.seed, def.gen);
    grid = built.grid;
    features = built.features;
    rooms = built.rooms;
    secrets = built.secrets;

    // Chests
    for (const c of features.chests) {
      const key = c.x + "," + c.y;
      events[key] = { type: "chest", loot: c.loot, once: id + "_chest_" + c.x + "_" + c.y, secret: !!c.secret };
    }
    // Traps (hidden)
    for (const t of features.traps) {
      events[t.x + "," + t.y] = { type: "trap", kind: t.kind, once: id + "_trap_" + t.x + "_" + t.y };
    }
    // Locked doors
    for (const l of features.locked) {
      events[l.x + "," + l.y] = { type: "locked", key: l.key };
    }
    // Messages
    for (const m of features.messages) {
      events[m.x + "," + m.y] = { type: "sign", text: m.text };
    }
    // Stairs
    if (features.stairsUp) {
      const u = features.stairsUp;
      if (def.prev === "town" && def.entranceFrom) {
        events[u.x + "," + u.y] = { type: "stairs", to: def.entranceFrom.map, x: def.entranceFrom.x, y: def.entranceFrom.y, dir: def.entranceFrom.dir, spawn: def.entranceFrom.spawn, label: "Stairs up" };
      } else if (def.prev && MAP_DEFS[def.prev]?.kind !== "dungeon") {
        events[u.x + "," + u.y] = { type: "stairs", to: def.prev, spawn: def.entranceFrom?.spawn, label: "Stairs up" };
      } else if (def.prev) {
        events[u.x + "," + u.y] = { type: "stairs", to: def.prev, spawn: "down", label: "Stairs up" };
      }
    }
    if (features.stairsDown && def.next) {
      const dwn = features.stairsDown;
      events[dwn.x + "," + dwn.y] = { type: "stairs", to: def.next, spawn: "up", label: "Stairs down" };
    }
    // Boss sits in the last room's center (or a reserved cell)
    if (def.boss) {
      const room = rooms[rooms.length - 1];
      const bx = room.x + Math.floor(room.w / 2);
      const by = room.y + Math.floor(room.h / 2);
      // Don't overwrite stairs if they landed here
      let x = bx, y = by;
      if (events[x + "," + y]?.type === "stairs") {
        x = Math.min(room.x + room.w - 2, bx + 1);
      }
      events[x + "," + y] = { type: "boss", monster: def.boss, once: "boss_" + def.boss };
      features.boss = { x, y, monster: def.boss };
    }
  } else {
    throw new Error("Map " + id + " has no grid or gen");
  }

  const map = {
    ...def,
    grid,
    w: grid[0].length,
    h: grid.length,
    features,
    rooms: rooms || [],
    secrets: secrets || [],
    events
  };
  cache.set(id, map);
  return map;
}

export function getMap(id) {
  return compileMap(id);
}

export function warmupAllMaps() {
  for (const id of MAP_IDS) compileMap(id);
}

export function eventAt(map, x, y) {
  return map.events[x + "," + y] || null;
}

export function isBlocking(map, x, y, ctx = {}) {
  const ch = getTile(map.grid, x, y);
  if (ch === "#" || ch === "T") return true;
  if (ch === "s") {
    const found = ctx.secretsFound && ctx.secretsFound.has(map.id + ":" + x + "," + y);
    return !found;
  }
  if (ch === "L" || (ch === "+" && eventAt(map, x, y)?.type === "locked")) {
    const ev = eventAt(map, x, y);
    const key = ev?.key;
    if (ctx.unlocked && ctx.unlocked.has(map.id + ":" + x + "," + y)) return false;
    if (ctx.doorsWalk === false) return true;
    return true; // locked until unlocked
  }
  if (ch === "+") return false; // openable doors, walking in opens
  if (ch === "o") return false; // pit — walkable but dangerous
  return false;
}

export function isWalkable(map, x, y, ctx = {}) {
  if (x < 0 || y < 0 || y >= map.h || x >= map.w) return false;
  const ch = getTile(map.grid, x, y);
  if (ch === "#" || ch === "T") return false;
  if (ch === "s") return !!(ctx.secretsFound && ctx.secretsFound.has(map.id + ":" + x + "," + y));
  if (ch === "L") return !!(ctx.unlocked && ctx.unlocked.has(map.id + ":" + x + "," + y));
  return true;
}

export function looksLikeWall(map, x, y, ctx = {}) {
  const ch = getTile(map.grid, x, y);
  if (ch === "#" || ch === "T") return true;
  if (ch === "s" && !(ctx.secretsFound && ctx.secretsFound.has(map.id + ":" + x + "," + y))) return true;
  return false;
}

export function isDoorTile(ch) {
  return ch === "+" || ch === "L" || ch === "s";
}

export function describeTile(ch) {
  return ({
    "#": "a wall",
    T: "trees",
    ".": "stone floor",
    ",": "a path",
    g: "grass",
    p: "the plaza",
    "~": "water",
    "+": "a door",
    L: "a locked door",
    s: "a wall",
    "<": "stairs leading up",
    ">": "stairs leading down",
    o: "a pit",
    "^": "odd, spinning tiles",
    "*": "deep shadow",
    c: "a chest",
    m: "a floor mark"
  })[ch] || "the way";
}

/** Spawn coordinates on a map. spawn may be "up", "down", a named spawn, or omitted. */
export function resolveSpawn(map, spawn, fallback) {
  if (spawn && map.spawns && map.spawns[spawn]) return { ...map.spawns[spawn] };
  if (spawn === "up" && map.features?.stairsUp) {
    return { x: map.features.stairsUp.x, y: map.features.stairsUp.y, dir: 0 };
  }
  if (spawn === "down" && map.features?.stairsDown) {
    return { x: map.features.stairsDown.x, y: map.features.stairsDown.y, dir: 0 };
  }
  if (spawn === "entrance" && map.features?.stairsUp) {
    return { x: map.features.stairsUp.x, y: map.features.stairsUp.y, dir: 2 };
  }
  if (map.start) return { ...map.start };
  if (fallback) return { ...fallback };
  // first walkable
  for (let y = 1; y < map.h - 1; y++) {
    for (let x = 1; x < map.w - 1; x++) {
      if (isWalkable(map, x, y, {})) return { x, y, dir: 0 };
    }
  }
  return { x: 1, y: 1, dir: 0 };
}

export { getTile, setTile, TILE };
