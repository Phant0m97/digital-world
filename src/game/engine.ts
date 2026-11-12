import { weaponById, type Dyes, type Loadout, type ModeId, type WeaponDef } from "@/data/catalog";
import { drawDigiFigure } from "@/game/figure";

export type MatchFighterSetup = {
  name: string;
  color: string;
  loadout: Loadout;
  dyes: Dyes;
  weapon: string;
  bot: boolean;
};

export type MatchSetup = {
  mode: ModeId;
  you: MatchFighterSetup;
  others: MatchFighterSetup[];
};

export type HudSnap = {
  mode: ModeId;
  timeLeft: number;
  hp: number;
  weapon: string;
  youScore: number;
  leader: string;
  leaderScore: number;
  team0: number;
  team1: number;
  crystal0: number;
  crystal1: number;
  alive: number;
  feed: string[];
  ended: boolean;
};

export type Placement = {
  name: string;
  score: number;
  kills: number;
  you: boolean;
  color: string;
  rank: number;
  credits: number;
};

export type MatchResult = {
  title: string;
  placements: Placement[];
  youCredits: number;
};

type Solid = { x: number; y: number; w: number; h: number; oneWay?: boolean; kind?: "ground" | "wood" | "mint" | "crate" };
type Fighter = {
  id: number;
  name: string;
  you: boolean;
  bot: boolean;
  team: number;
  color: string;
  loadout: Loadout;
  dyes: Dyes;
  weapon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: number;
  hp: number;
  alive: boolean;
  eliminated: boolean;
  respawn: number;
  invuln: number;
  grounded: boolean;
  coyote: number;
  jumpBuf: number;
  drop: number;
  cool: number;
  burst: number;
  aim: number;
  score: number;
  kills: number;
  hill: number;
  wantJump: boolean;
  jumpHeld: boolean;
};
type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  owner: number;
  team: number;
  body: number;
  head: number;
  color: string;
  gravity: number;
  bounce: number;
};
type Decal = { x: number; y: number; rx: number; ry: number; rot: number; color: string };
type Bit = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Crystal = { x: number; y: number; team: number; hp: number; max: number };

const WORLD_W = 2400;
const WORLD_H = 760;
const GROUND_Y = 620;
const PW = 28;
const PH = 64;

const SOLIDS: Solid[] = [
  { x: 0, y: GROUND_Y, w: WORLD_W, h: 140, kind: "ground" },
  { x: 160, y: 430, w: 230, h: 16, kind: "wood" },
  { x: 0, y: 522, w: 150, h: 14, oneWay: true, kind: "mint" },
  { x: 460, y: 390, w: 170, h: 14, oneWay: true, kind: "mint" },
  { x: 880, y: 500, w: 280, h: 18, kind: "wood" },
  { x: 1080, y: 340, w: 160, h: 14, oneWay: true, kind: "mint" },
  { x: 1320, y: 450, w: 210, h: 16, kind: "wood" },
  { x: 1680, y: 370, w: 180, h: 14, oneWay: true, kind: "mint" },
  { x: 1960, y: 480, w: 250, h: 18, kind: "wood" },
  { x: 2140, y: 370, w: 160, h: 14, oneWay: true, kind: "mint" },
  { x: 360, y: 572, w: 48, h: 48, kind: "crate" },
  { x: 1860, y: 572, w: 56, h: 48, kind: "crate" },
];

const SPAWNS = [
  { x: 90, y: 520 },
  { x: 2140, y: 520 },
  { x: 190, y: 340 },
  { x: 960, y: 410 },
  { x: 1360, y: 360 },
  { x: 1980, y: 390 },
];
const LEFT_SPAWNS = [SPAWNS[0]!, SPAWNS[2]!, SPAWNS[3]!];
const RIGHT_SPAWNS = [SPAWNS[1]!, SPAWNS[5]!, SPAWNS[4]!];

const INK = "#1a1a1a";
const CREAM = "#f3f0e8";

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ink(ctx: CanvasRenderingContext2D, width: number) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}

function drawFigure(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number) {
  drawDigiFigure(ctx, fighter, now);
}

