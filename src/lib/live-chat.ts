import { AVATARS, GIFS, type ThemeId } from "@/data/catalog";
import type { ChatMessage, Room } from "@/lib/store";

const RELAYS = ["wss://relay.primal.net", "wss://offchain.pub", "wss://nos.lol"];
const SECRET_KEY = "dw-chat-sk";
const TOMB_KEY = "dw-chat-drops";

type Tools = typeof import("nostr-tools/pure");
type Pool = import("nostr-tools/pool").SimplePool;

let identity: { sk: Uint8Array; pk: string } | null = null;
let poolPromise: Promise<Pool> | null = null;

function roomTag(roomId: string) {
  return `dw1-${roomId}`;
}

function codeTag(code: string) {
  return `dwcode-${code.trim().toUpperCase()}`;
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

export async function ensureIdentity(): Promise<string> {
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

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

function knownAvatar(id: string) {
  return AVATARS.some((avatar) => avatar.id === id) ? id : AVATARS[0]!.id;
}

function knownGif(id: unknown) {
  const value = clean(id, 24);
  return GIFS.some((gif) => gif.id === value) ? value : undefined;
}

const themes = new Set<ThemeId>(["black", "white", "fantasy", "doodle", "cyber"]);

function tombs(): { id: string; author: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(TOMB_KEY) || "[]") as { id: string; author: string }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bury(id: string, author: string) {
  if (typeof window === "undefined") return;
  const next = [...tombs().filter((item) => item.id !== id), { id, author }].slice(-400);
  localStorage.setItem(TOMB_KEY, JSON.stringify(next));
}

function isBuried(id: string, author: string) {
  return tombs().some((item) => item.id === id && item.author === author);
}

async function publish(tags: string[], content: string) {
  if (typeof window === "undefined") return false;
  const { finalizeEvent } = await tools();
  const pk = await ensureIdentity();
  if (!pk || !identity) return false;
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
    pool.publish(RELAYS, event).map((attempt) => attempt.then(() => true).catch(() => false)),
  );
  return results.some(Boolean);
}

export function publishMessage(message: ChatMessage) {
  return publish([roomTag(message.roomId)], JSON.stringify({
    v: 1,
    t: "m",
    id: message.id,
    roomId: message.roomId,
    name: message.fromName,
    avatarId: message.avatarId,
    body: message.body,
    gif: message.gif,
  }));
}

export function publishDrop(message: ChatMessage) {
  bury(message.id, message.fromId);
  return publish([roomTag(message.roomId)], JSON.stringify({
    v: 1,
    t: "x",
    id: message.id,
    roomId: message.roomId,
  }));
}

export function publishRoom(room: Room) {
  return publish(["dwroom", codeTag(room.inviteCode)], JSON.stringify({
    v: 1,
    t: "room",
    id: room.id,
    title: room.title,
    visibility: room.visibility,
    theme: room.theme,
    inviteCode: room.inviteCode,
  }));
}

export async function findSharedRoom(code: string): Promise<Room | null> {
  if (typeof window === "undefined") return null;
  const pool = await getPool();
  const events = await pool.querySync(
    RELAYS,
    { kinds: [1], "#t": [codeTag(code)], limit: 8 },
    { maxWait: 4000 },
  );
  const newest = [...events].sort((a, b) => b.created_at - a.created_at);
  for (const event of newest) {
    const room = parseRoom(event.content);
    if (room && room.inviteCode.toUpperCase() === code.trim().toUpperCase()) return room;
  }
  return null;
}

function parseRoom(content: string): Room | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "room") return null;
    const id = clean(data.id, 40);
    const title = clean(data.title, 40);
    const inviteCode = clean(data.inviteCode, 12).toUpperCase();
    const theme = themes.has(data.theme as ThemeId) ? (data.theme as ThemeId) : "black";
    const visibility = data.visibility === "public" ? "public" : "private";
    if (!/^[a-z0-9-]{2,40}$/.test(id) || !/^[A-Z0-9-]{2,12}$/.test(inviteCode) || !title) return null;
    return { id, title, visibility, theme, inviteCode, memberIds: [] };
  } catch {
    return null;
  }
}

