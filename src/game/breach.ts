import * as THREE from "three";

export type BreachHud = {
  hp: number;
  armor: number;
  money: number;
  mag: number;
  reserve: number;
  weapon: string;
  round: number;
  attackScore: number;
  holdScore: number;
  phase: "buy" | "live" | "end" | "match";
  timer: number;
  side: "Plant" | "Hold";
  bomb: string;
  prompt: string;
  note: string;
  locked: boolean;
};

type GunId = "pistol" | "rifle" | "bolt" | "buck";
type Phase = BreachHud["phase"];
type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
type Role = "long" | "tun" | "cat" | "holdA" | "holdB" | "mid";
type Spot = [number, number];
type Actor = {
  team: 0 | 1;
  role: Role;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  mag: number;
  cool: number;
  reload: number;
  route: Spot[];
  cursor: number;
  stuck: number;
  lastX: number;
  lastZ: number;
  mesh: THREE.Group;
  alive: boolean;
};

const GUNS: Record<GunId, { name: string; damage: number; mag: number; reserve: number; rate: number; auto: boolean; spread: number; price: number; pellets: number }> = {
  pistol: { name: "Sidearm", damage: 24, mag: 12, reserve: 36, rate: 0.2, auto: false, spread: 0.018, price: 0, pellets: 1 },
  rifle: { name: "Carbine", damage: 27, mag: 30, reserve: 90, rate: 0.1, auto: true, spread: 0.022, price: 2700, pellets: 1 },
  bolt: { name: "Bolt", damage: 115, mag: 5, reserve: 20, rate: 1.2, auto: false, spread: 0.002, price: 4300, pellets: 1 },
  buck: { name: "Buck", damage: 16, mag: 6, reserve: 24, rate: 0.75, auto: false, spread: 0.09, price: 1500, pellets: 7 },
};

const SITES = [
  { x: -17, z: -10, name: "A" },
  { x: 17, z: -10, name: "B" },
];

const NODES: Record<string, Spot> = {
  tspawn: [0, 20],
  tmid: [0, 13],
  midsouth: [0, 4],
  midnorth: [0, -2],
  midcover: [-4.6, -6],
  midbend: [-4.6, -2],
  cttop: [0, -8],
  ctgate: [0, -12.6],
  ctspawn: [1, -16],
  longt: [-20, 18],
  longm: [-20, 9],
  longa: [-20, 0],
  asite: [-17, -10],
  cat: [-12, -4],
  act: [-13, -13],
  tunnelt: [16, 18],
  tunnelm: [16, 9],
  tunnelb: [17, 0],
  bsite: [17, -10],
  bct: [12, -14],
};

const LINKS: [string, string][] = [
  ["tspawn", "tmid"],
  ["tspawn", "longt"],
  ["tspawn", "tunnelt"],
  ["tmid", "midsouth"],
  ["midsouth", "midnorth"],
  ["midnorth", "midbend"],
  ["midbend", "midcover"],
  ["midcover", "cttop"],
  ["midnorth", "cat"],
  ["cttop", "ctspawn"],
  ["cttop", "ctgate"],
  ["ctgate", "bct"],
  ["cttop", "act"],
  ["longt", "longm"],
  ["longm", "longa"],
  ["longa", "asite"],
  ["cat", "asite"],
  ["act", "asite"],
  ["tunnelt", "tunnelm"],
  ["tunnelm", "tunnelb"],
  ["tunnelb", "bsite"],
  ["bct", "bsite"],
];

const ROUTES: Record<Role, Spot[]> = {
  long: [NODES.longt!, NODES.longm!, NODES.longa!, NODES.asite!],
  tun: [NODES.tunnelt!, NODES.tunnelm!, NODES.tunnelb!, NODES.bsite!],
  cat: [NODES.tmid!, NODES.midsouth!, NODES.midnorth!, NODES.cat!, NODES.asite!],
  holdA: [NODES.ctgate!, NODES.act!, NODES.asite!],
  holdB: [NODES.ctgate!, NODES.bct!, NODES.bsite!],
  mid: [NODES.ctgate!, NODES.cttop!, NODES.midcover!, NODES.midbend!, NODES.midnorth!, NODES.midsouth!],
};

