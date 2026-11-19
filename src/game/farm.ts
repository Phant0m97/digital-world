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
};

const CROPS: Record<CropId, { cost: number; grow: number; sell: number; color: number }> = {
  wheat: { cost: 4, grow: 14, sell: 10, color: 0xe2c14e },
  carrot: { cost: 8, grow: 22, sell: 22, color: 0xff8a3d },
  pumpkin: { cost: 14, grow: 34, sell: 42, color: 0xe86a1a },
};

const KEY = "dw-acre-v1";
const GOAL = 200;

type Save = {
  coins: number;
  seeds: Record<CropId, number>;
  selected: CropId;
  plots: Plot[];
  day: number;
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
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Save;
    return { ...base, ...saved, seeds: { ...base.seeds, ...saved.seeds }, plots: saved.plots?.length === 16 ? saved.plots : base.plots };
  } catch {
    return base;
  }
}

export function mountFarm(canvas: HTMLCanvasElement, onHud: (hud: FarmHud) => void) {
  const save = load();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#9fd0ea");
  scene.fog = new THREE.Fog("#9fd0ea", 18, 42);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  const hemi = new THREE.HemisphereLight("#fff4d2", "#4d7a45", 0.85);
  const sun = new THREE.DirectionalLight("#fff1c9", 1.3);
  sun.position.set(8, 14, 6);
  scene.add(hemi, sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(16, 7),
    new THREE.MeshLambertMaterial({ color: "#6ea352" }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const barn = new THREE.Group();
  const barnBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 3.2), new THREE.MeshLambertMaterial({ color: "#c4553a" }));
  barnBody.position.y = 1.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.6, 4), new THREE.MeshLambertMaterial({ color: "#7a3b32" }));
  roof.position.y = 3.1;
  roof.rotation.y = Math.PI / 4;
  barn.add(barnBody, roof);
  barn.position.set(-7.2, 0, -4.5);
  scene.add(barn);

  for (let i = 0; i < 7; i += 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 5), new THREE.MeshLambertMaterial({ color: "#6b4630" }));
    trunk.position.y = 0.55;
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 6), new THREE.MeshLambertMaterial({ color: i % 2 ? "#2f7a3a" : "#3e8f48" }));
    top.position.y = 1.8;
    tree.add(trunk, top);
    const angle = (i / 7) * Math.PI * 1.2 + 0.4;
    tree.position.set(Math.cos(angle) * 11.5, 0, Math.sin(angle) * 9 - 1);
    scene.add(tree);
  }

  const plotMeshes: { soil: THREE.Mesh; crop: THREE.Mesh }[] = [];
  const plots = save.plots;
  for (let i = 0; i < 16; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 1.35), new THREE.MeshLambertMaterial({ color: "#8a6244" }));
    soil.position.set((col - 1.5) * 1.7, 0.09, (row - 1.5) * 1.7 + 1.2);
    const crop = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 5), new THREE.MeshLambertMaterial({ color: "#d8b44a" }));
    crop.position.copy(soil.position);
    crop.visible = false;
    scene.add(soil, crop);
    plotMeshes.push({ soil, crop });
  }

  const farmer = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.7, 0.32), new THREE.MeshLambertMaterial({ color: "#2ee6ff" }));
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshLambertMaterial({ color: "#f3d2b3" }));
  head.position.y = 1.35;
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.28, 6), new THREE.MeshLambertMaterial({ color: "#f2c14e" }));
  hat.position.y = 1.58;
  farmer.add(body, head, hat);
  farmer.position.set(0, 0, 5.2);
  scene.add(farmer);

  const keys = new Set<string>();
  const move = { x: 0, z: 0 };
  let yaw = 0;
  let selected: CropId = save.selected;
  let coins = save.coins;
  let day = save.day;
  let clock = 0.35;
  let note = "Walk up to a plot and plant.";
  const seeds = { ...save.seeds };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function paintPlots() {
    plots.forEach((plot, index) => {
      const mesh = plotMeshes[index]!;
      (mesh.soil.material as THREE.MeshLambertMaterial).color.set(plot.tilled ? "#6b442c" : "#8a6244");
      if (!plot.crop) {
        mesh.crop.visible = false;
        return;
      }
      const spec = CROPS[plot.crop];
      mesh.crop.visible = true;
      mesh.crop.scale.setScalar(0.35 + plot.growth * 1.15);
      mesh.crop.position.y = 0.25 + mesh.crop.scale.y * 0.28;
      (mesh.crop.material as THREE.MeshLambertMaterial).color.set(plot.water > 0 ? spec.color : 0x8d9a62);
    });
  }

  function hud() {
    onHud({
      coins,
      seeds: { ...seeds },
      selected,
      note,
      day,
      seasonDone: coins >= GOAL,
    });
  }

  function nearestPlot() {
    let best = -1;
    let dist = 1.7;
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
    const speed = 4.2;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    farmer.position.x += (strafe * cos + forward * sin) * speed * dt + move.x * speed * dt;
    farmer.position.z += (strafe * -sin + forward * cos) * speed * dt + move.z * speed * dt;
    farmer.position.x = Math.max(-8, Math.min(8, farmer.position.x));
    farmer.position.z = Math.max(-6, Math.min(8, farmer.position.z));
    if (forward || strafe || move.x || move.z) farmer.rotation.y = Math.atan2(forward || -move.z, strafe || move.x);
    clock = (clock + dt / 80) % 1;
    if (clock < dt / 80) day += 1;
    const sunAngle = clock * Math.PI * 2;
    sun.position.set(Math.cos(sunAngle) * 12, 6 + Math.sin(sunAngle) * 8, 6);
    const night = Math.sin(sunAngle);
    scene.background = new THREE.Color(night > 0 ? "#9fd0ea" : "#24324a");
    plots.forEach((plot) => {
      if (!plot.crop || plot.growth >= 1) return;
      if (plot.water > 0) {
        plot.water = Math.max(0, plot.water - dt);
        plot.growth = Math.min(1, plot.growth + dt / CROPS[plot.crop].grow);
      }
    });
    paintPlots();
    const look = farmer.position;
    const camX = look.x - Math.sin(yaw) * 7;
    const camZ = look.z - Math.cos(yaw) * 7;
    camera.position.lerp(new THREE.Vector3(camX, 5.4, camZ), 0.12);
    camera.lookAt(look.x, 1, look.z);
    renderer.render(scene, camera);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day }));
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
      localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day }));
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