function parseMessage(content: string, author: string, at: number): ChatMessage | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "m") return null;
    const id = clean(data.id, 40);
    const roomId = clean(data.roomId, 40);
    const body = clean(data.body, 400);
    const gif = knownGif(data.gif);
    const fromName = clean(data.name, 16) || "Guest";
    if (!/^[a-z0-9-]{2,40}$/.test(id) || !/^[a-z0-9-]{2,40}$/.test(roomId)) return null;
    if (!body && !gif) return null;
    if (isBuried(id, author)) return null;
    return {
      id,
      roomId,
      fromId: author,
      fromName,
      avatarId: knownAvatar(clean(data.avatarId, 24)),
      body,
      gif,
      at,
    };
  } catch {
    return null;
  }
}

export function subscribeRoom(
  roomId: string,
  onMessage: (message: ChatMessage) => void,
  onDrop: (id: string, author: string) => void,
) {
  if (typeof window === "undefined") return () => {};
  let closed = false;
  let closer: { close: () => void } | null = null;
  void (async () => {
    const pool = await getPool();
    if (closed) return;
    closer = pool.subscribe(
      RELAYS,
      {
        kinds: [1],
        "#t": [roomTag(roomId)],
        since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 14,
        limit: 80,
      },
      {
        onevent(event) {
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(event.content) as Record<string, unknown>;
          } catch {
            return;
          }
          if (data.t === "x" && clean(data.roomId, 40) === roomId) {
            const id = clean(data.id, 40);
            bury(id, event.pubkey);
            onDrop(id, event.pubkey);
            return;
          }
          const message = parseMessage(event.content, event.pubkey, event.created_at * 1000);
          if (message && message.roomId === roomId) onMessage(message);
        },
      },
    );
  })();
  return () => {
    closed = true;
    closer?.close();
  };
}

function idKey(id: string) {
  return id.trim().toLowerCase();
}

function idTag(id: string) {
  return `dwid-${idKey(id)}`;
}

export type ClaimedId = { digitalId: string; name: string; avatarId: string; pubkey: string };

function parseId(content: string): { digitalId: string; name: string; avatarId: string } | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "id") return null;
    const digitalId = clean(data.id, 16);
    if (!/^[a-z0-9_]{2,16}$/i.test(digitalId)) return null;
    const name = clean(data.name, 16) || digitalId;
    return { digitalId, name, avatarId: knownAvatar(clean(data.avatarId, 24)) };
  } catch {
    return null;
  }
}

async function idEvents(id: string) {
  const pool = await getPool();
  return pool.querySync(RELAYS, { kinds: [1], "#t": [idTag(id)], limit: 20 }, { maxWait: 4000 });
}

function earliestId(events: { pubkey: string; created_at: number; content: string }[], key: string) {
  return [...events]
    .filter((event) => {
      const parsed = parseId(event.content);
      return parsed && idKey(parsed.digitalId) === key;
    })
    .sort((a, b) => a.created_at - b.created_at)[0];
}

export async function claimDigitalId(
  digitalId: string,
  name: string,
  avatarId: string,
): Promise<{ ok: true } | { ok: false; offline?: boolean; reason: string }> {
  const key = idKey(digitalId);
  if (!/^[a-z0-9_]{2,16}$/.test(key)) return { ok: false, reason: "Use 2 to 16 letters, numbers, or underscores." };
  if (typeof window === "undefined") return { ok: false, offline: true, reason: "Couldn't check that ID. Try again." };
  try {
    const me = await ensureIdentity();
    if (!me) return { ok: false, offline: true, reason: "Couldn't check that ID. Try again." };
    const events = await idEvents(digitalId);
    const taken = earliestId(events, key);
    if (taken && taken.pubkey !== me) return { ok: false, reason: "That DigitalWorld ID is taken." };
    const posted = await publish(
      [idTag(digitalId)],
      JSON.stringify({ v: 1, t: "id", id: digitalId.trim(), name: name.trim(), avatarId }),
    );
    if (!posted) return { ok: false, offline: true, reason: "Couldn't check that ID. Try again." };
    const owner = earliestId(await idEvents(digitalId), key);
    if (owner && owner.pubkey !== me) return { ok: false, reason: "That DigitalWorld ID is taken." };
    return { ok: true };
  } catch {
    return { ok: false, offline: true, reason: "Couldn't check that ID. Try again." };
  }
}

