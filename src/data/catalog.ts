export type ThemeId = "black" | "white" | "fantasy" | "doodle" | "cyber";

export type AvatarKind =
  | "dragon"
  | "robot"
  | "knight"
  | "wizard"
  | "wolf"
  | "phoenix"
  | "astro"
  | "ninja"
  | "pirate"
  | "alien"
  | "samurai"
  | "fox"
  | "golem"
  | "cat"
  | "skull"
  | "cyborg"
  | "shroom"
  | "shark"
  | "owl"
  | "mech";

export type AvatarDef = {
  id: string;
  name: string;
  code: string;
  blurb: string;
  kind: AvatarKind;
  bg: string;
  accent: string;
  dark: string;
  light: string;
};

export const AVATARS: AvatarDef[] = [
  { id: "dragon", name: "Ember", code: "DRAKE-1840", blurb: "Low-poly dragon", kind: "dragon", bg: "#12352a", accent: "#3dba74", dark: "#145c38", light: "#d8ffe8" },
  { id: "robot", name: "Unit 9", code: "ROBO-4401", blurb: "Futuristic robot", kind: "robot", bg: "#10202e", accent: "#2ee6ff", dark: "#1a3a4a", light: "#e8fbff" },
  { id: "knight", name: "Sir Pixel", code: "KEEP-2208", blurb: "Low-poly knight", kind: "knight", bg: "#2a241c", accent: "#d7c4a3", dark: "#6e5a40", light: "#fff6e4" },
  { id: "wizard", name: "Vellum", code: "RUNE-7730", blurb: "Faceted wizard", kind: "wizard", bg: "#241433", accent: "#b388ff", dark: "#4c2d73", light: "#f3e8ff" },
  { id: "wolf", name: "Ash", code: "HOWL-1194", blurb: "Low-poly wolf", kind: "wolf", bg: "#1c2228", accent: "#c5ced6", dark: "#5d6a74", light: "#f4f7f8" },
  { id: "phoenix", name: "Cinder", code: "FIRE-9021", blurb: "Low-poly phoenix", kind: "phoenix", bg: "#3a160f", accent: "#ff7a3c", dark: "#c2410c", light: "#ffe7c2" },
  { id: "astro", name: "Orbiter", code: "VOID-3055", blurb: "Low-poly astronaut", kind: "astro", bg: "#141820", accent: "#f4f0e6", dark: "#3a4254", light: "#ffffff" },
  { id: "ninja", name: "Null", code: "NULL-2201", blurb: "Low-poly ninja", kind: "ninja", bg: "#121216", accent: "#ff2bd6", dark: "#2a2a32", light: "#f4f0e6" },
  { id: "pirate", name: "Brine", code: "SAIL-6612", blurb: "Low-poly pirate", kind: "pirate", bg: "#1b2430", accent: "#e0b15a", dark: "#6b3d1e", light: "#fff1d2" },
  { id: "alien", name: "Zed", code: "UFO-8080", blurb: "Low-poly alien", kind: "alien", bg: "#10261c", accent: "#7dffb2", dark: "#14734a", light: "#eafff3" },
  { id: "samurai", name: "Kite", code: "BLADE-4510", blurb: "Low-poly samurai", kind: "samurai", bg: "#2a1216", accent: "#ff4d4d", dark: "#4a1c22", light: "#ffe4e4" },
  { id: "fox", name: "Kit", code: "FOX-2744", blurb: "Low-poly fox", kind: "fox", bg: "#2e1a10", accent: "#ff8a3d", dark: "#a34716", light: "#fff0e0" },
  { id: "golem", name: "Pebble", code: "ROCK-1008", blurb: "Low-poly golem", kind: "golem", bg: "#1e2420", accent: "#8d9a86", dark: "#4d574c", light: "#e4ecdf" },
  { id: "cat", name: "Miso", code: "MEOW-5150", blurb: "Low-poly cat", kind: "cat", bg: "#241820", accent: "#ffd0a8", dark: "#c47b72", light: "#fff7f2" },
  { id: "skull", name: "Marrow", code: "BONE-0007", blurb: "Low-poly skeleton", kind: "skull", bg: "#1a1a1e", accent: "#f4f0e6", dark: "#6a6a72", light: "#ffffff" },
  { id: "cyborg", name: "Half", code: "WIRE-6363", blurb: "Low-poly cyborg", kind: "cyborg", bg: "#101820", accent: "#2ee6ff", dark: "#243038", light: "#f4f0e6" },
  { id: "shroom", name: "Cap", code: "SPORE-4242", blurb: "Low-poly mushroom", kind: "shroom", bg: "#1c1418", accent: "#ff4d5a", dark: "#f4f0e6", light: "#fff" },
  { id: "shark", name: "Fin", code: "BITE-1919", blurb: "Low-poly shark", kind: "shark", bg: "#0e2430", accent: "#5ec8e6", dark: "#1d4e63", light: "#e7f8ff" },
  { id: "owl", name: "Quill", code: "HOOT-3737", blurb: "Low-poly owl", kind: "owl", bg: "#241c12", accent: "#c4a574", dark: "#5c4630", light: "#fff6e6" },
  { id: "mech", name: "Bulk", code: "MECH-9090", blurb: "Low-poly mech pilot", kind: "mech", bg: "#1a1c12", accent: "#d6de4a", dark: "#3d4218", light: "#f7ffc4" },
];

