import * as THREE from "three";

export type CropId = "wheat" | "carrot" | "pumpkin";

type Plot = {
  tilled: boolean;
  crop: CropId | null;
  growth: number;
  water: number;
};

export type FarmHud = {
  coins: number;
  seeds: Record<CropId, number>;
  selected: CropId;
  note: string;
  day: number;
  seasonDone: boolean;
  inside: boolean;
};

const CROPS: Record<CropId, { cost: number; grow: number; sell: number; color: number }> = {
  wheat: { cost: 4, grow: 14, sell: 10, color: 0xe2c14e },
  carrot: { cost: 8, grow: 22, sell: 22, color: 0xff8a3d },
  pumpkin: { cost: 14, grow: 34, sell: 42, color: 0xe86a1a },
};

const KEY = "dw-acre-v1";
const GOAL = 200;
const HOUSE = { x: -6.4, z: -5.4 };
const ROOM = { x: 80, z: 0 };

type Box = { minX: number; maxX: number; minZ: number; maxZ: number };

type Save = {
  coins: number;
  seeds: Record<CropId, number>;
  selected: CropId;
  plots: Plot[];
  day: number;
  chestDay: number;
};

function freshPlots(): Plot[] {
  return Array.from({ length: 16 }, () => ({ tilled: false, crop: null, growth: 0, water: 0 }));
}

function load(): Save {
  const base: Save = {
    coins: 28,
    seeds: { wheat: 4, carrot: 1, pumpkin: 0 },
    selected: "wheat",
    plots: freshPlots(),
    day: 1,
    chestDay: 0,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Save;
    return {
      ...base,
      ...saved,
      seeds: { ...base.seeds, ...saved.seeds },
      plots: saved.plots?.length === 16 ? saved.plots : base.plots,
    };
  } catch {
    return base;
  }
}

function hits(x: number, z: number, boxes: Box[]) {
  return boxes.some((box) => x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ);
}

