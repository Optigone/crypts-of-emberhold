/** Boot Crypts of Emberhold and expose a test API. */

import { init, getState, startQuick, tryMove, turn, interact, search, openMap, openInv, openSpells, openQuests, doSave, doLoad, doExport, doImport, doCombat, debugTravel, debugFight, debugGive, forceLearn, debugRefill, applyWorldSpell, drawAppIcon } from "./game.js";
import { SPELLS } from "./data/spells.js";
import { listSlots } from "./systems/state.js";
import { isMuted, toggleMuted, setMuted, resume } from "./audio.js";
import { warmupAllMaps, getMap, MAP_IDS } from "./data/maps.js";

function ready() {
  try {
    init();
  } catch (err) {
    console.error("Emberhold failed to start", err);
    const el = document.createElement("pre");
    el.style.cssText = "color:#f0e6d0;padding:20px;white-space:pre-wrap";
    el.textContent = "Crypts of Emberhold failed to start:\n" + (err && err.stack || err);
    document.body.appendChild(el);
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* offline ok */ });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
else ready();

window.Emberhold = {
  getState,
  startQuick,
  moveForward: () => tryMove(0),
  moveBack: () => tryMove(2),
  turnLeft: () => turn(-1),
  turnRight: () => turn(1),
  strafeLeft: () => tryMove(3),
  strafeRight: () => tryMove(1),
  interact,
  search,
  openMap,
  openInv,
  openSpells,
  openQuests,
  saveToSlot: doSave,
  loadFromSlot: doLoad,
  exportSave: doExport,
  importSave: doImport,
  combatAction: doCombat,
  debugTravel,
  debugFight,
  debugGive,
  forceLearn,
  debugRefill,
  applyWorldSpell,
  drawAppIcon,
  listSlots,
  isMuted,
  toggleMuted,
  setMuted,
  resume,
  spells: SPELLS,
  warmupAllMaps,
  getMap,
  MAP_IDS
};
