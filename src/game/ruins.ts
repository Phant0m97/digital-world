export type RuinsHud = {
  hp: number;
  maxHp: number;
  gold: number;
  area: string;
  note: string;
  blade: number;
  won: boolean;
};

type Kind = "floor" | "wall" | "east" | "west" | "enemy" | "chest" | "boss" | "heal" | "shop";

type MapDef = {
  name: string;
  rows: string[];
};

const MAPS: Record<string, MapDef> = {
  camp: {
    name: "Camp",
    rows: [
      "####################",
      "#..................#",
      "#..H..........S....#",
      "#..................#",
      "#........P.........#",
      "#..................#",
      "#..............C...#",
      "#..................>",
      "####################",
    ],
  },
  wilds: {
    name: "Wilds",
    rows: [
      "####################",
      "<....E......###....#",
      "#........#....E....#",
      "#..C.....#.........#",
      "#........#....E....#",
      "#...E....#.........#",
      "#........###...C...>",
      "####################",
    ],
  },
  crypt: {
    name: "Crypt",
    rows: [
      "####################",
      "#........##........#",
      "#..E.....#....E....#",
      "#........#.........#",
      "<........#....B....#",
      "#........#.........#",
      "#...C....##...C....#",
      "####################",
    ],
  },
};

const LINKS: Record<string, { east?: string; west?: string }> = {
  camp: { east: "wilds" },
  wilds: { west: "camp", east: "crypt" },
  crypt: { west: "wilds" },
};

type Actor = { x: number; y: number; hp: number; max: number; kind: "enemy" | "boss"; cool: number };

type Save = {
  map: string;
  x: number;
  y: number;
  hp: number;
  gold: number;
  blade: number;
  opened: string[];
  won: boolean;
};

const KEY = "dw-ruins-v1";

function tileKind(char: string): Kind {
  if (char === "#") return "wall";
  if (char === ">") return "east";
  if (char === "<") return "west";
  if (char === "E") return "enemy";
  if (char === "C") return "chest";
  if (char === "B") return "boss";
  if (char === "H") return "heal";
  if (char === "S") return "shop";
  return "floor";
}

