import * as THREE from "three";

export type CropId = "wheat" | "carrot" | "pumpkin";
export type HatId = "none" | "straw" | "cap" | "flower" | "crown";
export type HairId = "none" | "brown" | "black" | "blonde" | "bun" | "long";
export type BizId = "shop" | "restaurant";

export type Look = {
  skin: string;
  shirt: string;
  pants: string;
  hat: HatId;
  hair: HairId;
};

export type Cosmetic = {
  id: string;
  slot: "hat" | "shirt" | "pants" | "hair";
  name: string;
  price: number;
  hat?: HatId;
  color?: string;
  hair?: HairId;
};

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
  creating: boolean;
  look: Look;
  owned: string[];
  shopLevel: number;
  restLevel: number;
  near: BizId | "village" | null;
};

export const SKINS = ["#f3d2b3", "#e0b090", "#c68642", "#8d5524", "#4a3128"];

export const COSMETICS: Cosmetic[] = [
  { id: "hat-none", slot: "hat", name: "No hat", price: 0, hat: "none" },
  { id: "hat-straw", slot: "hat", name: "Straw hat", price: 0, hat: "straw" },
  { id: "hat-cap", slot: "hat", name: "Red cap", price: 18, hat: "cap" },
  { id: "hat-flower", slot: "hat", name: "Flower", price: 24, hat: "flower" },
  { id: "hat-crown", slot: "hat", name: "Crown", price: 48, hat: "crown" },
  { id: "shirt-cyan", slot: "shirt", name: "Cyan shirt", price: 0, color: "#2ec8e6" },
  { id: "shirt-cream", slot: "shirt", name: "Cream shirt", price: 0, color: "#f3f0e8" },
  { id: "shirt-red", slot: "shirt", name: "Red shirt", price: 0, color: "#e25b4a" },
  { id: "shirt-green", slot: "shirt", name: "Green shirt", price: 0, color: "#3f8d46" },
  { id: "shirt-mag", slot: "shirt", name: "Magenta shirt", price: 16, color: "#ff2bd6" },
  { id: "shirt-gold", slot: "shirt", name: "Gold shirt", price: 16, color: "#f2c14e" },
  { id: "shirt-navy", slot: "shirt", name: "Navy shirt", price: 16, color: "#243a66" },
  { id: "pants-teal", slot: "pants", name: "Teal pants", price: 0, color: "#245c66" },
  { id: "pants-brown", slot: "pants", name: "Brown pants", price: 0, color: "#6b4630" },
  { id: "pants-navy", slot: "pants", name: "Navy pants", price: 0, color: "#243a66" },
  { id: "pants-black", slot: "pants", name: "Black pants", price: 14, color: "#1c1c1c" },
  { id: "pants-tan", slot: "pants", name: "Tan pants", price: 14, color: "#c4a574" },
  { id: "hair-none", slot: "hair", name: "No hair", price: 0, hair: "none" },
  { id: "hair-brown", slot: "hair", name: "Brown hair", price: 0, hair: "brown" },
  { id: "hair-black", slot: "hair", name: "Black hair", price: 0, hair: "black" },
  { id: "hair-blonde", slot: "hair", name: "Blonde hair", price: 0, hair: "blonde" },
  { id: "hair-bun", slot: "hair", name: "Bun", price: 20, hair: "bun" },
  { id: "hair-long", slot: "hair", name: "Long hair", price: 22, hair: "long" },
];