export async function findClaimedId(digitalId: string): Promise<ClaimedId | null> {
  const key = idKey(digitalId);
  if (!/^[a-z0-9_]{2,16}$/.test(key) || typeof window === "undefined") return null;
  const owner = earliestId(await idEvents(digitalId), key);
  if (!owner) return null;
  const parsed = parseId(owner.content);
  if (!parsed) return null;
  return { digitalId: parsed.digitalId, name: parsed.name, avatarId: parsed.avatarId, pubkey: owner.pubkey };
}

function loginTag(id: string) {
  return `dwpass-${idKey(id)}`;
}

function tight(bytes: Uint8Array) {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}

function b64encode(bytes: Uint8Array) {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}

function b64decode(value: string) {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function passwordKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: tight(salt), iterations: 100000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function loginEvents(id: string) {
  const pool = await getPool();
  return pool.querySync(RELAYS, { kinds: [1], "#t": [loginTag(id)], limit: 12 }, { maxWait: 4000 });
}

function parseLogin(content: string) {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.t !== "login") return null;
    const salt = b64decode(String(data.salt ?? ""));
    const iv = b64decode(String(data.iv ?? ""));
    const box = b64decode(String(data.box ?? ""));
    if (salt.length < 8 || iv.length < 8 || box.length < 16) return null;
    return { salt, iv, box };
  } catch {
    return null;
  }
}

export async function savePassword(
  digitalId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (password.length < 4) return { ok: false, reason: "Use at least 4 characters." };
  const me = await ensureIdentity();
  if (!me || !identity) return { ok: false, reason: "Couldn't save that password. Try again." };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await passwordKey(password, salt);
  const box = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: tight(iv) }, key, tight(identity.sk)));
  const posted = await publish(
    [loginTag(digitalId)],
    JSON.stringify({
      v: 1,
      t: "login",
      id: digitalId.trim(),
      salt: b64encode(salt),
      iv: b64encode(iv),
      box: b64encode(box),
    }),
  );
  if (!posted) return { ok: false, reason: "Couldn't save that password. Try again." };
  return { ok: true };
}

export async function hasSavedPassword(digitalId: string) {
  const me = await ensureIdentity();
  const events = await loginEvents(digitalId);
  return events.some((event) => event.pubkey === me && parseLogin(event.content));
}

export async function signInAccount(
  digitalId: string,
  password: string,
): Promise<{ ok: true; username: string; digitalId: string; avatarId: string } | { ok: false; reason: string }> {
  if (password.length < 4) return { ok: false, reason: "Use at least 4 characters." };
  try {
    const found = await findClaimedId(digitalId);
    if (!found) return { ok: false, reason: "No account uses that ID." };
    const events = [...(await loginEvents(digitalId))].sort((a, b) => b.created_at - a.created_at);
    const { getPublicKey } = await tools();
    const { bytesToHex } = await import("nostr-tools/utils");
    for (const event of events) {
      if (event.pubkey !== found.pubkey) continue;
      const packed = parseLogin(event.content);
      if (!packed) continue;
      try {
        const key = await passwordKey(password, packed.salt);
        const secret = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: tight(packed.iv) }, key, tight(packed.box)));
        if (secret.length !== 32 || getPublicKey(secret) !== found.pubkey) continue;
        localStorage.setItem(SECRET_KEY, bytesToHex(secret));
        identity = null;
        return { ok: true, username: found.name, digitalId: found.digitalId, avatarId: found.avatarId };
      } catch {
        continue;
      }
    }
    const saved = events.some((event) => event.pubkey === found.pubkey);
    return { ok: false, reason: saved ? "Wrong password." : "That account has no password yet. Set one on the device where you made it." };
  } catch {
    return { ok: false, reason: "Couldn't sign in. Try again." };
  }
}