export function mountRuins(canvas: HTMLCanvasElement, onHud: (hud: RuinsHud) => void) {
  const tile = 42;
  let mapId = "camp";
  let px = 0;
  let py = 0;
  let hp = 6;
  const maxHp = 6;
  let gold = 0;
  let blade = 1;
  let note = "The crypt is east. Heal at the tent, buy a blade at the stall.";
  let won = false;
  let attack = 0;
  let hurt = 0;
  let facing = 1;
  const opened = new Set<string>();
  let actors: Actor[] = [];
  const keys = new Set<string>();

  function rows() {
    return MAPS[mapId]!.rows;
  }
  function height() {
    return rows().length;
  }
  function width() {
    return rows()[0]!.length;
  }
  function at(x: number, y: number) {
    if (y < 0 || x < 0 || y >= height() || x >= width()) return "wall" as Kind;
    return tileKind(rows()[y]![x]!);
  }
  function blocked(x: number, y: number) {
    return at(Math.floor(x / tile), Math.floor(y / tile)) === "wall";
  }

  function spawn(id: string, from?: "east" | "west") {
    mapId = id;
    actors = [];
    const grid = MAPS[id]!.rows;
    for (let y = 0; y < grid.length; y += 1) {
      for (let x = 0; x < grid[y]!.length; x += 1) {
        const kind = tileKind(grid[y]![x]!);
        if (kind === "enemy") actors.push({ x: x * tile + tile / 2, y: y * tile + tile / 2, hp: 3, max: 3, kind: "enemy", cool: 0 });
        if (kind === "boss") actors.push({ x: x * tile + tile / 2, y: y * tile + tile / 2, hp: 18, max: 18, kind: "boss", cool: 0 });
        if (!from && grid[y]![x] === "P") {
          px = x * tile + tile / 2;
          py = y * tile + tile / 2;
        }
        if (from === "west" && kind === "west") {
          px = (x + 1) * tile + tile / 2;
          py = y * tile + tile / 2;
        }
        if (from === "east" && kind === "east") {
          px = (x - 1) * tile + tile / 2;
          py = y * tile + tile / 2;
        }
      }
    }
  }

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Save;
      gold = saved.gold ?? 0;
      blade = saved.blade ?? 1;
      hp = saved.hp ?? maxHp;
      won = Boolean(saved.won);
      for (const id of saved.opened ?? []) opened.add(id);
      spawn(saved.map || "camp");
      if (saved.x) {
        px = saved.x;
        py = saved.y;
      }
    } else spawn("camp");
  } catch {
    spawn("camp");
  }

  function hud() {
    onHud({ hp, maxHp, gold, area: MAPS[mapId]!.name, note, blade, won });
  }

  function persist() {
    const save: Save = { map: mapId, x: px, y: py, hp, gold, blade, opened: [...opened], won };
    localStorage.setItem(KEY, JSON.stringify(save));
  }

  function swing() {
    if (attack > 0 || won) return;
    attack = 0.28;
    const reach = 36 + blade * 4;
    for (const actor of actors) {
      if (actor.hp <= 0) continue;
      const dx = actor.x - px;
      const dy = actor.y - py;
      if (Math.hypot(dx, dy) < reach && Math.sign(dx || facing) === facing) {
        actor.hp -= blade;
        if (actor.hp <= 0) {
          const drop = actor.kind === "boss" ? 40 : 6;
          gold += drop;
          note = actor.kind === "boss" ? "The crypt goes quiet." : `Dropped ${drop} gold.`;
          if (actor.kind === "boss") won = true;
        }
      }
    }
  }

  function useStation() {
    const tx = Math.floor(px / tile);
    const ty = Math.floor(py / tile);
    const kind = at(tx, ty);
    if (kind === "heal") {
      hp = maxHp;
      note = "The tent patches you up.";
    } else if (kind === "shop") {
      if (blade >= 4) note = "The blade is as sharp as it gets.";
      else if (gold < 20) note = "A better blade costs 20 gold.";
      else {
        gold -= 20;
        blade += 1;
        note = `Blade ${blade}. It hits harder.`;
      }
    } else if (kind === "chest") {
      const id = `${mapId}:${tx}:${ty}`;
      if (opened.has(id)) note = "Already empty.";
      else {
        opened.add(id);
        gold += 12;
        hp = Math.min(maxHp, hp + 2);
        note = "A pouch of gold and a bitter drink.";
      }
    } else note = "Nothing here. Face the wilds.";
    hud();
  }

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") {
      keys.add(event.code);
      if (event.code === "Space" || event.code === "KeyJ") {
        event.preventDefault();
        swing();
      }
      if (event.code === "KeyF") useStation();
    } else keys.delete(event.code);
  }

  let raf = 0;
  let last = performance.now();
  let sinceSave = 0;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (!won && hp > 0) {
      const left = keys.has("KeyA") || keys.has("ArrowLeft");
      const right = keys.has("KeyD") || keys.has("ArrowRight");
      const up = keys.has("KeyW") || keys.has("ArrowUp");
      const down = keys.has("KeyS") || keys.has("ArrowDown");
      let vx = (right ? 1 : 0) - (left ? 1 : 0);
      let vy = (down ? 1 : 0) - (up ? 1 : 0);
      if (vx || vy) {
        const mag = Math.hypot(vx, vy);
        vx /= mag;
        vy /= mag;
        if (vx) facing = vx > 0 ? 1 : -1;
      }
      const speed = 170;
      const nx = px + vx * speed * dt;
      const ny = py + vy * speed * dt;
      if (!blocked(nx, py)) px = nx;
      if (!blocked(px, ny)) py = ny;
      const cell = at(Math.floor(px / tile), Math.floor(py / tile));
      if (cell === "east" && LINKS[mapId]?.east) spawn(LINKS[mapId]!.east!, "west");
      if (cell === "west" && LINKS[mapId]?.west) spawn(LINKS[mapId]!.west!, "east");
      attack = Math.max(0, attack - dt);
      hurt = Math.max(0, hurt - dt);
      for (const actor of actors) {
        if (actor.hp <= 0) continue;
        actor.cool = Math.max(0, actor.cool - dt);
        const dx = px - actor.x;
        const dy = py - actor.y;
        const dist = Math.hypot(dx, dy);
        const chase = actor.kind === "boss" ? 280 : 190;
        if (dist < chase && dist > 8) {
          const step = (actor.kind === "boss" ? 70 : 85) * dt;
          const mx = actor.x + (dx / dist) * step;
          const my = actor.y + (dy / dist) * step;
          if (!blocked(mx, actor.y)) actor.x = mx;
          if (!blocked(actor.x, my)) actor.y = my;
        }
        if (dist < (actor.kind === "boss" ? 34 : 26) && actor.cool <= 0 && hurt <= 0) {
          hp -= actor.kind === "boss" ? 2 : 1;
          hurt = 0.7;
          actor.cool = 0.8;
          note = hp > 0 ? "That one lands." : "You drop. The camp pulls you back.";
          if (hp <= 0) {
            hp = maxHp;
            gold = Math.max(0, gold - 8);
            spawn("camp");
            note = "Back at camp, lighter by 8 gold.";
          }
        }
      }
    }
    const viewW = rect.width;
    const viewH = rect.height;
    const scale = Math.max(viewW / (width() * tile), viewH / (height() * tile), 1);
    const camX = Math.max(0, Math.min(width() * tile - viewW / scale, px - viewW / scale / 2));
    const camY = Math.max(0, Math.min(height() * tile - viewH / scale, py - viewH / scale / 2));
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -camX * dpr * scale, -camY * dpr * scale);
    ctx.fillStyle = "#1a2218";
    ctx.fillRect(camX, camY, viewW / scale, viewH / scale);
    for (let y = 0; y < height(); y += 1) {
      for (let x = 0; x < width(); x += 1) {
        const kind = at(x, y);
        ctx.fillStyle = kind === "wall" ? "#3c4638" : kind === "east" || kind === "west" ? "#6d5a32" : "#cbbd96";
        ctx.fillRect(x * tile, y * tile, tile - 1, tile - 1);
        if (kind === "heal") {
          ctx.fillStyle = "#d7dde3";
          ctx.fillRect(x * tile + 10, y * tile + 8, 20, 16);
        }
        if (kind === "shop") {
          ctx.fillStyle = "#f2c14e";
          ctx.fillRect(x * tile + 8, y * tile + 10, 24, 14);
        }
        if (kind === "chest" && !opened.has(`${mapId}:${x}:${y}`)) {
          ctx.fillStyle = "#8a5a2a";
          ctx.fillRect(x * tile + 10, y * tile + 14, 20, 14);
        }
      }
    }
    const drawStick = (x: number, y: number, color: string, face: number, big = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(big, big);
      ctx.strokeStyle = "#141414";
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -22, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 6);
      ctx.moveTo(0, -6);
      ctx.lineTo(-10 * face, 2);
      ctx.moveTo(0, -6);
      ctx.lineTo(12 * face, -2);
      ctx.moveTo(0, 6);
      ctx.lineTo(-7, 18);
      ctx.moveTo(0, 6);
      ctx.lineTo(7, 18);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(-3, -8, 6, 10);
      ctx.restore();
    };
    for (const actor of actors) {
      if (actor.hp <= 0) continue;
      drawStick(actor.x, actor.y, actor.kind === "boss" ? "#ff4d4d" : "#9b6bff", actor.x < px ? 1 : -1, actor.kind === "boss" ? 1.45 : 1);
    }
    if (hurt > 0 && Math.sin(now / 40) > 0) ctx.globalAlpha = 0.45;
    drawStick(px, py, "#2ee6ff", facing);
    ctx.globalAlpha = 1;
    if (attack > 0) {
      ctx.strokeStyle = "#f4f0e6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + facing * 16, py - 6, 16, facing > 0 ? -1 : Math.PI - 1, facing > 0 ? 1 : Math.PI + 1);
      ctx.stroke();
    }
    hud();
    sinceSave += dt;
    if (sinceSave > 1) {
      sinceSave = 0;
      persist();
    }
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      persist();
    },
    swing,
    useStation,
    nudge(x: number, y: number) {
      if (x < 0) keys.add("ArrowLeft");
      else keys.delete("ArrowLeft");
      if (x > 0) keys.add("ArrowRight");
      else keys.delete("ArrowRight");
      if (y < 0) keys.add("ArrowUp");
      else keys.delete("ArrowUp");
      if (y > 0) keys.add("ArrowDown");
      else keys.delete("ArrowDown");
    },
  };
}
