/** WebAudio chiptune-ish music and SFX. Fully offline, muteable. */

let ac = null;
let muted = false;
let master = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let currentTheme = null;
let musicStep = 0;
let started = false;

export function isMuted() { return muted; }

export function setMuted(v) {
  muted = !!v;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, now(), 0.05);
  try { localStorage.setItem("emberhold-muted", muted ? "1" : "0"); } catch { /* ignore */ }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

function now() { return ac ? ac.currentTime : 0; }

export async function resume() {
  ensure();
  if (ac && ac.state === "suspended") {
    try { await ac.resume(); } catch { /* ignore */ }
  }
  started = true;
}

function ensure() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC({ latencyHint: "interactive" });
  master = ac.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ac.destination);
  musicGain = ac.createGain();
  musicGain.gain.value = 0.12;
  musicGain.connect(master);
  sfxGain = ac.createGain();
  sfxGain.gain.value = 0.22;
  sfxGain.connect(master);
  try {
    if (localStorage.getItem("emberhold-muted") === "1") setMuted(true);
  } catch { /* ignore */ }
}

function envGain(t, a, d, v = 1) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  return g;
}

function osc(type, freq, t, dur, dest, vol = 1) {
  if (!ac) return;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = envGain(t, 0.01, dur, vol);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
  return o;
}

function noise(t, dur, dest, vol = 1, filterFreq = 1200) {
  if (!ac) return;
  const n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = envGain(t, 0.005, dur, vol);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t); src.stop(t + dur + 0.02);
}

const A4 = 440;
function nfreq(semi) { return A4 * Math.pow(2, semi / 12); }

// Themes as { tempo, notes: [ {s, d, v, w} ] repeating patterns in semitones from A3 (= -12)
// plus bass and a pulse duty
const THEMES = {
  title: {
    bpm: 88,
    bars: 16,
    melody: [
      [0, 2, 0], [4, 2, 0], [7, 2, 0], [12, 4, 0], [7, 2, 0], [4, 2, 0], [0, 2, 0], [-1, 2, 0],
      [0, 2, 0], [5, 2, 0], [9, 2, 0], [12, 4, 0], [9, 2, 0], [5, 2, 0], [4, 2, 0], [2, 2, 0]
    ],
    bass: [
      [-24, 4], [-17, 4], [-24, 4], [-19, 4],
      [-24, 4], [-17, 4], [-22, 4], [-19, 4]
    ]
  },
  town: {
    bpm: 100,
    melody: [
      [0, 2], [4, 2], [7, 2], [4, 2], [9, 4], [7, 2], [4, 2],
      [5, 2], [9, 2], [12, 2], [9, 2], [7, 4], [5, 2], [4, 2],
      [0, 2], [4, 2], [7, 4], [12, 4], [7, 2], [4, 2],
      [2, 2], [5, 2], [9, 4], [7, 2], [5, 2], [4, 2], [0, 2]
    ],
    bass: [
      [-24, 4], [-20, 4], [-17, 4], [-20, 4],
      [-19, 4], [-15, 4], [-17, 4], [-24, 4]
    ]
  },
  overworld: {
    bpm: 112,
    melody: [
      [0, 2], [2, 2], [4, 2], [7, 2], [12, 4], [11, 2], [9, 2],
      [7, 2], [4, 2], [7, 2], [9, 2], [7, 4], [4, 2], [2, 2],
      [0, 2], [4, 2], [9, 4], [7, 4], [5, 2], [4, 2],
      [2, 4], [0, 4], [-1, 4], [0, 4]
    ],
    bass: [
      [-24, 4], [-17, 4], [-20, 4], [-17, 4],
      [-24, 4], [-19, 4], [-22, 4], [-24, 4]
    ]
  },
  dungeon: {
    bpm: 80,
    melody: [
      [0, 4], [-1, 4], [-4, 4], [-1, 4],
      [0, 2], [3, 2], [2, 4], [-1, 4],
      [-4, 4], [-6, 4], [-4, 2], [-1, 2], [0, 4],
      [3, 4], [2, 4], [0, 4], [-1, 4]
    ],
    bass: [
      [-24, 8], [-25, 8], [-28, 8], [-24, 8]
    ]
  },
  combat: {
    bpm: 132,
    melody: [
      [0, 1], [0, 1], [7, 2], [0, 1], [0, 1], [8, 2],
      [0, 1], [0, 1], [7, 1], [5, 1], [3, 2], [2, 2],
      [0, 1], [7, 1], [12, 2], [11, 2], [7, 2],
      [8, 2], [7, 2], [5, 2], [3, 2]
    ],
    bass: [
      [-24, 2], [-24, 2], [-17, 2], [-17, 2],
      [-20, 2], [-20, 2], [-19, 2], [-24, 2]
    ]
  },
  boss: {
    bpm: 108,
    melody: [
      [0, 2], [0, 2], [3, 2], [0, 2], [-2, 2], [0, 2], [3, 4],
      [5, 2], [3, 2], [2, 2], [0, 2], [-2, 4], [-4, 4],
      [0, 2], [3, 2], [6, 2], [7, 2], [6, 2], [3, 2], [0, 4],
      [-2, 4], [0, 4], [3, 4], [0, 4]
    ],
    bass: [
      [-24, 2], [-24, 2], [-21, 2], [-24, 2],
      [-26, 2], [-24, 2], [-21, 4]
    ]
  },
  victory: {
    bpm: 120,
    melody: [
      [0, 1], [4, 1], [7, 1], [12, 3], [7, 1], [12, 1], [16, 4]
    ],
    bass: [[-24, 4], [-17, 4], [-12, 8]],
    once: true
  }
};

