import { AVATARS } from "@/data/catalog";

const RELAYS = ["wss://relay.primal.net", "wss://offchain.pub", "wss://nos.lol"];
const SECRET_KEY = "dw-chat-sk";
const LOCAL_KEY = "dw-sketch-local-v1";
const DRAW_TAG = "dwdraw";
const HEART_TAG = "dwheart";

export const PAPER = "#f4f0e6";
export const PEN_IDS = ["ink", "marker", "pencil", "highlighter", "spray", "neon", "erase"] as const;

export type StrokePen = (typeof PEN_IDS)[number];

export type SketchStroke = {
  c: string;
  w: number;
  pen: StrokePen;
  p: [number, number][];
};

export type SketchPost = {
  id: string;
  name: string;
  avatarId: string;
  title: string;
  at: number;
  author: string;
  strokes: SketchStroke[];
};

export type WallSnapshot = {
  posts: SketchPost[];
  hearts: Record<string, string[]>;
  me: string;
};

type LocalHeart = { id: string; on: boolean; at: number; shared: boolean };
type LocalFile = {
  posts: { post: SketchPost; shared: boolean }[];
  hearts: LocalHeart[];
};

type Tools = typeof import("nostr-tools/pure");
type Pool = import("nostr-tools/pool").SimplePool;

type RelayEvent = { pubkey: string; created_at: number; content: string };

let identity: { sk: Uint8Array; pk: string } | null = null;
let poolPromise: Promise<Pool> | null = null;
let me = "";
const posts = new Map<string, SketchPost>();
const heartState = new Map<string, { on: boolean; at: number }>();
const listeners = new Set<(wall: WallSnapshot) => void>();
let relayStarted = false;
let closer: { close: () => void } | null = null;

function heartKey(id: string, author: string) {
  return `${id}:${author}`;
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

function knownAvatar(id: string) {
  return AVATARS.some((avatar) => avatar.id === id) ? id : "";
}

function normalizeColor(value: unknown) {
  if (value === PAPER) return PAPER;
  const text = String(value ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(text) ? text : null;
}

function normalizeWidth(value: unknown) {
  const width = Math.round(Number(value));
  if (!Number.isFinite(width) || width < 2 || width > 80) return null;
  return width;
}

function normalizePen(value: unknown): StrokePen {
  return PEN_IDS.includes(value as StrokePen) ? (value as StrokePen) : "ink";
}

export function normalizeStrokes(value: unknown): SketchStroke[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 80) return null;
  const strokes: SketchStroke[] = [];
  let count = 0;
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const stroke = raw as { c?: unknown; w?: unknown; pen?: unknown; p?: unknown };
    const color = normalizeColor(stroke.c);
    const width = normalizeWidth(stroke.w);
    if (!color || width == null || !Array.isArray(stroke.p)) return null;
    const p: [number, number][] = [];
    for (const pt of stroke.p) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const x = Math.round(Number(pt[0]));
      const y = Math.round(Number(pt[1]));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      p.push([Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))]);
      count += 1;
      if (p.length >= 280 || count >= 1800) break;
    }
    if (p.length) strokes.push({ c: color, w: width, pen: normalizePen(stroke.pen), p });
    if (count >= 1800) break;
  }
  return strokes.length ? strokes : null;
}

async function tools(): Promise<Tools> {
  return import("nostr-tools/pure");
}

async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = import("nostr-tools/pool").then(({ SimplePool }) => new SimplePool());
  }
  return poolPromise;
}

async function ensureIdentity(): Promise<string> {
  if (typeof window === "undefined") return "";
  if (identity) return identity.pk;
  const { generateSecretKey, getPublicKey } = await tools();
  const { bytesToHex, hexToBytes } = await import("nostr-tools/utils");
  const saved = localStorage.getItem(SECRET_KEY);
  const valid = Boolean(saved && /^[0-9a-f]{64}$/i.test(saved));
  const sk = valid && saved ? hexToBytes(saved) : generateSecretKey();
  if (!valid) localStorage.setItem(SECRET_KEY, bytesToHex(sk));
  identity = { sk, pk: getPublicKey(sk) };
  return identity.pk;
}

function readLocal(): LocalFile {
  if (typeof window === "undefined") return { posts: [], hearts: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "") as LocalFile;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      hearts: Array.isArray(parsed.hearts) ? parsed.hearts : [],
    };
  } catch {
    return { posts: [], hearts: [] };
  }
}

