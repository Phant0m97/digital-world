import { useWorld } from "@/lib/store";

export type BlackoutHud = {
  hp: number;
  power: number;
  kills: number;
  players: number;
  note: string;
};

type Building = { x: number; y: number; w: number; h: number };
type Seg = { ax: number; ay: number; bx: number; by: number };
type Bullet = { x: number; y: number; vx: number; vy: number; life: number; mine: boolean };
type Remote = {
  id: string;
  name: string;
  x: number;
  y: number;
  aim: number;
  hp: number;
  power: number;
  seq: number;
  seen: number;
  shot: number;
};

const WORLD = 3400;
const RELAYS = ["wss://relay.primal.net", "wss://offchain.pub", "wss://nos.lol"];
const buildings = makeMap();
const walls = buildings.flatMap((b) => [
  { ax: b.x, ay: b.y, bx: b.x + b.w, by: b.y },
  { ax: b.x + b.w, ay: b.y, bx: b.x + b.w, by: b.y + b.h },
  { ax: b.x + b.w, ay: b.y + b.h, bx: b.x, by: b.y + b.h },
  { ax: b.x, ay: b.y + b.h, bx: b.x, by: b.y },
]);

export function mountBlackout(canvas: HTMLCanvasElement, onHud: (hud: BlackoutHud) => void) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {}, nudge() {} };
  const pen = ctx;
  const spot = spawnPoint();
  let x = spot.x;
  let y = spot.y;
  let aim = 0;
  let hp = 100;
  let power = 1;
  let kills = 0;
  let note = "One map. You only see the beam in front of you.";
  const keys = new Set<string>();
  const remotes = new Map<string, Remote>();
  const bullets: Bullet[] = [];
  const seenHits = new Set<string>();
  const seenDeaths = new Set<string>();
  let shotId = 1;
  let cooldown = 0;
  let shooting = false;
  let stickX = 0;
  let stickY = 0;
  let selfId = "";
  let closed = false;
  let closer: { close: () => void } | null = null;

  let outbound = (_body: Record<string, unknown>) => {};
  const session = startNet((msg) => {
    if (closed || !msg || msg.id === selfId) return;
    if (msg.t === "s") {
      const prev = remotes.get(msg.id);
      if (prev && msg.seq < prev.seq) return;
      const remote: Remote = {
        id: msg.id,
        name: msg.n || "Player",
        x: msg.x,
        y: msg.y,
        aim: msg.a,
        hp: msg.hp,
        power: msg.pow,
        seq: msg.seq,
        seen: performance.now(),
        shot: prev?.shot ?? 0,
      };
      if (msg.f && msg.f > remote.shot) {
        remote.shot = msg.f;
        const speed = 560;
        bullets.push({
          x: msg.x + Math.cos(msg.a) * 18,
          y: msg.y + Math.sin(msg.a) * 18,
          vx: Math.cos(msg.a) * speed,
          vy: Math.sin(msg.a) * speed,
          life: 0.45,
          mine: false,
        });
      }
      remotes.set(msg.id, remote);
    } else if (msg.t === "h" && msg.v === selfId && msg.i && !seenHits.has(msg.i)) {
      seenHits.add(msg.i);
      hp = Math.max(0, hp - msg.d);
      if (hp <= 0) {
        power = 1;
        hp = 100;
        const next = spawnPoint();
        x = next.x;
        y = next.y;
        note = "You died. Strength reset.";
        outbound({ t: "d", id: selfId, k: msg.id, i: msg.i });
      }
    } else if (msg.t === "d" && msg.k === selfId && msg.i && !seenDeaths.has(msg.i)) {
      seenDeaths.add(msg.i);
      power = Math.min(8, power + 1);
      kills += 1;
      note = `Kill. Strength ${power}.`;
    }
  });
  outbound = (body) => session.send(body);
  void session.then((started) => {
    selfId = started.id;
    closer = started;
  });

  function hud() {
    const key = `${hp}|${power}|${kills}|${remotes.size}|${note}`;
    if (key === hudKey) return;
    hudKey = key;
    onHud({ hp, power, kills, players: remotes.size + 1, note });
  }

  function fire() {
    if (cooldown > 0 || hp <= 0) return;
    cooldown = Math.max(0.12, 0.34 - power * 0.025);
    const speed = 560;
    bullets.push({ x: x + Math.cos(aim) * 18, y: y + Math.sin(aim) * 18, vx: Math.cos(aim) * speed, vy: Math.sin(aim) * speed, life: 0.55, mine: true });
    shotId += 1;
    pendingShot = shotId;
  }

  let pendingShot = 0;
  let seq = 0;
  let lastSend = 0;
  let hudKey = "";

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") keys.add(event.code);
    else keys.delete(event.code);
    if (event.type === "keydown" && (event.code === "Space" || event.code === "KeyJ")) {
      event.preventDefault();
      shooting = true;
    }
    if (event.type === "keyup" && (event.code === "Space" || event.code === "KeyJ")) shooting = false;
  }
  function onAim(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    aim = Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2);
    shooting = event.buttons > 0;
  }
  function onUp() {
    shooting = false;
  }

  let raf = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
    }
    const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const speed = 168 + power * 14;
    const next = slide(x, y, (strafe + stickX) * speed * dt, (-forward + stickY) * speed * dt);
    x = next.x;
    y = next.y;
    cooldown = Math.max(0, cooldown - dt);
    if (shooting) fire();
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i]!;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life <= 0 || blocked(bullet.x, bullet.y, 0)) {
        bullets.splice(i, 1);
        continue;
      }
      if (!bullet.mine) continue;
      for (const remote of remotes.values()) {
        if (Math.hypot(bullet.x - remote.x, bullet.y - remote.y) < 16) {
          const nonce = `${selfId}-${shotId}-${remote.id}`;
          if (!seenHits.has(nonce)) {
            seenHits.add(nonce);
            outbound({ t: "h", id: selfId, v: remote.id, d: 16 + power * 10, i: nonce });
          }
          bullets.splice(i, 1);
          break;
        }
      }
    }
    for (const [id, remote] of remotes) {
      if (now - remote.seen > 2500) remotes.delete(id);
    }
    if (selfId && now - lastSend > 120) {
      lastSend = now;
      seq += 1;
      const name = useWorld.getState().profile?.username || "Guest";
      outbound({
        t: "s",
        id: selfId,
        n: name,
        x: Math.round(x),
        y: Math.round(y),
        a: Math.round(aim * 100) / 100,
        hp,
        pow: power,
        seq,
        f: pendingShot,
      });
    }
    draw(pen, width, height, ratio, x, y, aim, power, bullets, remotes);
    hud();
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  canvas.addEventListener("pointerdown", onAim);
  canvas.addEventListener("pointermove", onAim);
  window.addEventListener("pointerup", onUp);
  raf = requestAnimationFrame(frame);
  hud();

  return {
    destroy() {
      closed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("pointerdown", onAim);
      canvas.removeEventListener("pointermove", onAim);
      window.removeEventListener("pointerup", onUp);
      closer?.close();
    },
    nudge(mx: number, my: number) {
      stickX = mx;
      stickY = my;
    },
  };
}

