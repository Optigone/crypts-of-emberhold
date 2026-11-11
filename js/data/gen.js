/** Seeded room-and-corridor dungeon generator. Deterministic for a given seed. */

export function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...parts) {
  let h = 2166136261;
  const s = parts.join(":");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const TILE = {
  WALL: "#",
  FLOOR: ".",
  DOOR: "+",
  SECRET: "s",
  LOCKED: "L",
  STAIR_UP: "<",
  STAIR_DOWN: ">",
  PIT: "o",
  SPINNER: "^",
  DARK: "*",
  WATER: "~",
  TRAP: "!",
  CHEST: "c",
  PATH: ",",
  TREE: "T",
  GRASS: "g",
  PLAZA: "p",
  MESSAGE: "m"
};

export function inBounds(grid, x, y) {
  x = Math.round(Number(x));
  y = Math.round(Number(y));
  return y >= 0 && y < grid.length && x >= 0 && x < (grid[y] ? grid[y].length : 0);
}

export function getTile(grid, x, y) {
  x = Math.round(Number(x));
  y = Math.round(Number(y));
  if (!inBounds(grid, x, y)) return TILE.WALL;
  return grid[y][x];
}

export function setTile(grid, x, y, ch) {
  if (!inBounds(grid, x, y)) return;
  const row = grid[y];
  grid[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

export function cloneGrid(grid) {
  return grid.map((r) => r);
}

function fill(w, h, ch) {
  return Array.from({ length: h }, () => ch.repeat(w));
}

function roomsOverlap(a, b, pad = 1) {
  return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x || a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
}

function roomCenter(r) {
  return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) };
}

function carveRoom(grid, r) {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) setTile(grid, x, y, TILE.FLOOR);
  }
}

function carveLine(grid, x0, y0, x1, y1) {
  let x = x0, y = y0;
  while (x !== x1) {
    setTile(grid, x, y, TILE.FLOOR);
    x += x1 > x ? 1 : -1;
  }
  while (y !== y1) {
    setTile(grid, x, y, TILE.FLOOR);
    y += y1 > y ? 1 : -1;
  }
  setTile(grid, x1, y1, TILE.FLOOR);
}

function placeDoors(grid, rooms) {
  const h = grid.length, w = grid[0].length;
  for (const r of rooms) {
    const edges = [];
    for (let x = r.x; x < r.x + r.w; x++) {
      edges.push({ x, y: r.y - 1, ix: x, iy: r.y });
      edges.push({ x, y: r.y + r.h, ix: x, iy: r.y + r.h - 1 });
    }
    for (let y = r.y; y < r.y + r.h; y++) {
      edges.push({ x: r.x - 1, y, ix: r.x, iy: y });
      edges.push({ x: r.x + r.w, y, ix: r.x + r.w - 1, iy: y });
    }
    for (const e of edges) {
      if (e.x <= 0 || e.y <= 0 || e.x >= w - 1 || e.y >= h - 1) continue;
      const t = getTile(grid, e.x, e.y);
      if (t !== TILE.WALL) continue;
      const beyondX = e.x + (e.x - e.ix);
      const beyondY = e.y + (e.y - e.iy);
      if (getTile(grid, beyondX, beyondY) === TILE.FLOOR && getTile(grid, e.ix, e.iy) === TILE.FLOOR) {
        setTile(grid, e.x, e.y, TILE.DOOR);
      }
    }
  }
}

/**
 * Generate a connected dungeon floor.
 * opts: { w, h, rooms, loops, secrets, pits, spinners, darkZones, water, traps, chests, locked, theme }
 */
