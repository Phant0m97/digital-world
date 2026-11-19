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
  girl: boolean;
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
  carOwned: boolean;
  driving: boolean;
  nearCar: boolean;
  browsing: boolean;
  carInCity: boolean;
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

export const CAR_PRICE = 85;
const CAR_PARK = { x: 1.6, z: 7.3 };
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
const SHOP_ROOM = { x: 100, z: 0 };
const HALL_ROOM = { x: 120, z: 0 };
const OFFICE_ROOM = { x: 140, z: 0 };
const CITY_PARK = { x: 13.2, z: 5.3 };
const SHOP_AT = { x: 6.6, z: -3.4 };
const REST_AT = { x: 6.6, z: 1.2 };
const STALL_AT = { x: 20.2, z: 1.4 };

type RoomId = "house" | "shop" | "hall" | "office";
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
  carOwned: boolean;
  carX: number;
  carZ: number;
};

const DEFAULT_LOOK: Look = { skin: "#f3d2b3", shirt: "#3a6ea5", pants: "#6a4a32", hat: "straw", hair: "brown", girl: false };

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
    carOwned: false,
    carX: CAR_PARK.x,
    carZ: CAR_PARK.z,
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
      look: saved.customized ? { ...base.look, ...saved.look } : { ...DEFAULT_LOOK },
      owned: saved.owned?.length ? saved.owned : base.owned,
      customized: saved.customized ?? false,
      carOwned: saved.carOwned ?? false,
      carX: saved.carX ?? CAR_PARK.x,
      carZ: saved.carZ ?? CAR_PARK.z,
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
  scene.background = new THREE.Color("#8ec8ef");
  scene.fog = new THREE.Fog("#b7d7ea", 34, 78);
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

  const ground = solid(new THREE.PlaneGeometry(96, 52), "#67a33a", 16, 0, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  solid(new THREE.CircleGeometry(12, 10), "#7cb84a", 1.2, 0.012, 1.2).rotation.x = -Math.PI / 2;
  const lane = solid(new THREE.PlaneGeometry(2.4, 18), "#c4a06a", 1.2, 0.02, 10);
  lane.rotation.x = -Math.PI / 2;

  const hx = HOUSE.x;
  const hz = HOUSE.z;
  const homestead = new THREE.Group();
  scene.add(homestead);
  const walls = new THREE.Group();
  homestead.add(walls);
  const plaster = "#f6efe4";
  const ink = "#23282e";
  const glass = "#b9e3f5";
  const wall = (w: number, h: number, d: number, x: number, y: number, z: number, color = plaster) =>
    solid(new THREE.BoxGeometry(w, h, d), color, x, y, z, walls);
  wall(5.2, 2.45, 0.22, hx, 1.22, hz - 1.95);
  wall(0.22, 2.45, 4.1, hx - 2.5, 1.22, hz);
  wall(0.22, 2.45, 4.1, hx + 2.5, 1.22, hz);
  wall(1.85, 2.45, 0.22, hx - 1.55, 1.22, hz + 1.95);
  wall(1.85, 2.45, 0.22, hx + 1.55, 1.22, hz + 1.95);
  wall(1.5, 0.55, 0.22, hx, 2.15, hz + 1.95);
  solid(new THREE.BoxGeometry(6.5, 0.16, 5.4), ink, hx, 2.55, hz);
  solid(new THREE.BoxGeometry(6.8, 0.05, 5.7), "#3a4048", hx, 2.42, hz);
  solid(new THREE.BoxGeometry(0.42, 0.85, 0.42), "#b9c0c8", hx + 1.7, 2.95, hz - 0.7);
  solid(new THREE.BoxGeometry(0.28, 2.5, 0.28), "#c4a574", hx - 2.45, 1.22, hz - 1.85);
  solid(new THREE.BoxGeometry(0.28, 2.5, 0.28), "#c4a574", hx + 2.45, 1.22, hz - 1.85);
  solid(new THREE.BoxGeometry(0.28, 2.5, 0.28), "#c4a574", hx - 2.45, 1.22, hz + 1.85);
  solid(new THREE.BoxGeometry(0.28, 2.5, 0.28), "#c4a574", hx + 2.45, 1.22, hz + 1.85);
  solid(new THREE.BoxGeometry(2.6, 0.08, 1.6), "#d7dbe1", hx, 0.05, hz + 2.85);
  solid(new THREE.BoxGeometry(0.08, 2.05, 0.1), ink, hx - 0.62, 1.05, hz + 2.02);
  solid(new THREE.BoxGeometry(0.08, 2.05, 0.1), ink, hx + 0.62, 1.05, hz + 2.02);
  solid(new THREE.BoxGeometry(1.2, 1.55, 0.06), glass, hx - 1.55, 1.2, hz + 2.08);
  solid(new THREE.BoxGeometry(1.2, 1.55, 0.06), glass, hx + 1.55, 1.2, hz + 2.08);
  solid(new THREE.BoxGeometry(0.06, 1.45, 1.7), glass, hx - 2.64, 1.25, hz + 0.2);
  solid(new THREE.BoxGeometry(0.06, 1.45, 1.7), glass, hx + 2.64, 1.25, hz - 0.2);
  solid(new THREE.BoxGeometry(2.4, 1.2, 0.06), glass, hx, 1.35, hz - 2.08);
  solid(new THREE.BoxGeometry(5.3, 0.1, 0.06), "#c4a574", hx, 2.22, hz + 2.08);
  solid(new THREE.PlaneGeometry(1.15, 1.9), "#1c2126", hx, 1.0, hz + 1.82, walls);
  dressHouse(solid, walls, hx, hz);

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
  const shopBoxes = shellBoxes(SHOP_ROOM.x, SHOP_ROOM.z, [
    { minX: SHOP_ROOM.x - 1.3, maxX: SHOP_ROOM.x + 1.3, minZ: SHOP_ROOM.z - 1.15, maxZ: SHOP_ROOM.z - 0.45 },
  ]);
  const hallBoxes = shellBoxes(HALL_ROOM.x, HALL_ROOM.z, [
    { minX: HALL_ROOM.x - 1.1, maxX: HALL_ROOM.x + 1.1, minZ: HALL_ROOM.z - 1.5, maxZ: HALL_ROOM.z - 0.7 },
  ]);
  const officeBoxes = shellBoxes(OFFICE_ROOM.x, OFFICE_ROOM.z, [
    { minX: OFFICE_ROOM.x - 0.8, maxX: OFFICE_ROOM.x + 0.8, minZ: OFFICE_ROOM.z - 0.4, maxZ: OFFICE_ROOM.z + 0.4 },
  ]);
  const shells: Record<RoomId, Box[]> = { house: insideBoxes, shop: shopBoxes, hall: hallBoxes, office: officeBoxes };

  const houseRoom = new THREE.Group();
  scene.add(houseRoom);
  const floor = solid(new THREE.BoxGeometry(5.2, 0.08, 4.2), "#ece7e1", ROOM.x, 0.04, ROOM.z, houseRoom);
  floor.castShadow = false;
  solid(new THREE.BoxGeometry(5.2, 2.4, 0.16), "#f7f7f5", ROOM.x, 1.2, ROOM.z - 1.95, houseRoom);
  solid(new THREE.BoxGeometry(0.16, 2.4, 4.1), "#f7f7f5", ROOM.x - 2.5, 1.2, ROOM.z, houseRoom);
  solid(new THREE.BoxGeometry(0.16, 2.4, 4.1), "#f7f7f5", ROOM.x + 2.5, 1.2, ROOM.z, houseRoom);
  solid(new THREE.BoxGeometry(1.85, 2.4, 0.16), "#f7f7f5", ROOM.x - 1.55, 1.2, ROOM.z + 1.95, houseRoom);
  solid(new THREE.BoxGeometry(1.85, 2.4, 0.16), "#f7f7f5", ROOM.x + 1.55, 1.2, ROOM.z + 1.95, houseRoom);
  solid(new THREE.BoxGeometry(1.5, 0.5, 0.16), "#f7f7f5", ROOM.x, 2.15, ROOM.z + 1.95, houseRoom);
  solid(new THREE.BoxGeometry(5.4, 0.1, 4.5), "#2a3138", ROOM.x, 2.45, ROOM.z, houseRoom);
  solid(new THREE.BoxGeometry(2.1, 0.28, 1.15), "#f4f6f8", ROOM.x - 1.35, 0.28, ROOM.z - 1.05, houseRoom);
  solid(new THREE.BoxGeometry(1.7, 0.12, 0.9), "#d9dee7", ROOM.x - 1.35, 0.46, ROOM.z - 1.05, houseRoom);
  solid(new THREE.BoxGeometry(1.3, 0.32, 0.55), "#2a3138", ROOM.x + 1.15, 0.28, ROOM.z + 0.35, houseRoom);
  solid(new THREE.BoxGeometry(0.9, 0.45, 0.4), "#f4f6f8", ROOM.x - 1.7, 0.32, ROOM.z + 0.9, houseRoom);
  solid(new THREE.BoxGeometry(1.6, 0.02, 1.1), "#cfd5de", ROOM.x + 0.15, 0.06, ROOM.z - 0.15, houseRoom);
  solid(new THREE.BoxGeometry(1.5, 1.15, 0.06), "#b9e3f5", ROOM.x + 2.4, 1.35, ROOM.z - 0.2, houseRoom);
  solid(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 6), "#2a3138", ROOM.x + 1.5, 0.7, ROOM.z - 1.2, houseRoom);
  solid(new THREE.ConeGeometry(0.18, 0.16, 6), "#f3f0e8", ROOM.x + 1.5, 1.3, ROOM.z - 1.2, houseRoom);
  scene.add(dressRoom(solid, SHOP_ROOM.x, SHOP_ROOM.z, "shop"));
  scene.add(dressRoom(solid, HALL_ROOM.x, HALL_ROOM.z, "hall"));
  scene.add(dressRoom(solid, OFFICE_ROOM.x, OFFICE_ROOM.z, "office"));

  for (let i = 0; i < 7; i += 1) {
    const tree = new THREE.Group();
    solid(new THREE.CylinderGeometry(0.16, 0.24, 1.15, 5), "#6b4630", 0, 0.58, 0, tree);
    solid(new THREE.ConeGeometry(1.25, 1.7, 7), "#245c32", 0, 1.7, 0, tree);
    solid(new THREE.ConeGeometry(0.85, 1.25, 7), "#3c7a40", 0, 2.55, 0, tree);
    const angle = Math.PI * 0.65 + (i / 6) * Math.PI * 0.9;
    tree.position.set(Math.cos(angle) * 12.4, 0, Math.sin(angle) * 10.5 - 0.4);
    homestead.add(tree);
  }
  dressYard(solid, homestead, hx, hz);
  for (let i = 0; i < 14; i += 1) {
    const trunk = new THREE.Group();
    solid(new THREE.CylinderGeometry(0.22, 0.32, 1.8, 5), "#5a3b28", 0, 0.9, 0, trunk);
    solid(new THREE.ConeGeometry(1.35, 2.1, 6), "#245c32", 0, 2.5, 0, trunk);
    solid(new THREE.ConeGeometry(0.9, 1.4, 6), "#3f8d46", 0, 3.5, 0, trunk);
    trunk.position.set(8.75, 0, -13 + i * 2);
    scene.add(trunk);
  }
  outsideBoxes.push({ minX: 8.2, maxX: 9.5, minZ: -14, maxZ: 13 });
  const city = buildCity(solid, outsideBoxes);
  scene.add(city);
  const shopDoor = solid(new THREE.PlaneGeometry(0.9, 1.7), "#1c2126", STALL_AT.x, 0.95, STALL_AT.z + 1.46);
  shopDoor.castShadow = false;
  const hallDoor = solid(new THREE.PlaneGeometry(0.9, 1.7), "#1c2126", 16.5, 0.95, -3.52);
  hallDoor.castShadow = false;
  const officeDoor = solid(new THREE.PlaneGeometry(0.9, 1.7), "#1c2126", 18.2, 0.95, 7.62);
  officeDoor.rotation.y = Math.PI;
  officeDoor.castShadow = false;

  const shopGroups = [0, 1, 2, 3].map((level) => business(solid, "shop", level, SHOP_AT.x, SHOP_AT.z));
  const restGroups = [0, 1, 2, 3].map((level) => business(solid, "restaurant", level, REST_AT.x, REST_AT.z));
  shopGroups.forEach((group) => homestead.add(group));
  restGroups.forEach((group) => homestead.add(group));

  const plotMeshes: { soil: THREE.Mesh; crop: THREE.Group }[] = [];
  const plots = save.plots;
  for (let i = 0; i < 16; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const soil = solid(new THREE.BoxGeometry(1.28, 0.16, 1.28), "#8a6244", (col - 1.5) * 1.65, 0.08, (row - 1.5) * 1.65 + 1.5, homestead);
    const crop = new THREE.Group();
    crop.position.copy(soil.position);
    for (let s = 0; s < 3; s += 1) {
      const stalk = solid(new THREE.ConeGeometry(0.08, 0.55, 4), "#d8b44a", (s - 1) * 0.18, 0.42, s === 1 ? 0.08 : -0.05, crop);
      stalk.name = "stalk";
    }
    const fruit = solid(new THREE.SphereGeometry(0.22, 7, 5), "#e86a1a", 0, 0.38, 0, crop);
    fruit.name = "fruit";
    crop.visible = false;
    homestead.add(crop);
    plotMeshes.push({ soil, crop });
  }

  const farmer = new THREE.Group();
  const body = solid(new THREE.BoxGeometry(0.42, 0.62, 0.28), "#3a6ea5", 0, 0.86, 0, farmer);
  const head = solid(new THREE.SphereGeometry(0.2, 8, 6), "#f3d2b3", 0, 1.32, 0, farmer);
  const legL = solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#6a4a32", -0.12, 0.32, 0, farmer);
  const legR = solid(new THREE.BoxGeometry(0.12, 0.42, 0.12), "#6a4a32", 0.12, 0.32, 0, farmer);
  const skirt = solid(new THREE.CylinderGeometry(0.15, 0.42, 0.5, 8), "#2ec8e6", 0, 0.5, 0, farmer);
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
  const car = buildCar(solid);
  car.position.set(save.carX, 0, save.carZ);
  car.rotation.y = Math.PI / 2;
  scene.add(car);

  const keys = new Set<string>();
  const move = { x: 0, z: 0 };
  let yaw = 0.4;
  let selected: CropId = save.selected;
  let coins = save.coins;
  let day = save.day;
  let chestDay = save.chestDay;
  let clock = 0.32;
  let room: RoomId | null = null;
  let doorLock = 0;
  let creating = !save.customized;
  let look = { ...save.look };
  let owned = [...save.owned];
  let shopLevel = save.shopLevel;
  let restLevel = save.restLevel;
  let carOwned = save.carOwned;
  let browsing = false;
  let nearCar = false;
  let near: FarmHud["near"] = null;
  let note = creating ? "Pick a look, then start." : "The car by the road goes to the city.";
  const seeds = { ...save.seeds };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const bizBoxes: Box[] = [];

  function paintFarmer() {
    (body.material as THREE.MeshLambertMaterial).color.set(look.shirt);
    (head.material as THREE.MeshLambertMaterial).color.set(look.skin);
    (legL.material as THREE.MeshLambertMaterial).color.set(look.pants);
    (legR.material as THREE.MeshLambertMaterial).color.set(look.pants);
    (skirt.material as THREE.MeshLambertMaterial).color.set(look.shirt);
    skirt.visible = look.girl;
    body.scale.set(look.girl ? 0.78 : 1, look.girl ? 0.92 : 1, look.girl ? 0.84 : 1);
    body.position.y = look.girl ? 0.96 : 0.86;
    (Object.keys(hats) as Exclude<HatId, "none">[]).forEach((id) => {
      hats[id].visible = look.hat === id;
    });
    const hairColor = look.hair === "black" || look.hair === "bun" ? "#241c18" : look.hair === "blonde" || look.hair === "long" ? "#e2c56a" : "#6b4630";
    hairShort.visible = look.hair === "brown" || look.hair === "black" || look.hair === "blonde";
    hairBun.visible = look.hair === "bun";
    hairLong.visible = look.hair === "long";
    (hairShort.material as THREE.MeshLambertMaterial).color.set(hairColor);
    (hairBun.material as THREE.MeshLambertMaterial).color.set(hairColor);
    (hairLong.material as THREE.MeshLambertMaterial).color.set(hairColor);
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
      inside: room !== null,
      creating,
      look: { ...look },
      owned: [...owned],
      shopLevel,
      restLevel,
      near,
      carOwned,
      driving: false,
      nearCar,
      browsing,
      carInCity: car.position.x > 10,
    });
  }

  function persist() {
    localStorage.setItem(KEY, JSON.stringify({ coins, seeds, selected, plots, day, chestDay, look, owned, shopLevel, restLevel, customized: !creating, carOwned, carX: car.position.x, carZ: car.position.z }));
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
    if (!room && nearCar) {
      if (!carOwned) {
        if (coins < CAR_PRICE) note = `The car costs ${CAR_PRICE} coins.`;
        else {
          coins -= CAR_PRICE;
          carOwned = true;
          note = "It's yours. Use it again to go to the city.";
        }
      } else if (car.position.x > 10) {
        car.position.set(CAR_PARK.x, 0, CAR_PARK.z);
        farmer.position.set(CAR_PARK.x, 0, CAR_PARK.z + 3.2);
        note = "Back at the farm.";
      } else {
        car.position.set(CITY_PARK.x, 0, CITY_PARK.z);
        farmer.position.set(CITY_PARK.x + 3.2, 0, CITY_PARK.z);
        note = "You're in the city. Walk into a door.";
      }
      hud();
      return;
    }
    if (room === "house") {
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
    if (room === "shop") {
      const nearCounter = Math.hypot(farmer.position.x - SHOP_ROOM.x, farmer.position.z - (SHOP_ROOM.z - 0.2)) < 1.45;
      if (!nearCounter) {
        browsing = false;
        note = "Use the counter along the back wall.";
        hud();
        return;
      }
      browsing = !browsing;
      note = browsing ? "The counter is open." : "You step back.";
      hud();
      return;
    }
    if (room === "hall" || room === "office") {
      note = room === "hall" ? "The lobby is quiet." : "Nobody is at the desks.";
      hud();
      return;
    }
    if (near === "shop" || near === "restaurant") {
      upgrade(near);
      return;
    }
    const index = nearestPlot();
    if (index < 0) {
      note = "Get closer to a plot, a lot, the car, or a door.";
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

  function carBounds(): Box {
    return {
      minX: car.position.x - 1.2,
      maxX: car.position.x + 1.2,
      minZ: car.position.z - 0.75,
      maxZ: car.position.z + 0.75,
    };
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
    if (room || creating) return;
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

  const doors: { id: RoomId; x: number; z: number; outZ: number; note: string }[] = [
    { id: "house", x: hx, z: hz + 1.85, outZ: hz + 2.7, note: "Inside. The chest is by the bed." },
    { id: "shop", x: STALL_AT.x, z: STALL_AT.z + 2.15, outZ: STALL_AT.z + 3.3, note: "Inside the shop. Use the counter." },
    { id: "hall", x: 16.5, z: -3.15, outZ: -2.7, note: "A tower lobby." },
    { id: "office", x: 18.2, z: 7.25, outZ: 6.85, note: "A small office." },
  ];
  function roomAt(id: RoomId) {
    if (id === "shop") return SHOP_ROOM;
    if (id === "hall") return HALL_ROOM;
    if (id === "office") return OFFICE_ROOM;
    return ROOM;
  }

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
      const here = room ? shells[room] : [...outsideBoxes, ...bizBoxes, carBounds()];
      const nx = farmer.position.x + vx;
      const nz = farmer.position.z + vz;
      if (!hits(nx, farmer.position.z, here)) farmer.position.x = nx;
      if (!hits(farmer.position.x, nz, here)) farmer.position.z = nz;
      if (room) {
        const spot = roomAt(room);
        farmer.position.x = Math.max(spot.x - 2.2, Math.min(spot.x + 2.2, farmer.position.x));
        farmer.position.z = Math.max(spot.z - 1.7, Math.min(spot.z + 2.5, farmer.position.z));
      } else {
        farmer.position.x = Math.max(-15, Math.min(46, farmer.position.x));
        farmer.position.z = Math.max(-14, Math.min(13, farmer.position.z));
      }
      if (forward || strafe || move.x || move.z) farmer.rotation.y = Math.atan2(vx, vz);
      doorLock = Math.max(0, doorLock - dt);
      if (doorLock <= 0 && !room) {
        const door = doors.find((entry) => Math.hypot(farmer.position.x - entry.x, farmer.position.z - entry.z) < 0.7);
        if (door) {
          const spot = roomAt(door.id);
          room = door.id;
          browsing = false;
          doorLock = 0.7;
          farmer.position.set(spot.x, 0, spot.z + 1.35);
          note = door.note;
          hud();
        }
      } else if (doorLock <= 0 && room) {
        const spot = roomAt(room);
        if (Math.abs(farmer.position.x - spot.x) < 0.55 && farmer.position.z > spot.z + 1.85) {
          const back = doors.find((entry) => entry.id === room)!;
          room = null;
          browsing = false;
          doorLock = 0.7;
          farmer.position.set(back.x, 0, back.outZ);
          note = "Outside.";
          hud();
        }
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
    ];
    let nextNear: FarmHud["near"] = null;
    let best = 2.3;
    if (!room && !creating) {
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
      hud();
    }
    const closeToCar = !room && Math.hypot(farmer.position.x - car.position.x, farmer.position.z - car.position.z) < 2.6;
    if (closeToCar !== nearCar) {
      nearCar = closeToCar;
      if (nearCar && !carOwned) note = `A car is for sale. ${CAR_PRICE} coins.`;
      if (nearCar && carOwned) note = car.position.x > 10 ? "Use the car to go back to the farm." : "Use the car to go to the city.";
      hud();
    }
    if (browsing && (room !== "shop" || Math.hypot(farmer.position.x - SHOP_ROOM.x, farmer.position.z - (SHOP_ROOM.z - 0.2)) > 1.7)) {
      browsing = false;
      hud();
    }
    const sunAngle = clock * Math.PI * 2;
    sun.position.set(farmer.position.x + Math.cos(sunAngle) * 14, 5 + Math.max(0.4, Math.sin(sunAngle)) * 12, farmer.position.z + 7);
    sunTarget.position.set(farmer.position.x, 0, farmer.position.z);
    const dayness = Math.max(0, Math.sin(sunAngle));
    const inCity = !room && farmer.position.x > 10;
    sun.intensity = 0.25 + dayness * 1.45;
    scene.background = new THREE.Color(dayness > 0.15 ? "#9fd0ea" : "#1c2740");
    scene.fog = new THREE.Fog(dayness > 0.15 ? "#b7d7ea" : "#1c2740", inCity ? 8 : 24, inCity ? 20 : 62);
    homestead.visible = !inCity;
    if (!room && farmer.position.x > 7.5) {
      const next = carOwned ? "The woods are too thick. Use the car." : "The road is closed. Buy the car to reach the city.";
      if (note !== next) {
        note = next;
        hud();
      }
    }
    if (room) {
      const spot = roomAt(room);
      lamp.position.set(spot.x, 1.8, spot.z);
      lamp.intensity = 8;
    } else lamp.intensity = 1.5;
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
    } else if (room) {
      const spot = roomAt(room);
      const camX = Math.max(spot.x - 1.85, Math.min(spot.x + 1.85, lookAt.x - Math.sin(yaw) * 2.35));
      const camZ = Math.max(spot.z - 1.35, Math.min(spot.z + 1.45, lookAt.z - Math.cos(yaw) * 2.35));
      camera.position.lerp(new THREE.Vector3(camX, 1.65, camZ), 0.18);
      camera.lookAt(lookAt.x, 1.05, lookAt.z);
    } else {
      const camX = lookAt.x - Math.sin(yaw) * 7.2;
      const camZ = lookAt.z - Math.cos(yaw) * 7.2;
      camera.position.lerp(new THREE.Vector3(camX, 5.2, camZ), 0.12);
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
      note = "Buy the car by the road. Use it to go to the city.";
      hud();
    },
    nudge(x: number, z: number) {
      move.x = x;
      move.z = z;
    },
  };
}

function shellBoxes(ox: number, oz: number, extra: Box[] = []): Box[] {
  return [
    { minX: ox - 2.7, maxX: ox + 2.7, minZ: oz - 2.15, maxZ: oz - 1.75 },
    { minX: ox - 2.7, maxX: ox - 2.3, minZ: oz - 2.1, maxZ: oz + 2.15 },
    { minX: ox + 2.3, maxX: ox + 2.7, minZ: oz - 2.1, maxZ: oz + 2.15 },
    { minX: ox - 2.6, maxX: ox - 0.62, minZ: oz + 1.75, maxZ: oz + 2.15 },
    { minX: ox + 0.62, maxX: ox + 2.6, minZ: oz + 1.75, maxZ: oz + 2.15 },
    ...extra,
  ];
}

function dressRoom(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  ox: number,
  oz: number,
  kind: "shop" | "hall" | "office",
) {
  const group = new THREE.Group();
  const floor = solid(new THREE.BoxGeometry(5.2, 0.08, 4.2), kind === "office" ? "#d7dde6" : "#f4f1ea", ox, 0.04, oz, group);
  floor.castShadow = false;
  solid(new THREE.BoxGeometry(5.2, 2.4, 0.16), "#f7f7f5", ox, 1.2, oz - 1.95, group);
  solid(new THREE.BoxGeometry(0.16, 2.4, 4.1), "#f7f7f5", ox - 2.5, 1.2, oz, group);
  solid(new THREE.BoxGeometry(0.16, 2.4, 4.1), "#f7f7f5", ox + 2.5, 1.2, oz, group);
  solid(new THREE.BoxGeometry(1.85, 2.4, 0.16), "#f7f7f5", ox - 1.55, 1.2, oz + 1.95, group);
  solid(new THREE.BoxGeometry(1.85, 2.4, 0.16), "#f7f7f5", ox + 1.55, 1.2, oz + 1.95, group);
  solid(new THREE.BoxGeometry(1.5, 0.5, 0.16), "#f7f7f5", ox, 2.15, oz + 1.95, group);
  solid(new THREE.BoxGeometry(5.4, 0.1, 4.5), "#2a3138", ox, 2.45, oz, group);
  if (kind === "shop") {
    solid(new THREE.BoxGeometry(2.4, 0.7, 0.5), "#2a3138", ox, 0.45, oz - 0.85, group);
    solid(new THREE.BoxGeometry(0.7, 1.1, 0.35), "#2ec8e6", ox - 1.6, 0.7, oz + 0.2, group);
    solid(new THREE.BoxGeometry(0.7, 1.1, 0.35), "#ff2bd6", ox + 1.6, 0.7, oz + 0.2, group);
    solid(new THREE.BoxGeometry(0.55, 0.9, 0.3), "#f2c14e", ox - 1.6, 0.6, oz - 0.7, group);
  } else if (kind === "hall") {
    solid(new THREE.BoxGeometry(2.2, 0.7, 0.6), "#2a3138", ox, 0.45, oz - 1.1, group);
    solid(new THREE.BoxGeometry(0.8, 1.6, 0.08), "#1c2126", ox - 1.5, 0.9, oz - 1.85, group);
    solid(new THREE.BoxGeometry(0.8, 1.6, 0.08), "#1c2126", ox + 1.5, 0.9, oz - 1.85, group);
    solid(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 6), "#3f8d46", ox + 1.6, 0.4, oz + 0.8, group);
  } else {
    solid(new THREE.BoxGeometry(1.6, 0.5, 0.8), "#f7f7f5", ox - 0.8, 0.4, oz, group);
    solid(new THREE.BoxGeometry(1.6, 0.5, 0.8), "#f7f7f5", ox + 0.8, 0.4, oz - 0.6, group);
    solid(new THREE.BoxGeometry(1.4, 0.9, 0.08), "#b9e3f5", ox, 1.3, oz - 1.88, group);
  }
  return group;
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

function buildCar(solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh) {
  const group = new THREE.Group();
  solid(new THREE.BoxGeometry(1.15, 0.38, 2.25), "#e8eef5", 0, 0.48, 0.05, group);
  solid(new THREE.BoxGeometry(1.02, 0.34, 1.15), "#2a3138", 0, 0.78, -0.12, group);
  solid(new THREE.BoxGeometry(0.92, 0.22, 0.08), "#b9e3f5", 0, 0.8, 0.46, group);
  solid(new THREE.BoxGeometry(0.9, 0.08, 0.35), "#f2c14e", 0, 0.42, 1.05, group);
  solid(new THREE.BoxGeometry(0.7, 0.08, 0.12), "#e25b4a", 0, 0.48, -1.05, group);
  for (const side of [-0.48, 0.48]) {
    for (const axle of [-0.7, 0.72]) {
      const wheel = solid(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 8), "#1c2126", side, 0.22, axle, group);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  return group;
}

function buildCity(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  boxes: Box[],
) {
  const city = new THREE.Group();
  const pad = solid(new THREE.PlaneGeometry(40, 30), "#616872", 30, 0.02, 1.2, city);
  pad.rotation.x = -Math.PI / 2;
  pad.castShadow = false;
  const road = solid(new THREE.BoxGeometry(52, 0.05, 2.5), "#3c444c", 22, 0.04, 5.3, city);
  road.castShadow = false;
  const cross = solid(new THREE.BoxGeometry(2.4, 0.06, 20), "#3c444c", 28.5, 0.05, 2.2, city);
  cross.castShadow = false;
  for (let i = 0; i < 16; i += 1) {
    const dash = solid(new THREE.BoxGeometry(1.1, 0.02, 0.08), "#f3f0e8", 2 + i * 2.8, 0.07, 5.3, city);
    dash.castShadow = false;
  }
  const walkN = solid(new THREE.BoxGeometry(40, 0.04, 1.1), "#c5ccd4", 30, 0.045, 3.55, city);
  walkN.castShadow = false;
  const walkS = solid(new THREE.BoxGeometry(40, 0.04, 1.1), "#c5ccd4", 30, 0.045, 7.15, city);
  walkS.castShadow = false;
  const towers = [
    { x: 16.5, z: -5.2, w: 3.6, d: 3.2, h: 8, color: "#e7eef5", glass: "#8ec5e0" },
    { x: 22.4, z: -6.4, w: 3.8, d: 3.3, h: 12, color: "#d5deea", glass: "#f2c14e" },
    { x: 28.8, z: -4.6, w: 4.2, d: 3.4, h: 9.5, color: "#f7f4f1", glass: "#7eb6d6" },
    { x: 35.2, z: -6.2, w: 3.4, d: 3.2, h: 14, color: "#c9d4e2", glass: "#e8eef5" },
    { x: 41.2, z: -3.4, w: 3.8, d: 3.6, h: 7.5, color: "#2a3138", glass: "#f2c14e" },
    { x: 18.2, z: 9.2, w: 4.4, d: 3, h: 4.2, color: "#f4f6f8", glass: "#b9e3f5" },
    { x: 25.4, z: 9.4, w: 5.2, d: 3.2, h: 5.4, color: "#e7d7cf", glass: "#2a3138" },
    { x: 33.5, z: 9.1, w: 4, d: 3.1, h: 6.2, color: "#dfe6ee", glass: "#8ec5e0" },
    { x: 40.4, z: 8.6, w: 3.6, d: 3, h: 10, color: "#f7f4f1", glass: "#e25b4a" },
  ];
  for (const tower of towers) {
    const block = new THREE.Group();
    solid(new THREE.BoxGeometry(tower.w, tower.h * 0.7, tower.d), tower.color, 0, tower.h * 0.35, 0, block);
    solid(new THREE.BoxGeometry(tower.w * 0.72, tower.h * 0.3, tower.d * 0.72), tower.color, 0, tower.h * 0.85, 0, block);
    const rows = Math.max(2, Math.floor(tower.h / 1.4));
    for (let row = 0; row < rows; row += 1) {
      solid(new THREE.BoxGeometry(tower.w * 0.62, 0.28, 0.06), tower.glass, 0, 0.9 + row * 1.25, tower.d * 0.5 + 0.02, block);
    }
    block.position.set(tower.x, 0, tower.z);
    city.add(block);
    boxes.push({
      minX: tower.x - tower.w / 2,
      maxX: tower.x + tower.w / 2,
      minZ: tower.z - tower.d / 2,
      maxZ: tower.z + tower.d / 2,
    });
  }
  const shop = new THREE.Group();
  solid(new THREE.BoxGeometry(4.2, 2.6, 2.8), "#f7f7f5", 0, 1.3, 0, shop);
  solid(new THREE.BoxGeometry(4.5, 0.16, 3.1), "#2a3138", 0, 2.68, 0, shop);
  solid(new THREE.BoxGeometry(3.2, 1.6, 0.08), "#b9e3f5", 0, 1.25, 1.42, shop);
  solid(new THREE.BoxGeometry(1.6, 0.28, 0.08), "#2ec8e6", 0, 2.25, 1.46, shop);
  shop.position.set(STALL_AT.x, 0, STALL_AT.z);
  city.add(shop);
  boxes.push({ minX: STALL_AT.x - 2.1, maxX: STALL_AT.x + 2.1, minZ: STALL_AT.z - 1.4, maxZ: STALL_AT.z + 1.35 });
  for (let i = 0; i < 8; i += 1) {
    const lamp = new THREE.Group();
    solid(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 5), "#2a3138", 0, 1.2, 0, lamp);
    solid(new THREE.BoxGeometry(0.7, 0.08, 0.28), "#fff4c8", 0.2, 2.35, 0, lamp);
    lamp.position.set(8 + i * 4.6, 0, 3.7);
    city.add(lamp);
  }
  const parked = [
    { x: 14.5, z: 6.8, color: "#e25b4a" },
    { x: 24.2, z: 3.9, color: "#f2c14e" },
    { x: 33.8, z: 6.9, color: "#2ec8e6" },
  ];
  for (const spot of parked) {
    const parkedCar = buildCar(solid);
    parkedCar.position.set(spot.x, 0, spot.z);
    parkedCar.rotation.y = Math.PI / 2;
    const body = parkedCar.children[0] as THREE.Mesh;
    (body.material as THREE.MeshLambertMaterial).color.set(spot.color);
    city.add(parkedCar);
  }
  scenePeople(solid, city);
  cityDetails(solid, city);
  return city;
}

function dressHouse(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  walls: THREE.Group,
  hx: number,
  hz: number,
) {
  solid(new THREE.BoxGeometry(0.7, 1.1, 0.7), "#d7dbe1", hx - 2.1, 3.05, hz - 1.3, walls);
  solid(new THREE.BoxGeometry(0.4, 0.25, 0.4), "#2a3138", hx - 2.1, 3.7, hz - 1.3, walls);
  solid(new THREE.BoxGeometry(0.9, 0.22, 0.28), "#f7f7f5", hx - 1.55, 0.7, hz + 2.2, walls);
  solid(new THREE.BoxGeometry(0.9, 0.22, 0.28), "#f7f7f5", hx + 1.55, 0.7, hz + 2.2, walls);
  for (const x of [-1.55, 1.55]) {
    solid(new THREE.SphereGeometry(0.12, 6, 5), "#e25b4a", hx + x - 0.22, 0.95, hz + 2.32, walls);
    solid(new THREE.SphereGeometry(0.12, 6, 5), "#f2c14e", hx + x + 0.22, 0.95, hz + 2.32, walls);
  }
  solid(new THREE.BoxGeometry(1.7, 0.08, 0.7), "#c4a574", hx, 0.12, hz + 2.35, walls);
  solid(new THREE.BoxGeometry(1.2, 0.08, 0.5), "#8d5524", hx, 0.2, hz + 2.15, walls);
  solid(new THREE.BoxGeometry(0.7, 0.02, 0.4), "#2ec8e6", hx, 0.08, hz + 2.7, walls);
  solid(new THREE.BoxGeometry(0.08, 0.7, 0.08), "#23282e", hx - 0.7, 0.45, hz + 2.55, walls);
  solid(new THREE.BoxGeometry(0.08, 0.7, 0.08), "#23282e", hx + 0.7, 0.45, hz + 2.55, walls);
}

function dressYard(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  home: THREE.Group,
  hx: number,
  hz: number,
) {
  for (let i = 0; i < 6; i += 1) {
    solid(new THREE.BoxGeometry(0.42, 0.05, 0.42), "#cfc6b8", hx + 0.15, 0.04, hz + 3.3 + i * 0.55, home);
  }
  solid(new THREE.BoxGeometry(0.16, 0.9, 0.16), "#6b4630", hx + 3.4, 0.5, hz + 2.2, home);
  solid(new THREE.BoxGeometry(0.46, 0.28, 0.16), "#2ec8e6", hx + 3.55, 0.85, hz + 2.2, home);
  for (const spot of [
    { x: hx - 3.2, z: hz + 1.2, color: "#e25b4a" },
    { x: hx - 3.5, z: hz - 0.4, color: "#f2c14e" },
    { x: hx + 3.3, z: hz - 1.1, color: "#ff2bd6" },
    { x: hx + 2.4, z: hz + 3.1, color: "#ffffff" },
  ]) {
    solid(new THREE.SphereGeometry(0.28, 6, 5), "#2f7a3a", spot.x, 0.22, spot.z, home);
    solid(new THREE.SphereGeometry(0.1, 5, 4), spot.color, spot.x + 0.12, 0.42, spot.z, home);
  }
  for (let i = 0; i < 5; i += 1) {
    solid(new THREE.BoxGeometry(0.08, 0.55, 0.08), "#f4f6f8", -12.5 + i * 1.4, 0.32, 8.4, home);
    if (i < 4) solid(new THREE.BoxGeometry(1.4, 0.06, 0.05), "#f4f6f8", -11.8 + i * 1.4, 0.48, 8.4, home);
  }
  solid(new THREE.BoxGeometry(0.9, 0.35, 0.55), "#6b4630", hx - 4.2, 0.22, hz - 1.4, home);
}

function cityDetails(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  city: THREE.Group,
) {
  solid(new THREE.BoxGeometry(3.4, 0.08, 1.1), "#2ec8e6", STALL_AT.x, 2.15, STALL_AT.z + 1.7, city);
  solid(new THREE.BoxGeometry(1.4, 0.35, 0.08), "#f3f0e8", STALL_AT.x, 2.45, STALL_AT.z + 1.5, city);
  for (let i = 0; i < 5; i += 1) {
    solid(new THREE.BoxGeometry(0.7, 0.06, 1.6), "#f3f0e8", 26 + i * 1.1, 0.08, 5.3, city);
  }
  for (const bench of [
    { x: 17.2, z: 3.55 },
    { x: 26.5, z: 7.15 },
    { x: 34.2, z: 3.55 },
  ]) {
    solid(new THREE.BoxGeometry(1.1, 0.08, 0.34), "#8b5a32", bench.x, 0.38, bench.z, city);
    solid(new THREE.BoxGeometry(1.1, 0.28, 0.08), "#6b4630", bench.x, 0.55, bench.z - 0.14, city);
  }
  for (const pot of [15.2, 21.5, 30.4, 38.6]) {
    solid(new THREE.CylinderGeometry(0.22, 0.16, 0.28, 6), "#2a3138", pot, 0.2, 3.5, city);
    solid(new THREE.ConeGeometry(0.28, 0.45, 6), "#3f8d46", pot, 0.5, 3.5, city);
  }
  solid(new THREE.BoxGeometry(1.1, 0.35, 0.8), "#c5ccd4", 22.4, 12.15, -6.4, city);
  solid(new THREE.BoxGeometry(0.8, 0.4, 0.7), "#9aa6b2", 35.2, 14.2, -6.2, city);
}

function scenePeople(
  solid: (geo: THREE.BufferGeometry, color: number | string, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh,
  city: THREE.Group,
) {
  const people = [
    { x: 18.6, z: 3.6, shirt: "#ff8a3d" },
    { x: 23.4, z: 3.5, shirt: "#3f8d46" },
    { x: 31.2, z: 7.6, shirt: "#243a66" },
  ];
  for (const person of people) {
    const group = new THREE.Group();
    solid(new THREE.BoxGeometry(0.34, 0.5, 0.22), person.shirt, 0, 0.7, 0, group);
    solid(new THREE.SphereGeometry(0.15, 7, 5), "#f3d2b3", 0, 1.08, 0, group);
    group.position.set(person.x, 0, person.z);
    city.add(group);
  }
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
