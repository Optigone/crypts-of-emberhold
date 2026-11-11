/** First-person view, auto-map, portraits, and monster art. */

import { DIRS, getTile, TILE } from "./data/gen.js";
import { THEMES, getMap, looksLikeWall, isDoorTile, eventAt } from "./data/maps.js";
import { CLASSES } from "./data/classes.js";
import { isVisited } from "./systems/state.js";

const DEPTH = 7;
const FOCAL = 0.86;

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function shadeHex(hex, k) {
  const [r, g, b] = hexToRgb(hex);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const m = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}

function cellAt(px, py, dir, forward, side) {
  const f = DIRS[dir];
  const r = DIRS[(dir + 1) % 4];
  return { x: px + f.x * forward + r.x * side, y: py + f.y * forward + r.y * side };
}

function projectX(worldX, dist, cx, H) {
  return cx + (worldX / Math.max(0.12, dist)) * FOCAL * H;
}
function projectY(worldZ, dist, cy, H) {
  return cy - (worldZ / Math.max(0.12, dist)) * FOCAL * H;
}

function lightK(dist, themeLight, hasLight, darkCell, flicker) {
  let k = themeLight * (1 / (1 + dist * 0.28));
  if (darkCell && !hasLight) k *= 0.08;
  else if (darkCell && hasLight) k *= 0.55;
  if (!hasLight && themeLight < 0.5) k *= 0.45;
  k *= flicker;
  return Math.max(0.02, Math.min(1.15, k));
}

function tileKind(map, x, y, ctx) {
  const ch = getTile(map.grid, x, y);
  const ev = eventAt(map, x, y);
  const secretFound = ctx.secrets && ctx.secrets.has(map.id + ":" + x + "," + y);
  const unlocked = ctx.unlocked && ctx.unlocked.has(map.id + ":" + x + "," + y);
  if (ch === "#" || ch === "T") return { wall: true, tree: ch === "T", ch };
  if (ch === "s" && !secretFound) return { wall: true, secret: true, ch };
  if (ch === "s" && secretFound) return { door: true, secret: true, open: true, ch };
  if (ch === "L" && !unlocked) return { door: true, locked: true, ch };
  if (ch === "L" && unlocked) return { door: true, open: true, ch };
  if (ch === "+") return { door: true, open: ev?.type === "gate" || ev?.type === "door" || ev?.type === "stairs" ? false : true, place: ev?.type, ch };
  if (ch === "*" ) return { floor: true, dark: true, ch };
  if (ch === "~") return { floor: true, water: true, ch };
  if (ch === "o") return { floor: true, pit: true, ch };
  if (ch === "^") return { floor: true, spinner: true, ch };
  if (ch === "<" || ch === ">") return { floor: true, stairs: ch, ch };
  if (ch === "c") return { floor: true, chest: true, ch };
  if (ch === "p" || ch === ",") return { floor: true, path: true, ch };
  if (ch === "g") return { floor: true, grass: true, ch };
  return { floor: true, ch };
}

