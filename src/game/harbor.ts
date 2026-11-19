export type HarborHud = {
  coins: number;
  hold: { name: string; pay: number }[];
  cap: number;
  rod: number;
  note: string;
  storm: boolean;
  done: boolean;
};

type Fish = { name: string; pay: number; deep: number };

const FISH: Fish[] = [
  { name: "minnow", pay: 4, deep: 0 },
  { name: "perch", pay: 9, deep: 0.15 },
  { name: "bass", pay: 16, deep: 0.35 },
  { name: "tuna", pay: 28, deep: 0.55 },
  { name: "moonfish", pay: 60, deep: 0.78 },
];

const KEY = "dw-harbor-v1";
const ISLANDS = [
  { x: 420, y: 380, r: 150 },
  { x: 980, y: 260, r: 120 },
  { x: 1500, y: 520, r: 180 },
  { x: 760, y: 980, r: 140 },
  { x: 1680, y: 1080, r: 160 },
];

type Save = { coins: number; cap: number; rod: number; done: boolean };

function load(): Save {
  const base: Save = { coins: 0, cap: 5, rod: 0, done: false };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...base, ...(JSON.parse(raw) as Save) } : base;
  } catch {
    return base;
  }
}

export function mountHarbor(canvas: HTMLCanvasElement, onHud: (hud: HarborHud) => void) {
  const save = load();
  let coins = save.coins;
  let cap = save.cap;
  let rod = save.rod;
  let done = save.done;
  let x = 280;
  let y = 760;
  let angle = -0.4;
  let speed = 0;
  const hold: { name: string; pay: number }[] = [];
  let note = "Sail out, cast, and sell the catch at the pier.";
  let storm = 0;
  let calm = 18;
  let cast: { left: number; bite: number; window: number } | null = null;
  const keys = new Set<string>();
  const worldW = 2100;
  const worldH = 1400;

  function depthAt(px: number, py: number) {
    let shore = 9999;
    for (const island of ISLANDS) shore = Math.min(shore, Math.hypot(px - island.x, py - island.y) - island.r);
    shore = Math.min(shore, px - 40, py - 40, worldW - 40 - px, worldH - 40 - py);
    return Math.max(0, Math.min(1, shore / 520));
  }

  function hud() {
    onHud({ coins, hold: hold.map((fish) => ({ ...fish })), cap, rod, note, storm: storm > 0, done });
  }

  function pickFish() {
    const deep = depthAt(x, y);
    const pool = FISH.filter((fish) => fish.deep <= deep + (storm > 0 ? 0.2 : 0));
    const bag = pool.length ? pool : [FISH[0]!];
    const roll = bag[Math.floor(Math.random() * bag.length)]!;
    if (storm > 0 && deep > 0.6 && Math.random() < 0.35) return FISH[4]!;
    return roll;
  }

  function castLine() {
    if (Math.hypot(x - 230, y - 820) < 150) {
      if (!hold.length) note = "Nothing to sell. The deep water pays better.";
      else {
        const pay = hold.reduce((sum, fish) => sum + fish.pay, 0);
        coins += pay;
        hold.length = 0;
        if (coins >= 400) done = true;
        note = done ? `Sold for ${pay}. The cutter is yours.` : `Sold the catch for ${pay}.`;
      }
      hud();
      return;
    }
    if (hold.length >= cap) {
      note = "The hold is full. Sell at the pier.";
      hud();
      return;
    }
    if (cast) {
      if (cast.bite <= 0 && cast.bite > -cast.window) {
        const fish = pickFish();
        hold.push(fish);
        note = `Caught a ${fish.name}.`;
        cast = null;
      } else note = cast.bite > 0 ? "Wait for the tug." : "It got away.";
      if (cast && cast.bite <= -cast.window) cast = null;
      hud();
      return;
    }
    if (speed > 28) {
      note = "Slow down before you cast.";
      hud();
      return;
    }
    cast = { left: 1.4 + Math.random() * 1.6 - rod * 0.25, bite: 0, window: 0.55 + rod * 0.18 };
    note = "Line is out.";
    hud();
  }

  function buy(kind: "hold" | "rod") {
    if (Math.hypot(x - 230, y - 820) > 170) {
      note = "Upgrades are sold on the pier.";
      hud();
      return;
    }
    if (kind === "hold") {
      if (cap >= 12) note = "The hold can't get bigger.";
      else if (coins < 70) note = "A bigger hold is 70.";
      else {
        coins -= 70;
        cap += 3;
        note = `Hold holds ${cap}.`;
      }
    } else if (rod >= 3) note = "That rod is as good as they sell.";
    else if (coins < 55) note = "A better rod is 55.";
    else {
      coins -= 55;
      rod += 1;
      note = `Rod ${rod}. Bites are easier.`;
    }
    hud();
  }

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") {
      keys.add(event.code);
      if (event.code === "KeyF" || event.code === "Space") {
        event.preventDefault();
        castLine();
      }
      if (event.code === "KeyH") buy("hold");
      if (event.code === "KeyR") buy("rod");
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
    const turn = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const thrust = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    angle += turn * 1.7 * dt;
    speed += thrust * 70 * dt;
    speed *= 1 - dt * 0.7;
    speed = Math.max(-20, Math.min(150, speed));
    if (storm > 0) {
      x += Math.sin(now / 300) * 18 * dt;
      y += Math.cos(now / 260) * 14 * dt;
    }
    x = Math.max(50, Math.min(worldW - 50, x + Math.cos(angle) * speed * dt));
    y = Math.max(50, Math.min(worldH - 50, y + Math.sin(angle) * speed * dt));
    for (const island of ISLANDS) {
      const dx = x - island.x;
      const dy = y - island.y;
      const dist = Math.hypot(dx, dy);
      if (dist < island.r + 16) {
        x = island.x + (dx / dist) * (island.r + 16);
        y = island.y + (dy / dist) * (island.r + 16);
        speed *= 0.4;
      }
    }
    if (cast) {
      cast.left -= dt;
      if (cast.left <= 0) cast.bite -= dt;
      if (cast.bite < -cast.window - 0.4) {
        cast = null;
        note = "The line went slack.";
        hud();
      }
    }
    calm -= dt;
    if (calm <= 0 && storm <= 0) {
      storm = 10;
      note = "A squall is on the water.";
      hud();
    }
    if (storm > 0) {
      storm -= dt;
      if (storm <= 0) {
        calm = 24;
        note = "The water settles.";
        hud();
      }
    }
    const viewW = rect.width;
    const viewH = rect.height;
    const camX = Math.max(0, Math.min(worldW - viewW, x - viewW / 2));
    const camY = Math.max(0, Math.min(worldH - viewH, y - viewH / 2));
    ctx.setTransform(dpr, 0, 0, dpr, -camX * dpr, -camY * dpr);
    ctx.fillStyle = storm > 0 ? "#1d4c63" : "#1f6f8a";
    ctx.fillRect(camX, camY, viewW, viewH);
    for (let i = 0; i < 18; i += 1) {
      ctx.strokeStyle = storm > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)";
      ctx.beginPath();
      const wy = ((i * 90 + now / 20) % worldH);
      ctx.moveTo(0, wy);
      ctx.quadraticCurveTo(worldW / 2, wy + Math.sin(now / 400 + i) * 10, worldW, wy);
      ctx.stroke();
    }
    ctx.fillStyle = "#d7c39a";
    ctx.fillRect(120, 760, 220, 28);
    ctx.fillStyle = "#8b5a32";
    for (let i = 0; i < 6; i += 1) ctx.fillRect(140 + i * 28, 788, 10, 36);
    ctx.fillStyle = "#e7d3ad";
    ctx.fillRect(150, 700, 70, 48);
    ctx.fillStyle = storm > 0 ? "#6e8f58" : "#7eaa62";
    for (const island of ISLANDS) {
      ctx.beginPath();
      ctx.moveTo(island.x + island.r, island.y);
      for (let i = 1; i <= 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const rad = island.r * (i % 2 ? 0.86 : 1);
        ctx.lineTo(island.x + Math.cos(a) * rad, island.y + Math.sin(a) * rad);
      }
      ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#f4f0e6";
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-16, 10);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#141414";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-2, -2, 5, 0, Math.PI * 2);
    ctx.moveTo(-2, 3);
    ctx.lineTo(-2, 12);
    ctx.stroke();
    ctx.restore();
    if (cast) {
      ctx.fillStyle = cast.bite <= 0 ? "#ff2bd6" : "#f4f0e6";
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 28, y + Math.sin(angle) * 28, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    sinceSave += dt;
    if (sinceSave > 1.5) {
      sinceSave = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, cap, rod, done }));
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
      localStorage.setItem(KEY, JSON.stringify({ coins, cap, rod, done }));
    },
    cast: castLine,
    buy,
    nudge(turn: number, thrust: number) {
      if (turn < 0) keys.add("ArrowLeft");
      else keys.delete("ArrowLeft");
      if (turn > 0) keys.add("ArrowRight");
      else keys.delete("ArrowRight");
      if (thrust > 0) keys.add("ArrowUp");
      else keys.delete("ArrowUp");
      if (thrust < 0) keys.add("ArrowDown");
      else keys.delete("ArrowDown");
    },
  };
}