export const BIZ_COST: Record<BizId, number[]> = {
  shop: [40, 80, 150],
  restaurant: [60, 110, 180],
};
const BIZ_PAY: Record<BizId, number[]> = {
  shop: [0, 8, 18, 32],
  restaurant: [0, 10, 22, 40],
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
const SHOP_AT = { x: 6.6, z: -3.4 };
const REST_AT = { x: 6.6, z: 1.2 };
const STALL_AT = { x: 20.2, z: 1.4 };

type Box = { minX: number; maxX: number; minZ: number; maxZ: number };

type Save = {
  coins: number;
  seeds: Record<CropId, number>;
  selected: CropId;
  plots: Plot[];
  day: number;
  chestDay: number;
  look: Look;
  owned: string[];
  shopLevel: number;
  restLevel: number;
  customized: boolean;
};

const DEFAULT_LOOK: Look = { skin: "#f3d2b3", shirt: "#2ec8e6", pants: "#245c66", hat: "straw", hair: "brown" };

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
    look: { ...DEFAULT_LOOK },
    owned: COSMETICS.filter((item) => item.price === 0).map((item) => item.id),
    shopLevel: 0,
    restLevel: 0,
    customized: false,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Save>;
    return {
      ...base,
      ...saved,
      seeds: { ...base.seeds, ...saved.seeds },
      plots: saved.plots?.length === 16 ? saved.plots : base.plots,
      look: { ...base.look, ...saved.look },
      owned: saved.owned?.length ? saved.owned : base.owned,
      customized: saved.customized ?? false,
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
  scene.fog = new THREE.Fog("#b7d7ea", 28, 72);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  const hemi = new THREE.HemisphereLight("#fff6df", "#3e6a34", 0.72);
  const sun = new THREE.DirectionalLight("#ffe3a8", 1.55);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.0008;
  const sunTarget = new THREE.Object3D();
  scene.add(sunTarget);
  sun.target = sunTarget;
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

  const ground = solid(new THREE.PlaneGeometry(64, 42), "#6fa34c", 8, 0, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  solid(new THREE.CircleGeometry(11, 8), "#7eb557", 1.2, 0.015, 1.4).rotation.x = -Math.PI / 2;
  solid(new THREE.CircleGeometry(7, 7), "#86b85f", 20, 0.02, 1).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 14; i += 1) {
    const slab = solid(new THREE.BoxGeometry(1.15, 0.05, 0.7), "#b7a07a", 3.2 + i * 1.35, 0.04, 5.2);
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
  solid(gable(5.6, 4.6, 1.35), "#8e3a32", hx, 2.35, hz);
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
    { minX: 18.4, maxX: 22.2, minZ: -0.2, maxZ: 2.5 },
    { minX: 14.5, maxX: 17.4, minZ: -3.6, maxZ: -1.2 },
    { minX: 22.6, maxX: 25.6, minZ: -2.8, maxZ: -0.2 },
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

  for (let i = 0; i < 7; i += 1) {
    const tree = new THREE.Group();
    solid(new THREE.CylinderGeometry(0.16, 0.24, 1.15, 5), "#6b4630", 0, 0.58, 0, tree);
    solid(new THREE.ConeGeometry(1.05, 1.35, 6), i % 2 ? "#2f7a3a" : "#3f8d46", 0, 1.55, 0, tree);
    solid(new THREE.ConeGeometry(0.72, 1.05, 6), "#57a35a", 0, 2.25, 0, tree);
    const angle = Math.PI * 0.65 + (i / 6) * Math.PI * 0.9;
    tree.position.set(Math.cos(angle) * 12.4, 0, Math.sin(angle) * 10.5 - 0.4);
    scene.add(tree);
  }
  scene.add(cottage(solid, 15.9, -2.4, "#d7c4a3", "#8e3a32"));
  scene.add(cottage(solid, 24.1, -1.5, "#f0e2c8", "#3f5f86"));
  const stall = new THREE.Group();
  scene.add(stall);
  solid(new THREE.BoxGeometry(3.6, 2.1, 2.4), "#f7e7c4", 0, 1.05, 0, stall);
  solid(gable(4.1, 2.9, 1.15), "#e25b4a", 0, 2.1, 0, stall);
  solid(new THREE.BoxGeometry(2.2, 0.12, 1.3), "#2ec8e6", 0, 1.55, 1.15, stall);
  solid(new THREE.BoxGeometry(1.4, 0.7, 0.4), "#8b5a32", 0, 0.45, 1.35, stall);
  solid(new THREE.ConeGeometry(0.28, 0.22, 6), "#f2c14e", -0.8, 0.95, 1.4, stall);
  solid(new THREE.BoxGeometry(0.46, 0.18, 0.46), "#c4553a", 0.75, 0.95, 1.4, stall);
  stall.position.set(STALL_AT.x, 0, STALL_AT.z);
  scene.add(villager(solid, 18.4, 4.2, "#ff8a3d"));
  scene.add(villager(solid, 22.6, 4.6, "#3f8d46"));
  solid(new THREE.CylinderGeometry(0.55, 0.6, 0.7, 6), "#8a8f98", 17.2, 0.35, 4.6);
  solid(new THREE.CylinderGeometry(0.28, 0.28, 0.15, 6), "#5d6872", 17.2, 0.75, 4.6);

  const shopGroups = [0, 1, 2, 3].map((level) => business(solid, "shop", level, SHOP_AT.x, SHOP_AT.z));
  const restGroups = [0, 1, 2, 3].map((level) => business(solid, "restaurant", level, REST_AT.x, REST_AT.z));
  shopGroups.forEach((group) => scene.add(group));
  restGroups.forEach((group) => scene.add(group));

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
  const body = solid(new THREE.BoxGeometry(0.42, 0.62, 0.28), "#2ec8e6", 0, 0.86, 0, farmer);
  const head = solid(new THREE.SphereGeometry(0.2, 8, 6), "#f3d2b3", 0, 1.32, 0, farmer);
  const legL = solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#245c66", -0.12, 0.32, 0, farmer);
  const legR = solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#245c66", 0.12, 0.32, 0, farmer);
  const hats: Record<Exclude<HatId, "none">, THREE.Object3D> = {
    straw: hatStraw(solid),
    cap: hatCap(solid),
    flower: hatFlower(solid),
    crown: hatCrown(solid),
  };
  Object.values(hats).forEach((hat) => farmer.add(hat));
  const hairShort = solid(new THREE.SphereGeometry(0.18, 7, 5), "#6b4630", 0, 1.46, -0.02, farmer);
  const hairBun = solid(new THREE.SphereGeometry(0.1, 6, 5), "#241c18", 0, 1.58, -0.08, farmer);
  const hairLong = solid(new THREE.BoxGeometry(0.36, 0.28, 0.12), "#e2c56a", 0, 1.18, -0.12, farmer);
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
  let creating = !save.customized;
  let look = { ...save.look };
  let owned = [...save.owned];
  let shopLevel = save.shopLevel;
  let restLevel = save.restLevel;
  let near: FarmHud["near"] = null;
  let note = creating ? "Pick a look, then start." : "The road east leads to the village.";
  const seeds = { ...save.seeds };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const bizBoxes: Box[] = [];

  function paintFarmer() {
    (body.material as THREE.MeshLambertMaterial).color.set(look.shirt);
    (head.material as THREE.MeshLambertMaterial).color.set(look.skin);
    (legL.material as THREE.MeshLambertMaterial).color.set(look.pants);
    (legR.material as THREE.MeshLambertMaterial).color.set(look.pants);
    (Object.keys(hats) as Exclude<HatId, "none">[]).forEach((id) => {
      hats[id].visible = look.hat === id;
    });
    const hairColor = look.hair === "black" || look.hair === "bun" ? "#241c18" : look.hair === "blonde" || look.hair === "long" ? "#e2c56a" : "#6b4630";
    hairShort.visible = look.hair === "brown" || look.hair === "black" || look.hair === "blonde";
    hairBun.visible = look.hair === "bun";
    hairLong.visible = look.hair === "long";
    (hairShort.material as THREE.MeshLambertMaterial).color.set(hairColor);
    (hairBun.material as THREE.MeshLambertMaterial).color.set(hairColor);
  }

  function showBiz() {
    shopGroups.forEach((group, level) => {
      group.visible = level === shopLevel;
    });
    restGroups.forEach((group, level) => {
      group.visible = level === restLevel;
    });
    bizBoxes.length = 0;
    if (shopLevel > 0) bizBoxes.push({ minX: SHOP_AT.x - 1.5, maxX: SHOP_AT.x + 1.5, minZ: SHOP_AT.z - 1.05, maxZ: SHOP_AT.z + 0.85 });
    if (restLevel > 0) bizBoxes.push({ minX: REST_AT.x - 1.6, maxX: REST_AT.x + 1.6, minZ: REST_AT.z - 1.05, maxZ: REST_AT.z + 1.05 });
  }

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
    onHud({
      coins,
      seeds: { ...seeds },
      selected,
      note,
      day,
      seasonDone: coins >= GOAL,
      inside,
      creating,
      look: { ...look },
      owned: [...owned],
      shopLevel,
      restLevel,
      near,
    });
  }

  function persist() {
    localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day, chestDay, look, owned, shopLevel, restLevel, customized: !creating }));
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

  function upgrade(which: BizId) {
    const level = which === "shop" ? shopLevel : restLevel;
    if (level >= 3) {
      note = which === "shop" ? "The shop is fully built." : "The restaurant is fully built.";
      hud();
      return;
    }
    const cost = BIZ_COST[which][level] ?? 0;
    if (coins < cost) {
      note = `That costs ${cost} coins.`;
      hud();
      return;
    }
    coins -= cost;
    if (which === "shop") shopLevel += 1;
    else restLevel += 1;
    showBiz();
    const names = which === "shop" ? ["", "shop stall", "market stall", "general store"] : ["", "lunch counter", "cafe", "bistro"];
    note = `Opened the ${names[which === "shop" ? shopLevel : restLevel]}. It earns coins each day.`;
    hud();
  }

  function wear(id: string) {
    const item = COSMETICS.find((entry) => entry.id === id);
    if (!item) return;
    if (!owned.includes(id)) {
      if (coins < item.price) {
        note = `${item.name} costs ${item.price}.`;
        hud();
        return;
      }
      coins -= item.price;
      owned.push(id);
    }
    if (item.hat) look.hat = item.hat;
    if (item.color && item.slot === "shirt") look.shirt = item.color;
    if (item.color && item.slot === "pants") look.pants = item.color;
    if (item.hair) look.hair = item.hair;
    paintFarmer();
    note = `Wearing ${item.name}.`;
    hud();
  }

  function act() {
    if (creating) return;
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
    if (near === "shop" || near === "restaurant") {
      upgrade(near);
      return;
    }
    if (near === "village") {
      note = "Buy a look from the stall.";
      hud();
      return;
    }
    const index = nearestPlot();
    if (index < 0) {
      note = "Get closer to a plot, a lot, or the village stall.";
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
    if (creating) return;
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
    if (inside || creating) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(plotMeshes.map((mesh) => mesh.soil))[0];
    if (!hit) return;
    const index = plotMeshes.findIndex((mesh) => mesh.soil === hit.object);
    if (index >= 0) actOn(index);
    paintPlots();
    hud();
  }

  function onDrag(event: PointerEvent) {
    if (creating || (event.buttons !== 2 && event.buttons !== 4)) return;
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
    if (!creating) {
      const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      const speed = 4.1;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const vx = (-strafe * cos + forward * sin) * speed * dt + move.x * speed * dt;
      const vz = (strafe * sin + forward * cos) * speed * dt + move.z * speed * dt;
      const boxes = inside ? insideBoxes : [...outsideBoxes, ...bizBoxes];
      const nx = farmer.position.x + vx;
      const nz = farmer.position.z + vz;
      if (!hits(nx, farmer.position.z, boxes)) farmer.position.x = nx;
      if (!hits(farmer.position.x, nz, boxes)) farmer.position.z = nz;
      if (inside) {
        farmer.position.x = Math.max(ROOM.x - 2.2, Math.min(ROOM.x + 2.2, farmer.position.x));
        farmer.position.z = Math.max(ROOM.z - 1.7, Math.min(ROOM.z + 2.5, farmer.position.z));
      } else {
        farmer.position.x = Math.max(-15, Math.min(28, farmer.position.x));
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
      if (clock < dt / 90) {
        day += 1;
        const pay = (BIZ_PAY.shop[shopLevel] ?? 0) + (BIZ_PAY.restaurant[restLevel] ?? 0);
        if (pay > 0) {
          coins += pay;
          note = `Your places earned ${pay} coins today.`;
          hud();
        }
      }
    }
    const spots: { id: FarmHud["near"]; x: number; z: number }[] = [
      { id: "shop", x: SHOP_AT.x, z: SHOP_AT.z + 2.1 },
      { id: "restaurant", x: REST_AT.x, z: REST_AT.z + 2.3 },
      { id: "village", x: STALL_AT.x, z: STALL_AT.z + 2.5 },
    ];
    let nextNear: FarmHud["near"] = null;
    let best = 2.3;
    if (!inside && !creating) {
      for (const spot of spots) {
        const dist = Math.hypot(farmer.position.x - spot.x, farmer.position.z - spot.z);
        if (dist < best) {
          best = dist;
          nextNear = spot.id;
        }
      }
    }
    if (nextNear !== near) {
      near = nextNear;
      if (near === "shop") note = shopLevel === 0 ? "Empty lot. Set up a shop." : `Shop level ${shopLevel}. Upgrade it here.`;
      if (near === "restaurant") note = restLevel === 0 ? "Empty lot. Set up a restaurant." : `Restaurant level ${restLevel}. Upgrade it here.`;
      if (near === "village") note = "The stall sells clothes and hats.";
      hud();
    }
    const sunAngle = clock * Math.PI * 2;
    sun.position.set(farmer.position.x + Math.cos(sunAngle) * 14, 5 + Math.max(0.4, Math.sin(sunAngle)) * 12, farmer.position.z + 7);
    sunTarget.position.set(farmer.position.x, 0, farmer.position.z);
    const dayness = Math.max(0, Math.sin(sunAngle));
    sun.intensity = 0.25 + dayness * 1.45;
    scene.background = new THREE.Color(dayness > 0.15 ? "#9fd0ea" : "#1c2740");
    scene.fog = new THREE.Fog(dayness > 0.15 ? "#b7d7ea" : "#1c2740", 24, 70);
    lamp.intensity = inside ? 7 : 1.5;
    plots.forEach((plot) => {
      if (!plot.crop || plot.growth >= 1) return;
      if (plot.water > 0) {
        plot.water = Math.max(0, plot.water - dt);
        plot.growth = Math.min(1, plot.growth + dt / CROPS[plot.crop].grow);
      }
    });
    paintPlots();
    const lookAt = farmer.position;
    if (creating) {
      camera.position.lerp(new THREE.Vector3(lookAt.x + 0.2, 1.7, lookAt.z + 3.4), 0.18);
      camera.lookAt(lookAt.x, 1.15, lookAt.z);
    } else {
      const dist = inside ? 4.6 : 7.2;
      const camX = lookAt.x - Math.sin(yaw) * dist;
      const camZ = lookAt.z - Math.cos(yaw) * dist;
      camera.position.lerp(new THREE.Vector3(camX, inside ? 3.3 : 5.2, camZ), 0.12);
      camera.lookAt(lookAt.x, 1, lookAt.z);
    }
    renderer.render(scene, camera);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      persist();
    }
    raf = requestAnimationFrame(frame);
  }

  paintPlots();
  paintFarmer();
  showBiz();
  hud();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onDrag);
      persist();
      renderer.dispose();
    },
    act,
    buy,
    upgrade,
    wear,
    select(id: CropId) {
      selected = id;
      hud();
    },
    previewLook(next: Partial<Look>) {
      look = { ...look, ...next };
      paintFarmer();
      hud();
    },
    confirmLook() {
      creating = false;
      note = "The road east leads to the village. Empty lots can become a shop or a restaurant.";
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

function cottage(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  x: number,
  z: number,
  wallColor: string,
  roofColor: string,
) {
  const group = new THREE.Group();
  solid(new THREE.BoxGeometry(2.6, 1.7, 2.2), wallColor, 0, 0.85, 0, group);
  solid(gable(3.1, 2.6, 1), roofColor, 0, 1.7, 0, group);
  solid(new THREE.BoxGeometry(0.4, 0.45, 0.08), "#8fd0ea", 0.7, 1.05, 1.12, group);
  group.position.set(x, 0, z);
  return group;
}

function villager(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  x: number,
  z: number,
  shirt: string,
) {
  const group = new THREE.Group();
  solid(new THREE.BoxGeometry(0.36, 0.5, 0.24), shirt, 0, 0.7, 0, group);
  solid(new THREE.SphereGeometry(0.16, 7, 5), "#f3d2b3", 0, 1.1, 0, group);
  solid(new THREE.BoxGeometry(0.1, 0.32, 0.1), "#243a66", -0.08, 0.22, 0, group);
  solid(new THREE.BoxGeometry(0.1, 0.32, 0.1), "#243a66", 0.08, 0.22, 0, group);
  group.position.set(x, 0, z);
  return group;
}

function business(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  kind: BizId,
  level: number,
  x: number,
  z: number,
) {
  const group = new THREE.Group();
  const shop = kind === "shop";
  if (level === 0) {
    solid(new THREE.BoxGeometry(2.2, 0.06, 1.6), "#8a6244", 0, 0.04, 0, group);
    solid(new THREE.BoxGeometry(0.12, 0.9, 0.12), "#6b4630", 0, 0.5, 0.4, group);
    solid(new THREE.BoxGeometry(0.7, 0.4, 0.08), shop ? "#2ec8e6" : "#e25b4a", 0, 0.85, 0.4, group);
  } else if (level === 1) {
    solid(new THREE.BoxGeometry(2.2, 0.7, 1.1), "#8b5a32", 0, 0.4, 0, group);
    solid(new THREE.BoxGeometry(2.4, 0.1, 1.5), shop ? "#f2c14e" : "#c4553a", 0, 1.15, 0.2, group);
    solid(new THREE.BoxGeometry(0.1, 1.2, 0.1), "#6b4630", -1.05, 0.6, 0.7, group);
    solid(new THREE.BoxGeometry(0.1, 1.2, 0.1), "#6b4630", 1.05, 0.6, 0.7, group);
  } else if (level === 2) {
    solid(new THREE.BoxGeometry(2.8, 1.6, 1.8), shop ? "#f3e2c0" : "#f7d2c4", 0, 0.85, 0, group);
    solid(gable(3.3, 2.2, 0.9), shop ? "#3f5f86" : "#8e3a32", 0, 1.65, 0, group);
    solid(new THREE.BoxGeometry(1.2, 0.5, 0.35), "#6b4630", 0, 0.4, 1.05, group);
  } else {
    solid(new THREE.BoxGeometry(3.4, 2.1, 2.2), shop ? "#f7e7c4" : "#f0d0c8", 0, 1.1, 0, group);
    solid(gable(4, 2.7, 1.15), shop ? "#243a66" : "#a33b24", 0, 2.15, 0, group);
    solid(new THREE.BoxGeometry(0.32, 0.8, 0.32), "#6d513c", 1.1, 2.7, -0.4, group);
    solid(new THREE.BoxGeometry(1.5, 0.55, 0.4), "#6b4630", 0, 0.45, 1.25, group);
    solid(new THREE.BoxGeometry(0.7, 0.45, 0.7), "#d7b07a", -1.3, 0.28, 1.3, group);
  }
  group.position.set(x, 0, z);
  return group;
}

function hatStraw(solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh) {
  const group = new THREE.Group();
  solid(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 8), "#e2c14e", 0, 1.5, 0, group);
  solid(new THREE.ConeGeometry(0.22, 0.22, 6), "#f2c14e", 0, 1.62, 0, group);
  return group;
}

function hatCap(solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh) {
  const group = new THREE.Group();
  solid(new THREE.SphereGeometry(0.18, 7, 5), "#c4553a", 0, 1.5, 0, group);
  solid(new THREE.BoxGeometry(0.28, 0.05, 0.16), "#c4553a", 0, 1.42, 0.16, group);
  return group;
}

function hatFlower(solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh) {
  const group = new THREE.Group();
  solid(new THREE.SphereGeometry(0.08, 6, 5), "#ff2bd6", 0.12, 1.5, 0.08, group);
  solid(new THREE.SphereGeometry(0.05, 5, 4), "#f2c14e", 0.12, 1.5, 0.08, group);
  return group;
}

function hatCrown(solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh) {
  const group = new THREE.Group();
  solid(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 6), "#f2c14e", 0, 1.52, 0, group);
  solid(new THREE.ConeGeometry(0.06, 0.14, 4), "#f2c14e", 0, 1.64, 0.1, group);
  solid(new THREE.ConeGeometry(0.06, 0.14, 4), "#f2c14e", -0.12, 1.64, -0.06, group);
  solid(new THREE.ConeGeometry(0.06, 0.14, 4), "#f2c14e", 0.12, 1.64, -0.06, group);
  return group;
}
