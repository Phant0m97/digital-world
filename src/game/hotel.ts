export type HotelHud = {
  coins: number;
  stars: number;
  rooms: number;
  dirty: number;
  waiting: number;
  clerk: boolean;
  maid: boolean;
  cook: boolean;
  note: string;
  done: boolean;
  buildCost: number;
  upgradeCost: number;
};

type Need = "none" | "meal" | "towel";
type Guest = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  phase: "queue" | "walk" | "stay" | "leave";
  room: number;
  patience: number;
  stay: number;
  need: Need;
  served: boolean;
  happy: boolean;
  color: string;
};
type Room = { built: boolean; dirty: boolean; level: number; cleaning: number };

const KEY = "dw-hotel-v1";
const SLOTS = [
  { x: 500, y: 78 },
  { x: 670, y: 78 },
  { x: 840, y: 78 },
  { x: 500, y: 292 },
  { x: 670, y: 292 },
  { x: 840, y: 292 },
];
const COLORS = ["#2ec8e6", "#ff8a3d", "#e25b4a", "#3f8d46", "#245c66", "#f2c14e", "#ff2bd6"];

export function mountHotel(canvas: HTMLCanvasElement, onHud: (hud: HotelHud) => void) {
  const save = load();
  let coins = save.coins;
  let clerk = save.clerk;
  let maid = save.maid;
  let cook = save.cook;
  let note = "Click a guest to check them in. Click a dirty room to clean it.";
  let done = save.done;
  const rooms: Room[] = save.rooms;
  const guests: Guest[] = [];
  const history: boolean[] = save.history;
  let nextId = 1;
  let spawn = 2;
  let clerkCool = 0;
  let maidCool = 0;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {}, build() {}, hire() {}, upgrade() {} };
  const pen = ctx;

  function hud() {
    const built = rooms.filter((room) => room.built);
    const ratio = history.length ? history.filter(Boolean).length / history.length : 0.6;
    const stars = history.length < 3 ? 3 : Math.max(1, Math.min(5, Math.round(1 + ratio * 4)));
    if (!done && stars >= 5 && coins >= 500 && built.length >= 6) {
      done = true;
      note = "Happy Hotel. Guests keep coming.";
    }
    onHud({
      coins,
      stars,
      rooms: built.length,
      dirty: built.filter((room) => room.dirty).length,
      waiting: guests.filter((guest) => guest.phase === "queue").length,
      clerk,
      maid,
      cook,
      note,
      done,
      buildCost: 40 + built.length * 30,
      upgradeCost: 45,
    });
  }

  function takeRoom(guest: Guest) {
    const index = rooms.findIndex((room, i) => room.built && !room.dirty && !guests.some((other) => other.room === i && other.phase !== "leave"));
    if (index < 0) return false;
    guest.phase = "walk";
    guest.room = index;
    guest.tx = SLOTS[index]!.x + 70;
    guest.ty = SLOTS[index]!.y + 90;
    guest.need = "none";
    return true;
  }

  function finish(guest: Guest, happy: boolean) {
    guest.happy = happy;
    guest.phase = "leave";
    guest.tx = 40;
    guest.ty = 470;
    history.push(happy);
    if (history.length > 12) history.shift();
    if (guest.room >= 0) rooms[guest.room]!.dirty = true;
    if (!happy) note = "A guest left unhappy.";
  }

  function serve(guest: Guest) {
    if (guest.need === "none") return;
    guest.served = true;
    guest.need = "none";
    coins += 8;
    note = "Need handled. They left a tip.";
    hud();
  }

  function onPointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const point = toDesign(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
    const guest = [...guests].reverse().find((entry) => Math.hypot(entry.x - point.x, entry.y - point.y) < 28);
    if (guest) {
      if (guest.phase === "queue") {
        if (!takeRoom(guest)) note = "No clean rooms. Clean one or build another.";
        else note = "Checked in.";
      } else if (guest.need !== "none") serve(guest);
      hud();
      return;
    }
    const index = SLOTS.findIndex((slot) => point.x > slot.x && point.x < slot.x + 140 && point.y > slot.y && point.y < slot.y + 160);
    if (index < 0) return;
    const room = rooms[index]!;
    if (!room.built) {
      build();
      return;
    }
    if (room.dirty && room.cleaning <= 0) {
      room.cleaning = 0.01;
      note = "Cleaning.";
      hud();
    }
  }

  function build() {
    const index = rooms.findIndex((room) => !room.built);
    if (index < 0) {
      note = "The hotel is full size.";
      hud();
      return;
    }
    const cost = 40 + rooms.filter((room) => room.built).length * 30;
    if (coins < cost) {
      note = `A new room costs ${cost}.`;
      hud();
      return;
    }
    coins -= cost;
    rooms[index] = { built: true, dirty: false, level: 1, cleaning: 0 };
    note = "New room ready.";
    hud();
  }

  function hire(role: "clerk" | "maid" | "cook") {
    const price = role === "clerk" ? 80 : role === "maid" ? 90 : 70;
    if (role === "clerk" ? clerk : role === "maid" ? maid : cook) return;
    if (coins < price) {
      note = `${role} costs ${price}.`;
      hud();
      return;
    }
    coins -= price;
    if (role === "clerk") clerk = true;
    if (role === "maid") maid = true;
    if (role === "cook") cook = true;
    note = role === "clerk" ? "The clerk watches the desk." : role === "maid" ? "The maid grabs a cart." : "The cook covers room service.";
    hud();
  }

  function upgrade() {
    const room = rooms.find((entry) => entry.built && entry.level < 3);
    if (!room) {
      note = "Every room is already plush.";
      hud();
      return;
    }
    if (coins < 45) {
      note = "An upgrade costs 45.";
      hud();
      return;
    }
    coins -= 45;
    room.level += 1;
    note = room.level === 2 ? "Better beds." : "Suite linens.";
    hud();
  }

  let raf = 0;
  let last = performance.now();
  let saveTimer = 0;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
    }
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 6.5;
      if (guests.filter((guest) => guest.phase !== "leave").length < 8) {
        const line = guests.filter((guest) => guest.phase === "queue").length;
        guests.push({
          id: nextId,
          x: 70,
          y: 480,
          tx: 150,
          ty: 150 + line * 42,
          phase: "queue",
          room: -1,
          patience: 16,
          stay: 11,
          need: "none",
          served: false,
          happy: true,
          color: COLORS[nextId % COLORS.length]!,
        });
        nextId += 1;
      }
    }
    clerkCool -= dt;
    maidCool -= dt;
    if (clerk && clerkCool <= 0) {
      const waiting = guests.find((guest) => guest.phase === "queue");
      if (waiting && takeRoom(waiting)) clerkCool = 1.5;
    }
    if (maid && maidCool <= 0) {
      const dirty = rooms.find((room) => room.built && room.dirty && room.cleaning <= 0);
      if (dirty) {
        dirty.cleaning = 0.01;
        maidCool = 1.7;
      }
    }
    for (const room of rooms) {
      if (room.cleaning <= 0) continue;
      room.cleaning += dt * (maid ? 0.85 : 0.7);
      if (room.cleaning >= 1) {
        room.cleaning = 0;
        room.dirty = false;
      }
    }
    for (const guest of guests) {
      const step = 140 * dt;
      const dx = guest.tx - guest.x;
      const dy = guest.ty - guest.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        guest.x += (dx / dist) * Math.min(step, dist);
        guest.y += (dy / dist) * Math.min(step, dist);
      } else if (guest.phase === "walk") {
        guest.phase = "stay";
        guest.stay = 9 + rooms[guest.room]!.level;
        coins += 16 + rooms[guest.room]!.level * 12;
        note = `Room ${guest.room + 1} paid ${16 + rooms[guest.room]!.level * 12}.`;
        hud();
      } else if (guest.phase === "leave" && dist <= 2) {
        guest.patience = -2;
      }
      if (guest.phase === "queue") {
        guest.patience -= dt;
        if (guest.patience <= 0) finish(guest, false);
      }
      if (guest.phase === "stay") {
        guest.stay -= dt;
        if (guest.need === "none" && !guest.served && guest.stay < 6 && guest.stay > 5.8) {
          guest.need = Math.random() < 0.5 ? "meal" : "towel";
        }
        if (guest.need !== "none" && cook && guest.need === "meal") serve(guest);
        if (guest.stay <= 0) finish(guest, guest.need === "none");
      }
    }
    let line = 0;
    for (const guest of guests) {
      if (guest.phase !== "queue") continue;
      guest.tx = 160;
      guest.ty = 150 + line * 46;
      line += 1;
    }
    for (let i = guests.length - 1; i >= 0; i -= 1) {
      if (guests[i]!.patience < -1) guests.splice(i, 1);
    }
    draw(pen, canvas, width, height, rooms, guests);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, clerk, maid, cook, done, rooms, history }));
    }
    raf = requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", onPointer);
  hud();
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointer);
    },
    build,
    hire,
    upgrade,
  };
}

