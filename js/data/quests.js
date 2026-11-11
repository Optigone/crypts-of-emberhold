/** Main quest line and side rumors. */

export const RELICS = ["spark", "living", "bell", "green", "cinder"];

export const RELIC_ITEMS = {
  spark: "shard_spark",
  living: "shard_living",
  bell: "shard_bell",
  green: "shard_green",
  cinder: "shard_cinder"
};

export const QUESTS = {
  fading_flame: {
    id: "fading_flame",
    name: "The Fading Flame",
    giver: "Master Halden",
    steps: [
      "Speak with Master Halden at Ironhearth Gym.",
      "Descend the Undercity Crypts and recover the First Spark.",
      "Return the First Spark to Master Halden."
    ]
  },
  mossdeep_plea: {
    id: "mossdeep_plea",
    name: "The Mossdeep Plea",
    giver: "Nila the Miner",
    steps: [
      "Find Nila by the western cave in Embervale — or hear of her at the guild.",
      "Clear Mossdeep Caverns and claim the Living Ember.",
      "Show the Living Ember to Nila or to Halden."
    ]
  },
  sunken_bell: {
    id: "sunken_bell",
    name: "The Sunken Bell",
    giver: "Ma Trindle",
    steps: [
      "Ask Ma Trindle at the inn about the old watchtower.",
      "Cross Mistfen to the Sunken Watchtower and recover the Bell's Heart.",
      "Return word to Ma Trindle."
    ]
  },
  thornwood_pact: {
    id: "thornwood_pact",
    name: "The Thornwood Pact",
    giver: "The Leafwarden",
    steps: [
      "Enter Thornwood and speak with the Leafwarden.",
      "Face the Briar Hag in Thornwood Hollow and take the Green Flame.",
      "The forest will open a kind word — and a key — if you succeed."
    ]
  },
  ashen_march: {
    id: "ashen_march",
    name: "The Ashen March",
    giver: "Master Halden",
    steps: [
      "With four shards, Master Halden will unbar the pass to the Ashen March.",
      "Enter the Emberforge Vaults and wrest the Cinder Core from the Colossus.",
      "Bring the last shard home."
    ]
  },
  hollow_crown: {
    id: "hollow_crown",
    name: "The Hollow Crown",
    giver: "Master Halden",
    steps: [
      "Gather all five shards of the Heartflame.",
      "The sealed door in Ironhearth Gym will open onto the Hollow Crown.",
      "Defeat the Hollow King and restore the Heartflame."
    ]
  }
};

export const QUEST_ORDER = [
  "fading_flame",
  "mossdeep_plea",
  "sunken_bell",
  "thornwood_pact",
  "ashen_march",
  "hollow_crown"
];

export const RUMORS = [
  "The Heartflame in the gym hearth is no larger than a candle now. Master Halden looks tired.",
  "Nila the miner says Mossdeep is 'breathing odd' — green lights in the lower caves.",
  "Ma Trindle swears she still hears the old watchtower bell on foggy nights, south in the fen.",
  "Travelers take the east path into Thornwood and come back with leaves in their hair and no memory of the hour.",
  "The northwest pass is shut. Old fire-country. Nobody's been to the March in years.",
  "Magister Quill will buy curious tomes, and sell a few, and identify a mystery for a fee.",
  "Voss at the armory hammers late. He pays fair for used steel.",
  "A bard at the guild hummed a song that made the map on the table draw itself. Or so they claim.",
  "Pits in the deeper halls drop you if you aren't careful. A levitation charm is a kind friend.",
  "Some doors only look like walls. Search, or sing, or spend a spell.",
  "If a ring feels wrong when you put it on, the medic at Ironhearth Gym can lift a curse. Don't panic. It happens.",
  "Five shards made the Heartflame, once. Five will make it again."
];