function writeLocal(file: LocalFile) {
  if (typeof window === "undefined") return;
  const postsKept = file.posts.slice(-40);
  const heartsKept = file.hearts.slice(-200);
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ posts: postsKept, hearts: heartsKept }));
}

function snapshot(): WallSnapshot {
  const hearts: Record<string, string[]> = {};
  for (const [key, value] of heartState) {
    if (!value.on) continue;
    const split = key.indexOf(":");
    const id = key.slice(0, split);
    const author = key.slice(split + 1);
    const list = hearts[id] ?? [];
    list.push(author);
    hearts[id] = list;
  }
  const ranked = [...posts.values()].sort((a, b) => {
    const score = (hearts[b.id]?.length ?? 0) - (hearts[a.id]?.length ?? 0);
    if (score) return score;
    return b.at - a.at;
  });
  return { posts: ranked, hearts, me };
}

function emit() {
  const wall = snapshot();
  for (const listener of listeners) listener(wall);
}

function rememberPost(post: SketchPost, shared: boolean) {
  posts.set(post.id, post);
  const file = readLocal();
  const next = file.posts.filter((item) => item.post.id !== post.id);
  next.push({ post, shared });
  writeLocal({ ...file, posts: next });
}

function rememberHeart(id: string, on: boolean, at: number, shared: boolean) {
  if (!me) return;
  const key = heartKey(id, me);
  const previous = heartState.get(key);
  if (!previous || at >= previous.at) heartState.set(key, { on, at });
  const file = readLocal();
  const hearts = file.hearts.filter((item) => item.id !== id);
  hearts.push({ id, on, at, shared });
  writeLocal({ ...file, hearts });
}

function markPostShared(id: string) {
  const file = readLocal();
  writeLocal({
    ...file,
    posts: file.posts.map((item) => (item.post.id === id ? { ...item, shared: true } : item)),
  });
}

function markHeartShared(id: string) {
  const file = readLocal();
  writeLocal({
    ...file,
    hearts: file.hearts.map((item) => (item.id === id ? { ...item, shared: true } : item)),
  });
}

async function publish(tags: string[], content: string) {
  if (typeof window === "undefined" || !identity) return false;
  const { finalizeEvent } = await tools();
  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags.map((tag) => ["t", tag]),
      content,
    },
    identity.sk,
  );
  const pool = await getPool();
  const results = await Promise.all(
    pool.publish(RELAYS, event).map((attempt) =>
      Promise.race([
        attempt.then(() => true).catch(() => false),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
      ]),
    ),
  );
  return results.some(Boolean);
}

function parsePost(content: string, author: string, at: number): SketchPost | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "draw") return null;
    const id = clean(data.id, 24);
    if (!/^sk-[a-z0-9]{4,16}$/.test(id)) return null;
    const strokes = normalizeStrokes(data.strokes);
    if (!strokes) return null;
    const name = clean(data.name, 16) || "Guest";
    return {
      id,
      name,
      avatarId: knownAvatar(clean(data.avatarId, 24)),
      title: clean(data.title, 42),
      at,
      author,
      strokes,
    };
  } catch {
    return null;
  }
}

function parseHeart(content: string, author: string, at: number): { id: string; on: boolean; at: number; author: string } | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "heart") return null;
    const id = clean(data.id, 24);
    if (!/^sk-[a-z0-9]{4,16}$/.test(id)) return null;
    return { id, on: data.on !== false, at, author };
  } catch {
    return null;
  }
}

function ingest(event: RelayEvent) {
  let data: { t?: unknown };
  try {
    data = JSON.parse(event.content) as { t?: unknown };
  } catch {
    return;
  }
  if (data.t === "draw") {
    const post = parsePost(event.content, event.pubkey, event.created_at);
    if (!post) return;
    const existing = posts.get(post.id);
    if (!existing || post.at >= existing.at) posts.set(post.id, post);
    return;
  }
  if (data.t === "heart") {
    const heart = parseHeart(event.content, event.pubkey, event.created_at);
    if (!heart) return;
    const key = heartKey(heart.id, heart.author);
    const previous = heartState.get(key);
    if (!previous || heart.at >= previous.at) heartState.set(key, { on: heart.on, at: heart.at });
  }
}