function playPattern(theme, startTime) {
  if (!ac || !theme) return 1;
  const beat = 60 / (theme.bpm || 100);
  // melody
  let t = startTime;
  let maxT = startTime;
  const base = -9; // near C4-ish relative to A4: C4 is -9
  let tm = startTime;
  for (const [semi, dur] of theme.melody) {
    const d = dur * beat * 0.46;
    const o = osc("square", nfreq(base + semi), tm, d, musicGain, 0.5);
    if (o) o.frequency.setValueAtTime(nfreq(base + semi), tm);
    tm += dur * beat * 0.5;
  }
  maxT = Math.max(maxT, tm);
  let tb = startTime;
  for (const [semi, dur] of theme.bass) {
    osc("triangle", nfreq(base + semi), tb, dur * beat * 0.48, musicGain, 0.7);
    tb += dur * beat * 0.5;
  }
  maxT = Math.max(maxT, tb);
  // soft hat
  let th = startTime;
  const steps = Math.round((maxT - startTime) / (beat * 0.5));
  for (let i = 0; i < steps; i++) {
    if (i % 2 === 1) noise(th, 0.04, musicGain, 0.08, 4000);
    th += beat * 0.5;
  }
  return Math.max(0.5, maxT - startTime);
}

let loopHandle = 0;

export function playTheme(name) {
  ensure();
  if (currentTheme === name && loopHandle) return;
  stopMusic();
  currentTheme = name;
  const theme = THEMES[name] || THEMES.dungeon;
  const loop = () => {
    if (currentTheme !== name || !ac) return;
    const dur = playPattern(theme, now() + 0.02);
    if (theme.once) {
      currentTheme = null;
      loopHandle = 0;
      return;
    }
    loopHandle = setTimeout(loop, dur * 1000 - 30);
  };
  loop();
}

export function stopMusic() {
  if (loopHandle) {
    clearTimeout(loopHandle);
    loopHandle = 0;
  }
  currentTheme = null;
}

export const sfx = {
  step() { ensure(); const t = now(); noise(t, 0.05, sfxGain, 0.25, 700); osc("triangle", 90, t, 0.06, sfxGain, 0.2); },
  bump() { ensure(); const t = now(); osc("square", 110, t, 0.08, sfxGain, 0.3); noise(t, 0.08, sfxGain, 0.3, 400); },
  door() { ensure(); const t = now(); osc("triangle", 180, t, 0.12, sfxGain, 0.3); osc("triangle", 140, t + 0.08, 0.14, sfxGain, 0.25); },
  chest() { ensure(); const t = now(); osc("square", 520, t, 0.08, sfxGain, 0.25); osc("square", 780, t + 0.07, 0.1, sfxGain, 0.22); },
  coin() { ensure(); const t = now(); osc("square", 880, t, 0.06, sfxGain, 0.2); osc("square", 1320, t + 0.06, 0.08, sfxGain, 0.18); },
  hit() { ensure(); const t = now(); noise(t, 0.08, sfxGain, 0.45, 900); osc("square", 160, t, 0.07, sfxGain, 0.3); },
  miss() { ensure(); const t = now(); osc("square", 240, t, 0.05, sfxGain, 0.12); osc("square", 180, t + 0.04, 0.05, sfxGain, 0.1); },
  spell() { ensure(); const t = now(); osc("sawtooth", 440, t, 0.18, sfxGain, 0.2); osc("sawtooth", 660, t + 0.05, 0.2, sfxGain, 0.15); },
  heal() { ensure(); const t = now(); osc("sine", 523, t, 0.15, sfxGain, 0.25); osc("sine", 784, t + 0.08, 0.18, sfxGain, 0.2); },
  sing() { ensure(); const t = now(); osc("sine", 392, t, 0.2, sfxGain, 0.25); osc("sine", 494, t + 0.12, 0.22, sfxGain, 0.22); osc("sine", 587, t + 0.24, 0.3, sfxGain, 0.2); },
  stairs() { ensure(); const t = now(); osc("triangle", 200, t, 0.1, sfxGain, 0.25); osc("triangle", 160, t + 0.1, 0.12, sfxGain, 0.22); osc("triangle", 120, t + 0.2, 0.14, sfxGain, 0.2); },
  menu() { ensure(); const t = now(); osc("square", 660, t, 0.04, sfxGain, 0.12); },
  save() { ensure(); const t = now(); osc("sine", 440, t, 0.1, sfxGain, 0.2); osc("sine", 660, t + 0.1, 0.14, sfxGain, 0.2); },
  error() { ensure(); const t = now(); osc("square", 140, t, 0.12, sfxGain, 0.25); },
  win() { ensure(); playTheme("victory"); },
  curse() { ensure(); const t = now(); osc("triangle", 180, t, 0.2, sfxGain, 0.2); osc("triangle", 140, t + 0.1, 0.25, sfxGain, 0.2); },
  fire() { ensure(); const t = now(); noise(t, 0.18, sfxGain, 0.35, 800); osc("sawtooth", 220, t, 0.15, sfxGain, 0.15); },
  unlock() { ensure(); const t = now(); osc("square", 400, t, 0.08, sfxGain, 0.2); osc("square", 600, t + 0.08, 0.1, sfxGain, 0.2); osc("square", 800, t + 0.16, 0.12, sfxGain, 0.18); }
};

export function sfxName(name) {
  if (typeof sfx[name] === "function") sfx[name]();
}