export function generateFloor(seed, opts = {}) {
  const rng = typeof seed === "function" ? seed : mulberry32(seed >>> 0);
  const w = opts.w || 24;
  const h = opts.h || 24;
  const wantRooms = opts.rooms || 8;
  const grid = fill(w, h, TILE.WALL);
  const rooms = [];

  let attempts = 0;
  while (rooms.length < wantRooms && attempts < 240) {
    attempts++;
    const rw = 4 + Math.floor(rng() * 6);
    const rh = 4 + Math.floor(rng() * 5);
    const rx = 1 + Math.floor(rng() * (w - rw - 2));
    const ry = 1 + Math.floor(rng() * (h - rh - 2));
    const room = { x: rx, y: ry, w: rw, h: rh, i: rooms.length };
    if (rooms.some((o) => roomsOverlap(room, o, 1))) continue;
    rooms.push(room);
    carveRoom(grid, room);
  }

  if (rooms.length === 0) {
    const room = { x: 2, y: 2, w: w - 4, h: h - 4, i: 0 };
    rooms.push(room);
    carveRoom(grid, room);
  }

  // Connect rooms in a shuffled order, each to a previous one (MST-like), plus loops.
  const order = rooms.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let k = 1; k < order.length; k++) {
    const a = roomCenter(rooms[order[k]]);
    const prev = rooms[order[Math.floor(rng() * k)]];
    const b = roomCenter(prev);
    if (rng() < 0.5) {
      carveLine(grid, a.x, a.y, b.x, a.y);
      carveLine(grid, b.x, a.y, b.x, b.y);
    } else {
      carveLine(grid, a.x, a.y, a.x, b.y);
      carveLine(grid, a.x, b.y, b.x, b.y);
    }
  }
  const loops = opts.loops ?? 3;
  for (let i = 0; i < loops; i++) {
    const a = roomCenter(rooms[Math.floor(rng() * rooms.length)]);
    const b = roomCenter(rooms[Math.floor(rng() * rooms.length)]);
    if (rng() < 0.5) {
      carveLine(grid, a.x, a.y, b.x, a.y);
      carveLine(grid, b.x, a.y, b.x, b.y);
    } else {
      carveLine(grid, a.x, a.y, a.x, b.y);
      carveLine(grid, a.x, b.y, b.x, b.y);
    }
  }

  placeDoors(grid, rooms);

  const floors = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (getTile(grid, x, y) === TILE.FLOOR) floors.push({ x, y });
    }
  }

  const used = new Set();
  const mark = (x, y) => used.add(x + "," + y);
  const isFree = (x, y) => getTile(grid, x, y) === TILE.FLOOR && !used.has(x + "," + y);

  function pickFloor() {
    const pool = floors.filter((p) => isFree(p.x, p.y));
    if (!pool.length) return null;
    return pool[Math.floor(rng() * pool.length)];
  }

  // Secret rooms: bump a small alcove off a wall.
  const secrets = [];
  const secretCount = opts.secrets ?? 1;
  for (let i = 0; i < secretCount; i++) {
    let placed = false;
    for (let t = 0; t < 40 && !placed; t++) {
      const x = 2 + Math.floor(rng() * (w - 4));
      const y = 2 + Math.floor(rng() * (h - 4));
      if (getTile(grid, x, y) !== TILE.WALL) continue;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of dirs) {
        const fx = x + dx, fy = y + dy;
        const bx = x - dx, by = y - dy;
        if (getTile(grid, fx, fy) === TILE.FLOOR && getTile(grid, bx, by) === TILE.WALL) {
          const alcove = { x: bx, y: by };
          if (alcove.x <= 0 || alcove.y <= 0 || alcove.x >= w - 1 || alcove.y >= h - 1) continue;
          // expand 3x2 alcove if space
          setTile(grid, x, y, TILE.SECRET);
          setTile(grid, bx, by, TILE.FLOOR);
          if (getTile(grid, bx + dy, by + dx) === TILE.WALL && bx + dy > 0) setTile(grid, bx + dy, by + dx, TILE.FLOOR);
          secrets.push({ door: { x, y }, cell: alcove });
          mark(bx, by);
          placed = true;
          break;
        }
      }
    }
  }

  const features = { stairsUp: null, stairsDown: null, chests: [], pits: [], spinners: [], traps: [], dark: [], water: [], locked: [], messages: [] };

  // Stairs in first and last rooms (by placement order, which is reasonably spread).
  const upRoom = rooms[0];
  const downRoom = rooms[rooms.length - 1] === upRoom && rooms.length > 1 ? rooms[rooms.length - 2] : rooms[rooms.length - 1];
  const upC = roomCenter(upRoom);
  const downC = roomCenter(downRoom);
  if (opts.stairsUp !== false) {
    setTile(grid, upC.x, upC.y, TILE.STAIR_UP);
    mark(upC.x, upC.y);
    features.stairsUp = { x: upC.x, y: upC.y };
  }
  if (opts.stairsDown) {
    // nudge if same cell
    let dx = downC.x, dy = downC.y;
    if (dx === upC.x && dy === upC.y) {
      dx = Math.min(w - 3, downC.x + 1);
    }
    setTile(grid, dx, dy, TILE.STAIR_DOWN);
    mark(dx, dy);
    features.stairsDown = { x: dx, y: dy };
  }

  const chestCount = opts.chests ?? 3;
  for (let i = 0; i < chestCount; i++) {
    const p = pickFloor();
    if (!p) break;
    setTile(grid, p.x, p.y, TILE.CHEST);
    mark(p.x, p.y);
    features.chests.push({ x: p.x, y: p.y, loot: opts.lootMinor || "overworld", major: false });
  }
  // One chest in a secret alcove if possible
  if (secrets.length) {
    const s = secrets[0];
    setTile(grid, s.cell.x, s.cell.y, TILE.CHEST);
    features.chests.push({ x: s.cell.x, y: s.cell.y, loot: opts.lootMajor || opts.lootMinor || "overworld", major: true, secret: true });
  }

  const pitCount = opts.pits ?? 0;
  for (let i = 0; i < pitCount; i++) {
    const p = pickFloor();
    if (!p) break;
    setTile(grid, p.x, p.y, TILE.PIT);
    mark(p.x, p.y);
    features.pits.push(p);
  }

  const spinnerCount = opts.spinners ?? 0;
  for (let i = 0; i < spinnerCount; i++) {
    const p = pickFloor();
    if (!p) break;
    setTile(grid, p.x, p.y, TILE.SPINNER);
    mark(p.x, p.y);
    features.spinners.push(p);
  }

  const trapCount = opts.traps ?? 0;
  for (let i = 0; i < trapCount; i++) {
    const p = pickFloor();
    if (!p) break;
    // Traps are hidden: stay as floor visually, recorded in features
    mark(p.x, p.y);
    features.traps.push({ x: p.x, y: p.y, kind: rng() < 0.5 ? "dart" : "snare" });
  }

  const waterCount = opts.water ?? 0;
  for (let i = 0; i < waterCount; i++) {
    const p = pickFloor();
    if (!p) break;
    setTile(grid, p.x, p.y, TILE.WATER);
    mark(p.x, p.y);
    features.water.push(p);
    // maybe puddle neighbors
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (rng() < 0.4 && isFree(p.x + dx, p.y + dy)) {
        setTile(grid, p.x + dx, p.y + dy, TILE.WATER);
        mark(p.x + dx, p.y + dy);
        features.water.push({ x: p.x + dx, y: p.y + dy });
      }
    }
  }

  if (opts.darkZones) {
    // A few rooms become dark
    const n = Math.min(opts.darkZones, rooms.length);
    for (let i = 0; i < n; i++) {
      const r = rooms[Math.floor(rng() * rooms.length)];
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          if (getTile(grid, x, y) === TILE.FLOOR) {
            setTile(grid, x, y, TILE.DARK);
            features.dark.push({ x, y });
          }
        }
      }
    }
  }

  if (opts.locked) {
    // Turn some doors into locked doors
    const doors = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) if (getTile(grid, x, y) === TILE.DOOR) doors.push({ x, y });
    }
    const k = Math.min(opts.locked.count || 1, doors.length);
    for (let i = 0; i < k && doors.length; i++) {
      const idx = Math.floor(rng() * doors.length);
      const d = doors.splice(idx, 1)[0];
      setTile(grid, d.x, d.y, TILE.LOCKED);
      features.locked.push({ ...d, key: opts.locked.key || "bronze" });
    }
  }

  if (opts.message) {
    const p = pickFloor();
    if (p) {
      features.messages.push({ x: p.x, y: p.y, text: opts.message });
    }
  }

  return { grid, rooms, features, secrets, w, h };
}

export function walkableTile(ch, opts = {}) {
  const open = ".,p*gc<m^!";
  if (open.includes(ch)) return true;
  if (ch === ">" || ch === "<") return true;
  if (ch === "+") return !!opts.doorsOpen;
  if (ch === "L") return !!opts.unlocked;
  if (ch === "s") return !!opts.secretFound;
  if (ch === "o") return !!opts.levitate;
  if (ch === "~") return !!opts.levitate; // water is slow / blocks unless levitate? We'll allow wading
  if (ch === "c") return true;
  return false;
}

export const DIRS = [
  { x: 0, y: -1, name: "N", label: "North" },
  { x: 1, y: 0, name: "E", label: "East" },
  { x: 0, y: 1, name: "S", label: "South" },
  { x: -1, y: 0, name: "W", label: "West" }
];

export function leftDir(d) { return (d + 3) % 4; }
export function rightDir(d) { return (d + 1) % 4; }
export function backDir(d) { return (d + 2) % 4; }