async function publishPost(post: SketchPost) {
  const content = JSON.stringify({
    v: 1,
    t: "draw",
    id: post.id,
    name: post.name,
    avatarId: post.avatarId,
    title: post.title,
    strokes: post.strokes,
  });
  if (content.length > 60000) return false;
  const shared = await publish([DRAW_TAG], content);
  if (shared) markPostShared(post.id);
  return shared;
}

async function publishHeart(id: string, on: boolean) {
  const shared = await publish([HEART_TAG], JSON.stringify({ v: 1, t: "heart", id, on }));
  if (shared) markHeartShared(id);
  return shared;
}

function applyLocal(pk: string) {
  const file = readLocal();
  for (const item of file.posts) {
    const strokes = normalizeStrokes(item.post?.strokes);
    if (!strokes || !item.post?.id) continue;
    const post = { ...item.post, strokes, author: item.post.author || pk };
    if (!posts.has(post.id)) posts.set(post.id, post);
  }
  for (const heart of file.hearts) {
    if (!/^sk-[a-z0-9]{4,16}$/.test(heart.id)) continue;
    const key = heartKey(heart.id, pk);
    const previous = heartState.get(key);
    if (!previous || heart.at >= previous.at) heartState.set(key, { on: heart.on, at: heart.at });
  }
}

async function flushLocal() {
  const file = readLocal();
  for (const item of file.posts) {
    if (!item.shared && posts.has(item.post.id)) await publishPost(posts.get(item.post.id)!);
  }
  for (const heart of file.hearts) {
    if (!heart.shared) await publishHeart(heart.id, heart.on);
  }
}

async function loadRelay() {
  const pool = await getPool();
  const since = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 45;
  const [drawings, hearts] = await Promise.all([
    pool.querySync(RELAYS, { kinds: [1], "#t": [DRAW_TAG], since, limit: 80 }, { maxWait: 4500 }),
    pool.querySync(RELAYS, { kinds: [1], "#t": [HEART_TAG], since, limit: 250 }, { maxWait: 4500 }),
  ]);
  for (const event of [...drawings, ...hearts]) ingest(event);
  emit();
  if (closer) return;
  closer = pool.subscribe(
    RELAYS,
    { kinds: [1], "#t": [DRAW_TAG], since, limit: 80 },
    {
      onevent(event) {
        ingest(event);
        emit();
      },
    },
  );
  const heartsSub = pool.subscribe(
    RELAYS,
    { kinds: [1], "#t": [HEART_TAG], since, limit: 250 },
    {
      onevent(event) {
        ingest(event);
        emit();
      },
    },
  );
  const previous = closer;
  closer = {
    close() {
      previous.close();
      heartsSub.close();
    },
  };
}

function startRelay() {
  if (relayStarted || typeof window === "undefined") return;
  relayStarted = true;
  void (async () => {
    me = await ensureIdentity();
    applyLocal(me);
    emit();
    try {
      await loadRelay();
      await flushLocal();
    } catch {
      emit();
    }
  })();
}

export function watchWall(onChange: (wall: WallSnapshot) => void) {
  if (typeof window === "undefined") return () => {};
  listeners.add(onChange);
  onChange(snapshot());
  startRelay();
  return () => {
    listeners.delete(onChange);
  };
}

export async function postSketch(input: {
  name: string;
  avatarId: string;
  title: string;
  strokes: SketchStroke[];
}): Promise<{ ok: true; shared: boolean } | { ok: false; reason: string }> {
  const strokes = normalizeStrokes(input.strokes);
  if (!strokes) return { ok: false, reason: "Draw something first." };
  const pk = await ensureIdentity();
  if (!pk) return { ok: false, reason: "Couldn't open the wall." };
  me = pk;
  const post: SketchPost = {
    id: `sk-${Math.random().toString(36).slice(2, 10)}`,
    name: clean(input.name, 16) || "Guest",
    avatarId: knownAvatar(input.avatarId),
    title: clean(input.title, 42),
    at: Math.floor(Date.now() / 1000),
    author: pk,
    strokes,
  };
  rememberPost(post, false);
  emit();
  const shared = await publishPost(post);
  return { ok: true, shared };
}

export async function toggleHeart(id: string, on: boolean) {
  const pk = await ensureIdentity();
  if (!pk || !/^sk-[a-z0-9]{4,16}$/.test(id)) return false;
  me = pk;
  const at = Math.floor(Date.now() / 1000);
  rememberHeart(id, on, at, false);
  emit();
  return publishHeart(id, on);
}