export const THEMES: { id: ThemeId; name: string; blurb: string }[] = [
  { id: "black", name: "Simple black", blurb: "Ink bubbles, quiet room." },
  { id: "white", name: "Simple white", blurb: "Paper and soft gray." },
  { id: "fantasy", name: "Fantasy pixel", blurb: "Castle, dragon, parchment bubbles." },
  { id: "doodle", name: "Doodly stickfigures", blurb: "Ink people on cream paper." },
  { id: "cyber", name: "Futuristic cyberpunk", blurb: "Neon city, outlined bubbles." },
];

export const GIFS: { id: string; label: string }[] = [
  { id: "splat", label: "Splat" },
  { id: "dragon", label: "Dragon" },
  { id: "wave", label: "Wave" },
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
  { id: "skull", label: "Skull" },
  { id: "robot", label: "Robot" },
  { id: "glitch", label: "Glitch" },
];

export const PAINTS = [
  { id: "cyan", hex: "#2ee6ff" },
  { id: "mag", hex: "#ff2bd6" },
  { id: "lime", hex: "#b6ff3c" },
  { id: "sun", hex: "#ffc857" },
  { id: "orange", hex: "#ff7a3c" },
  { id: "violet", hex: "#9b8cff" },
  { id: "white", hex: "#f4f0e6" },
  { id: "red", hex: "#ff4d4d" },
] as const;

export type WeaponId = "marker" | "splatter" | "needle" | "hopper" | "longarm" | "spray";

export type WeaponDef = {
  id: WeaponId;
  name: string;
  cost: number;
  rof: number;
  speed: number;
  spread: number;
  gravity: number;
  body: number;
  head: number;
  radius: number;
  burst: number;
  gap: number;
  blurb: string;
  strength: string;
  weakness: string;
};

export const WEAPONS: WeaponDef[] = [
  {
    id: "marker",
    name: "Standard Marker",
    cost: 0,
    rof: 3.4,
    speed: 780,
    spread: 0.045,
    gravity: 420,
    body: 1,
    head: 2,
    radius: 5,
    burst: 1,
    gap: 0,
    blurb: "The yard gun. Two to the body, one to the head.",
    strength: "Balanced speed and trigger",
    weakness: "No trick shots",
  },
  {
    id: "splatter",
    name: "Splatter Rifle",
    cost: 40,
    rof: 2.1,
    speed: 1040,
    spread: 0.012,
    gravity: 140,
    body: 1,
    head: 2,
    radius: 4.5,
    burst: 1,
    gap: 0,
    blurb: "Flat, fast paint. Makes the long lane honest.",
    strength: "Tight and fast",
    weakness: "Slow trigger if they rush",
  },
  {
    id: "needle",
    name: "Burst Needle",
    cost: 35,
    rof: 1.15,
    speed: 820,
    spread: 0.07,
    gravity: 260,
    body: 1,
    head: 2,
    radius: 3.5,
    burst: 3,
    gap: 0.07,
    blurb: "Three needles, then a breath. Land the group.",
    strength: "Burst melts close targets",
    weakness: "Long recovery, wider spread",
  },
  {
    id: "hopper",
    name: "Heavy Hopper",
    cost: 80,
    rof: 0.85,
    speed: 520,
    spread: 0.02,
    gravity: 980,
    body: 2,
    head: 2,
    radius: 8,
    burst: 1,
    gap: 0,
    blurb: "A fat ball. Body shots drop them. Easy to step around.",
    strength: "One body shot eliminates",
    weakness: "Slow arc, short effective range",
  },
  {
    id: "longarm",
    name: "Longarm",
    cost: 90,
    rof: 0.7,
    speed: 1500,
    spread: 0.004,
    gravity: 30,
    body: 1,
    head: 2,
    radius: 4,
    burst: 1,
    gap: 0,
    blurb: "Almost a laser. Headshots feel unfair. Misses feel worse.",
    strength: "Pinpoint, headshot range",
    weakness: "Very slow rate of fire",
  },
  {
    id: "spray",
    name: "Spray Can",
    cost: 25,
    rof: 8,
    speed: 560,
    spread: 0.18,
    gravity: 520,
    body: 1,
    head: 2,
    radius: 4,
    burst: 1,
    gap: 0,
    blurb: "Hose the platform. Most of it misses. Some of it doesn't.",
    strength: "Ridiculous fire rate",
    weakness: "Wild spread, slow balls",
  },
];