function drawPlank(ctx: CanvasRenderingContext2D, solid: Solid, mint: boolean) {
  roundPath(ctx, solid.x, solid.y, solid.w, solid.h, 7);
  ctx.fillStyle = mint ? "#c7ebe6" : "#e6d2a2";
  ctx.fill();
  ink(ctx, 3.4);
  ctx.stroke();
  ink(ctx, 2.2);
  if (mint) {
    for (let x = solid.x + 16; x < solid.x + solid.w - 10; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, solid.y + 4);
      ctx.lineTo(x, solid.y + solid.h - 4);
      ctx.stroke();
    }
  } else {
    const parts = Math.max(3, Math.round(solid.w / 46));
    for (let i = 1; i < parts; i++) {
      const x = solid.x + (solid.w / parts) * i;
      ctx.beginPath();
      ctx.moveTo(x, solid.y + 4);
      ctx.lineTo(x, solid.y + solid.h - 4);
      ctx.stroke();
    }
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(solid.x + 12, solid.y + solid.h / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, solid: Solid) {
  roundPath(ctx, solid.x, solid.y, solid.w, solid.h, 3);
  ctx.fillStyle = "#e4c27a";
  ctx.fill();
  ink(ctx, 3.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(solid.x + 7, solid.y + 7);
  ctx.lineTo(solid.x + solid.w - 7, solid.y + solid.h - 7);
  ctx.moveTo(solid.x + solid.w - 7, solid.y + 7);
  ctx.lineTo(solid.x + 7, solid.y + solid.h - 7);
  ctx.stroke();
}

function drawSplat(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(rx * 0.55, -ry * 0.15, rx * 0.42, ry * 0.55, 0.4, 0, Math.PI * 2);
  ctx.ellipse(-rx * 0.5, ry * 0.1, rx * 0.34, ry * 0.4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const ZONE = { x: 1040, y: 548, w: 320, h: 78 };

export type TouchState = {
  moveX: number;
  jump: boolean;
  drop: boolean;
  fire: boolean;
  aim: number | null;
};

export type ControlsProbe = {
  getX: () => number;
  getVx: () => number;
  getYaw: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: Solid) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function prize(rank: number, count: number) {
  if (count <= 2) return rank === 1 ? 20 : 0;
  if (rank === 1) return 50;
  if (rank === 2) return 25;
  if (rank === 3) return 10;
  return 0;
}

export function createMatch(
  canvas: HTMLCanvasElement,
  setup: MatchSetup,
  onEnd: (result: MatchResult) => void,
) {
  const mode = setup.mode;
  const teamMode = mode === "tdm" || mode === "crystal";
  const seconds = mode === "lms" ? 120 : mode === "crystal" ? 120 : 90;
  const keys = new Set<string>();
  const qa = new Set<string>();
  const touch: TouchState = { moveX: 0, jump: false, drop: false, fire: false, aim: null };
  const mouse = { x: 0, y: 0, down: false, inside: false, aimed: false };
  const fighters: Fighter[] = [];
  const roster = [setup.you, ...setup.others];
  roster.forEach((entry, index) => {
    const team = teamMode ? (index < Math.ceil(roster.length / 2) ? 0 : 1) : index;
    const spots = teamMode ? (team === 0 ? LEFT_SPAWNS : RIGHT_SPAWNS) : SPAWNS;
    const spawn = spots[index % spots.length]!;
    fighters.push({
      id: index,
      name: entry.name,
      you: index === 0,
      bot: entry.bot,
      team,
      color: entry.color,
      loadout: entry.loadout,
      dyes: entry.dyes,
      weapon: entry.weapon,
      x: spawn.x,
      y: spawn.y,
      w: PW,
      h: PH,
      vx: 0,
      vy: 0,
      facing: team === 1 ? -1 : 1,
      hp: 2,
      alive: true,
      eliminated: false,
      respawn: 0,
      invuln: 1.8,
      grounded: false,
      coyote: 0,
      jumpBuf: 0,
      drop: 0,
      cool: index === 0 ? 0.2 : 1.3 + index * 0.08,
      burst: 0,
      aim: 0,
      score: 0,
      kills: 0,
      hill: 0,
      wantJump: false,
      jumpHeld: false,
    });
  });

  const crystals: Crystal[] = [
    { x: 230, y: 578, team: 0, hp: 18, max: 18 },
    { x: 2160, y: 578, team: 1, hp: 18, max: 18 },
  ];
  const bullets: Bullet[] = [];
  const decals: Decal[] = [];
  const bits: Bit[] = [];
  const feed: string[] = [];
  let timeLeft = seconds;
  let ended = false;
  let shake = 0;
  let hitStop = 0;
  let steps = 0;
  let loopError = "";
  let acc = 0;
  let last = performance.now();
  let camX = 0;
  let camY = 160;
  let viewW = 980;
  let viewH = 640;
  let raf = 0;
  let audio: AudioContext | null = null;
  let prevJump = false;

  const you = () => fighters[0]!;

  function tone(freq: number, dur: number, type: OscillatorType, gain = 0.04) {
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  }

  function unlock() {
    if (audio) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio = new Ctx();
    void audio.resume();
  }

  function pushFeed(text: string) {
    feed.unshift(text);
    if (feed.length > 4) feed.pop();
  }

  function splat(x: number, y: number, color: string) {
    decals.push({
      x,
      y,
      rx: 7 + Math.random() * 10,
      ry: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      color,
    });
    if (decals.length > 90) decals.shift();
    for (let i = 0; i < 6; i++) {
      bits.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 220,
        vy: -40 - Math.random() * 180,
        life: 0.35 + Math.random() * 0.25,
        color,
      });
    }
  }

  function los(from: Fighter, tx: number, ty: number) {
    const x0 = from.x + from.w / 2;
    const y0 = from.y + 24;
    const dist = Math.hypot(tx - x0, ty - y0);
    const steps = Math.ceil(dist / 12);
    for (let i = 1; i < steps; i++) {
      const x = x0 + ((tx - x0) * i) / steps;
      const y = y0 + ((ty - y0) * i) / steps;
      for (const solid of SOLIDS) {
        if (solid.oneWay) continue;
        if (x >= solid.x && x <= solid.x + solid.w && y >= solid.y && y <= solid.y + solid.h) return false;
      }
    }
    return true;
  }

  function hostile(a: Fighter, b: Fighter) {
    if (a.id === b.id || !b.alive) return false;
    if (teamMode) return a.team !== b.team;
    return true;
  }

  function fire(fighter: Fighter) {
    const spec: WeaponDef = weaponById(fighter.weapon);
    if (fighter.cool > 0 || !fighter.alive) return;
    const spread = (Math.random() - 0.5) * spec.spread * 2;
    const ang = fighter.aim + spread;
    bullets.push({
      x: fighter.x + fighter.w / 2 + Math.cos(ang) * 20,
      y: fighter.y + 28 + Math.sin(ang) * 20,
      vx: Math.cos(ang) * spec.speed,
      vy: Math.sin(ang) * spec.speed,
      life: 1.4,
      r: spec.radius,
      owner: fighter.id,
      team: fighter.team,
      body: spec.body,
      head: spec.head,
      color: fighter.color,
      gravity: spec.gravity,
      bounce: spec.id === "ricochet" ? 1 : 0,
    });
    fighter.burst += 1;
    if (fighter.burst >= spec.burst) {
      fighter.burst = 0;
      fighter.cool = 1 / spec.rof;
    } else {
      fighter.cool = spec.gap;
    }
    if (fighter.you) tone(520, 0.05, "square", 0.03);
  }

  function hurt(target: Fighter, amount: number, attacker: Fighter | undefined, color: string, head: boolean) {
    if (!target.alive || target.invuln > 0) return;
    target.hp -= amount;
    splat(target.x + target.w / 2, head ? target.y + 12 : target.y + 36, color);
    shake = Math.max(shake, target.you || attacker?.you ? 7 : 3);
    hitStop = 0.035;
    if (target.hp <= 0) {
      target.alive = false;
      target.hp = 0;
      target.vx = 0;
      if (attacker && attacker.id !== target.id) {
        attacker.kills += 1;
        if (mode !== "koth" && mode !== "crystal") attacker.score += 1;
        pushFeed(`${attacker.name} painted ${target.name}`);
        if (attacker.you) tone(220, 0.08, "triangle", 0.05);
      }
      if (mode === "lms") {
        target.eliminated = true;
        target.respawn = 0;
      } else {
        target.respawn = 3;
      }
    } else if (target.you) {
      tone(140, 0.06, "sawtooth", 0.03);
    }
  }

  function moveX(body: Fighter, dx: number) {
    body.x += dx;
    for (const solid of SOLIDS) {
      if (solid.oneWay || !overlaps(body, solid)) continue;
      const rise = body.y + body.h - solid.y;
      if (body.bot && solid.kind !== "ground" && body.vy < -40 && rise > 0 && rise < 170) {
        body.y = solid.y - body.h;
        body.vy = 0;
        body.grounded = true;
        body.x = dx > 0 ? solid.x + 4 : solid.x + solid.w - body.w - 4;
      } else {
        if (dx > 0) body.x = solid.x - body.w;
        else body.x = solid.x + solid.w;
        body.vx = 0;
      }
    }
    body.x = clamp(body.x, 0, WORLD_W - body.w);
  }

  function moveY(body: Fighter, dy: number) {
    const prev = body.y;
    body.y += dy;
    body.grounded = false;
    for (const solid of SOLIDS) {
      if (solid.oneWay || !overlaps(body, solid)) continue;
      if (dy > 0) {
        body.y = solid.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else {
        body.y = solid.y + solid.h;
        body.vy = 0;
      }
    }
    if (dy > 0 && body.drop <= 0) {
      for (const solid of SOLIDS) {
        if (!solid.oneWay) continue;
        const prevBottom = prev + body.h;
        if (prevBottom > solid.y + 2) continue;
        if (body.x + body.w <= solid.x || body.x >= solid.x + solid.w) continue;
        if (body.y + body.h >= solid.y && prevBottom <= solid.y + 6) {
          body.y = solid.y - body.h;
          body.vy = 0;
          body.grounded = true;
        }
      }
    }
  }

  function botAct(bot: Fighter, dt: number) {
    let tx = bot.x + bot.facing * 80;
    let ty = bot.y;
    if (mode === "crystal") {
      const gem = crystals.find((crystal) => crystal.team !== bot.team && crystal.hp > 0);
      if (gem) {
        tx = gem.x;
        ty = gem.y;
      }
    } else if (mode === "koth") {
      const inZone = bot.x + bot.w / 2 > ZONE.x && bot.x + bot.w / 2 < ZONE.x + ZONE.w;
      if (!inZone || Math.random() < 0.35) {
        tx = ZONE.x + ZONE.w / 2;
        ty = GROUND_Y - 20;
      }
    }
    let best = Infinity;
    for (const other of fighters) {
      if (!hostile(bot, other)) continue;
      const d = Math.hypot(other.x - bot.x, other.y - bot.y);
      if (d < best) {
        best = d;
        tx = other.x + other.w / 2;
        ty = other.y + 20;
      }
    }
    const dx = tx - (bot.x + bot.w / 2);
    const left = dx < -10;
    const right = dx > 10;
    const dir = dx >= 0 ? 1 : -1;
    const reach = 78;
    const probe = {
      x: dir > 0 ? bot.x + bot.w - 6 : bot.x - reach,
      y: bot.y + 4,
      w: reach,
      h: bot.h,
    };
    const blocked = SOLIDS.some(
      (solid) => solid.kind !== "ground" && !solid.oneWay && overlaps(probe, solid),
    );
    const needUp = ty + 36 < bot.y && Math.abs(dx) < 240;
    bot.wantJump = Boolean(bot.grounded && (blocked || needUp));
    bot.aim = Math.atan2(ty - (bot.y + 28), tx - (bot.x + bot.w / 2));
    const trigger = best < 680 && los(bot, tx, ty);
    return { left, right, jump: bot.wantJump, drop: false, fire: trigger, dt };
  }

  function readHuman() {
    const left =
      keys.has("KeyA") || keys.has("ArrowLeft") || qa.has("KeyA") || qa.has("ArrowLeft") || touch.moveX < -0.25;
    const right =
      keys.has("KeyD") || keys.has("ArrowRight") || qa.has("KeyD") || qa.has("ArrowRight") || touch.moveX > 0.25;
    const jumpHeld =
      keys.has("Space") ||
      keys.has("KeyW") ||
      keys.has("ArrowUp") ||
      qa.has("Space") ||
      qa.has("KeyW") ||
      qa.has("ArrowUp") ||
      touch.jump;
    const drop = keys.has("KeyS") || keys.has("ArrowDown") || qa.has("KeyS") || touch.drop;
    const fire = mouse.down || touch.fire || qa.has("KeyF") || keys.has("KeyF");
    return { left, right, jumpHeld, drop, fire };
  }

  function control(fighter: Fighter, dt: number) {
    let left = false;
    let right = false;
    let jumpHeld = false;
    let drop = false;
    let trigger = false;
    if (fighter.you) {
      const human = readHuman();
      left = human.left && !human.right;
      right = human.right && !human.left;
      jumpHeld = human.jumpHeld;
      drop = human.drop;
      trigger = human.fire;
      if (touch.aim !== null) fighter.aim = touch.aim;
      else if (mouse.inside) {
        const world = screenToWorld(mouse.x, mouse.y);
        fighter.aim = Math.atan2(world.y - (fighter.y + 28), world.x - (fighter.x + fighter.w / 2));
      } else if (!mouse.aimed && Math.abs(fighter.vx) > 8) {
        fighter.aim = fighter.vx > 0 ? 0 : Math.PI;
      }
      const wasHeld = fighter.jumpHeld;
      fighter.jumpHeld = jumpHeld;
      if (jumpHeld && !wasHeld) fighter.jumpBuf = 0.12;
      if (!jumpHeld && wasHeld && fighter.vy < 0) fighter.vy *= 0.48;
    } else {
      const act = botAct(fighter, dt);
      left = act.left;
      right = act.right;
      drop = act.drop;
      trigger = act.fire;
      if (act.jump && fighter.grounded) fighter.jumpBuf = 0.12;
    }
    if (drop) fighter.drop = 0.18;
    const max = 270;
    const accel = fighter.grounded ? 2400 : 1500;
    if (left) fighter.vx -= accel * dt;
    if (right) fighter.vx += accel * dt;
    if (!left && !right) {
      const fr = fighter.grounded ? 2000 : 420;
      if (Math.abs(fighter.vx) < fr * dt) fighter.vx = 0;
      else fighter.vx -= Math.sign(fighter.vx) * fr * dt;
    }
    fighter.vx = clamp(fighter.vx, -max, max);
    if (Math.abs(Math.cos(fighter.aim)) > 0.35) {
      if (Math.abs(fighter.vx) > 20) fighter.facing = fighter.vx > 0 ? 1 : -1;
      else if (Math.cos(fighter.aim) > 0) fighter.facing = 1;
      else fighter.facing = -1;
    }
    if (trigger) fire(fighter);
    else fighter.burst = 0;
  }

  function stepFighter(fighter: Fighter, dt: number) {
    fighter.cool = Math.max(0, fighter.cool - dt);
    fighter.invuln = Math.max(0, fighter.invuln - dt);
    fighter.drop = Math.max(0, fighter.drop - dt);
    if (!fighter.alive) {
      if (fighter.eliminated || fighter.respawn <= 0) return;
      fighter.respawn -= dt;
      if (fighter.respawn <= 0) {
        const spots = teamMode ? (fighter.team === 0 ? LEFT_SPAWNS : RIGHT_SPAWNS) : SPAWNS;
        const spot = spots[Math.floor(Math.random() * spots.length)]!;
        fighter.x = spot.x;
        fighter.y = spot.y;
        fighter.vx = 0;
        fighter.vy = 0;
        fighter.hp = 2;
        fighter.alive = true;
        fighter.invuln = 1.15;
      }
      return;
    }
    control(fighter, dt);
    if (fighter.you && qa.size > 0) fighter.invuln = 0.4;
    fighter.jumpBuf = Math.max(0, fighter.jumpBuf - dt);
    if (fighter.grounded) fighter.coyote = 0.1;
    else fighter.coyote = Math.max(0, fighter.coyote - dt);
    if (fighter.jumpBuf > 0 && (fighter.grounded || fighter.coyote > 0)) {
      fighter.vy = fighter.you ? -690 : -820;
      fighter.grounded = false;
      fighter.coyote = 0;
      fighter.jumpBuf = 0;
      if (fighter.you) tone(340, 0.05, "square", 0.02);
    }
    let grav = 2100;
    if (fighter.vy > 0) grav *= 1.75;
    if (Math.abs(fighter.vy) < 70) grav *= 0.62;
    fighter.vy = Math.min(920, fighter.vy + grav * dt);
    const steps = Math.max(1, Math.ceil(Math.abs(fighter.vy * dt) / 8));
    moveX(fighter, fighter.vx * dt);
    const slice = (fighter.vy * dt) / steps;
    for (let i = 0; i < steps; i++) moveY(fighter, slice);
    if (mode === "koth" && inZone(fighter)) {
      fighter.hill += dt;
      while (fighter.hill >= 1) {
        fighter.hill -= 1;
        fighter.score += 1;
      }
    }
  }

  function inZone(fighter: Fighter) {
    const cx = fighter.x + fighter.w / 2;
    const feet = fighter.y + fighter.h;
    return cx > ZONE.x && cx < ZONE.x + ZONE.w && feet > ZONE.y && feet < ZONE.y + ZONE.h + 30;
  }

  function stepBullets(dt: number) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]!;
      bullet.life -= dt;
      bullet.vy += bullet.gravity * dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      let dead = bullet.life <= 0 || bullet.x < -20 || bullet.x > WORLD_W + 20 || bullet.y > WORLD_H;
      if (!dead) {
        for (const solid of SOLIDS) {
          if (solid.oneWay && bullet.vy < 0) continue;
          if (
            bullet.x > solid.x &&
            bullet.x < solid.x + solid.w &&
            bullet.y > solid.y &&
            bullet.y < solid.y + solid.h
          ) {
            if (bullet.bounce > 0) {
              bullet.bounce -= 1;
              const left = bullet.x - solid.x;
              const right = solid.x + solid.w - bullet.x;
              const top = bullet.y - solid.y;
              const bottom = solid.y + solid.h - bullet.y;
              if (Math.min(left, right) < Math.min(top, bottom)) {
                bullet.vx *= -1;
                bullet.x += Math.sign(bullet.vx) * (bullet.r + 2);
              } else {
                bullet.vy *= -1;
                bullet.y += Math.sign(bullet.vy) * (bullet.r + 2);
              }
            } else {
              splat(bullet.x, bullet.y, bullet.color);
              dead = true;
            }
            break;
          }
        }
      }
      if (!dead && mode === "crystal") {
        for (const crystal of crystals) {
          if (crystal.hp <= 0) continue;
          if (teamMode && crystal.team === bullet.team) continue;
          if (Math.hypot(bullet.x - crystal.x, bullet.y - crystal.y) < 28 + bullet.r) {
            crystal.hp = Math.max(0, crystal.hp - bullet.body);
            const owner = fighters.find((fighter) => fighter.id === bullet.owner);
            if (owner && mode === "crystal") owner.score += bullet.body;
            splat(bullet.x, bullet.y, bullet.color);
            dead = true;
            if (crystal.hp <= 0) pushFeed(`${owner?.name ?? "Someone"} shattered a crystal`);
            break;
          }
        }
      }
      if (!dead) {
        for (const fighter of fighters) {
          if (fighter.id === bullet.owner || !fighter.alive || fighter.invuln > 0) continue;
          if (teamMode && fighter.team === bullet.team) continue;
          const hx = fighter.x + fighter.w / 2;
          const hy = fighter.y + 13;
          const head = Math.hypot(bullet.x - hx, bullet.y - hy) < 13 + bullet.r;
          const body =
            bullet.x > fighter.x + 2 &&
            bullet.x < fighter.x + fighter.w - 2 &&
            bullet.y > fighter.y + 18 &&
            bullet.y < fighter.y + fighter.h;
          if (head || body) {
            const owner = fighters.find((item) => item.id === bullet.owner);
            hurt(fighter, head ? bullet.head : bullet.body, owner, bullet.color, head);
            dead = true;
            break;
          }
        }
      }
      if (dead) bullets.splice(i, 1);
    }
  }

  function checkEnd() {
    if (ended) return;
    let title = "Time";
    if (mode === "crystal") {
      const broken = crystals.find((crystal) => crystal.hp <= 0);
      if (broken) {
        title = broken.team === 0 ? "Right side broke the crystal" : "Left side broke the crystal";
        finish(title);
        return;
      }
    }
    if (mode === "lms") {
      const living = fighters.filter((fighter) => fighter.alive);
      if (living.length <= 1) {
        title = living[0] ? `${living[0].name} is last standing` : "Yard empty";
        if (living[0]) living[0].score += 100;
        finish(title);
        return;
      }
    }
    if (timeLeft <= 0) {
      if (mode === "tdm") {
        const a = fighters.filter((fighter) => fighter.team === 0).reduce((sum, fighter) => sum + fighter.kills, 0);
        const b = fighters.filter((fighter) => fighter.team === 1).reduce((sum, fighter) => sum + fighter.kills, 0);
        title = a === b ? "Teams tied on kills" : a > b ? "Left team takes the yard" : "Right team takes the yard";
      } else if (mode === "koth") title = "Hill closed";
      else if (mode === "crystal") {
        const left = crystals[0]!.hp;
        const right = crystals[1]!.hp;
        title = left === right ? "Crystals held" : left > right ? "Left crystal holds" : "Right crystal holds";
      } else if (mode === "lms") title = "Sudden stop";
      else title = "Deathmatch over";
      finish(title);
    }
  }

  function finish(title: string) {
    if (ended) return;
    ended = true;
    const ranked = [...fighters].sort((a, b) => b.score - a.score || b.kills - a.kills);
    const placements: Placement[] = ranked.map((fighter, index) => {
      const rank = index + 1;
      return {
        name: fighter.name,
        score: fighter.score,
        kills: fighter.kills,
        you: fighter.you,
        color: fighter.color,
        rank,
        credits: prize(rank, fighters.length),
      };
    });
    const youCredits = placements.find((row) => row.you)?.credits ?? 0;
    onEnd({ title, placements, youCredits });
  }

  function step(dt: number) {
    if (ended) return;
    if (hitStop > 0) {
      hitStop -= dt;
      return;
    }
    timeLeft = Math.max(0, timeLeft - dt);
    for (const fighter of fighters) stepFighter(fighter, dt);
    stepBullets(dt);
    for (let i = bits.length - 1; i >= 0; i--) {
      const bit = bits[i]!;
      bit.life -= dt;
      bit.vy += 700 * dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      if (bit.life <= 0) bits.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 18);
    checkEnd();
  }

  function syncView() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const width = rect.width;
    viewW = width < 700 ? 500 : 640;
    viewH = viewW * (rect.height / Math.max(1, width));
  }

  function screenToWorld(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const u = (clientX - rect.left) / Math.max(1, rect.width);
    const v = (clientY - rect.top) / Math.max(1, rect.height);
    return { x: camX + u * viewW, y: camY + v * viewH };
  }

  function updateCam() {
    const fighter = you();
    const lookX = fighter.x + fighter.w / 2 + fighter.facing * 90;
    const lookY = Math.min(520, fighter.y + 20);
    const halfW = viewW / 2;
    const halfH = viewH / 2;
    const destX = clamp(lookX, halfW, Math.max(halfW, WORLD_W - halfW));
    const destY = clamp(lookY, halfH - 40, Math.max(halfH - 40, 700 - halfH + 40));
    camX += (destX - halfW - camX) * 0.14;
    camY += (destY - halfH - camY) * 0.14;
    if (shake > 0) {
      camX += (Math.random() - 0.5) * shake;
      camY += (Math.random() - 0.5) * shake;
    }
  }

  function drawStick(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number) {
    drawFigure(ctx, fighter, now);
  }

  function render(now: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    syncView();
    updateCam();
    const dpr = canvas.width / Math.max(1, canvas.clientWidth);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const sx = cssW / viewW;
    const sy = cssH / viewH;
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.setTransform(dpr * sx, 0, 0, dpr * sy, -camX * dpr * sx, -camY * dpr * sy);
    ctx.fillStyle = CREAM;
    ctx.fillRect(camX - 40, camY - 40, viewW + 80, viewH + 80);
    ctx.fillStyle = "#c5c9d0";
    ctx.fillRect(camX - 40, GROUND_Y, viewW + 80, 52);
    ctx.fillStyle = "#8e949c";
    ctx.fillRect(camX - 40, GROUND_Y + 52, viewW + 80, WORLD_H - GROUND_Y);
    ctx.strokeStyle = "#7a8088";
    ctx.lineWidth = 2;
    for (let x = 0; x < WORLD_W; x += 84) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 52);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
    ink(ctx, 5);
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WORLD_W, GROUND_Y);
    ctx.stroke();
    if (mode === "koth") {
      ctx.fillStyle = "rgba(255, 214, 92, 0.45)";
      ctx.fillRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h);
      ink(ctx, 3);
      ctx.strokeRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h);
    }
    for (const solid of SOLIDS) {
      if (solid.kind === "ground") continue;
      if (solid.kind === "crate") drawCrate(ctx, solid);
      else drawPlank(ctx, solid, solid.kind === "mint");
    }
    const yardPaint = [
      { x: 250, y: GROUND_Y - 8, rx: 16, ry: 9, rot: -0.2, color: "#ff5b8a" },
      { x: 292, y: GROUND_Y - 2, rx: 22, ry: 11, rot: 0.15, color: "#ff4d7d" },
      { x: 430, y: GROUND_Y - 4, rx: 14, ry: 8, rot: 0.4, color: "#7ed9d0" },
    ];
    for (const splat of yardPaint) drawSplat(ctx, splat.x, splat.y, splat.rx, splat.ry, splat.rot, splat.color);
    for (const decal of decals) drawSplat(ctx, decal.x, decal.y, decal.rx, decal.ry, decal.rot, decal.color);
    if (mode === "crystal") {
      for (const crystal of crystals) {
        ctx.save();
        ctx.translate(crystal.x, crystal.y);
        ctx.fillStyle = crystal.team === 0 ? "#2ee6ff" : "#ff2bd6";
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(18, 0);
        ctx.lineTo(0, 34);
        ctx.lineTo(-18, 0);
        ctx.fill();
        ctx.strokeStyle = "#16161c";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#16161c";
        ctx.font = "700 12px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${crystal.hp}`, 0, 48);
        ctx.restore();
      }
    }
    for (const fighter of fighters) drawStick(ctx, fighter, now);
    for (const bullet of bullets) {
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, Math.max(4.5, bullet.r), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const bit of bits) {
      ctx.fillStyle = bit.color;
      ctx.fillRect(bit.x, bit.y, 4, 4);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK;
    ctx.font = "700 22px Oxanium, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(format(timeLeft), 18, 34);
  }

  function format(value: number) {
    const whole = Math.ceil(value);
    const m = Math.floor(whole / 60);
    const s = whole % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function frame(now: number) {
    try {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= 1 / 60) {
        step(1 / 60);
        steps += 1;
        acc -= 1 / 60;
      }
      render(now);
    } catch (error) {
      loopError = error instanceof Error ? error.message : String(error);
    }
    raf = requestAnimationFrame(frame);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;
    keys.add(event.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  }
  function onKeyUp(event: KeyboardEvent) {
    keys.delete(event.code);
  }
  function onBlur() {
    keys.clear();
  }
  function onPointer(event: PointerEvent) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.inside = true;
    mouse.aimed = true;
    if (event.type === "pointerdown") {
      mouse.down = true;
      canvas.setPointerCapture(event.pointerId);
      unlock();
    }
  }
  function onPointerUp(event: PointerEvent) {
    mouse.down = false;
    const rect = canvas.getBoundingClientRect();
    mouse.inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
  }
  function onLeave(event: PointerEvent) {
    if (mouse.down) return;
    mouse.inside = false;
    mouse.down = false;
    if (event.pointerId) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
  }

  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onPointer);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onLeave);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  raf = requestAnimationFrame(frame);
  prevJump = false;
  void prevJump;

  const probe = {
    getX: () => you().x,
    getVx: () => you().vx,
    getYaw: () => you().facing,
    getSpeed: () => Math.abs(you().vx),
    getDebug: () => ({
      x: you().x,
      vx: you().vx,
      alive: you().alive,
      ended,
      steps,
      loopError,
      qa: [...qa],
    }),
    setKeys: (codes: string[]) => {
      qa.clear();
      for (const code of codes) qa.add(code);
    },
  };
  window.__controlsTest = probe;

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (window.__controlsTest === probe) delete window.__controlsTest;
    },
    setTouch(next: Partial<TouchState>) {
      Object.assign(touch, next);
      if (next.jump || next.fire || next.moveX) unlock();
    },
    getHud(): HudSnap {
      const self = you();
      const leader = [...fighters].sort((a, b) => b.score - a.score)[0];
      const team0 = fighters.filter((fighter) => fighter.team === 0).reduce((sum, fighter) => sum + fighter.kills, 0);
      const team1 = fighters.filter((fighter) => fighter.team === 1).reduce((sum, fighter) => sum + fighter.kills, 0);
      return {
        mode,
        timeLeft,
        hp: self.alive ? self.hp : 0,
        weapon: weaponById(self.weapon).name,
        youScore: self.score,
        leader: leader?.name ?? "",
        leaderScore: leader?.score ?? 0,
        team0,
        team1,
        crystal0: crystals[0]!.hp,
        crystal1: crystals[1]!.hp,
        alive: fighters.filter((fighter) => fighter.alive).length,
        feed: [...feed],
        ended,
      };
    },
  };
}

export function paintPreview(canvas: HTMLCanvasElement, loadout: Loadout, dyes: Dyes, paint = "#ff3d6e") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f6f3ec";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#9aa3ad";
  ctx.fillRect(0, h - 36, w, 36);
  ctx.fillStyle = "#b7c0c8";
  ctx.fillRect(0, h - 48, w, 14);
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 48);
  ctx.lineTo(w, h - 48);
  ctx.stroke();
  const scale = Math.min((w * 0.7) / 40, (h - 56) / 90);
  ctx.save();
  ctx.translate(w / 2, h - 48);
  ctx.scale(scale, scale);
  ctx.translate(-14, -64);
  const fake = {
    x: 0,
    y: 0,
    w: 28,
    h: 64,
    loadout,
    dyes,
    color: paint,
    weapon: "marker",
    aim: -0.15,
    facing: 1,
    vx: 0,
    vy: 0,
    grounded: true,
    id: 1,
    name: "",
    alive: true,
    eliminated: false,
    invuln: 0,
    respawn: 0,
  } as Fighter;
  drawFigure(ctx, fake, 0);
  ctx.restore();
}
