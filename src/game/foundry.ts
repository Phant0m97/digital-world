export type Order = { id: number; metal: "iron" | "copper"; item: string; pay: number; patience: number };

export type FoundryHud = {
  gold: number;
  ore: { iron: number; copper: number; coal: number };
  bars: { iron: number; copper: number };
  orders: Order[];
  note: string;
  smelt: number;
  forging: boolean;
  marker: number;
  strikes: number[];
  done: boolean;
  zone: string;
};

const KEY = "dw-foundry-v1";
const TILE = 48;
const MAP = [
  "####################",
  "#M..M......F.......#",
  "#..##..............#",
  "#..##....P.........#",
  "#......#####..A....#",
  "#..M...#........C..#",
  "#......#..U........#",
  "####################",
];

type Save = {
  gold: number;
  ore: FoundryHud["ore"];
  bars: FoundryHud["bars"];
  orders: Order[];
  heat: number;
  veins: number[];
  done: boolean;
  furnace: number;
  hammer: number;
};

let nextId = 1;

function makeOrder(): Order {
  const metal = Math.random() < 0.5 ? "iron" : "copper";
  const item = metal === "iron" ? (Math.random() < 0.5 ? "blade" : "hoe") : "lamp";
  return { id: nextId++, metal, item, pay: metal === "iron" ? 18 : 26, patience: 70 };
}

function fresh(): Save {
  return {
    gold: 0,
    ore: { iron: 0, copper: 0, coal: 1 },
    bars: { iron: 0, copper: 0 },
    orders: [makeOrder(), makeOrder(), makeOrder()],
    heat: 0,
    veins: MAP.flatMap((row, y) => [...row].map((cell, x) => (cell === "M" ? y * 20 + x : -1)).filter((id) => id >= 0)).map(() => 3),
    done: false,
    furnace: 0,
    hammer: 0,
  };
}

function load(): Save {
  const base = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Save;
    return { ...base, ...saved, ore: { ...base.ore, ...saved.ore }, bars: { ...base.bars, ...saved.bars }, orders: saved.orders?.length ? saved.orders : base.orders };
  } catch {
    return base;
  }
}