export type SkinId =
  | "shirt"
  | "bandana"
  | "beanie"
  | "hoodie"
  | "mohawk"
  | "visor"
  | "cape"
  | "gasmask"
  | "camo";

export type SkinDef = {
  id: SkinId;
  name: string;
  cost: number;
  blurb: string;
};

export const SKINS: SkinDef[] = [
  { id: "shirt", name: "Shirt", cost: 20, blurb: "A plain tee in your paint." },
  { id: "bandana", name: "Bandana", cost: 30, blurb: "A paint cloth across the mouth." },
  { id: "beanie", name: "Beanie", cost: 40, blurb: "A knit cap pulled over the head." },
  { id: "hoodie", name: "Hoodie", cost: 55, blurb: "The rectangle is the hoodie." },
  { id: "mohawk", name: "Mohawk", cost: 50, blurb: "A tall stripe of hair." },
  { id: "visor", name: "Visor", cost: 65, blurb: "A dark band across the eyes." },
  { id: "cape", name: "Cape", cost: 80, blurb: "A short cape behind the stick." },
  { id: "gasmask", name: "Gas Mask", cost: 90, blurb: "A welded hood and suit. No shirt showing." },
  { id: "camo", name: "Camo", cost: 140, blurb: "Woodland helmet, ear flaps, camo body." },
];

export const MODES = [
  {
    id: "tdm",
    name: "Team Deathmatch",
    blurb: "Two teams spawn on opposite sides. Most kills when the clock ends.",
    seconds: 90,
  },
  {
    id: "dm",
    name: "Solo Deathmatch",
    blurb: "Separate spawns. Ninety seconds. Most kills wins.",
    seconds: 90,
  },
  {
    id: "crystal",
    name: "Crystal Defence",
    blurb: "Each side has a crystal. Break theirs first.",
    seconds: 120,
  },
  {
    id: "lms",
    name: "Last Man Standing",
    blurb: "One death and you are out. Last stick alive wins.",
    seconds: 0,
  },
  {
    id: "koth",
    name: "King of the Hill",
    blurb: "A point every second in the yellow zone. Most points wins.",
    seconds: 90,
  },
] as const;

export type ModeId = (typeof MODES)[number]["id"];

export function weaponById(id: string): WeaponDef {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0]!;
}

export function skinById(id: string | null): SkinDef | undefined {
  return SKINS.find((s) => s.id === id);
}

export function avatarById(id: string): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}

export function paintHex(id: string): string {
  return PAINTS.find((p) => p.id === id)?.hex ?? PAINTS[0].hex;
}

export const REPLIES = [
  "splatter on the high wood, watch your head",
  "party up? crystal side is open",
  "two to the body. stop missing the stick",
  "that yellow zone is a trap and I love it",
  "bring the hopper if you want to be rude",
  "invite me, I already have the bandana",
  "ninety seconds is long enough to regret a peek",
  "the dragon says hi. also, left spawn is cursed",
  "gas mask does not stop paint. I checked",
  "public yard is live if your code bounces",
];
