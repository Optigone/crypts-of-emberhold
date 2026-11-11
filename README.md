# Crypts of Emberhold

An original first-person, grid-based party dungeon crawler in the spirit of classic 1980s computer RPGs. Walk the streets of Emberhold, the wilds of the vale, and the halls below. Gather a party of six, recover five shards of the Heartflame, and face the Hollow King.

This is an original game (name, story, maps, art, music, and code). It is a web app you can add to a phone’s Home Screen or open on a Windows PC.

## Play

Open the game over **HTTPS** (or localhost). After the first visit it works **offline**.

**iPhone (Safari):** Share → Add to Home Screen.

**Android (Chrome):** Menu → Add to Home screen / Install app.

**Windows PC:** Open the link in a browser, or install it as a PWA (browser install prompt / “Install app”). Keyboard controls work at a desk.

Each device keeps its own saves in that browser. Use **Export Save** / **Import Save** (Camp or the inn’s save book, or the Continue screen) to back up a `.json` file or move it between your PC and a phone.

## Controls

**Keyboard:** `W`/`↑` step forward · `S`/`↓` back · `A`/`←` turn left · `D`/`→` turn right · `Q`/`E` sidestep · `Space`/`Enter` interact · `F` search · `M` map · `I` pack · `B` spellbook · `L` quests · `Esc` close or menu · `1`–`9` combat and menu choices.

**Touch:** on-screen D-pad (turn, step, sidestep). The gold center button interacts. Map, Pack, Spells, Quests, Search, and Camp sit along the sides. Works in landscape and portrait.

## Features

- First-person step-and-turn view of grid halls: doors, secret doors, locked doors, stairs, pits, spinners, traps, dark zones, and wall messages
- Town of Emberhold (inn, guild, shop, mage tower, Ironhearth Gym, graveyard crypt, south gate) plus an overworld of Embervale, Thornwood, Mistfen, and the Ashen March
- Ironhearth Gym: pay gold to train Strength, Agility, or Endurance (costs rise with each session), and a medic's corner to heal, cure, revive, and lift curses
- Six dungeons, fourteen hand-seeded floors, a quest line, and a final boss
- Party of up to six: Warrior, Paladin, Rogue, Bard, Mage, Cleric — stats, HP/MP, leveling, equipment, packs
- Learned spells and bard songs (level-up, shop tomes, found books): attack, heal, buffs, light, mapping, locate, teleport, summons, unlock, detect secrets, levitate, and more, with a per-character spellbook
- Magic gear: weapons, armor, rings, amulets, wands with charges, enchantments, rare artifacts, unidentified items, and mild cursed items, plus equipment comparison
- Turn-based combat (Fight / Parry / Cast / Sing / Use / Run)
- Auto-map and compass
- Multiple save slots in localStorage, plus export/import of a save file
- Chiptune-ish music and sound effects (mute toggle)
- No ads, no accounts, no tracking, no network calls after the files load

## Privacy

The game is a static website. Scores and saves stay on your device unless you export a file yourself.

## Hosting

This folder is a static site (`index.html`, `css/`, `js/`, `icons/`, `manifest.webmanifest`, `sw.js`, `.nojekyll`). Put the whole folder on any static HTTPS host. Do not open it as a `file://` page if you want Add to Home Screen and offline mode to work.