export function mountFarm(canvas: HTMLCanvasElement, onHud: (hud: FarmHud) => void) {
  const save = load();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#9fd0ea");
  scene.fog = new THREE.Fog("#b7d7ea", 22, 48);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 90);
  const hemi = new THREE.HemisphereLight("#fff6df", "#3e6a34", 0.72);
  const sun = new THREE.DirectionalLight("#ffe3a8", 1.55);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.0008;
  const fill = new THREE.DirectionalLight("#9ec7ff", 0.28);
  fill.position.set(-8, 6, -4);
  scene.add(hemi, sun, fill);
  const lamp = new THREE.PointLight("#ffb56a", 6, 9, 1.4);
  lamp.position.set(ROOM.x - 1.4, 1.7, ROOM.z - 0.4);
  scene.add(lamp);

  const mat = (color: number | string) => new THREE.MeshLambertMaterial({ color });
  function solid(geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const ground = solid(new THREE.PlaneGeometry(36, 36), "#6fa34c", 0, 0, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  solid(new THREE.CircleGeometry(11, 8), "#7eb557", 1.2, 0.01, 1.4).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 6; i += 1) {
    const slab = solid(new THREE.BoxGeometry(0.7, 0.05, 0.45), "#b7a07a", -4.6 + i * 0.85, 0.04, -2.3 + i * 0.55);
    slab.castShadow = false;
  }

  const hx = HOUSE.x;
  const hz = HOUSE.z;
  const walls = new THREE.Group();
  scene.add(walls);
  const wall = (w: number, h: number, d: number, x: number, y: number, z: number, color = "#e7d3ad") =>
    solid(new THREE.BoxGeometry(w, h, d), color, x, y, z, walls);
  wall(5.2, 2.35, 0.22, hx, 1.18, hz - 1.95);
  wall(0.22, 2.35, 4.1, hx - 2.5, 1.18, hz);
  wall(0.22, 2.35, 4.1, hx + 2.5, 1.18, hz);
  wall(1.85, 2.35, 0.22, hx - 1.55, 1.18, hz + 1.95);
  wall(1.85, 2.35, 0.22, hx + 1.55, 1.18, hz + 1.95);
  wall(1.5, 0.7, 0.22, hx, 2.0, hz + 1.95);
  solid(new THREE.BoxGeometry(0.9, 0.08, 0.7), "#8b5a32", hx, 0.06, hz + 2.25);
  const roof = solid(gable(5.6, 4.6, 1.35), "#8e3a32", hx, 2.35, hz);
  roof.castShadow = true;
  solid(new THREE.BoxGeometry(0.38, 1.1, 0.38), "#6d513c", hx + 1.6, 3.15, hz - 0.8);
  solid(new THREE.BoxGeometry(0.55, 0.7, 0.08), "#8fd0ea", hx - 1.35, 1.45, hz - 1.84);
  solid(new THREE.BoxGeometry(0.55, 0.7, 0.08), "#8fd0ea", hx + 1.35, 1.45, hz - 1.84);
  solid(new THREE.BoxGeometry(0.16, 2.35, 0.16), "#6b4632", hx - 2.35, 1.18, hz - 1.8);
  solid(new THREE.BoxGeometry(0.16, 2.35, 0.16), "#6b4632", hx + 2.35, 1.18, hz - 1.8);
  solid(new THREE.PlaneGeometry(1.15, 1.65), "#2a211c", hx, 0.9, hz + 1.82);

  const outsideBoxes: Box[] = [
    { minX: hx - 2.7, maxX: hx + 2.7, minZ: hz - 2.15, maxZ: hz - 1.75 },
    { minX: hx - 2.7, maxX: hx - 2.3, minZ: hz - 2.1, maxZ: hz + 2.15 },
    { minX: hx + 2.3, maxX: hx + 2.7, minZ: hz - 2.1, maxZ: hz + 2.15 },
    { minX: hx - 2.6, maxX: hx - 0.62, minZ: hz + 1.75, maxZ: hz + 2.15 },
    { minX: hx + 0.62, maxX: hx + 2.6, minZ: hz + 1.75, maxZ: hz + 2.15 },
  ];
  const insideBoxes: Box[] = [
    { minX: ROOM.x - 2.7, maxX: ROOM.x + 2.7, minZ: ROOM.z - 2.15, maxZ: ROOM.z - 1.75 },
    { minX: ROOM.x - 2.7, maxX: ROOM.x - 2.3, minZ: ROOM.z - 2.1, maxZ: ROOM.z + 2.15 },
    { minX: ROOM.x + 2.3, maxX: ROOM.x + 2.7, minZ: ROOM.z - 2.1, maxZ: ROOM.z + 2.15 },
    { minX: ROOM.x - 2.6, maxX: ROOM.x - 0.62, minZ: ROOM.z + 1.75, maxZ: ROOM.z + 2.15 },
    { minX: ROOM.x + 0.62, maxX: ROOM.x + 2.6, minZ: ROOM.z + 1.75, maxZ: ROOM.z + 2.15 },
    { minX: ROOM.x - 2.2, maxX: ROOM.x - 0.7, minZ: ROOM.z - 1.7, maxZ: ROOM.z - 0.5 },
    { minX: ROOM.x + 0.55, maxX: ROOM.x + 1.7, minZ: ROOM.z + 0.15, maxZ: ROOM.z + 1.15 },
  ];

  const room = new THREE.Group();
  scene.add(room);
  const floor = solid(new THREE.BoxGeometry(5.2, 0.08, 4.2), "#b88858", ROOM.x, 0.04, ROOM.z, room);
  floor.castShadow = false;
  solid(new THREE.BoxGeometry(5.2, 2.3, 0.18), "#f0e2c8", ROOM.x, 1.2, ROOM.z - 1.95, room);
  solid(new THREE.BoxGeometry(0.18, 2.3, 4.1), "#f0e2c8", ROOM.x - 2.5, 1.2, ROOM.z, room);
  solid(new THREE.BoxGeometry(0.18, 2.3, 4.1), "#f0e2c8", ROOM.x + 2.5, 1.2, ROOM.z, room);
  solid(new THREE.BoxGeometry(1.85, 2.3, 0.18), "#f0e2c8", ROOM.x - 1.55, 1.2, ROOM.z + 1.95, room);
  solid(new THREE.BoxGeometry(1.85, 2.3, 0.18), "#f0e2c8", ROOM.x + 1.55, 1.2, ROOM.z + 1.95, room);
  solid(new THREE.BoxGeometry(1.5, 0.65, 0.18), "#f0e2c8", ROOM.x, 1.95, ROOM.z + 1.95, room);
  solid(new THREE.BoxGeometry(2.1, 0.45, 1.05), "#8d4b32", ROOM.x - 1.45, 0.35, ROOM.z - 1.05, room);
  solid(new THREE.BoxGeometry(1.7, 0.22, 0.7), "#d7b07a", ROOM.x - 1.4, 0.62, ROOM.z - 0.85, room);
  solid(new THREE.BoxGeometry(1.15, 0.55, 0.7), "#a56b3c", ROOM.x + 1.15, 0.35, ROOM.z + 0.65, room);
  solid(new THREE.BoxGeometry(0.9, 0.55, 0.7), "#6a442c", ROOM.x - 1.7, 0.4, ROOM.z + 0.9, room);
  solid(new THREE.CircleGeometry(0.85, 6), "#c4553a", ROOM.x + 0.2, 0.07, ROOM.z - 0.2, room).rotation.x = -Math.PI / 2;
  solid(new THREE.BoxGeometry(0.5, 0.7, 0.08), "#9fd4ee", ROOM.x + 2.38, 1.4, ROOM.z - 0.2, room);
  solid(gable(5.5, 4.4, 1.15), "#8e3a32", ROOM.x, 2.35, ROOM.z, room);

  for (let i = 0; i < 8; i += 1) {
    const tree = new THREE.Group();
    solid(new THREE.CylinderGeometry(0.16, 0.24, 1.15, 5), "#6b4630", 0, 0.58, 0, tree);
    solid(new THREE.ConeGeometry(1.05, 1.35, 6), i % 2 ? "#2f7a3a" : "#3f8d46", 0, 1.55, 0, tree);
    solid(new THREE.ConeGeometry(0.72, 1.05, 6), "#57a35a", 0, 2.25, 0, tree);
    const angle = (i / 8) * Math.PI * 2;
    tree.position.set(Math.cos(angle) * 13.2, 0, Math.sin(angle) * 11.2);
    scene.add(tree);
  }
  for (let i = 0; i < 10; i += 1) {
    solid(new THREE.BoxGeometry(0.12, 0.55, 0.12), "#d8c7a2", -3.3 + (i % 5) * 1.7, 0.28, 4.15 + Math.floor(i / 5) * 3.4);
  }

  const plotMeshes: { soil: THREE.Mesh; crop: THREE.Group }[] = [];
  const plots = save.plots;
  for (let i = 0; i < 16; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const soil = solid(new THREE.BoxGeometry(1.28, 0.16, 1.28), "#8a6244", (col - 1.5) * 1.65, 0.08, (row - 1.5) * 1.65 + 1.5);
    const crop = new THREE.Group();
    crop.position.copy(soil.position);
    for (let s = 0; s < 3; s += 1) {
      const stalk = solid(new THREE.ConeGeometry(0.08, 0.55, 4), "#d8b44a", (s - 1) * 0.18, 0.42, s === 1 ? 0.08 : -0.05, crop);
      stalk.name = "stalk";
    }
    const fruit = solid(new THREE.SphereGeometry(0.22, 7, 5), "#e86a1a", 0, 0.38, 0, crop);
    fruit.name = "fruit";
    crop.visible = false;
    scene.add(crop);
    plotMeshes.push({ soil, crop });
  }

  const farmer = new THREE.Group();
  solid(new THREE.BoxGeometry(0.42, 0.62, 0.28), "#2ec8e6", 0, 0.86, 0, farmer);
  solid(new THREE.SphereGeometry(0.2, 8, 6), "#f3d2b3", 0, 1.32, 0, farmer);
  solid(new THREE.ConeGeometry(0.26, 0.22, 6), "#f2c14e", 0, 1.52, 0, farmer);
  solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#245c66", -0.12, 0.32, 0, farmer);
  solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#245c66", 0.12, 0.32, 0, farmer);
  farmer.position.set(0.4, 0, 5.4);
  scene.add(farmer);

  const keys = new Set<string>();
  const move = { x: 0, z: 0 };
  let yaw = 0.4;
  let selected: CropId = save.selected;
  let coins = save.coins;
  let day = save.day;
  let chestDay = save.chestDay;
  let clock = 0.32;
  let inside = false;
  let doorLock = 0;
  let note = "Walk through the cottage door.";
  const seeds = { ...save.seeds };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function paintPlots() {
    plots.forEach((plot, index) => {
      const mesh = plotMeshes[index]!;
      (mesh.soil.material as THREE.MeshLambertMaterial).color.set(plot.tilled ? "#5c3a24" : "#8a6244");
      if (!plot.crop) {
        mesh.crop.visible = false;
        return;
      }
      const spec = CROPS[plot.crop];
      mesh.crop.visible = true;
      const scale = 0.35 + plot.growth * 1.2;
      mesh.crop.scale.setScalar(scale);
      mesh.crop.position.y = mesh.soil.position.y + 0.08;
      const wet = plot.water > 0 ? spec.color : 0x8d9a62;
      mesh.crop.children.forEach((child) => {
        const part = child as THREE.Mesh;
        part.visible = plot.crop === "pumpkin" ? part.name === "fruit" : part.name === "stalk";
        (part.material as THREE.MeshLambertMaterial).color.set(wet);
      });
    });
  }

  function hud() {
    onHud({ coins, seeds: { ...seeds }, selected, note, day, seasonDone: coins >= GOAL, inside });
  }

  function nearestPlot() {
    let best = -1;
    let dist = 1.6;
    plots.forEach((_, index) => {
      const mesh = plotMeshes[index]!.soil.position;
      const d = Math.hypot(mesh.x - farmer.position.x, mesh.z - farmer.position.z);
      if (d < dist) {
        dist = d;
        best = index;
      }
    });
    return best;
  }

  function actOn(index: number) {
    const plot = plots[index];
    if (!plot) return;
    if (plot.crop && plot.growth >= 1) {
      coins += CROPS[plot.crop].sell;
      note = `Harvested ${plot.crop} for ${CROPS[plot.crop].sell}.`;
      plot.crop = null;
      plot.growth = 0;
      plot.water = 0;
      return;
    }
    if (!plot.crop) {
      if (seeds[selected] <= 0) {
        note = `No ${selected} seed. Buy one.`;
        return;
      }
      seeds[selected] -= 1;
      plot.tilled = true;
      plot.crop = selected;
      plot.growth = 0;
      plot.water = 8;
      note = `Planted ${selected}.`;
      return;
    }
    plot.water = 10;
    note = "Watered.";
  }

  function act() {
    if (inside) {
      const nearChest = Math.hypot(farmer.position.x - (ROOM.x - 1.7), farmer.position.z - (ROOM.z + 0.9)) < 1.25;
      if (!nearChest) {
        note = "The chest is against the wall.";
        hud();
        return;
      }
      if (chestDay === day) note = "The chest is empty until tomorrow.";
      else {
        chestDay = day;
        seeds.wheat += 1;
        note = "The chest had a wheat seed.";
      }
      hud();
      return;
    }
    const index = nearestPlot();
    if (index < 0) {
      note = "Get closer to a plot.";
      hud();
      return;
    }
    actOn(index);
    paintPlots();
    hud();
  }

  function buy() {
    const spec = CROPS[selected];
    if (coins < spec.cost) {
      note = "Not enough coins.";
      hud();
      return;
    }
    coins -= spec.cost;
    seeds[selected] += 1;
    note = `Bought a ${selected} seed.`;
    hud();
  }

  function onKey(event: KeyboardEvent) {
    if (event.type === "keydown") keys.add(event.code);
    else keys.delete(event.code);
    if (event.type === "keydown" && event.code === "KeyE") act();
    if (event.type === "keydown" && event.code === "KeyB") buy();
    if (event.type === "keydown" && event.code === "Digit1") selected = "wheat";
    if (event.type === "keydown" && event.code === "Digit2") selected = "carrot";
    if (event.type === "keydown" && event.code === "Digit3") selected = "pumpkin";
    if (event.type === "keydown" && ["Digit1", "Digit2", "Digit3"].includes(event.code)) hud();
  }

  function onPointer(event: PointerEvent) {
    if (inside) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(plotMeshes.map((mesh) => mesh.soil));
    const hit = hits[0];
    if (!hit) return;
    const index = plotMeshes.findIndex((mesh) => mesh.soil === hit.object);
    if (index >= 0) actOn(index);
    paintPlots();
    hud();
  }

  function onDrag(event: PointerEvent) {
    if (event.buttons !== 2 && event.buttons !== 4) return;
    yaw -= event.movementX * 0.008;
  }

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onDrag);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  let raf = 0;
  let last = performance.now();
  let saveTimer = 0;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const speed = 4.1;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const vx = (strafe * cos + forward * sin) * speed * dt + move.x * speed * dt;
    const vz = (strafe * -sin + forward * cos) * speed * dt + move.z * speed * dt;
    const boxes = inside ? insideBoxes : outsideBoxes;
    const nx = farmer.position.x + vx;
    const nz = farmer.position.z + vz;
    if (!hits(nx, farmer.position.z, boxes)) farmer.position.x = nx;
    if (!hits(farmer.position.x, nz, boxes)) farmer.position.z = nz;
    if (inside) {
      farmer.position.x = Math.max(ROOM.x - 2.2, Math.min(ROOM.x + 2.2, farmer.position.x));
      farmer.position.z = Math.max(ROOM.z - 1.7, Math.min(ROOM.z + 2.5, farmer.position.z));
    } else {
      farmer.position.x = Math.max(-14, Math.min(14, farmer.position.x));
      farmer.position.z = Math.max(-12, Math.min(12, farmer.position.z));
    }
    if (forward || strafe || move.x || move.z) farmer.rotation.y = Math.atan2(vx, vz);
    doorLock = Math.max(0, doorLock - dt);
    if (doorLock <= 0 && !inside && Math.abs(farmer.position.x - hx) < 0.55 && Math.abs(farmer.position.z - (hz + 1.85)) < 0.45) {
      inside = true;
      doorLock = 0.7;
      farmer.position.set(ROOM.x, 0, ROOM.z + 1.35);
      note = "Inside. The chest is by the bed.";
      hud();
    } else if (doorLock <= 0 && inside && Math.abs(farmer.position.x - ROOM.x) < 0.55 && farmer.position.z > ROOM.z + 1.85) {
      inside = false;
      doorLock = 0.7;
      farmer.position.set(hx, 0, hz + 2.7);
      note = "Back in the yard.";
      hud();
    }
    clock = (clock + dt / 90) % 1;
    if (clock < dt / 90) day += 1;
    const sunAngle = clock * Math.PI * 2;
    sun.position.set(Math.cos(sunAngle) * 14, 5 + Math.max(0.4, Math.sin(sunAngle)) * 12, 7);
    const dayness = Math.max(0, Math.sin(sunAngle));
    sun.intensity = 0.25 + dayness * 1.45;
    scene.background = new THREE.Color(dayness > 0.15 ? "#9fd0ea" : "#1c2740");
    scene.fog = new THREE.Fog(dayness > 0.15 ? "#b7d7ea" : "#1c2740", 18, 46);
    lamp.intensity = inside ? 7 : 1.5;
    plots.forEach((plot) => {
      if (!plot.crop || plot.growth >= 1) return;
      if (plot.water > 0) {
        plot.water = Math.max(0, plot.water - dt);
        plot.growth = Math.min(1, plot.growth + dt / CROPS[plot.crop].grow);
      }
    });
    paintPlots();
    const look = farmer.position;
    const dist = inside ? 4.6 : 7.2;
    const camX = look.x - Math.sin(yaw) * dist;
    const camZ = look.z - Math.cos(yaw) * dist;
    camera.position.lerp(new THREE.Vector3(camX, inside ? 3.3 : 5.2, camZ), 0.12);
    camera.lookAt(look.x, 1, look.z);
    renderer.render(scene, camera);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day, chestDay }));
    }
    raf = requestAnimationFrame(frame);
  }

  paintPlots();
  hud();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onDrag);
      localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day, chestDay }));
      renderer.dispose();
    },
    act,
    buy,
    select(id: CropId) {
      selected = id;
      hud();
    },
    nudge(x: number, z: number) {
      move.x = x;
      move.z = z;
    },
  };
}

function gable(width: number, depth: number, height: number) {
  const hw = width / 2;
  const hd = depth / 2;
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -hw, 0, -hd, hw, 0, -hd, 0, height, -hd,
    hw, 0, hd, -hw, 0, hd, 0, height, hd,
    -hw, 0, -hd, 0, height, -hd, 0, height, hd,
    -hw, 0, -hd, 0, height, hd, -hw, 0, hd,
    hw, 0, -hd, hw, 0, hd, 0, height, hd,
    hw, 0, -hd, 0, height, hd, 0, height, -hd,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}
