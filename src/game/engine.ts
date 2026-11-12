import { weaponById, type ModeId, type WeaponDef } from "@/data/catalog";

export type MatchFighterSetup = {
  name: string;
  color: string;
  skin: string | null;
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

type Solid = { x: number; y: number; w: number; h: number; oneWay?: boolean };
type Fighter = {
  id: number;
  name: string;
  you: boolean;
  bot: boolean;
  team: number;
  color: string;
  skin: string | null;
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
};
type Decal = { x: number; y: number; rx: number; ry: number; rot: number; color: string };
type Bit = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Crystal = { x: number; y: number; team: number; hp: number; max: number };

const WORLD_W = 2000;
const WORLD_H = 640;
const GROUND_Y = 520;
const PW = 26;
const PH = 58;

const SOLIDS: Solid[] = [
  { x: 0, y: GROUND_Y, w: WORLD_W, h: 160 },
  { x: 70, y: 400, w: 230, h: 16 },
  { x: 360, y: 310, w: 180, h: 14, oneWay: true },
  { x: 560, y: 410, w: 200, h: 16 },
  { x: 800, y: 280, w: 260, h: 16 },
  { x: 1120, y: 390, w: 170, h: 14, oneWay: true },
  { x: 1340, y: 318, w: 210, h: 16 },
  { x: 1620, y: 418, w: 240, h: 16 },
  { x: 980, y: 440, w: 90, h: 80 },
];

const ZONE = { x: 900, y: 470, w: 220, h: 50 };
const SPAWNS = [90, 240, 430, 680, 1240, 1500, 1720, 1880];

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
  const mouse = { x: 0, y: 0, down: false, inside: false };
  const fighters: Fighter[] = [];
  const roster = [setup.you, ...setup.others];
  roster.forEach((entry, index) => {
    const team = teamMode ? (index < Math.ceil(roster.length / 2) ? 0 : 1) : index;
    const spawnX = teamMode
      ? team === 0
        ? SPAWNS[index % 4]!
        : SPAWNS[4 + (index % 4)]!
      : SPAWNS[index % SPAWNS.length]!;
    fighters.push({
      id: index,
      name: entry.name,
      you: index === 0,
      bot: entry.bot,
      team,
      color: entry.color,
      skin: entry.skin,
      weapon: entry.weapon,
      x: spawnX,
      y: GROUND_Y - PH,
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
    { x: 120, y: 468, team: 0, hp: 18, max: 18 },
    { x: 1880, y: 468, team: 1, hp: 18, max: 18 },
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
  let viewW = 900;
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
      if (dx > 0) body.x = solid.x - body.w;
      else body.x = solid.x + solid.w;
      body.vx = 0;
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
    const probe = { x: bot.x + dir * 16, y: bot.y + 8, w: bot.w, h: 24 };
    const blocked = SOLIDS.some((solid) => !solid.oneWay && overlaps(probe, solid));
    bot.wantJump = Boolean(bot.grounded && (blocked || ty + 30 < bot.y) && Math.abs(dx) < 140);
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
      } else if (Math.abs(fighter.vx) > 8) {
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
    if (Math.abs(fighter.vx) > 20) fighter.facing = fighter.vx > 0 ? 1 : -1;
    else if (Math.cos(fighter.aim) > 0.2) fighter.facing = 1;
    else if (Math.cos(fighter.aim) < -0.2) fighter.facing = -1;
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
        const spots = teamMode
          ? SPAWNS.filter((_, index) => (fighter.team === 0 ? index < 4 : index >= 4))
          : SPAWNS;
        fighter.x = spots[Math.floor(Math.random() * spots.length)]!;
        fighter.y = GROUND_Y - PH;
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
      fighter.vy = -690;
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
            splat(bullet.x, bullet.y, bullet.color);
            dead = true;
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
    viewH = 640;
    viewW = clamp(viewH * (rect.width / Math.max(1, rect.height)), 460, 1500);
  }

  function screenToWorld(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const u = (clientX - rect.left) / Math.max(1, rect.width);
    const v = (clientY - rect.top) / Math.max(1, rect.height);
    return { x: camX + u * viewW, y: v * viewH };
  }

  function updateCam() {
    const fighter = you();
    const target = fighter.x + fighter.w / 2 - viewW * 0.42;
    camX += (target - camX) * 0.14;
    camX = clamp(camX, 0, Math.max(0, WORLD_W - viewW));
    if (shake > 0) camX += (Math.random() - 0.5) * shake;
  }

  function drawStick(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number) {
    if (!fighter.alive && fighter.eliminated) return;
    if (!fighter.alive) return;
    if (fighter.invuln > 0 && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.45;
    const x = fighter.x;
    const y = fighter.y;
    const cx = x + fighter.w / 2;
    const bob = fighter.grounded ? Math.sin(now / 90 + fighter.id) * Math.min(4, Math.abs(fighter.vx) / 80) : 0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16161c";
    ctx.lineWidth = 3;
    if (fighter.skin === "cape") {
      ctx.fillStyle = fighter.color;
      ctx.beginPath();
      ctx.moveTo(cx, y + 22);
      ctx.lineTo(cx - 18 * fighter.facing, y + 58);
      ctx.lineTo(cx + 2 * fighter.facing, y + 34);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx, y + 36);
    ctx.lineTo(cx - 8, y + PH + bob);
    ctx.moveTo(cx, y + 36);
    ctx.lineTo(cx + 8, y + PH - bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y + 26);
    ctx.lineTo(cx, y + 40);
    ctx.stroke();
    const handX = cx + Math.cos(fighter.aim) * 16;
    const handY = y + 30 + Math.sin(fighter.aim) * 16;
    ctx.beginPath();
    ctx.moveTo(cx, y + 28);
    ctx.lineTo(handX, handY);
    ctx.moveTo(cx, y + 28);
    ctx.lineTo(cx - fighter.facing * 10, y + 34 + bob);
    ctx.stroke();
    ctx.strokeStyle = fighter.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(handX + Math.cos(fighter.aim) * 12, handY + Math.sin(fighter.aim) * 12);
    ctx.stroke();
    ctx.strokeStyle = "#16161c";
    ctx.lineWidth = 3;
    if (fighter.skin === "shirt" || !fighter.skin) {
      ctx.fillStyle = fighter.skin === "shirt" ? fighter.color : "#f7f4ee";
      ctx.fillRect(cx - 7, y + 24, 14, 14);
      ctx.strokeRect(cx - 7, y + 24, 14, 14);
    }
    if (fighter.skin === "hoodie") {
      ctx.fillStyle = fighter.color;
      ctx.fillRect(cx - 10, y + 20, 20, 22);
      ctx.strokeRect(cx - 10, y + 20, 20, 22);
      ctx.beginPath();
      ctx.arc(cx, y + 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }
    if (fighter.skin === "gasmask") {
      ctx.fillStyle = "#2a2e36";
      ctx.fillRect(cx - 10, y + 22, 20, 20);
      ctx.strokeRect(cx - 10, y + 22, 20, 20);
    }
    if (fighter.skin === "camo") {
      ctx.fillStyle = "#4e623f";
      ctx.fillRect(cx - 11, y + 22, 22, 20);
      ctx.strokeRect(cx - 11, y + 22, 22, 20);
      ctx.fillStyle = "#6b7a45";
      ctx.fillRect(cx - 6, y + 26, 5, 5);
      ctx.fillRect(cx + 2, y + 32, 6, 4);
    }
    ctx.fillStyle = "#f7f4ee";
    ctx.beginPath();
    ctx.arc(cx, y + 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (fighter.skin === "bandana") {
      ctx.fillStyle = fighter.color;
      ctx.fillRect(cx - 12, y + 14, 24, 7);
    }
    if (fighter.skin === "beanie") {
      ctx.fillStyle = fighter.color;
      ctx.beginPath();
      ctx.arc(cx, y + 12, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - 13, y + 10, 26, 5);
      ctx.strokeRect(cx - 13, y + 10, 26, 5);
    }
    if (fighter.skin === "mohawk") {
      ctx.fillStyle = fighter.color;
      ctx.beginPath();
      ctx.moveTo(cx - 3, y + 6);
      ctx.lineTo(cx, y - 12);
      ctx.lineTo(cx + 3, y + 6);
      ctx.fill();
    }
    if (fighter.skin === "visor") {
      ctx.fillStyle = "#14141c";
      ctx.fillRect(cx - 13, y + 10, 26, 6);
      ctx.fillStyle = fighter.color;
      ctx.fillRect(cx - 11, y + 11, 22, 3);
    }
    if (fighter.skin === "gasmask") {
      ctx.fillStyle = "#1b1e24";
      ctx.beginPath();
      ctx.arc(cx, y + 14, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fighter.color;
      ctx.beginPath();
      ctx.arc(cx - 5, y + 14, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 5, y + 14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (fighter.skin === "camo") {
      ctx.fillStyle = "#3d4f32";
      ctx.beginPath();
      ctx.arc(cx, y + 12, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - 16, y + 8, 6, 10);
      ctx.fillRect(cx + 10, y + 8, 6, 10);
    }
    if (fighter.skin === "hoodie") {
      ctx.strokeStyle = "#16161c";
      ctx.beginPath();
      ctx.arc(cx, y + 16, 12, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.font = "600 12px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f7f4ee";
    ctx.strokeText(fighter.name, cx, y - 8);
    ctx.fillStyle = "#16161c";
    ctx.fillText(fighter.name, cx, y - 8);
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
    ctx.fillStyle = "#d5e4ec";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.setTransform(dpr * sx, 0, 0, dpr * sy, -camX * dpr * sx, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    sky.addColorStop(0, "#c5dceb");
    sky.addColorStop(1, "#e7eef2");
    ctx.fillStyle = sky;
    ctx.fillRect(camX - 20, 0, viewW + 40, WORLD_H);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 380 + now * 0.01) % (WORLD_W + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(cx, 80 + (i % 3) * 28, 50, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mode === "koth") {
      ctx.fillStyle = "rgba(255, 200, 60, 0.45)";
      ctx.fillRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h);
      ctx.strokeStyle = "#e0a020";
      ctx.strokeRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h);
    }
    for (const solid of SOLIDS) {
      if (solid.y === GROUND_Y) {
        ctx.fillStyle = "#66707a";
        ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
        ctx.strokeStyle = "#4c555e";
        ctx.lineWidth = 2;
        for (let x = 0; x < WORLD_W; x += 40) {
          ctx.strokeRect(x, GROUND_Y, 40, 28);
          ctx.strokeRect(x + 20, GROUND_Y + 28, 40, 28);
        }
      } else if (solid.oneWay) {
        ctx.fillStyle = "#7dcea0";
        ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
        ctx.fillStyle = "#16161c";
        for (let x = solid.x + 8; x < solid.x + solid.w; x += 16) ctx.fillRect(x, solid.y + 4, 6, 4);
      } else if (solid.h > 40) {
        ctx.fillStyle = "#d7a15a";
        ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
        ctx.strokeStyle = "#6b3d1e";
        ctx.lineWidth = 3;
        ctx.strokeRect(solid.x, solid.y, solid.w, solid.h);
        ctx.beginPath();
        ctx.moveTo(solid.x, solid.y);
        ctx.lineTo(solid.x + solid.w, solid.y + solid.h);
        ctx.moveTo(solid.x + solid.w, solid.y);
        ctx.lineTo(solid.x, solid.y + solid.h);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#e0a15a";
        ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
        ctx.strokeStyle = "#6b3d1e";
        ctx.lineWidth = 3;
        ctx.strokeRect(solid.x, solid.y, solid.w, solid.h);
        ctx.fillStyle = "#6b3d1e";
        ctx.beginPath();
        ctx.arc(solid.x + 8, solid.y + solid.h / 2, 2, 0, Math.PI * 2);
        ctx.arc(solid.x + solid.w - 8, solid.y + solid.h / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const decal of decals) {
      ctx.save();
      ctx.translate(decal.x, decal.y);
      ctx.rotate(decal.rot);
      ctx.fillStyle = decal.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, decal.rx, decal.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
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
      ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#16161c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (const bit of bits) {
      ctx.fillStyle = bit.color;
      ctx.fillRect(bit.x, bit.y, 4, 4);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(7,7,11,0.78)";
    ctx.fillRect(12, 12, 220, 58);
    ctx.fillStyle = "#f4f0e6";
    ctx.font = "700 18px Oxanium, sans-serif";
    ctx.textAlign = "left";
    const clock = mode === "lms" && timeLeft > 0 ? format(timeLeft) : format(timeLeft);
    ctx.fillText(clock, 24, 36);
    ctx.font = "500 13px Outfit, sans-serif";
    ctx.fillStyle = "#2ee6ff";
    ctx.fillText(`${you().name}  ${you().hp <= 0 ? "out" : you().hp === 2 ? "full" : "tagged"}`, 24, 56);
    if (!ended && timeLeft > seconds - 4) {
      ctx.fillStyle = "rgba(7,7,11,0.72)";
      ctx.fillRect(cssW / 2 - 160, cssH - 72, 320, 44);
      ctx.fillStyle = "#f4f0e6";
      ctx.font = "500 13px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("A D move   W / Space jump   hold click to shoot", cssW / 2, cssH - 46);
    }
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
    if (event.type === "pointerdown") {
      mouse.down = true;
      unlock();
    }
  }
  function onPointerUp() {
    mouse.down = false;
  }
  function onLeave() {
    mouse.inside = false;
    mouse.down = false;
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

export function paintPreview(canvas: HTMLCanvasElement, skin: string | null, color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#e7eef2";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#66707a";
  ctx.fillRect(0, h - 28, w, 28);
  const fake = {
    x: w / 2 - 18,
    y: h - 28 - 78,
    w: 36,
    h: 78,
    skin,
    color,
    aim: 0.1,
    facing: 1,
    vx: 0,
    grounded: true,
    id: 1,
    name: "",
    alive: true,
    eliminated: false,
    invuln: 0,
  } as Fighter;
  ctx.save();
  ctx.translate(0, 8);
  drawPreview(ctx, fake);
  ctx.restore();
}

function drawPreview(ctx: CanvasRenderingContext2D, fighter: Fighter) {
  const scale = 1.15;
  ctx.translate(fighter.x, fighter.y);
  ctx.scale(scale, scale);
  ctx.translate(-fighter.x, -fighter.y);
  const now = 0;
  const x = fighter.x;
  const y = fighter.y;
  const cx = x + fighter.w / 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#16161c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, y + 36);
  ctx.lineTo(cx - 8, y + fighter.h);
  ctx.moveTo(cx, y + 36);
  ctx.lineTo(cx + 8, y + fighter.h);
  ctx.moveTo(cx, y + 26);
  ctx.lineTo(cx, y + 40);
  ctx.moveTo(cx, y + 28);
  ctx.lineTo(cx + 16, y + 32);
  ctx.stroke();
  ctx.strokeStyle = fighter.color;
  ctx.beginPath();
  ctx.moveTo(cx + 16, y + 32);
  ctx.lineTo(cx + 28, y + 32);
  ctx.stroke();
  ctx.strokeStyle = "#16161c";
  if (fighter.skin === "shirt" || !fighter.skin) {
    ctx.fillStyle = fighter.skin === "shirt" ? fighter.color : "#f7f4ee";
    ctx.fillRect(cx - 7, y + 24, 14, 14);
    ctx.strokeRect(cx - 7, y + 24, 14, 14);
  }
  if (fighter.skin === "hoodie") {
    ctx.fillStyle = fighter.color;
    ctx.fillRect(cx - 10, y + 20, 20, 22);
    ctx.strokeRect(cx - 10, y + 20, 20, 22);
  }
  if (fighter.skin === "cape") {
    ctx.fillStyle = fighter.color;
    ctx.beginPath();
    ctx.moveTo(cx, y + 24);
    ctx.lineTo(cx - 16, y + 56);
    ctx.lineTo(cx + 2, y + 34);
    ctx.fill();
  }
  if (fighter.skin === "camo" || fighter.skin === "gasmask") {
    ctx.fillStyle = fighter.skin === "camo" ? "#4e623f" : "#2a2e36";
    ctx.fillRect(cx - 10, y + 22, 20, 20);
  }
  ctx.fillStyle = "#f7f4ee";
  ctx.beginPath();
  ctx.arc(cx, y + 14, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (fighter.skin === "bandana") {
    ctx.fillStyle = fighter.color;
    ctx.fillRect(cx - 12, y + 14, 24, 7);
  }
  if (fighter.skin === "beanie" || fighter.skin === "camo") {
    ctx.fillStyle = fighter.skin === "camo" ? "#3d4f32" : fighter.color;
    ctx.beginPath();
    ctx.arc(cx, y + 12, 13, Math.PI, 0);
    ctx.fill();
  }
  if (fighter.skin === "mohawk") {
    ctx.fillStyle = fighter.color;
    ctx.beginPath();
    ctx.moveTo(cx - 3, y + 6);
    ctx.lineTo(cx, y - 10);
    ctx.lineTo(cx + 3, y + 6);
    ctx.fill();
  }
  if (fighter.skin === "visor") {
    ctx.fillStyle = fighter.color;
    ctx.fillRect(cx - 12, y + 10, 24, 5);
  }
  if (fighter.skin === "gasmask") {
    ctx.fillStyle = "#1b1e24";
    ctx.beginPath();
    ctx.arc(cx, y + 14, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  void now;
}