function load() {
  const rooms: Room[] = SLOTS.map((_, index) => ({ built: index < 2, dirty: index === 1, level: 1, cleaning: 0 }));
  const base = { coins: 60, clerk: false, maid: false, cook: false, done: false, rooms, history: [] as boolean[] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<typeof base>;
    return {
      ...base,
      ...saved,
      rooms: saved.rooms?.length === SLOTS.length ? saved.rooms : base.rooms,
      history: saved.history ?? [],
    };
  } catch {
    return base;
  }
}

function toDesign(x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / 1000, height / 540);
  const ox = (width - 1000 * scale) / 2;
  const oy = (height - 540 * scale) / 2;
  return { x: (x - ox) / scale, y: (y - oy) / scale };
}

function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, width: number, height: number, rooms: Room[], guests: Guest[]) {
  const ratio = canvas.width / width;
  const scale = Math.min(width / 1000, height / 540);
  const ox = (width - 1000 * scale) / 2;
  const oy = (height - 540 * scale) / 2;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ox * ratio, oy * ratio);
  ctx.fillStyle = "#c4b396";
  ctx.fillRect(0, 0, 1000, 540);
  ctx.fillStyle = "#f6f1e6";
  round(ctx, 24, 24, 430, 492, 18);
  ctx.fill();
  ctx.strokeStyle = "#1c2126";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#1c2126";
  ctx.fillRect(78, 492, 64, 24);
  ctx.fillStyle = "#2a3138";
  round(ctx, 250, 188, 170, 78, 12);
  ctx.fill();
  ctx.fillStyle = "#f2c14e";
  ctx.font = "700 18px Outfit, sans-serif";
  ctx.fillText("DESK", 304, 234);
  ctx.fillStyle = "#d5dbe3";
  ctx.fillRect(454, 168, 520, 36);
  ctx.fillRect(454, 372, 520, 36);
  rooms.forEach((room, index) => {
    const slot = SLOTS[index]!;
    ctx.fillStyle = room.built ? (room.dirty ? "#e7d3c4" : "#fffaf3") : "#efe6d6";
    round(ctx, slot.x, slot.y, 140, 160, 12);
    ctx.fill();
    ctx.strokeStyle = "#1c2126";
    ctx.stroke();
    if (!room.built) {
      ctx.fillStyle = "#1c2126";
      ctx.font = "700 28px Outfit, sans-serif";
      ctx.fillText("+", slot.x + 58, slot.y + 92);
      return;
    }
    ctx.fillStyle = "#2ec8e6";
    ctx.fillRect(slot.x + 18, slot.y + 28, 104, 14);
    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(slot.x + 22, slot.y + 78, 96, 42);
    ctx.fillStyle = "#1c2126";
    ctx.font = "700 14px Outfit, sans-serif";
    ctx.fillText(`${room.level === 1 ? "Cozy" : room.level === 2 ? "Soft" : "Suite"}`, slot.x + 18, slot.y + 22);
    if (room.dirty) {
      ctx.fillStyle = "#8b5a32";
      ctx.fillText("Dirty", slot.x + 46, slot.y + 148);
    }
    if (room.cleaning > 0) {
      ctx.fillStyle = "#1c2126";
      ctx.fillRect(slot.x + 16, slot.y + 150, 108, 6);
      ctx.fillStyle = "#2ec8e6";
      ctx.fillRect(slot.x + 16, slot.y + 150, 108 * room.cleaning, 6);
    }
  });
  for (const guest of guests) {
    ctx.fillStyle = guest.color;
    round(ctx, guest.x - 14, guest.y - 10, 28, 26, 6);
    ctx.fill();
    ctx.strokeStyle = "#1c2126";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(guest.x, guest.y - 22, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#f3d2b3";
    ctx.fill();
    ctx.stroke();
    if (guest.need !== "none") {
      ctx.fillStyle = "#fffaf3";
      round(ctx, guest.x + 16, guest.y - 48, 54, 22, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1c2126";
      ctx.font = "700 12px Outfit, sans-serif";
      ctx.fillText(guest.need === "meal" ? "Meal" : "Towel", guest.x + 24, guest.y - 33);
    } else if (guest.phase === "queue") {
      const left = Math.max(0, guest.patience / 16);
      ctx.fillStyle = left < 0.35 ? "#e25b4a" : "#1c2126";
      ctx.fillRect(guest.x - 16, guest.y + 20, 32, 4);
      ctx.fillStyle = "#2ec8e6";
      ctx.fillRect(guest.x - 16, guest.y + 20, 32 * left, 4);
    }
  }
  ctx.fillStyle = "#1c2126";
  ctx.font = "700 22px Outfit, sans-serif";
  ctx.fillText("Happy Hotel", 40, 58);
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