function startNet(onMessage: (msg: Packet) => void) {
  let publish = (_body: Record<string, unknown>) => {};
  const ready = (async () => {
    const { generateSecretKey, getPublicKey, finalizeEvent } = await import("nostr-tools/pure");
    const { bytesToHex, hexToBytes } = await import("nostr-tools/utils");
    const { SimplePool } = await import("nostr-tools/pool");
    const saved = localStorage.getItem("dw-chat-sk");
    const sk = saved && /^[0-9a-f]{64}$/i.test(saved) ? hexToBytes(saved) : generateSecretKey();
    if (!saved) localStorage.setItem("dw-chat-sk", bytesToHex(sk));
    const id = getPublicKey(sk);
    const pool = new SimplePool();
    publish = (body) => {
      const event = finalizeEvent(
        { kind: 21111, created_at: Math.floor(Date.now() / 1000), tags: [["t", "dw-blackout"]], content: JSON.stringify(body) },
        sk,
      );
      pool.publish(RELAYS, event);
    };
    const sub = pool.subscribe(
      RELAYS,
      { kinds: [21111], "#t": ["dw-blackout"], since: Math.floor(Date.now() / 1000) - 4 },
      {
        onevent(event) {
          try {
            onMessage(JSON.parse(event.content) as Packet);
          } catch {
            /* ignore bad packets */
          }
        },
      },
    );
    return {
      id,
      close() {
        sub.close();
      },
    };
  })();
  return {
    then: ready.then.bind(ready),
    send(body: Record<string, unknown>) {
      publish(body);
    },
  };
}

