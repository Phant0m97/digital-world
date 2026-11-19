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
type Actor = {
  team: 0 | 1;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  mag: number;
  cool: number;
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
  { x: -11, z: -9 },
  { x: 11, z: -9 },
];

export function mountBreach(canvas: HTMLCanvasElement, onHud: (hud: BreachHud) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#9bb0c0");
  scene.fog = new THREE.Fog("#9bb0c0", 18, 48);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 80);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight("#d7e4ee", "#6d6248", 0.85));
  const sun = new THREE.DirectionalLight("#fff2d2", 1.15);
  sun.position.set(8, 18, 6);
  scene.add(sun);

  const mat = (color: string) => new THREE.MeshLambertMaterial({ color });
  const boxes: Box[] = [];
  function block(w: number, h: number, d: number, color: string, x: number, y: number, z: number, solid = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    scene.add(mesh);
    if (solid) boxes.push({ minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return mesh;
  }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), mat("#8b9096"));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  block(46, 3.2, 0.4, "#6e747c", 0, 1.6, -20);
  block(46, 3.2, 0.4, "#6e747c", 0, 1.6, 20);
  block(0.4, 3.2, 40, "#6e747c", -20, 1.6, 0);
  block(0.4, 3.2, 40, "#6e747c", 20, 1.6, 0);
  block(8, 3.2, 0.4, "#7c838b", -6, 1.6, -2);
  block(8, 3.2, 0.4, "#7c838b", 6, 1.6, 2);
  block(1.6, 1.1, 1.6, "#c4a06a", -3, 0.55, 4);
  block(1.6, 1.1, 1.6, "#b48a52", 3.2, 0.55, 6);
  block(2.2, 1.3, 1.2, "#c4a06a", 0, 0.65, -4);
  block(1.2, 1.6, 1.2, "#a87840", -7, 0.8, 8);
  block(1.4, 0.9, 2.4, "#c4a06a", 8, 0.45, -1);
  for (const site of SITES) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.7, 20), mat("#e2c14e"));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.x, 0.04, site.z);
    scene.add(ring);
  }
  const bombMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.55), mat("#e25b4a"));
  bombMesh.visible = false;
  scene.add(bombMesh);

  const gun = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.46), mat("#2a3138"));
  body.position.set(0, 0, -0.1);
  const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.08), mat("#1c2126"));
  magMesh.position.set(0, -0.1, 0.02);
  gun.add(body, magMesh);
  gun.position.set(0.26, -0.24, -0.45);
  camera.add(gun);

  const keys = new Set<string>();
  let yaw = Math.PI;
  let pitch = 0;
  let x = 0;
  let y = 0;
  let z = 14;
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
  let note = "Buy, then plant the case. First to 7.";
  let prompt = "";
  let hudKey = "";
  let locked = false;
  const bots: Actor[] = [];

  function figure(color: string) {
    const group = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.28), mat(color));
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat("#e6c2a2"));
    head.position.y = 1.64;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.24), mat("#2a3138"));
    legs.position.y = 0.45;
    group.add(torso, head, legs);
    scene.add(group);
    return group;
  }

  function spawnBots() {
    for (const bot of bots) scene.remove(bot.mesh);
    bots.length = 0;
    const spots = [
      { team: 0 as const, x: -2, z: 14 },
      { team: 0 as const, x: 2, z: 13 },
      { team: 1 as const, x: -2, z: -15 },
      { team: 1 as const, x: 2, z: -14 },
    ];
    for (const spot of spots) {
      bots.push({
        team: spot.team,
        x: spot.x,
        y: 0,
        z: spot.z,
        yaw: spot.team === 0 ? Math.PI : 0,
        hp: 100,
        mag: 30,
        cool: 0.4,
        mesh: figure(spot.team === 0 ? "#e27a3a" : "#3a7ad4"),
        alive: true,
      });
    }
  }

  function resetRound(nextPhase: Phase) {
    playerTeam = round % 2 === 0 ? 1 : 0;
    const attack = playerTeam === 0;
    x = attack ? 0 : 0;
    z = attack ? 14 : -15;
    y = 0;
    vy = 0;
    yaw = attack ? Math.PI : 0;
    hp = 100;
    mag = GUNS[gunId].mag;
    reserve = GUNS[gunId].reserve;
    cool = 0;
    reload = 0;
    plant = 0;
    defuse = 0;
    planted = false;
    carrier = attack;
    bombMesh.visible = false;
    spawnBots();
    phase = nextPhase;
    timer = nextPhase === "buy" ? 12 : 100;
  }

  function blocked(px: number, pz: number) {
    const r = 0.36;
    return boxes.some((box) => px + r > box.minX && px - r < box.maxX && 0.2 < box.maxY && 1.5 > box.minY && pz + r > box.minZ && pz - r < box.maxZ);
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

  function damageActor(team: 0 | 1, amount: number, tx: number, ty: number, tz: number) {
    if (team !== playerTeam && hp > 0) {
      const dist = Math.hypot(tx - x, ty - 1.2, tz - z);
      if (dist < 0.55) {
        const soaked = Math.min(armor, amount * 0.5);
        armor -= soaked;
        hp = Math.max(0, hp - (amount - soaked));
        return true;
      }
    }
    for (const bot of bots) {
      if (!bot.alive || bot.team === team) continue;
      if (Math.hypot(tx - bot.x, ty - 1.2, tz - bot.z) < 0.5) {
        bot.hp -= amount;
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.mesh.visible = false;
          if (team === playerTeam) money += 300;
        }
        return true;
      }
    }
    return false;
  }

  function fire(team: 0 | 1, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, spec: (typeof GUNS)[GunId]) {
    for (let pellet = 0; pellet < spec.pellets; pellet += 1) {
      const sx = dx + (Math.random() - 0.5) * spec.spread;
      const sy = dy + (Math.random() - 0.5) * spec.spread;
      const sz = dz + (Math.random() - 0.5) * spec.spread;
      const len = Math.hypot(sx, sy, sz) || 1;
      const ndx = sx / len;
      const ndy = sy / len;
      const ndz = sz / len;
      const reach = wallDistance(ox, oy, oz, ndx, ndy, ndz, 40);
      const tx = ox + ndx * Math.max(0, reach - 0.05);
      const ty = oy + ndy * Math.max(0, reach - 0.05);
      const tz = oz + ndz * Math.max(0, reach - 0.05);
      damageActor(team, spec.damage, tx, ty, tz);
    }
  }

  function onSite(px: number, pz: number) {
    return SITES.some((site) => Math.hypot(px - site.x, pz - site.z) < 2.1);
  }

  function living(team: 0 | 1) {
    const botsAlive = bots.filter((bot) => bot.alive && bot.team === team).length;
    return botsAlive + (playerTeam === team && hp > 0 ? 1 : 0);
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
    const bomb = planted ? "Planted" : carrier && playerTeam === 0 ? "You carry it" : playerTeam === 0 ? "A teammate carries it" : planted ? "Planted" : "Not planted";
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
    note = "New match.";
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
    gun.position.z = -0.32;
    if (mag === 0) reload = 1.5;
  }

  function stepBot(bot: Actor, dt: number, planter: boolean, holder: boolean) {
    if (!bot.alive || phase !== "live") return;
    bot.cool = Math.max(0, bot.cool - dt);
    const foes = [
      ...(playerTeam !== bot.team && hp > 0 ? [{ x, z, team: playerTeam }] : []),
      ...bots.filter((other) => other.alive && other.team !== bot.team).map((other) => ({ x: other.x, z: other.z, team: other.team })),
    ];
    let seen: { x: number; z: number } | null = null;
    let best = 26;
    for (const foe of foes) {
      const dist = Math.hypot(foe.x - bot.x, foe.z - bot.z);
      if (dist > best) continue;
      const dx = foe.x - bot.x;
      const dz = foe.z - bot.z;
      const len = dist || 1;
      const clear = wallDistance(bot.x, 1.4, bot.z, dx / len, 0, dz / len, dist);
      if (clear > dist - 0.4) {
        seen = foe;
        best = dist;
      }
    }
    let tx = bot.team === 0 ? SITES[0]!.x : 0;
    let tz = bot.team === 0 ? SITES[0]!.z : 14;
    if (bot.team === 1 && planted) {
      tx = bombX;
      tz = bombZ;
    } else if (bot.team === 0 && !planted) {
      const site = SITES[round % 2]!;
      tx = site.x;
      tz = site.z;
    } else if (seen) {
      tx = seen.x;
      tz = seen.z;
    }
    if (seen && bot.cool <= 0 && bot.mag > 0) {
      const dx = seen.x - bot.x;
      const dz = seen.z - bot.z;
      const len = Math.hypot(dx, dz) || 1;
      fire(bot.team, bot.x, 1.4, bot.z, dx / len, -0.04, dz / len, GUNS.rifle);
      bot.cool = 0.28;
      bot.mag -= 1;
    }
    const dx = tx - bot.x;
    const dz = tz - bot.z;
    const dist = Math.hypot(dx, dz);
    if (!seen && dist > 1.2) {
      const step = Math.min(3.1 * dt, dist);
      const nx = bot.x + (dx / dist) * step;
      const nz = bot.z + (dz / dist) * step;
      if (!blocked(nx, bot.z)) bot.x = nx;
      if (!blocked(bot.x, nz)) bot.z = nz;
      bot.yaw = Math.atan2(dx, dz);
    } else if (seen) bot.yaw = Math.atan2(seen.x - bot.x, seen.z - bot.z);
    if (planter && bot.team === 0 && !planted && !carrier && onSite(bot.x, bot.z)) {
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
    if (holder && planted && Math.hypot(bot.x - bombX, bot.z - bombZ) < 1.8 && (playerTeam !== 1 || hp <= 0)) {
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
    gun.position.z += (-0.45 - gun.position.z) * Math.min(1, dt * 10);
    if (phase === "buy" || phase === "end") {
      timer -= dt;
      if (timer <= 0) {
        if (phase === "buy") {
          phase = "live";
          timer = 100;
          note = playerTeam === 0 ? "Plant on a gold ring. Hold F." : "Stop the plant. Hold F on the case.";
        } else {
          round += 1;
          resetRound("buy");
        }
      }
    } else if (phase === "live") {
      timer -= dt;
      if (hp > 0) {
        const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
        const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
        const speed = 4.6;
        const nx = x + (-Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed * dt;
        const nz = z + (-Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * speed * dt;
        if (!blocked(nx, z)) x = nx;
        if (!blocked(x, nz)) z = nz;
        x = Math.max(-19, Math.min(19, x));
        z = Math.max(-19, Math.min(19, z));
        vy -= 22 * dt;
        y += vy * dt;
        if (y <= 0) {
          y = 0;
          vy = 0;
        }
        if (keys.has("Space") && y === 0) vy = 7.2;
        if (keys.has("KeyR") && reserve > 0 && mag < GUNS[gunId].mag && reload === 0) reload = 1.45;
        if (trigger && GUNS[gunId].auto) shootPlayer();
      }
      if (reload <= 0 && mag === 0 && reserve > 0 && keys.has("KeyR") === false && cool <= 0) reload = 1.45;
      const planter = bots.find((bot) => bot.alive && bot.team === 0);
      const holder = bots.find((bot) => bot.alive && bot.team === 1);
      for (const bot of bots) stepBot(bot, dt, bot === planter, bot === holder);
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
      if (playerTeam === 1 && planted && hp > 0 && Math.hypot(x - bombX, z - bombZ) < 1.8) {
        prompt = "Hold F to defuse";
        if (keys.has("KeyF")) {
          defuse += dt;
          if (defuse >= 5) finish(false, "You defused the case.");
        } else defuse = 0;
      }
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
      if (event.code === "KeyF" || event.code === "KeyR") keys.add(event.code);
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
