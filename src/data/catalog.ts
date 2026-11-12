export type ThemeId = "black" | "white" | "fantasy" | "doodle" | "cyber";

export type AvatarGroup = "base" | "paintball" | "life" | "sketch";

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
  | "mech"
  | "mask"
  | "splatter"
  | "hopper"
  | "barrel"
  | "visor"
  | "bandana"
  | "pod"
  | "striker"
  | "goggle"
  | "camo"
  | "drip"
  | "jersey"
  | "cook"
  | "student"
  | "nurse"
  | "driver"
  | "builder"
  | "farmer"
  | "clerk"
  | "baker"
  | "mail"
  | "coach"
  | "medic"
  | "neighbor"
  | "pencil"
  | "brush"
  | "inkpot"
  | "eraser"
  | "palette"
  | "marker"
  | "spraycan"
  | "ruler"
  | "notebook"
  | "crayon"
  | "nib"
  | "easel";

export type AvatarDef = {
  id: string;
  name: string;
  code: string;
  blurb: string;
  kind: AvatarKind;
  group: AvatarGroup;
  bg: string;
  accent: string;
  dark: string;
  light: string;
};

const BASE_AVATARS: Omit<AvatarDef, "group">[] = [
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

const GAME_AVATARS: AvatarDef[] = [
  { id: "mask", name: "Shade", code: "MASK-1001", blurb: "Paintball mask", kind: "mask", group: "paintball", bg: "#10141c", accent: "#2ee6ff", dark: "#1c2430", light: "#e8fbff" },
  { id: "splatter", name: "Burst", code: "SPLAT-1002", blurb: "Paint burst", kind: "splatter", group: "paintball", bg: "#1a1020", accent: "#ff2bd6", dark: "#3a1840", light: "#ffe4f6" },
  { id: "hopper", name: "Loader", code: "HOPP-1003", blurb: "Hopper on a lid", kind: "hopper", group: "paintball", bg: "#14180e", accent: "#b6ff3c", dark: "#2a3318", light: "#f4ffd4" },
  { id: "barrel", name: "Range", code: "BARL-1004", blurb: "Marker barrel", kind: "barrel", group: "paintball", bg: "#1c140e", accent: "#ff7a3c", dark: "#3a2418", light: "#ffe7d2" },
  { id: "visor", name: "Tint", code: "VISR-1005", blurb: "Tinted visor", kind: "visor", group: "paintball", bg: "#101820", accent: "#9b8cff", dark: "#241c38", light: "#eee8ff" },
  { id: "bandana", name: "Wrap", code: "BAND-1006", blurb: "Paint bandana", kind: "bandana", group: "paintball", bg: "#201014", accent: "#ff4d4d", dark: "#3a1820", light: "#ffe4e4" },
  { id: "pod", name: "Tube", code: "POD-1007", blurb: "Paint pod", kind: "pod", group: "paintball", bg: "#102018", accent: "#3dba74", dark: "#143828", light: "#e4ffe8" },
  { id: "striker", name: "Kick", code: "STRK-1008", blurb: "Striped lid", kind: "striker", group: "paintball", bg: "#20180e", accent: "#ffc857", dark: "#3a3018", light: "#fff3d4" },
  { id: "goggle", name: "Glass", code: "GOGG-1009", blurb: "Round goggles", kind: "goggle", group: "paintball", bg: "#10141a", accent: "#f4f0e6", dark: "#2a3038", light: "#ffffff" },
  { id: "camo", name: "Patch", code: "CAMO-1010", blurb: "Block camo", kind: "camo", group: "paintball", bg: "#161c12", accent: "#8d9a86", dark: "#2c3824", light: "#e4ecdf" },
  { id: "drip", name: "Drop", code: "DRIP-1011", blurb: "Paint drip", kind: "drip", group: "paintball", bg: "#140e18", accent: "#ff2bd6", dark: "#2ee6ff", light: "#f4f0e6" },
  { id: "jersey", name: "Home", code: "JERS-1012", blurb: "Yard jersey", kind: "jersey", group: "paintball", bg: "#101820", accent: "#2ee6ff", dark: "#182838", light: "#e8fbff" },
  { id: "cook", name: "Ladle", code: "COOK-2001", blurb: "Kitchen hat", kind: "cook", group: "life", bg: "#241c14", accent: "#f4f0e6", dark: "#6e5a40", light: "#fff6e4" },
  { id: "student", name: "Page", code: "STUD-2002", blurb: "Square cap", kind: "student", group: "life", bg: "#14141c", accent: "#9b8cff", dark: "#2a2440", light: "#eee8ff" },
  { id: "nurse", name: "Cross", code: "NURS-2003", blurb: "Clinic cap", kind: "nurse", group: "life", bg: "#141820", accent: "#ff4d4d", dark: "#f4f0e6", light: "#ffffff" },
  { id: "driver", name: "Wheel", code: "DRIV-2004", blurb: "Road cap", kind: "driver", group: "life", bg: "#1c1814", accent: "#ffc857", dark: "#3a3018", light: "#fff3d4" },
  { id: "builder", name: "Beam", code: "BUIL-2005", blurb: "Hard hat", kind: "builder", group: "life", bg: "#1c160e", accent: "#ffc857", dark: "#3a2a14", light: "#fff1c8" },
  { id: "farmer", name: "Row", code: "FARM-2006", blurb: "Wide brim", kind: "farmer", group: "life", bg: "#1a2010", accent: "#b6ff3c", dark: "#3a4218", light: "#f4ffd4" },
  { id: "clerk", name: "Stamp", code: "CLRK-2007", blurb: "Desk collar", kind: "clerk", group: "life", bg: "#16141c", accent: "#2ee6ff", dark: "#2a2838", light: "#f4f0e6" },
  { id: "baker", name: "Crumb", code: "BAKE-2008", blurb: "Puffy hat", kind: "baker", group: "life", bg: "#241810", accent: "#ffd0a8", dark: "#c47b72", light: "#fff7f2" },
  { id: "mail", name: "Parcel", code: "MAIL-2009", blurb: "Mail cap", kind: "mail", group: "life", bg: "#141820", accent: "#3dba74", dark: "#1a3038", light: "#e8fbff" },
  { id: "coach", name: "Bench", code: "COAC-2010", blurb: "Whistle cap", kind: "coach", group: "life", bg: "#1c1418", accent: "#ff4d4d", dark: "#2a1820", light: "#ffe4e4" },
  { id: "medic", name: "Aid", code: "MEDI-2011", blurb: "Kit bag", kind: "medic", group: "life", bg: "#141c18", accent: "#f4f0e6", dark: "#ff4d4d", light: "#ffffff" },
  { id: "neighbor", name: "Stoop", code: "NEIG-2012", blurb: "Porch sweater", kind: "neighbor", group: "life", bg: "#1c1820", accent: "#c4a574", dark: "#3a3040", light: "#fff6e6" },
  { id: "pencil", name: "Lead", code: "PENC-3001", blurb: "Pencil", kind: "pencil", group: "sketch", bg: "#20180e", accent: "#ffc857", dark: "#3a3014", light: "#fff6d8" },
  { id: "brush", name: "Bristle", code: "BRSH-3002", blurb: "Paint brush", kind: "brush", group: "sketch", bg: "#1a1410", accent: "#ff7a3c", dark: "#6e5a40", light: "#fff0e0" },
  { id: "inkpot", name: "Well", code: "INK-3003", blurb: "Ink bottle", kind: "inkpot", group: "sketch", bg: "#101014", accent: "#2ee6ff", dark: "#14141c", light: "#e8fbff" },
  { id: "eraser", name: "Smudge", code: "ERAS-3004", blurb: "Block eraser", kind: "eraser", group: "sketch", bg: "#201418", accent: "#ffb0c0", dark: "#3a242c", light: "#fff0f3" },
  { id: "palette", name: "Mix", code: "PALT-3005", blurb: "Color palette", kind: "palette", group: "sketch", bg: "#14141a", accent: "#f4f0e6", dark: "#2a2830", light: "#ffffff" },
  { id: "marker", name: "Chisel", code: "MARK-3006", blurb: "Chisel marker", kind: "marker", group: "sketch", bg: "#180e18", accent: "#ff2bd6", dark: "#2a1428", light: "#ffe4f6" },
  { id: "spraycan", name: "Can", code: "SPRY-3007", blurb: "Spray can", kind: "spraycan", group: "sketch", bg: "#10141c", accent: "#b6ff3c", dark: "#1c2430", light: "#f4ffd4" },
  { id: "ruler", name: "Tick", code: "RULE-3008", blurb: "Straight ruler", kind: "ruler", group: "sketch", bg: "#161614", accent: "#f4f0e6", dark: "#3a3a34", light: "#ffffff" },
  { id: "notebook", name: "Folio", code: "NOTE-3009", blurb: "Open notebook", kind: "notebook", group: "sketch", bg: "#1c1612", accent: "#f4f0e6", dark: "#2ee6ff", light: "#fff6e4" },
  { id: "crayon", name: "Wax", code: "CRAY-3010", blurb: "Short crayon", kind: "crayon", group: "sketch", bg: "#201410", accent: "#ff4d4d", dark: "#3a1814", light: "#ffe4e4" },
  { id: "nib", name: "Point", code: "NIB-3011", blurb: "Pen nib", kind: "nib", group: "sketch", bg: "#121216", accent: "#c5ced6", dark: "#2a2a32", light: "#f4f7f8" },
  { id: "easel", name: "Frame", code: "EASE-3012", blurb: "Small easel", kind: "easel", group: "sketch", bg: "#16120e", accent: "#ffc857", dark: "#3a3020", light: "#fff6e4" },
];

export const AVATARS: AvatarDef[] = [
  ...BASE_AVATARS.map((avatar) => ({ ...avatar, group: "base" as const })),
  ...GAME_AVATARS,
];

export const AVATAR_GROUPS: { id: AvatarGroup; label: string }[] = [
  { id: "base", label: "Base" },
  { id: "paintball", label: "Paintball" },
  { id: "life", label: "Life Sim" },
  { id: "sketch", label: "Sketch" },
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
  { id: "black", hex: "#111111" },
] as const;

export type WeaponId = "marker" | "splatter" | "needle" | "hopper" | "longarm" | "spray" | "ricochet";

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
  {
    id: "ricochet",
    name: "Ricochet",
    cost: 75,
    rof: 2.2,
    speed: 700,
    spread: 0.04,
    gravity: 280,
    body: 1,
    head: 2,
    radius: 5,
    burst: 1,
    gap: 0,
    blurb: "Bounces off one wall.",
    strength: "Bank shots around corners",
    weakness: "Medium everything, one bounce only",
  },
];