type Packet = {
  t: "s" | "h" | "d";
  id: string;
  n?: string;
  x: number;
  y: number;
  a: number;
  hp: number;
  pow: number;
  seq: number;
  f?: number;
  v?: string;
  d: number;
  k?: string;
  i?: string;
};

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ratio: number,
  x: number,
  y: number,
  aim: number,
  power: number,
  bullets: Bullet[],
  remotes: Map<string, Remote>,
) {
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, width, height);
  const range = 250 + power * 42;
  const fov = 0.78 + power * 0.02;
  const poly = beam(x, y, aim, fov, range);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.beginPath();
  poly.forEach((point, index) => {
    const px = point.x - x;
    const py = point.y - y;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.clip();
  ctx.translate(-x, -y);
  ctx.fillStyle = "#242833";
  ctx.fillRect(x - width, y - height, width * 2, height * 2);
  ctx.strokeStyle = "#31384a";
  ctx.lineWidth = 1;
  for (let gx = Math.floor((x - width) / 48) * 48; gx < x + width; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, y - height);
    ctx.lineTo(gx, y + height);
    ctx.stroke();
  }
  for (const building of buildings) {
    if (building.x > x + range + 200 || building.y > y + range + 200 || building.x + building.w < x - range - 200 || building.y + building.h < y - range - 200) continue;
    const index = buildings.indexOf(building);
    ctx.fillStyle = "#d9c7a4";
    ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.fillStyle = "#c4b08a";
    for (let row = building.y + 14; row < building.y + building.h - 8; row += 16) {
      ctx.fillRect(building.x + 4, row, building.w - 8, 3);
    }
    ctx.fillStyle = "#8b5a32";
    ctx.fillRect(building.x + building.w / 2 - 11, building.y + building.h - 26, 22, 26);
    ctx.fillStyle = "#5a3b28";
    ctx.fillRect(building.x + building.w / 2 - 2, building.y + building.h - 14, 3, 3);
    const time = performance.now() / 1000;
    for (let wx = building.x + 16; wx < building.x + building.w - 18; wx += 22) {
      const lit = Math.sin(time * 0.85 + index * 1.7 + wx * 0.01) > 0.35;
      ctx.fillStyle = "#1c2126";
      ctx.fillRect(wx - 2, building.y + 20, 14, 12);
      ctx.fillStyle = lit ? "#ffe27a" : "#6aa8c4";
      ctx.fillRect(wx, building.y + 22, 10, 8);
      if (lit) {
        ctx.fillStyle = "rgba(255, 214, 120, 0.28)";
        ctx.beginPath();
        ctx.arc(wx + 5, building.y + 26, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const lampOn = Math.sin(time * 1.4 + index) > 0.15;
    if (lampOn) {
      ctx.fillStyle = "#2a3138";
      ctx.fillRect(building.x - 6, building.y + 8, 4, 18);
      ctx.fillStyle = "#fff6ea";
      ctx.beginPath();
      ctx.arc(building.x - 4, building.y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 236, 180, 0.22)";
      ctx.beginPath();
      ctx.arc(building.x - 4, building.y + 6, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const remote of remotes.values()) {
    person(ctx, remote.x, remote.y, remote.aim, "#ff8a3d", remote.name);
  }
  for (const bullet of bullets) {
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  person(ctx, x, y, aim, "#2ec8e6", "");
  ctx.restore();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, aim: number, color: string, name: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#16161c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(aim) * 16, Math.sin(aim) * 16);
  ctx.stroke();
  if (name) {
    ctx.fillStyle = "#f3f0e8";
    ctx.font = "700 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 0, -16);
  }
  ctx.restore();
}

function beam(x: number, y: number, aim: number, fov: number, range: number) {
  const angles = [aim - fov, aim + fov];
  for (const wall of walls) {
    for (const point of [
      { x: wall.ax, y: wall.ay },
      { x: wall.bx, y: wall.by },
    ]) {
      const dist = Math.hypot(point.x - x, point.y - y);
      if (dist > range + 8) continue;
      const angle = Math.atan2(point.y - y, point.x - x);
      if (Math.abs(wrap(angle - aim)) > fov) continue;
      angles.push(angle - 0.0008, angle + 0.0008);
    }
  }
  angles.sort((a, b) => wrap(a - aim) - wrap(b - aim));
  const points = [{ x, y }];
  for (const angle of angles) {
    if (Math.abs(wrap(angle - aim)) > fov + 0.001) continue;
    const hit = cast(x, y, angle, range);
    points.push(hit);
  }
  return points;
}

function cast(x: number, y: number, angle: number, range: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = range;
  for (const wall of walls) {
    if (wall.ax > x + range && wall.bx > x + range) continue;
    if (wall.ay > y + range && wall.by > y + range) continue;
    if (wall.ax < x - range && wall.bx < x - range) continue;
    if (wall.ay < y - range && wall.by < y - range) continue;
    const sx = wall.bx - wall.ax;
    const sy = wall.by - wall.ay;
    const den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-6) continue;
    const t = ((wall.ax - x) * sy - (wall.ay - y) * sx) / den;
    const u = ((wall.ax - x) * dy - (wall.ay - y) * dx) / den;
    if (t > 1 && t < best && u >= 0 && u <= 1) best = t;
  }
  return { x: x + dx * best, y: y + dy * best };
}

function wrap(angle: number) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function blocked(x: number, y: number, pad: number) {
  if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) return true;
  return buildings.some((b) => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad);
}

function slide(x: number, y: number, dx: number, dy: number) {
  let nx = x;
  let ny = y;
  if (!blocked(x + dx, y, 12)) nx = x + dx;
  if (!blocked(nx, y + dy, 12)) ny = y + dy;
  return { x: nx, y: ny };
}

function spawnPoint() {
  for (let i = 0; i < 40; i += 1) {
    const x = 80 + Math.random() * (WORLD - 160);
    const y = 80 + Math.random() * (WORLD - 160);
    if (!blocked(x, y, 28)) return { x, y };
  }
  return { x: 200, y: 200 };
}

function makeMap() {
  let seed = 21111;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const placed: Building[] = [];
  for (let i = 0; i < 280 && placed.length < 150; i += 1) {
    const w = 70 + Math.floor(rand() * 5) * 28;
    const h = 70 + Math.floor(rand() * 5) * 28;
    const x = 40 + Math.floor(rand() * (WORLD - w - 80));
    const y = 40 + Math.floor(rand() * (WORLD - h - 80));
    const hit = placed.some((b) => x < b.x + b.w + 64 && x + w + 64 > b.x && y < b.y + b.h + 64 && y + h + 64 > b.y);
    if (!hit) placed.push({ x, y, w, h });
  }
  return placed;
}