export function mountFoundry(canvas: HTMLCanvasElement, onHud: (hud: FoundryHud) => void) {
  const save = load();
  let gold = save.gold;
  const ore = { ...save.ore };
  const bars = { ...save.bars };
  let orders = save.orders.map((order) => ({ ...order }));
  let heat = save.heat;
  let smeltMetal: "iron" | "copper" = "iron";
  let veins = [...save.veins];
  let done = save.done;
  let furnace = save.furnace;
  let hammer = save.hammer;
  let px = 8 * TILE;
  let py = 3 * TILE;
  let note = "Mine the marked stone, smelt at the forge, strike at the anvil, sell at the counter.";
  let mining = 0;
  let forging = false;
  let marker = 0;
  let markerDir = 1;
  const strikes: number[] = [];
  const keys = new Set<string>();
  let zone = "Floor";

  function cell(cx: number, cy: number) {
    if (cy < 0 || cx < 0 || cy >= MAP.length || cx >= MAP[0]!.length) return "#";
    return MAP[cy]![cx]!;
  }
  function blocked(wx: number, wy: number) {
    return cell(Math.floor(wx / TILE), Math.floor(wy / TILE)) === "#";
  }
  function here() {
    return cell(Math.floor(px / TILE), Math.floor(py / TILE));
  }

  function hud() {
    const spot = here();
    zone = spot === "M" ? "Vein" : spot === "F" ? "Furnace" : spot === "A" ? "Anvil" : spot === "C" ? "Counter" : spot === "U" ? "Upgrades" : "Floor";
    onHud({
      gold,
      ore: { ...ore },
      bars: { ...bars },
      orders: orders.map((order) => ({ ...order })),
      note,
      smelt: heat,
      forging,
      marker,
      strikes: [...strikes],
      done,
      zone,
    });
  }

  function use() {
    const spot = here();
    if (spot === "M") {
      const index = veinIndex(Math.floor(px / TILE), Math.floor(py / TILE));
      if (index < 0 || veins[index]! <= 0) {
        note = "This vein is spent. Another will cool back.";
        hud();
        return;
      }
      mining = 0.8;
      return;
    }
    if (spot === "F") {
      if (heat > 0) {
        note = "The furnace is already working.";
        hud();
        return;
      }
      const metal = ore.iron > 0 ? "iron" : ore.copper > 0 ? "copper" : null;
      if (!metal || ore.coal <= 0) {
        note = "It wants ore and a piece of coal.";
        hud();
        return;
      }
      ore[metal] -= 1;
      ore.coal -= 1;
      smeltMetal = metal;
      heat = 7 - furnace * 1.4;
      note = `Smelting ${metal}.`;
      hud();
      return;
    }
    if (spot === "A") {
      if (!forging) {
        const metal = bars.iron > 0 ? "iron" : bars.copper > 0 ? "copper" : null;
        if (!metal) {
          note = "You need a bar on the anvil.";
          hud();
          return;
        }
        bars[metal] -= 1;
        forging = true;
        strikes.length = 0;
        marker = 0;
        note = `Strike the ${metal} when the mark sits in the bright band.`;
        hud();
        return;
      }
      strike();
      return;
    }
    if (spot === "C") {
      const ready = orders[0];
      if (!ready) {
        note = "No one is waiting.";
        hud();
        return;
      }
      if (!strikes.length) {
        note = `They want a ${ready.metal} ${ready.item}. Finish one on the anvil.`;
        hud();
        return;
      }
      const quality = strikes.reduce((sum, hit) => sum + hit, 0) / strikes.length;
      const pay = Math.round(ready.pay * (0.6 + quality));
      gold += pay;
      orders = orders.slice(1);
      orders.push(makeOrder());
      strikes.length = 0;
      if (gold >= 250) done = true;
      note = done ? `Paid ${pay}. The week is won.` : `Delivered. Paid ${pay}.`;
      hud();
      return;
    }
    if (spot === "U") {
      if (furnace < 2 && gold >= 40) {
        gold -= 40;
        furnace += 1;
        note = "The furnace runs hotter.";
      } else if (hammer < 2 && gold >= 35) {
        gold -= 35;
        hammer += 1;
        note = "The hammer's sweet spot is wider.";
      } else note = gold < 35 ? "Upgrades cost 40 then 35." : "The shop has nothing left.";
      hud();
      return;
    }
    note = "Walk onto a marked tile and use it.";
    hud();
  }

  function veinIndex(cx: number, cy: number) {
    let index = 0;
    for (let y = 0; y < MAP.length; y += 1) {
      for (let x = 0; x < MAP[0]!.length; x += 1) {
        if (MAP[y]![x] !== "M") continue;
        if (x === cx && y === cy) return index;
        index += 1;
      }
    }
    return -1;
  }

  function strike() {
    const center = 0.5;
    const width = 0.16 + hammer * 0.05;
    const score = Math.abs(marker - center) < width ? 1 : Math.abs(marker - center) < width * 2 ? 0.45 : 0.1;
    strikes.push(score);
    note = score > 0.8 ? "Clean hit." : score > 0.4 ? "A little off." : "That one rang wrong.";
    if (strikes.length >= 3) {
      forging = false;
      note = "The piece is done. Take it to the counter.";
    }
    hud();
  }

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") {
      keys.add(event.code);
      if (event.code === "KeyE" || event.code === "Space") {
        event.preventDefault();
        use();
      }
    } else keys.delete(event.code);
  }

  let raf = 0;
  let last = performance.now();
  let sinceSave = 0;
  let veinTimer = 0;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const viewW = Math.max(1, Math.floor(rect.width * dpr));
    const viewH = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== viewW || canvas.height !== viewH) {
      canvas.width = viewW;
      canvas.height = viewH;
    }
    let vx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    let vy = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    if (vx || vy) {
      const mag = Math.hypot(vx, vy);
      vx /= mag;
      vy /= mag;
    }
    const nx = px + vx * 150 * dt;
    const ny = py + vy * 150 * dt;
    if (!blocked(nx, py)) px = nx;
    if (!blocked(px, ny)) py = ny;
    if (mining > 0) {
      mining -= dt;
      if (mining <= 0) {
        const index = veinIndex(Math.floor(px / TILE), Math.floor(py / TILE));
        if (index >= 0 && veins[index]! > 0) {
          veins[index] -= 1;
          const roll = Math.random();
          if (roll < 0.45) ore.iron += 1;
          else if (roll < 0.75) ore.copper += 1;
          else ore.coal += 1;
          note = "The stone gives.";
          hud();
        }
      }
    }
    if (heat > 0) {
      heat -= dt;
      if (heat <= 0) {
        bars[smeltMetal] += 1;
        note = `A ${smeltMetal} bar is ready.`;
        hud();
      }
    }
    if (forging) {
      marker += markerDir * dt * 0.85;
      if (marker > 1 || marker < 0) {
        markerDir *= -1;
        marker = Math.max(0, Math.min(1, marker));
      }
    }
    orders = orders.map((order) => ({ ...order, patience: Math.max(0, order.patience - dt) }));
    orders = orders.filter((order) => {
      if (order.patience > 0) return true;
      note = `The ${order.item} order left.`;
      return false;
    });
    while (orders.length < 3) orders.push(makeOrder());
    veinTimer += dt;
    if (veinTimer > 12) {
      veinTimer = 0;
      veins = veins.map((left) => Math.min(3, left + (left < 3 ? 1 : 0)));
    }
    const cols = MAP[0]!.length;
    const rows = MAP.length;
    const scale = Math.max(rect.width / (cols * TILE), rect.height / (rows * TILE), 1);
    const camX = Math.max(0, Math.min(cols * TILE - rect.width / scale, px - rect.width / scale / 2));
    const camY = Math.max(0, Math.min(rows * TILE - rect.height / scale, py - rect.height / scale / 2));
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -camX * dpr * scale, -camY * dpr * scale);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const kind = MAP[y]![x]!;
        ctx.fillStyle = kind === "#" ? "#3a2e2a" : "#cbb59a";
        ctx.fillRect(x * TILE, y * TILE, TILE - 2, TILE - 2);
        if (kind === "M") {
          const index = veinIndex(x, y);
          ctx.fillStyle = veins[index]! > 0 ? "#8d97a3" : "#6a625c";
          ctx.fillRect(x * TILE + 12, y * TILE + 14, 22, 16);
        }
        if (kind === "F") {
          ctx.fillStyle = heat > 0 ? "#ff7a3a" : "#a33b24";
          ctx.fillRect(x * TILE + 10, y * TILE + 12, 26, 22);
        }
        if (kind === "A") {
          ctx.fillStyle = "#6e6a66";
          ctx.fillRect(x * TILE + 8, y * TILE + 16, 30, 14);
        }
        if (kind === "C") {
          ctx.fillStyle = "#d7b07a";
          ctx.fillRect(x * TILE + 8, y * TILE + 14, 30, 18);
        }
        if (kind === "U") {
          ctx.fillStyle = "#f2c14e";
          ctx.fillRect(x * TILE + 12, y * TILE + 12, 22, 22);
        }
      }
    }
    ctx.strokeStyle = "#141414";
    ctx.fillStyle = "#f4f0e6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py - 16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py - 9);
    ctx.lineTo(px, py + 8);
    ctx.moveTo(px, py - 2);
    ctx.lineTo(px - 10, py + 4);
    ctx.moveTo(px, py - 2);
    ctx.lineTo(px + 12, py - 6);
    ctx.moveTo(px, py + 8);
    ctx.lineTo(px - 7, py + 20);
    ctx.moveTo(px, py + 8);
    ctx.lineTo(px + 7, py + 20);
    ctx.stroke();
    ctx.fillStyle = "#ffb25a";
    ctx.fillRect(px - 4, py - 8, 8, 10);
    if (forging) hud();
    sinceSave += dt;
    if (sinceSave > 1.5) {
      sinceSave = 0;
      hud();
      sinceSave = 0;
      localStorage.setItem(KEY, JSON.stringify({ gold, ore, bars, orders, heat, veins, done, furnace, hammer }));
    }
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  hud();
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      localStorage.setItem(KEY, JSON.stringify({ gold, ore, bars, orders, heat, veins, done, furnace, hammer }));
    },
    use,
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