export function renderView(ctx, state, opts = {}) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const map = getMap(state.mapId);
  const theme = THEMES[map.theme] || THEMES.crypt;
  const hasLight = !!opts.hasLight;
  const flicker = hasLight ? 0.96 + Math.sin((opts.time || 0) / 180) * 0.04 + Math.sin((opts.time || 0) / 70) * 0.02 : 1;
  const ctxInfo = { secrets: opts.secrets, unlocked: opts.unlocked };
  const px = opts.px ?? state.x;
  const py = opts.py ?? state.y;
  const dir = opts.dir ?? state.dir;
  const cx = W / 2;
  const cy = H * 0.48;

  // Sky / ceiling / floor backdrop
  if (theme.sky) {
    const g = ctx.createLinearGradient(0, 0, 0, cy);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, cy);
    // simple sun or ember
    ctx.fillStyle = "rgba(255,230,160,0.7)";
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.14, 18, 0, Math.PI * 2);
    ctx.fill();
    const g2 = ctx.createLinearGradient(0, cy, 0, H);
    g2.addColorStop(0, shadeHex(theme.floor, 0.9));
    g2.addColorStop(1, shadeHex(theme.floor2, 0.7));
    ctx.fillStyle = g2;
    ctx.fillRect(0, cy, W, H - cy);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, shadeHex(theme.ceil, 0.7));
    g.addColorStop(0.48, shadeHex(theme.fog, 1));
    g.addColorStop(1, shadeHex(theme.floor2, 0.8));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const nearOf = (F) => (F === 0 ? 0.18 : F - 0.5);
  const farOf = (F) => F + 0.5;

  // Draw far to near
  for (let F = DEPTH; F >= 0; F--) {
    const n = nearOf(F);
    const f = farOf(F);
    // sides from outside in, then center front walls
    const sides = [];
    for (let s = -4; s <= 4; s++) sides.push(s);

    // floors / ceilings of each cell
    for (const s of sides) {
      const cell = cellAt(px, py, dir, F, s);
      const kind = tileKind(map, cell.x, cell.y, ctxInfo);
      if (kind.wall) continue;
      const dark = kind.dark || (map.light === "dark" && !kind.path);
      const k = lightK(n + 0.4, theme.light, hasLight, dark && map.light === "dark", flicker);
      drawFloorCeil(ctx, theme, s, n, f, cx, cy, H, W, k, kind, map.theme);
    }

    // side walls (left face of cells on the right, right face of cells on the left... 
    // and the inward faces when adjacent cell is a wall)
    for (const s of sides) {
      const cell = cellAt(px, py, dir, F, s);
      // If this cell is a wall, draw its front face at near plane? That's for front walls.
      // Side wall: the wall between cell s and s-1, visible when one is wall and we're looking along
      const leftCell = cellAt(px, py, dir, F, s);
      const kind = tileKind(map, leftCell.x, leftCell.y, ctxInfo);
      // Right face of this cell (worldX = s+0.5) if THIS is wall and the cell to the right (s+1) is not? 
      // Better: for each cell that is a wall, draw faces that look toward the viewer corridor.

      // Draw the LEFT wall of cell (F,s) if that cell is open and the cell (F,s-1) is wall
      if (!kind.wall) {
        const west = cellAt(px, py, dir, F, s - 1);
        const wk = tileKind(map, west.x, west.y, ctxInfo);
        if (wk.wall || wk.door) {
          const dark = kind.dark;
          const kk = lightK((n + f) / 2, theme.light, hasLight, map.light === "dark" && dark, flicker);
          drawSideWall(ctx, theme, s - 0.5, n, f, cx, cy, H, kk, wk, false);
        }
        const east = cellAt(px, py, dir, F, s + 1);
        const ek = tileKind(map, east.x, east.y, ctxInfo);
        if (ek.wall || ek.door) {
          const dark = kind.dark;
          const kk = lightK((n + f) / 2, theme.light, hasLight, map.light === "dark" && dark, flicker);
          drawSideWall(ctx, theme, s + 0.5, n, f, cx, cy, H, kk, ek, true);
        }
      }
    }

    // Front walls: wall in this cell? That's wrong — front wall of corridor at depth F is the wall
    // at the far plane if the NEXT cell (F+1) is a wall, OR if THIS cell is a wall (then it's at near plane).
    for (const s of sides) {
      const here = cellAt(px, py, dir, F, s);
      const hk = tileKind(map, here.x, here.y, ctxInfo);
      if (hk.wall || hk.door) {
        // wall occupying this cell: draw front face at NEAR plane (we're looking at the near side)
        // Skip if F===0 and s===0 (we're standing in it — shouldn't be a wall)
        if (F === 0 && s === 0 && !hk.door) continue;
        const dist = n;
        const dark = false;
        const kk = lightK(dist, theme.light, hasLight, map.light === "dark", flicker);
        drawFrontWall(ctx, theme, s - 0.5, s + 0.5, dist, cx, cy, H, kk, hk);
      }
    }

    // Billboards in this cell (center)
    for (const s of sides) {
      const here = cellAt(px, py, dir, F, s);
      const hk = tileKind(map, here.x, here.y, ctxInfo);
      if (hk.wall) continue;
      const ev = eventAt(map, here.x, here.y);
      const dist = Math.max(0.35, (n + f) / 2);
      const kk = lightK(dist, theme.light, hasLight, map.light === "dark" && hk.dark, flicker);
      if (hk.chest || ev?.type === "chest") {
        if (!(ev?.once && opts.opened && opts.opened.has(ev.once))) {
          drawChest(ctx, s, dist, cx, cy, H, kk);
        }
      }
      if (hk.stairs || ev?.type === "stairs") {
        const down = hk.stairs === ">" || (ev?.label || "").toLowerCase().includes("down");
        drawStairs(ctx, s, dist, cx, cy, H, kk, down, theme);
      }
      if (ev?.type === "npc") drawNpc(ctx, s, dist, cx, cy, H, kk, ev.name);
      if (ev?.type === "boss" && !(opts.bosses && opts.bosses.has(ev.once))) {
        drawBossSilhouette(ctx, s, dist, cx, cy, H, kk);
      }
      if (ev?.type === "door" || ev?.type === "gate") {
        // already a door tile probably
      }
    }
  }

  // Vignette
  const vg = ctx.createRadialGradient(cx, cy, H * 0.15, cx, cy, H * 0.85);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (map.light === "dark" && !hasLight) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(230,200,140,0.8)";
    ctx.font = `600 ${Math.round(H * 0.045)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText("It's very dark. Light a torch, or cast Light.", cx, H * 0.9);
  }
}

function quad(ctx, pts, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawFloorCeil(ctx, theme, s, n, f, cx, cy, H, W, k, kind, themeId) {
  const xLn = projectX(s - 0.5, n, cx, H);
  const xRn = projectX(s + 0.5, n, cx, H);
  const xLf = projectX(s - 0.5, f, cx, H);
  const xRf = projectX(s + 0.5, f, cx, H);
  const yFn = projectY(-0.5, n, cy, H);
  const yFf = projectY(-0.5, f, cy, H);
  const yCn = projectY(0.5, n, cy, H);
  const yCf = projectY(0.5, f, cy, H);
  let floor = theme.floor;
  if (kind.grass) floor = "#3a5a28";
  if (kind.path) floor = "#6a5a40";
  if (kind.water) floor = "#1a3a4a";
  if (kind.pit) floor = "#040208";
  if (kind.spinner) floor = "#4a3a5a";
  if (kind.stairs) floor = shadeHex(theme.floor, 0.6);
  quad(ctx, [[xLn, yFn], [xRn, yFn], [xRf, yFf], [xLf, yFf]], shadeHex(floor, k * 0.9), shadeHex(theme.wallLine, k * 0.5));
  if (theme.ceil) {
    quad(ctx, [[xLn, yCn], [xRn, yCn], [xRf, yCf], [xLf, yCf]], shadeHex(theme.ceil, k * 0.75), shadeHex(theme.wallLine, k * 0.4));
  }
  if (kind.water) {
    ctx.strokeStyle = `rgba(140,200,220,${0.15 * k})`;
    ctx.beginPath();
    ctx.moveTo((xLn + xRn) / 2, yFn);
    ctx.lineTo((xLf + xRf) / 2, yFf);
    ctx.stroke();
  }
  if (kind.pit) {
    quad(ctx, [[xLn + 4, yFn], [xRn - 4, yFn], [xRf - 2, yFf], [xLf + 2, yFf]], "#000", "rgba(0,0,0,0.8)");
  }
}

function drawSideWall(ctx, theme, worldX, n, f, cx, cy, H, k, kind, /* rightFace */ _rf) {
  const xN = projectX(worldX, n, cx, H);
  const xF = projectX(worldX, f, cx, H);
  const yCn = projectY(0.5, n, cy, H);
  const yFn = projectY(-0.5, n, cy, H);
  const yCf = projectY(0.5, f, cy, H);
  const yFf = projectY(-0.5, f, cy, H);
  const col = kind.tree ? theme.wall[0] : theme.wall[Math.abs(Math.floor(worldX + 3)) % theme.wall.length];
  const fill = shadeHex(kind.door ? theme.door : col, k);
  quad(ctx, [[xN, yCn], [xN, yFn], [xF, yFf], [xF, yCf]], fill, shadeHex(theme.wallLine, k));
  // brick lines
  if (!kind.tree && !kind.door) {
    ctx.strokeStyle = shadeHex(theme.wallLine, k * 0.7);
    ctx.lineWidth = 1;
    const midY1 = (yCn + yFn) / 2;
    const midY2 = (yCf + yFf) / 2;
    ctx.beginPath();
    ctx.moveTo(xN, midY1);
    ctx.lineTo(xF, midY2);
    ctx.stroke();
  }
  if (kind.door) drawDoorPanel(ctx, [[xN, yCn], [xN, yFn], [xF, yFf], [xF, yCf]], theme, k, kind, true);
  if (kind.tree) {
    ctx.strokeStyle = shadeHex(theme.wallHi, k * 0.8);
    ctx.beginPath();
    ctx.moveTo((xN + xF) / 2, (yCn + yCf) / 2);
    ctx.lineTo((xN + xF) / 2, (yFn + yFf) / 2);
    ctx.stroke();
  }
}

function drawFrontWall(ctx, theme, leftX, rightX, dist, cx, cy, H, k, kind) {
  const xL = projectX(leftX, dist, cx, H);
  const xR = projectX(rightX, dist, cx, H);
  const yC = projectY(0.5, dist, cy, H);
  const yF = projectY(-0.5, dist, cy, H);
  const col = kind.tree ? theme.wall[1] : theme.wall[0];
  const fill = shadeHex(kind.door ? theme.door : col, k);
  quad(ctx, [[xL, yC], [xR, yC], [xR, yF], [xL, yF]], fill, shadeHex(theme.wallLine, k));
  if (!kind.door && !kind.tree) {
    ctx.strokeStyle = shadeHex(theme.wallHi, k * 0.45);
    ctx.lineWidth = 1;
    const rows = 4;
    for (let i = 1; i < rows; i++) {
      const y = yC + (yF - yC) * (i / rows);
      ctx.beginPath();
      ctx.moveTo(xL, y);
      ctx.lineTo(xR, y);
      ctx.stroke();
    }
    const mid = (xL + xR) / 2;
    ctx.beginPath();
    ctx.moveTo(mid, yC);
    ctx.lineTo(mid, yF);
    ctx.stroke();
  }
  if (kind.door) drawDoorPanel(ctx, [[xL, yC], [xR, yC], [xR, yF], [xL, yF]], theme, k, kind, false);
}

function drawDoorPanel(ctx, pts, theme, k, kind, side) {
  // Inset a door rectangle from the wall quad (axis-aligned-ish)
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  const insetX = w * 0.18;
  const insetY = h * 0.08;
  const x0 = minX + insetX, x1 = maxX - insetX;
  const y0 = minY + insetY, y1 = maxY - insetY * 0.2;
  ctx.fillStyle = shadeHex(theme.door, k * 0.85);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = shadeHex(theme.doorBand, k);
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // handle
  ctx.fillStyle = shadeHex(theme.doorBand, k);
  ctx.beginPath();
  ctx.arc(x1 - (x1 - x0) * 0.18, (y0 + y1) / 2, Math.max(2, (x1 - x0) * 0.04), 0, Math.PI * 2);
  ctx.fill();
  if (kind.locked) {
    ctx.fillStyle = shadeHex("#d0b050", k);
    ctx.font = `${Math.max(8, Math.floor(h * 0.16))}px Georgia`;
    ctx.textAlign = "center";
    ctx.fillText("🔒", (x0 + x1) / 2, (y0 + y1) / 2 + 4);
  }
  if (kind.secret) {
    ctx.strokeStyle = shadeHex(theme.wallHi, k * 0.8);
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.setLineDash([]);
  }
}

function billboardRect(s, dist, cx, cy, H, bw, bh, lift = -0.15) {
  const x0 = projectX(s - bw, dist, cx, H);
  const x1 = projectX(s + bw, dist, cx, H);
  const yBase = projectY(-0.5, dist, cy, H);
  const yTop = projectY(-0.5 + bh, dist, cy, H);
  return { x0, x1, yBase, yTop, w: x1 - x0, h: yBase - yTop };
}

function drawChest(ctx, s, dist, cx, cy, H, k) {
  const r = billboardRect(s, dist, cx, cy, H, 0.22, 0.28);
  ctx.fillStyle = shadeHex("#6a4424", k);
  ctx.fillRect(r.x0, r.yTop + r.h * 0.35, r.w, r.h * 0.65);
  ctx.fillStyle = shadeHex("#8a5a30", k);
  ctx.fillRect(r.x0 - r.w * 0.05, r.yTop, r.w * 1.1, r.h * 0.45);
  ctx.strokeStyle = shadeHex("#d0b050", k);
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x0, r.yTop + r.h * 0.35, r.w, r.h * 0.65);
  ctx.fillStyle = shadeHex("#d0b050", k);
  ctx.fillRect(r.x0 + r.w * 0.42, r.yTop + r.h * 0.5, r.w * 0.16, r.h * 0.2);
}

function drawStairs(ctx, s, dist, cx, cy, H, k, down, theme) {
  const r = billboardRect(s, dist, cx, cy, H, 0.28, 0.08, 0);
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const y = r.yBase - (down ? -1 : 1) * (t * 18) - 4;
    const inset = t * r.w * 0.15;
    ctx.fillStyle = shadeHex(theme.floor, k * (0.7 - t * 0.1));
    ctx.fillRect(r.x0 + inset, y, r.w - inset * 2, 5);
    ctx.strokeStyle = shadeHex(theme.wallLine, k);
    ctx.strokeRect(r.x0 + inset, y, r.w - inset * 2, 5);
  }
}

function drawNpc(ctx, s, dist, cx, cy, H, k, name) {
  const r = billboardRect(s, dist, cx, cy, H, 0.16, 0.7);
  ctx.fillStyle = shadeHex("#3a2a4a", k);
  ctx.fillRect(r.x0 + r.w * 0.2, r.yTop + r.h * 0.35, r.w * 0.6, r.h * 0.65);
  ctx.fillStyle = shadeHex("#e8d0b0", k);
  ctx.beginPath();
  ctx.arc((r.x0 + r.x1) / 2, r.yTop + r.h * 0.28, r.w * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shadeHex("#f0e8d0", k);
  ctx.font = `${Math.max(8, r.w * 0.35)}px Georgia`;
  ctx.textAlign = "center";
  ctx.fillText(name.split(" ")[0], (r.x0 + r.x1) / 2, r.yTop - 4);
}

function drawBossSilhouette(ctx, s, dist, cx, cy, H, k) {
  const r = billboardRect(s, dist, cx, cy, H, 0.28, 0.9);
  ctx.fillStyle = shadeHex("#1a1020", k);
  ctx.beginPath();
  ctx.moveTo((r.x0 + r.x1) / 2, r.yTop);
  ctx.lineTo(r.x1, r.yTop + r.h * 0.3);
  ctx.lineTo(r.x1 - r.w * 0.15, r.yBase);
  ctx.lineTo(r.x0 + r.w * 0.15, r.yBase);
  ctx.lineTo(r.x0, r.yTop + r.h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shadeHex("#d0b050", k);
  ctx.stroke();
}

/* ---------------- Automap ---------------- */

export function renderAutomap(ctx, state, opts = {}) {
  const map = getMap(state.mapId);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = "#0c0a0e";
  ctx.fillRect(0, 0, W, H);
  const pad = 16;
  const cell = Math.max(3, Math.min((W - pad * 2) / map.w, (H - pad * 2 - 28) / map.h));
  const ox = (W - map.w * cell) / 2;
  const oy = (H - map.h * cell) / 2 + 8;
  const theme = THEMES[map.theme] || THEMES.crypt;
  const showAll = !!opts.showAll;
  const mem = state.memory[map.id] || { visited: {} };

  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (!showAll && !mem.visited[x + "," + y]) continue;
      const ch = map.grid[y][x];
      const ev = eventAt(map, x, y);
      let col = shadeHex(theme.floor, 0.9);
      if (ch === "#" || ch === "T") col = shadeHex(theme.wall[0], 1.1);
      if (ch === "+" || ch === "L") col = "#c4a060";
      if (ch === "s") col = mem.visited[x + "," + y] && ev ? "#c4a060" : shadeHex(theme.wall[0], 1.1);
      if (ch === "<" || ch === ">" || ev?.type === "stairs") col = "#80d0e0";
      if (ch === "c" || ev?.type === "chest") col = "#d0a040";
      if (ch === "~") col = "#2a6080";
      if (ch === "o") col = "#100818";
      if (ch === "g") col = "#3a6a30";
      if (ch === ",") col = "#8a7a50";
      if (ch === "p") col = "#7a6a50";
      if (ev?.type === "door" || ev?.type === "gate") col = "#e0c070";
      if (ev?.type === "npc") col = "#e0a0d0";
      if (ev?.type === "boss") col = "#e07060";
      ctx.fillStyle = col;
      ctx.fillRect(ox + x * cell, oy + y * cell, Math.ceil(cell) - 0.5, Math.ceil(cell) - 0.5);
    }
  }
  // party
  const px = ox + state.x * cell + cell / 2;
  const py = oy + state.y * cell + cell / 2;
  ctx.fillStyle = "#f0e8c0";
  ctx.beginPath();
  ctx.arc(px, py, Math.max(2, cell * 0.35), 0, Math.PI * 2);
  ctx.fill();
  const d = DIRS[state.dir];
  ctx.strokeStyle = "#f0e8c0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + d.x * cell * 0.7, py + d.y * cell * 0.7);
  ctx.stroke();

  ctx.fillStyle = "#e8d5b0";
  ctx.font = "600 14px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(map.name, W / 2, 18);
}

export function renderMinimap(ctx, state, opts = {}) {
  const map = getMap(state.mapId);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(8,6,10,0.72)";
  ctx.fillRect(0, 0, W, H);
  const R = 8;
  const cell = Math.min(W, H) / (R * 2 + 1);
  const mem = state.memory[map.id] || { visited: {} };
  const theme = THEMES[map.theme] || THEMES.crypt;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const x = state.x + dx, y = state.y + dy;
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      if (!mem.visited[x + "," + y]) continue;
      const ch = map.grid[y][x];
      let col = "#8a7a64";
      if (ch === "#" || ch === "T") col = shadeHex(theme.wall[0], 1.35);
      if (ch === "+" || ch === "L" || ch === "<" || ch === ">") col = "#e0c070";
      if (ch === "p" || ch === ",") col = "#b89a6a";
      if (ch === "g") col = "#5a8a48";
      if (ch === "~") col = "#3a80a0";
      ctx.fillStyle = col;
      ctx.fillRect((dx + R) * cell, (dy + R) * cell, Math.max(2, cell - 0.4), Math.max(2, cell - 0.4));
    }
  }
  ctx.fillStyle = "#f0e8c0";
  const cx = (R + 0.5) * cell, cy = (R + 0.5) * cell;
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------- Compass ---------------- */

export function renderCompass(ctx, dir) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.4;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(20,14,10,0.7)";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c4a060";
  ctx.lineWidth = 2;
  ctx.stroke();
  const labels = ["N", "E", "S", "W"];
  ctx.fillStyle = "#e8d5b0";
  ctx.font = `700 ${Math.round(r * 0.45)}px Georgia`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labels[dir], cx, cy);
}

/* ---------------- Portraits & monsters ---------------- */

export function drawPortrait(ctx, ch, x, y, s) {
  const def = CLASSES[ch.cls] || CLASSES.warrior;
  const hue = ch.hue ?? 20;
  ctx.save();
  ctx.translate(x, y);
  // frame
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = Math.max(2, s * 0.04);
  ctx.strokeRect(1, 1, s - 2, s - 2);
  // bg
  ctx.fillStyle = `hsl(${hue}, 30%, 22%)`;
  ctx.fillRect(s * 0.08, s * 0.08, s * 0.84, s * 0.84);
  const skin = `hsl(${15 + (hue % 40)}, 40%, 70%)`;
  const hair = `hsl(${hue}, 50%, 30%)`;
  const cloth = def.color;
  // shoulders
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.95, s * 0.38, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.46, s * 0.22, s * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  // hair
  ctx.fillStyle = hair;
  if (ch.cls === "mage" || ch.cls === "cleric") {
    // hood
    ctx.fillStyle = shadeHex(cloth, 0.7);
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.4, s * 0.26, s * 0.28, 0, Math.PI, 0);
    ctx.fill();
  } else if (ch.cls === "warrior" || ch.cls === "paladin") {
    ctx.fillStyle = "#8a8a92";
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.4, s * 0.24, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.36, s * 0.24, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // eyes
  ctx.fillStyle = "#1a1010";
  ctx.beginPath();
  ctx.arc(s * 0.42, s * 0.48, s * 0.03, 0, Math.PI * 2);
  ctx.arc(s * 0.58, s * 0.48, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  if (ch.unconscious || ch.hp <= 0) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, s, s);
  }
  ctx.restore();
}

export function drawMonsterArt(ctx, art, w, h, t = 0) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h * 0.62);
  const s = Math.min(w, h) * 0.42;
  const bob = Math.sin(t / 400) * 3;
  ctx.translate(0, bob);
  const fn = MONSTER_DRAW[art] || MONSTER_DRAW.shade;
  fn(ctx, s, t);
  ctx.restore();
}

function ell(ctx, x, y, rx, ry, fill, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

const MONSTER_DRAW = {
  rat(ctx, s) {
    ell(ctx, 0, 0, s * 0.45, s * 0.28, "#6a4a3a", "#2a1a10");
    ell(ctx, s * 0.4, -s * 0.05, s * 0.22, s * 0.18, "#6a4a3a", "#2a1a10");
    ell(ctx, s * 0.52, -s * 0.08, s * 0.05, s * 0.04, "#1a1010");
    ctx.strokeStyle = "#6a4a3a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.quadraticCurveTo(-s * 0.8, s * 0.2, -s * 0.7, s * 0.4); ctx.stroke();
  },
  skeleton(ctx, s) {
    ctx.strokeStyle = "#e8e0d0"; ctx.fillStyle = "#e8e0d0"; ctx.lineWidth = 5;
    ell(ctx, 0, -s * 0.55, s * 0.28, s * 0.3, "#f0e8d8", "#c0b8a8");
    ctx.fillStyle = "#1a1010";
    ell(ctx, -s * 0.1, -s * 0.58, s * 0.06, s * 0.08, "#1a1010");
    ell(ctx, s * 0.1, -s * 0.58, s * 0.06, s * 0.08, "#1a1010");
    ctx.strokeStyle = "#e8e0d0";
    ctx.beginPath(); ctx.moveTo(0, -s * 0.25); ctx.lineTo(0, s * 0.3);
    ctx.moveTo(-s * 0.4, -s * 0.05); ctx.lineTo(s * 0.4, -s * 0.05);
    ctx.moveTo(0, s * 0.3); ctx.lineTo(-s * 0.25, s * 0.7);
    ctx.moveTo(0, s * 0.3); ctx.lineTo(s * 0.25, s * 0.7); ctx.stroke();
  },
  skeleton_helm(ctx, s) {
    MONSTER_DRAW.skeleton(ctx, s);
    ctx.fillStyle = "#6a6a72";
    ctx.beginPath(); ctx.arc(0, -s * 0.62, s * 0.3, Math.PI, 0); ctx.fill();
  },
  shade(ctx, s) {
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, s);
    g.addColorStop(0, "#7a50a0"); g.addColorStop(1, "rgba(30,10,40,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.quadraticCurveTo(s * 0.7, 0, 0, s * 0.9);
    ctx.quadraticCurveTo(-s * 0.7, 0, 0, -s * 0.8); ctx.fill();
    ell(ctx, -s * 0.12, -s * 0.35, s * 0.06, s * 0.08, "#e8d0ff");
    ell(ctx, s * 0.12, -s * 0.35, s * 0.06, s * 0.08, "#e8d0ff");
  },
  warden(ctx, s) {
    MONSTER_DRAW.skeleton_helm(ctx, s * 1.1);
    ctx.strokeStyle = "#c4a060"; ctx.lineWidth = 4;
    ctx.strokeRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.5);
  },
  bat(ctx, s) {
    ctx.fillStyle = "#3a2a4a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.8, -s * 0.6, -s * 0.9, 0);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.1, 0, 0);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.8, -s * 0.6, s * 0.9, 0);
    ctx.quadraticCurveTo(s * 0.4, s * 0.1, 0, 0);
    ctx.fill();
    ell(ctx, 0, 0, s * 0.16, s * 0.14, "#2a1a30", "#100810");
  },
  slime(ctx, s) {
    ell(ctx, 0, s * 0.1, s * 0.55, s * 0.4, "rgba(80,180,90,0.85)", "#2a5a30");
    ell(ctx, -s * 0.12, -s * 0.05, s * 0.08, s * 0.1, "#1a3018");
    ell(ctx, s * 0.16, -s * 0.02, s * 0.08, s * 0.1, "#1a3018");
    ell(ctx, -s * 0.2, -s * 0.15, s * 0.1, s * 0.07, "rgba(200,255,200,0.5)");
  },
  slime_yellow(ctx, s) {
    ell(ctx, 0, s * 0.1, s * 0.55, s * 0.4, "rgba(200,190,70,0.85)", "#6a5a20");
    ell(ctx, -s * 0.12, -s * 0.05, s * 0.08, s * 0.1, "#3a3010");
    ell(ctx, s * 0.16, -s * 0.02, s * 0.08, s * 0.1, "#3a3010");
  },
  beetle(ctx, s) {
    ell(ctx, 0, 0, s * 0.45, s * 0.32, "#2a3a28", "#101810");
    ctx.strokeStyle = "#1a2018"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, s * 0.3); ctx.stroke();
    ell(ctx, s * 0.4, -s * 0.1, s * 0.16, s * 0.14, "#2a3a28", "#101810");
  },
  mushroom(ctx, s) {
    ell(ctx, 0, s * 0.15, s * 0.18, s * 0.35, "#e8dcc0", "#8a7a60");
    ell(ctx, 0, -s * 0.15, s * 0.5, s * 0.28, "#c05060", "#6a2030");
    ell(ctx, -s * 0.1, s * 0.05, s * 0.05, s * 0.06, "#1a1010");
    ell(ctx, s * 0.1, s * 0.05, s * 0.05, s * 0.06, "#1a1010");
  },
  spider(ctx, s) {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = "#2a1a20"; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * s * 0.7, -s * 0.4 + i * s * 0.25);
        ctx.stroke();
      }
    }
    ell(ctx, 0, 0, s * 0.32, s * 0.26, "#3a2030", "#1a1018");
    ell(ctx, s * 0.28, -s * 0.05, s * 0.16, s * 0.14, "#3a2030", "#1a1018");
    ctx.fillStyle = "#e0c060";
    for (const x of [0.22, 0.32, 0.28, 0.18]) ell(ctx, s * x, -s * 0.12, 2, 2, "#e0c060");
  },
  queen_spider(ctx, s) {
    MONSTER_DRAW.spider(ctx, s * 1.15);
    ctx.fillStyle = "#c04070";
    ell(ctx, 0, 0, s * 0.2, s * 0.16, "rgba(180,40,80,0.5)");
  },
  frog(ctx, s) {
    ell(ctx, 0, s * 0.05, s * 0.5, s * 0.32, "#4a8a50", "#1a3a20");
    ell(ctx, -s * 0.22, -s * 0.22, s * 0.16, s * 0.16, "#4a8a50", "#1a3a20");
    ell(ctx, s * 0.22, -s * 0.22, s * 0.16, s * 0.16, "#4a8a50", "#1a3a20");
    ell(ctx, -s * 0.22, -s * 0.22, s * 0.06, s * 0.06, "#101810");
    ell(ctx, s * 0.22, -s * 0.22, s * 0.06, s * 0.06, "#101810");
  },
  crab(ctx, s) {
    ell(ctx, 0, 0, s * 0.45, s * 0.28, "#b05040", "#5a2018");
    ctx.strokeStyle = "#b05040"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(-s * 0.55, -s * 0.1, s * 0.2, 0.3, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.1, s * 0.2, 0, Math.PI - 0.3); ctx.stroke();
    ell(ctx, -s * 0.15, -s * 0.05, s * 0.06, s * 0.06, "#101010");
    ell(ctx, s * 0.15, -s * 0.05, s * 0.06, s * 0.06, "#101010");
  },
  drowned(ctx, s) {
    ctx.fillStyle = "#3a5a60";
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.7); ctx.lineTo(-s * 0.35, -s * 0.1); ctx.lineTo(s * 0.35, -s * 0.1); ctx.lineTo(s * 0.3, s * 0.7); ctx.fill();
    ell(ctx, 0, -s * 0.35, s * 0.22, s * 0.26, "#8aa0a0", "#304040");
    ell(ctx, -s * 0.08, -s * 0.36, s * 0.05, s * 0.06, "#102020");
    ell(ctx, s * 0.08, -s * 0.36, s * 0.05, s * 0.06, "#102020");
  },
  bellwisp(ctx, s) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 0.8);
    g.addColorStop(0, "rgba(200,220,255,0.9)"); g.addColorStop(1, "rgba(80,100,160,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill();
    ell(ctx, 0, 0, s * 0.2, s * 0.28, "rgba(230,240,255,0.8)");
  },
  bellwight(ctx, s) {
    MONSTER_DRAW.drowned(ctx, s);
    ctx.strokeStyle = "#d0b050"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -s * 0.7, s * 0.3, 0.2, Math.PI - 0.2); ctx.stroke();
  },
  wolf(ctx, s) {
    ell(ctx, 0, s * 0.1, s * 0.5, s * 0.25, "#6a6a70", "#2a2a30");
    ell(ctx, s * 0.4, -s * 0.05, s * 0.22, s * 0.18, "#6a6a70", "#2a2a30");
    ctx.fillStyle = "#6a6a70";
    ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.2); ctx.lineTo(s * 0.35, -s * 0.45); ctx.lineTo(s * 0.48, -s * 0.15); ctx.fill();
    ell(ctx, s * 0.5, -s * 0.08, s * 0.04, s * 0.04, "#101010");
  },
  sprite(ctx, s) {
    ctx.fillStyle = "#6aaa50";
    ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.25, s * 0.4); ctx.lineTo(-s * 0.25, s * 0.4); ctx.fill();
    ell(ctx, 0, -s * 0.45, s * 0.14, s * 0.16, "#d0f0c0", "#406030");
    ctx.fillStyle = "rgba(160,220,120,0.5)";
    ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.2, s * 0.2, s * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.3, -s * 0.2, s * 0.2, s * 0.1, 0.6, 0, Math.PI * 2); ctx.fill();
  },
  vine(ctx, s) {
    ctx.strokeStyle = "#3a6a30"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, s * 0.7); ctx.quadraticCurveTo(-s * 0.4, 0, 0, -s * 0.6);
    ctx.quadraticCurveTo(s * 0.4, 0, s * 0.1, s * 0.7); ctx.stroke();
    ctx.fillStyle = "#4a8a40";
    for (const p of [[-0.2, -0.2], [0.25, 0.1], [-0.1, 0.3]]) {
      ctx.beginPath(); ctx.ellipse(s * p[0], s * p[1], s * 0.12, s * 0.06, 0.5, 0, Math.PI * 2); ctx.fill();
    }
  },
  owlbeast(ctx, s) {
    ell(ctx, 0, 0, s * 0.4, s * 0.5, "#8a6a40", "#3a2a18");
    ell(ctx, -s * 0.15, -s * 0.15, s * 0.16, s * 0.18, "#f0e8c0", "#3a2a18");
    ell(ctx, s * 0.15, -s * 0.15, s * 0.16, s * 0.18, "#f0e8c0", "#3a2a18");
    ell(ctx, -s * 0.15, -s * 0.15, s * 0.06, s * 0.08, "#101010");
    ell(ctx, s * 0.15, -s * 0.15, s * 0.06, s * 0.08, "#101010");
    ctx.fillStyle = "#d0a040";
    ctx.beginPath(); ctx.moveTo(0, -s * 0.02); ctx.lineTo(-s * 0.08, s * 0.1); ctx.lineTo(s * 0.08, s * 0.1); ctx.fill();
  },
  hag(ctx, s) {
    ctx.fillStyle = "#3a4a30";
    ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.7); ctx.lineTo(-s * 0.2, -s * 0.1); ctx.lineTo(s * 0.2, -s * 0.1); ctx.lineTo(s * 0.45, s * 0.7); ctx.fill();
    ell(ctx, 0, -s * 0.3, s * 0.22, s * 0.26, "#c0c8a0", "#405030");
    ctx.fillStyle = "#6a3060";
    ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.26, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#c04070"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.2); ctx.lineTo(s * 0.4, s * 0.3); ctx.stroke();
  },
  imp(ctx, s) {
    ell(ctx, 0, s * 0.1, s * 0.3, s * 0.32, "#d06030", "#6a2010");
    ell(ctx, 0, -s * 0.28, s * 0.2, s * 0.2, "#d06030", "#6a2010");
    ctx.fillStyle = "#d06030";
    ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.4); ctx.lineTo(-s * 0.2, -s * 0.7); ctx.lineTo(0, -s * 0.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.4); ctx.lineTo(s * 0.2, -s * 0.7); ctx.lineTo(0, -s * 0.4); ctx.fill();
    ell(ctx, -s * 0.07, -s * 0.3, 3, 4, "#201000");
    ell(ctx, s * 0.07, -s * 0.3, 3, 4, "#201000");
  },
  cinderbat(ctx, s) {
    MONSTER_DRAW.bat(ctx, s);
    ctx.fillStyle = "rgba(230,100,40,0.45)";
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
  },
  golem(ctx, s) {
    ctx.fillStyle = "#6a5a52";
    ctx.fillRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.9);
    ctx.fillStyle = "#8a7a70";
    ctx.fillRect(-s * 0.28, -s * 0.7, s * 0.56, s * 0.42);
    ell(ctx, -s * 0.12, -s * 0.52, 4, 5, "#e07030");
    ell(ctx, s * 0.12, -s * 0.52, 4, 5, "#e07030");
  },
  magmabug(ctx, s) {
    MONSTER_DRAW.beetle(ctx, s);
    ctx.fillStyle = "rgba(230,80,30,0.5)";
    ell(ctx, 0, 0, s * 0.25, s * 0.16, "rgba(230,80,30,0.5)");
  },
  colossus(ctx, s) {
    MONSTER_DRAW.golem(ctx, s * 1.2);
    ctx.fillStyle = "#e07030";
    ctx.fillRect(-s * 0.08, -s * 0.1, s * 0.16, s * 0.5);
  },
  hollow(ctx, s) {
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(-s * 0.32, -s * 0.15, s * 0.64, s * 0.8);
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(-s * 0.22, -s * 0.65, s * 0.44, s * 0.5);
    ctx.fillStyle = "#d0b050";
    ctx.fillRect(-s * 0.22, -s * 0.4, s * 0.44, 4);
    ell(ctx, -s * 0.08, -s * 0.48, 3, 4, "#e8d080");
    ell(ctx, s * 0.08, -s * 0.48, 3, 4, "#e8d080");
  },
  moth(ctx, s) {
    ctx.fillStyle = "rgba(60,40,80,0.8)";
    ctx.beginPath(); ctx.ellipse(-s * 0.4, 0, s * 0.4, s * 0.55, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.4, 0, s * 0.4, s * 0.55, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(200,180,255,0.5)";
    ctx.beginPath(); ctx.ellipse(-s * 0.4, 0, s * 0.25, s * 0.35, -0.3, 0, Math.PI * 2); ctx.stroke();
    ell(ctx, 0, 0, s * 0.1, s * 0.28, "#2a1a30");
  },
  echo(ctx, s) {
    MONSTER_DRAW.shade(ctx, s);
    ctx.strokeStyle = "rgba(160,140,220,0.6)"; ctx.lineWidth = 2;
    ctx.strokeRect(-s * 0.35, -s * 0.2, s * 0.7, s * 0.15);
  },
  crownguard(ctx, s) {
    MONSTER_DRAW.hollow(ctx, s);
    ctx.fillStyle = "#d0b050";
    ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.65); ctx.lineTo(0, -s * 0.95); ctx.lineTo(s * 0.2, -s * 0.65); ctx.fill();
  },
  king(ctx, s) {
    MONSTER_DRAW.crownguard(ctx, s * 1.15);
    const g = ctx.createRadialGradient(0, -s * 0.4, 4, 0, 0, s);
    g.addColorStop(0, "rgba(200,160,60,0.3)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
  },
  brigand(ctx, s) {
    ctx.fillStyle = "#4a3a30";
    ctx.fillRect(-s * 0.28, -s * 0.05, s * 0.56, s * 0.7);
    ell(ctx, 0, -s * 0.32, s * 0.2, s * 0.24, "#e0c0a0", "#4a3020");
    ctx.fillStyle = "#2a1a10";
    ctx.beginPath(); ctx.arc(0, -s * 0.4, s * 0.2, Math.PI, 0); ctx.fill();
  },
  boar(ctx, s) {
    ell(ctx, 0, s * 0.05, s * 0.5, s * 0.28, "#6a4a38", "#3a2a20");
    ell(ctx, s * 0.4, 0, s * 0.22, s * 0.2, "#6a4a38", "#3a2a20");
    ctx.strokeStyle = "#e8e0d0"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(s * 0.45, s * 0.05); ctx.lineTo(s * 0.65, s * 0.2); ctx.stroke();
  },
  flicker(ctx, s) {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, s * 0.8);
    g.addColorStop(0, "#fff0c0"); g.addColorStop(0.4, "#e07030"); g.addColorStop(1, "rgba(200,80,20,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill();
  },
  guardian(ctx, s) {
    ctx.fillStyle = "#8a8070";
    ctx.fillRect(-s * 0.35, -s * 0.2, s * 0.7, s * 0.8);
    ctx.fillStyle = "#c0b8a0";
    ctx.fillRect(-s * 0.25, -s * 0.6, s * 0.5, s * 0.42);
    ell(ctx, -s * 0.1, -s * 0.42, 4, 5, "#80c0e0");
    ell(ctx, s * 0.1, -s * 0.42, 4, 5, "#80c0e0");
  },
  emberspirit(ctx, s) {
    MONSTER_DRAW.flicker(ctx, s * 1.2);
    ctx.fillStyle = "rgba(255,240,200,0.8)";
    ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.quadraticCurveTo(s * 0.4, 0, 0, s * 0.6);
    ctx.quadraticCurveTo(-s * 0.4, 0, 0, -s * 0.5); ctx.fill();
  }
};

export function drawAppIcon(ctx, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#2a1c18");
  g.addColorStop(1, "#0c0806");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // arch
  ctx.fillStyle = "#3a2e28";
  ctx.fillRect(s * 0.15, s * 0.45, s * 0.7, s * 0.5);
  ctx.fillStyle = "#1a1210";
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.95);
  ctx.lineTo(s * 0.22, s * 0.5);
  ctx.quadraticCurveTo(s * 0.5, s * 0.18, s * 0.78, s * 0.5);
  ctx.lineTo(s * 0.78, s * 0.95);
  ctx.fill();
  ctx.strokeStyle = "#c4a060";
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.95);
  ctx.lineTo(s * 0.22, s * 0.5);
  ctx.quadraticCurveTo(s * 0.5, s * 0.18, s * 0.78, s * 0.5);
  ctx.lineTo(s * 0.78, s * 0.95);
  ctx.stroke();
  // flame
  const flame = ctx.createRadialGradient(s * 0.5, s * 0.58, 1, s * 0.5, s * 0.58, s * 0.22);
  flame.addColorStop(0, "#fff0c0");
  flame.addColorStop(0.35, "#e07030");
  flame.addColorStop(1, "rgba(180,40,10,0)");
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.32);
  ctx.quadraticCurveTo(s * 0.66, s * 0.55, s * 0.5, s * 0.78);
  ctx.quadraticCurveTo(s * 0.34, s * 0.55, s * 0.5, s * 0.32);
  ctx.fill();
}

export { DIRS };