export type Loadout = string[];

export type Dyes = Record<string, string>;

export const EMPTY_LOADOUT: Loadout = [];

const SKIN_ALIAS: Record<string, string> = { gasmask: "gas", camo: "swat" };

export function wornList(value: unknown): string[] {
  const ids = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];
  const keep = new Set(SKINS.map((skin) => skin.id));
  return [...new Set(ids.filter((id): id is string => typeof id === "string").map((id) => SKIN_ALIAS[id] ?? id))].filter((id) =>
    keep.has(id as (typeof SKINS)[number]["id"]),
  );
}

export const SKINS = [
  { id: "bandana", name: "Bandana", cost: 30 },
  { id: "hoodie", name: "Hoodie", cost: 55 },
  { id: "beanie", name: "Beanie", cost: 40 },
  { id: "mohawk", name: "Mohawk", cost: 50 },
  { id: "visor", name: "Visor", cost: 65 },
  { id: "cape", name: "Cape", cost: 80 },
  { id: "gas", name: "Gas Mask", cost: 90 },
  { id: "swat", name: "Camo", cost: 140 },
] as const;

export const SKIN_HEX: Record<string, string> = {
  bandana: "#ff3d6e",
  hoodie: "#12c7a8",
  beanie: "#ff8a3d",
  mohawk: "#f2c14e",
  visor: "#22252e",
  cape: "#9b6bff",
  gas: "#22252e",
  swat: "#7ed957",
};

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

export function skinById(id: string | null) {
  return SKINS.find((skin) => skin.id === id);
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