export function mountBreach(canvas: HTMLCanvasElement, onHud: (hud: BreachHud) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#87c4ea");
  scene.fog = new THREE.Fog("#c5d6e4", 26, 68);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 90);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight("#f4efe4", "#8a7048", 0.72));
  const sun = new THREE.DirectionalLight("#fff1d2", 1.35);
  sun.position.set(16, 28, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -32;
  sun.shadow.camera.right = 32;
  sun.shadow.camera.top = 32;
  sun.shadow.camera.bottom = -32;
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const materials = new Map<string, THREE.MeshLambertMaterial>();
  const mat = (color: string) => {
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshLambertMaterial({ color });
      materials.set(color, material);
    }
    return material;
  };
  const boxes: Box[] = [];
  function block(w: number, h: number, d: number, color: string, x: number, y: number, z: number, solid = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (solid) boxes.push({ minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return mesh;
  }

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(70, 64), mat("#c4a36a"));
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.02;
  sand.receiveShadow = true;
  scene.add(sand);
  const concrete = new THREE.Mesh(new THREE.PlaneGeometry(52, 44), mat("#d5cbbd"));
  concrete.rotation.x = -Math.PI / 2;
  concrete.position.set(0, 0, 1);
  concrete.receiveShadow = true;
  scene.add(concrete);

  block(52, 4.2, 0.7, "#cbbba8", 0, 2.1, -20.5);
  block(52, 4.2, 0.7, "#cbbba8", 0, 2.1, 23.5);
  block(0.7, 4.2, 44, "#d9cfc2", -25.3, 2.1, 1.5);
  block(0.7, 4.2, 44, "#d9cfc2", 25.3, 2.1, 1.5);
  block(0.55, 4, 16, "#c8b8a4", -15.4, 2, 7);
  block(0.55, 4, 2.6, "#c8b8a4", -9.2, 2, -16.8);
  block(0.55, 4, 4, "#c8b8a4", -9.2, 2, -8);
  block(8, 2.6, 0.45, "#b7a794", -12, 1.3, 0.2);
  block(0.5, 4, 12, "#d2c4b0", -5.6, 2, 8);
  block(0.5, 4, 12, "#d2c4b0", 5.6, 2, 8);
  block(3.6, 4, 0.45, "#6b4328", -3.4, 2, 1);
  block(3.6, 4, 0.45, "#6b4328", 3.4, 2, 1);
  block(0.5, 4, 16, "#c8b8a4", 12.2, 2, 10);
  block(3.6, 4, 0.5, "#b7a794", 14.2, 2, -2);
  block(6, 4, 0.5, "#b7a794", 21.2, 2, -2);
  block(4.2, 2.6, 0.45, "#b7a794", -0.2, 1.3, -4);
  block(4, 4, 0.5, "#d2c4b0", -3.2, 2, -11);
  block(4.4, 4, 0.5, "#d2c4b0", 3.6, 2, -11);
  block(52, 0.35, 1.4, "#b7a28c", 0, 4.15, -20.2, false);
  block(1.4, 0.35, 44, "#b7a28c", -25, 4.15, 1.5, false);
  block(1.4, 0.35, 44, "#b7a28c", 25, 4.15, 1.5, false);

  function crate(x: number, z: number, tall = false) {
    const h = tall ? 1.25 : 0.9;
    block(1.15, h, 1.15, "#a56b3c", x, h / 2, z);
    block(1.2, 0.08, 0.12, "#6b4328", x, h * 0.45, z + 0.58, false);
    block(1.2, 0.08, 0.12, "#6b4328", x, h * 0.7, z + 0.58, false);
  }
  function barrel(x: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.85, 8), mat("#5c6a62"));
    mesh.position.set(x, 0.42, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    boxes.push({ minX: x - 0.34, maxX: x + 0.34, minY: 0, maxY: 0.85, minZ: z - 0.34, maxZ: z + 0.34 });
  }
  crate(-22.4, 11, true);
  crate(-13.2, -16);
  crate(-21.2, -7, true);
  crate(21.4, 10);
  crate(14.2, -15.2);
  crate(21.2, -7);
  crate(-3.5, 9, true);
  crate(3.5, 7);
  barrel(-18.4, -14.2);
  barrel(19.4, -14.4);
  barrel(6.4, -16.6);
  block(1.3, 2.2, 0.12, "#8d6744", -0.9, 1.1, 1.28, false);
  block(1.3, 2.2, 0.12, "#8d6744", 0.9, 1.1, 0.72, false);

  for (const site of SITES) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.95, 24), mat("#e2c14e"));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.x, 0.05, site.z);
    scene.add(ring);
    block(0.7, 0.7, 0.12, "#e2c14e", site.x, 1.6, site.z - 2.4, false);
  }
  const bombMesh = new THREE.Group();
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), mat("#f2c14e"));
  fuse.position.set(0, 0.16, 0.1);
  bombMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.62), mat("#e25b4a")), fuse);
  bombMesh.visible = false;
  scene.add(bombMesh);

  const gun = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.62), mat("#2a3138"));
  gunBody.position.set(0, 0.02, -0.16);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.12), mat("#3a4148"));
  hand.position.set(0, -0.04, 0.08);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.07), mat("#1c2126"));
  clip.position.set(0, -0.1, 0.02);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.18), mat("#5c4030"));
  stock.position.set(0, 0.01, 0.22);
  gun.add(gunBody, hand, clip, stock);
  gun.position.set(0.28, -0.26, -0.42);
  camera.add(gun);

  const keys = new Set<string>();
  let yaw = 0;
  let pitch = 0;
  let x = 0;
  let y = 0;
  let z = 20;
  let vy = 0;
  let hp = 100;
  let armor = 0;
  let money = 800;
  let gunId: GunId = "pistol";
  let mag = GUNS.pistol.mag;
  let reserve = GUNS.pistol.reserve;
  let cool = 0;
  let reload = 0;
  let trigger = false;
  let plant = 0;
  let defuse = 0;
  let round = 1;
  let attackScore = 0;
  let holdScore = 0;
  let phase: Phase = "buy";
  let timer = 12;
  let playerTeam: 0 | 1 = 0;
  let carrier = true;
  let planted = false;
  let bombX = 0;
  let bombZ = 0;
  let routedBomb = false;
  let note = "Long is left. Mid is the doors. Tunnels are right.";
  let prompt = "";
  let hudKey = "";
  let locked = false;
  const bots: Actor[] = [];

  function figure(color: string) {
    const group = new THREE.Group();
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.58, 0.24), mat("#2c3138"));
    legs.position.y = 0.29;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.3), mat(color));
    torso.position.y = 1.05;
    torso.castShadow = true;
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.12), mat("#23282e"));
    vest.position.set(0, 1.08, 0.16);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.26), mat("#e6c2a2"));
    head.position.y = 1.58;
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), mat(color));
    helm.position.y = 1.74;
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.55), mat("#1c2126"));
    rifle.position.set(0.18, 0.95, 0.28);
    group.add(legs, torso, vest, head, helm, rifle);
    scene.add(group);
    return group;
  }

  function nearestNode(px: number, pz: number) {
    let best = "tspawn";
    let score = Infinity;
    for (const [id, spot] of Object.entries(NODES)) {
      const dist = Math.hypot(spot[0] - px, spot[1] - pz);
      if (dist < score) {
        score = dist;
        best = id;
      }
    }
    return best;
  }

  function routeNodes(fromId: string, toId: string) {
    const queue = [fromId];
    const prev = new Map<string, string | null>([[fromId, null]]);
    while (queue.length) {
      const id = queue.shift()!;
      if (id === toId) break;
      for (const [a, b] of LINKS) {
        const next = a === id ? b : b === id ? a : "";
        if (!next || prev.has(next)) continue;
        prev.set(next, id);
        queue.push(next);
      }
    }
    const spots: Spot[] = [];
    if (!prev.has(toId)) return spots;
    let cursor: string | null = toId;
    const chain: string[] = [];
    while (cursor) {
      chain.push(cursor);
      cursor = prev.get(cursor) ?? null;
    }
    chain.reverse();
    for (const id of chain) spots.push(NODES[id]!);
    return spots;
  }

  function spawnBots() {
    for (const bot of bots) scene.remove(bot.mesh);
    bots.length = 0;
    const attackRoles: Role[] = ["long", "tun", "cat"];
    const holdRoles: Role[] = ["holdA", "holdB", "mid"];
    const attackCount = playerTeam === 0 ? 2 : 3;
    const holdCount = playerTeam === 1 ? 2 : 3;
    const attackSpots: Spot[] = [
      [-3, 21],
      [3.2, 21],
      [0, 22.2],
    ];
    const holdSpots: Spot[] = [
      [-2.4, -17],
      [4, -16.4],
      [1, -18.4],
    ];
    for (let index = 0; index < attackCount; index += 1) {
      const role = attackRoles[index]!;
      const spot = attackSpots[index]!;
      bots.push(makeBot(0, role, spot[0], spot[1], "#e07a32"));
    }
    for (let index = 0; index < holdCount; index += 1) {
      const role = holdRoles[index]!;
      const spot = holdSpots[index]!;
      bots.push(makeBot(1, role, spot[0], spot[1], "#2f6fbe"));
    }
  }

  function makeBot(team: 0 | 1, role: Role, sx: number, sz: number, color: string): Actor {
    return {
      team,
      role,
      x: sx,
      z: sz,
      yaw: team === 0 ? 0 : Math.PI,
      hp: 100,
      mag: 30,
      cool: 0.3 + Math.random() * 0.4,
      reload: 0,
      route: [...ROUTES[role]],
      cursor: 0,
      stuck: 0,
      lastX: sx,
      lastZ: sz,
      mesh: figure(color),
      alive: true,
    };
  }

  function resetRound(nextPhase: Phase) {
    playerTeam = round % 2 === 0 ? 1 : 0;
    const attack = playerTeam === 0;
    x = attack ? 0 : 1;
    z = attack ? 20 : -16;
    y = 0;
    vy = 0;
    yaw = attack ? 0 : Math.PI;
    pitch = 0;
    hp = 100;
    mag = GUNS[gunId].mag;
    reserve = GUNS[gunId].reserve;
    cool = 0;
    reload = 0;
    plant = 0;
    defuse = 0;
    planted = false;
    routedBomb = false;
    carrier = attack;
    bombMesh.visible = false;
    spawnBots();
    phase = nextPhase;
    timer = nextPhase === "buy" ? 12 : 115;
  }

  function blocked(px: number, pz: number) {
    const r = 0.34;
    return boxes.some((box) => px + r > box.minX && px - r < box.maxX && 0.2 < box.maxY && 1.45 > box.minY && pz + r > box.minZ && pz - r < box.maxZ);
  }

  function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, box: Box, max: number) {
    let tmin = 0;
    let tmax = max;
    const span: [number, number, number, number][] = [
      [box.minX, box.maxX, ox, dx],
      [box.minY, box.maxY, oy, dy],
      [box.minZ, box.maxZ, oz, dz],
    ];
    for (const [min, maxSide, origin, delta] of span) {
      if (Math.abs(delta) < 1e-7) {
        if (origin < min || origin > maxSide) return -1;
        continue;
      }
      let t1 = (min - origin) / delta;
      let t2 = (maxSide - origin) / delta;
      if (t1 > t2) {
        const swap = t1;
        t1 = t2;
        t2 = swap;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return -1;
    }
    return tmin >= 0 ? tmin : -1;
  }

  function wallDistance(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number) {
    let best = max;
    for (const box of boxes) {
      const hit = rayBox(ox, oy, oz, dx, dy, dz, box, best);
      if (hit >= 0 && hit < best) best = hit;
    }
    return best;
  }

  function raySphere(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cy: number, cz: number, radius: number) {
    const lx = cx - ox;
    const ly = cy - oy;
    const lz = cz - oz;
    const t = lx * dx + ly * dy + lz * dz;
    if (t < 0) return -1;
    const miss = (ox + dx * t - cx) ** 2 + (oy + dy * t - cy) ** 2 + (oz + dz * t - cz) ** 2;
    if (miss > radius * radius) return -1;
    return t - Math.sqrt(radius * radius - miss);
  }

  function hurtPlayer(amount: number) {
    const soaked = Math.min(armor, amount * 0.5);
    armor -= soaked;
    hp = Math.max(0, hp - (amount - soaked));
    if (hp <= 0 && carrier && !planted) carrier = false;
  }

  function fire(team: 0 | 1, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, spec: (typeof GUNS)[GunId]) {
    const len = Math.hypot(dx, dy, dz) || 1;
    for (let pellet = 0; pellet < spec.pellets; pellet += 1) {
      const sx = dx / len + (Math.random() - 0.5) * spec.spread;
      const sy = dy / len + (Math.random() - 0.5) * spec.spread;
      const sz = dz / len + (Math.random() - 0.5) * spec.spread;
      const nlen = Math.hypot(sx, sy, sz) || 1;
      const ndx = sx / nlen;
      const ndy = sy / nlen;
      const ndz = sz / nlen;
      let best = wallDistance(ox, oy, oz, ndx, ndy, ndz, 48);
      let kind: "player" | number = -1;
      if (team !== playerTeam && hp > 0) {
        const hit = raySphere(ox, oy, oz, ndx, ndy, ndz, x, y + 1.15, z, 0.42);
        if (hit >= 0 && hit < best) {
          best = hit;
          kind = "player";
        }
      }
      bots.forEach((bot, index) => {
        if (!bot.alive || bot.team === team) return;
        const hit = raySphere(ox, oy, oz, ndx, ndy, ndz, bot.x, 1.15, bot.z, 0.42);
        if (hit >= 0 && hit < best) {
          best = hit;
          kind = index;
        }
      });
      if (kind === "player") hurtPlayer(spec.damage);
      else if (kind >= 0) {
        const bot = bots[kind]!;
        bot.hp -= spec.damage;
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.mesh.visible = false;
          if (team === playerTeam) money += 300;
        }
      }
    }
  }

  function onSite(px: number, pz: number) {
    return SITES.some((site) => Math.hypot(px - site.x, pz - site.z) < 2.6);
  }

  function living(team: 0 | 1) {
    return bots.filter((bot) => bot.alive && bot.team === team).length + (playerTeam === team && hp > 0 ? 1 : 0);
  }

  function finish(attackWins: boolean, why: string) {
    if (phase !== "live") return;
    if (attackWins) attackScore += 1;
    else holdScore += 1;
    money += attackWins === (playerTeam === 0) ? 3000 : 1400;
    note = why;
    if (attackScore >= 7 || holdScore >= 7) {
      phase = "match";
      timer = 0;
      note = attackScore > holdScore ? "Plant takes the match." : "Hold takes the match.";
      return;
    }
    phase = "end";
    timer = 4;
  }

  function hud() {
    const spec = GUNS[gunId];
    const bomb = planted ? "Planted" : carrier && playerTeam === 0 ? "You carry it" : playerTeam === 0 ? "A teammate carries it" : "Not planted";
    const key = `${hp}|${armor}|${money}|${mag}|${gunId}|${phase}|${Math.ceil(timer)}|${prompt}|${note}|${locked}|${attackScore}|${holdScore}|${bomb}`;
    if (key === hudKey) return;
    hudKey = key;
    onHud({
      hp,
      armor,
      money,
      mag,
      reserve,
      weapon: spec.name,
      round,
      attackScore,
      holdScore,
      phase,
      timer: Math.ceil(timer),
      side: playerTeam === 0 ? "Plant" : "Hold",
      bomb,
      prompt,
      note,
      locked,
    });
  }

  function buy(id: GunId | "armor") {
    if (phase !== "buy") return;
    if (id === "armor") {
      if (armor >= 50 || money < 650) return;
      money -= 650;
      armor = 50;
      note = "Vest on.";
      hud();
      return;
    }
    const spec = GUNS[id];
    if (money < spec.price) {
      note = `${spec.name} costs ${spec.price}.`;
      hud();
      return;
    }
    money -= spec.price;
    gunId = id;
    mag = spec.mag;
    reserve = spec.reserve;
    note = `${spec.name} ready.`;
    hud();
  }

  function restart() {
    round = 1;
    attackScore = 0;
    holdScore = 0;
    money = 800;
    gunId = "pistol";
    armor = 0;
    note = "New match. Long left, mid doors, tunnels right.";
    resetRound("buy");
    hud();
  }

  function shootPlayer() {
    const spec = GUNS[gunId];
    if (phase !== "live" || hp <= 0 || reload > 0 || cool > 0 || mag <= 0) return;
    mag -= 1;
    cool = spec.rate;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    fire(playerTeam, camera.position.x, camera.position.y, camera.position.z, dir.x, dir.y, dir.z, spec);
    pitch += 0.012;
    gun.position.z = -0.28;
    if (mag === 0 && reserve > 0) reload = 1.5;
  }

  function moveToward(bot: Actor, tx: number, tz: number, dt: number) {
    const dx = tx - bot.x;
    const dz = tz - bot.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.45) return true;
    const step = Math.min(4.5 * dt, dist);
    const ux = dx / dist;
    const uz = dz / dist;
    const nx = bot.x + ux * step;
    const nz = bot.z + uz * step;
    if (!blocked(nx, nz)) {
      bot.x = nx;
      bot.z = nz;
    } else if (!blocked(nx, bot.z)) bot.x = nx;
    else if (!blocked(bot.x, nz)) bot.z = nz;
    else {
      const side = bot.stuck > 0.25 ? 1 : -1;
      const sx = -uz * side;
      const sz = ux * side;
      if (!blocked(bot.x + sx * 0.8, bot.z + sz * 0.8)) {
        bot.x += sx * step;
        bot.z += sz * step;
      }
    }
    bot.yaw = Math.atan2(dx, dz);
    return false;
  }

  function retargetBomb() {
    const goal = Math.hypot(bombX - SITES[0]!.x, bombZ - SITES[0]!.z) < Math.hypot(bombX - SITES[1]!.x, bombZ - SITES[1]!.z) ? "asite" : "bsite";
    for (const bot of bots) {
      if (!bot.alive) continue;
      const from = nearestNode(bot.x, bot.z);
      bot.route = [...routeNodes(from, goal), [bombX, bombZ]];
      bot.cursor = 0;
    }
  }

  function stepBot(bot: Actor, dt: number, planter: boolean, defuser: boolean) {
    if (!bot.alive || phase !== "live") return;
    bot.cool = Math.max(0, bot.cool - dt);
    const wasReload = bot.reload;
    bot.reload = Math.max(0, bot.reload - dt);
    if (wasReload > 0 && bot.reload === 0) bot.mag = 30;
    if (bot.mag <= 0 && bot.reload === 0) bot.reload = 1.4;
    const foes = [
      ...(playerTeam !== bot.team && hp > 0 ? [{ x, y: y + 1.15, z }] : []),
      ...bots.filter((other) => other.alive && other.team !== bot.team).map((other) => ({ x: other.x, y: 1.15, z: other.z })),
    ];
    let seen: { x: number; y: number; z: number } | null = null;
    let best = 28;
    for (const foe of foes) {
      const dx = foe.x - bot.x;
      const dy = foe.y - 1.4;
      const dz = foe.z - bot.z;
      const dist = Math.hypot(dx, dz);
      if (dist > best) continue;
      const len = Math.hypot(dx, dy, dz) || 1;
      const clear = wallDistance(bot.x, 1.4, bot.z, dx / len, dy / len, dz / len, dist);
      if (clear > dist - 0.35) {
        seen = foe;
        best = dist;
      }
    }
    if (seen && best < 16 && bot.cool <= 0 && bot.mag > 0 && bot.reload <= 0) {
      const dx = seen.x - bot.x;
      const dy = seen.y - 1.4;
      const dz = seen.z - bot.z;
      fire(bot.team, bot.x, 1.4, bot.z, dx, dy, dz, { ...GUNS.rifle, spread: best > 8 ? 0.09 : 0.04 });
      bot.cool = best < 8 ? 0.22 : 0.45;
      bot.mag -= 1;
      bot.yaw = Math.atan2(dx, dz);
    }
    const fighting = seen !== null && best < 11;
    if (!fighting) {
      const point = bot.route[Math.min(bot.cursor, bot.route.length - 1)];
      if (point) {
        const arrived = moveToward(bot, point[0], point[1], dt);
        if (arrived && bot.cursor < bot.route.length - 1) bot.cursor += 1;
      }
    } else if (seen) {
      const side = Math.sin(performance.now() / 280 + bot.x) * 2.2 * dt;
      const dx = seen.x - bot.x;
      const dz = seen.z - bot.z;
      const len = Math.hypot(dx, dz) || 1;
      const sx = bot.x + (-dz / len) * side;
      const sz = bot.z + (dx / len) * side;
      if (!blocked(sx, sz)) {
        bot.x = sx;
        bot.z = sz;
      }
    }
    if (Math.hypot(bot.x - bot.lastX, bot.z - bot.lastZ) < 0.02) bot.stuck += dt;
    else bot.stuck = 0;
    bot.lastX = bot.x;
    bot.lastZ = bot.z;
    if (bot.stuck > 0.8) {
      bot.stuck = 0;
      if (bot.cursor < bot.route.length - 1) bot.cursor += 1;
    }
    if (planter && !planted && !carrier && onSite(bot.x, bot.z)) {
      plant += dt;
      if (plant >= 2.4) {
        planted = true;
        plant = 0;
        bombX = bot.x;
        bombZ = bot.z;
        bombMesh.visible = true;
        bombMesh.position.set(bombX, 0.2, bombZ);
        timer = 35;
        note = "The case is planted.";
      }
    }
    if (defuser && planted && Math.hypot(bot.x - bombX, bot.z - bombZ) < 1.9) {
      defuse += dt;
      if (defuse >= 5) finish(false, "The case is defused.");
    }
    bot.mesh.position.set(bot.x, 0, bot.z);
    bot.mesh.rotation.y = bot.yaw;
    bot.mesh.visible = bot.alive;
  }

  function step(dt: number) {
    locked = document.pointerLockElement === canvas;
    cool = Math.max(0, cool - dt);
    const wasReload = reload;
    reload = Math.max(0, reload - dt);
    if (wasReload > 0 && reload === 0 && reserve > 0) {
      const need = GUNS[gunId].mag - mag;
      const take = Math.min(need, reserve);
      mag += take;
      reserve -= take;
    }
    gun.position.z += (-0.42 - gun.position.z) * Math.min(1, dt * 10);
    if (phase === "buy" || phase === "end") {
      timer -= dt;
      if (timer <= 0) {
        if (phase === "buy") {
          phase = "live";
          timer = 115;
          note = playerTeam === 0 ? "Plant on a gold ring. Hold F." : "Hold the sites. Defuse with F.";
        } else {
          round += 1;
          resetRound("buy");
        }
      }
    }
    if (hp > 0 && phase !== "match") {
      const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      const speed = 4.7;
      const nx = x + (-Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed * dt;
      const nz = z + (-Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * speed * dt;
      if (!blocked(nx, z)) x = nx;
      if (!blocked(x, nz)) z = nz;
      x = Math.max(-24.4, Math.min(24.4, x));
      z = Math.max(-19.6, Math.min(22.6, z));
      vy -= 22 * dt;
      y += vy * dt;
      if (y <= 0) {
        y = 0;
        vy = 0;
      }
      if (keys.has("Space") && y === 0) vy = 7.2;
      if (phase === "live" && keys.has("KeyR") && reserve > 0 && mag < GUNS[gunId].mag && reload === 0) reload = 1.45;
      if (phase === "live" && trigger && GUNS[gunId].auto) shootPlayer();
    }
    if (phase === "live") {
      timer -= dt;
      if (planted && !routedBomb) {
        routedBomb = true;
        retargetBomb();
      }
      const wantA = round % 2 === 0;
      const planter =
        bots.find((bot) => bot.alive && bot.team === 0 && (wantA ? bot.role === "long" || bot.role === "cat" : bot.role === "tun")) ??
        bots.find((bot) => bot.alive && bot.team === 0);
      const holders = bots.filter((bot) => bot.alive && bot.team === 1);
      holders.sort((a, b) => Math.hypot(a.x - bombX, a.z - bombZ) - Math.hypot(b.x - bombX, b.z - bombZ));
      const playerDefusing = playerTeam === 1 && hp > 0 && planted && Math.hypot(x - bombX, z - bombZ) < 1.9;
      const defuser = planted && !playerDefusing ? holders[0] : undefined;
      for (const bot of bots) stepBot(bot, dt, bot === planter, bot === defuser);
      prompt = "";
      if (playerTeam === 0 && carrier && !planted && onSite(x, z) && hp > 0) {
        prompt = "Hold F to plant";
        if (keys.has("KeyF")) {
          plant += dt;
          if (plant >= 2.4) {
            planted = true;
            carrier = false;
            plant = 0;
            bombX = x;
            bombZ = z;
            bombMesh.visible = true;
            bombMesh.position.set(bombX, 0.2, bombZ);
            timer = 35;
            note = "Case planted.";
          }
        } else plant = 0;
      }
      if (playerTeam === 1 && planted && hp > 0 && Math.hypot(x - bombX, z - bombZ) < 1.9) {
        prompt = "Hold F to defuse";
        if (keys.has("KeyF")) {
          defuse += dt;
          if (defuse >= 5) finish(false, "You defused the case.");
        } else defuse = 0;
      }
      if (hp <= 0) prompt = "You're down.";
      if (planted && timer <= 0) finish(true, "The case goes off.");
      else if (!planted && timer <= 0) finish(false, "Time. The hold wins.");
      else if (living(0) === 0 && !planted) finish(false, "Plant team is down.");
      else if (living(1) === 0) finish(true, "Hold team is down.");
    }
    camera.position.set(x, y + 1.55, z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    hud();
  }

  let raf = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    if (canvas.width !== Math.floor(width * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    step(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") {
      keys.add(event.code);
      if (["Space", "KeyR", "KeyF"].includes(event.code)) event.preventDefault();
    } else keys.delete(event.code);
  }
  function onMouse(event: MouseEvent) {
    if (document.pointerLockElement !== canvas && event.buttons === 0) return;
    yaw -= event.movementX * 0.0022;
    pitch = Math.max(-1.25, Math.min(1.25, pitch - event.movementY * 0.0022));
  }
  function onDown(event: PointerEvent) {
    if (event.button === 0) {
      canvas.requestPointerLock();
      trigger = true;
      if (phase === "live") shootPlayer();
    }
  }
  function onUp(event: PointerEvent) {
    if (event.button === 0) trigger = false;
  }
  function onLock() {
    locked = document.pointerLockElement === canvas;
    hudKey = "";
    hud();
  }

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("mousemove", onMouse);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  document.addEventListener("pointerlockchange", onLock);
  resetRound("buy");
  hud();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      document.removeEventListener("pointerlockchange", onLock);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      renderer.dispose();
    },
    buy,
    restart,
  };
}
