import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AVATARS, EMPTY_LOADOUT, skinById, wornList, type Loadout, type ModeId, type ThemeId } from "@/data/catalog";

export type Profile = { username: string; digitalId: string; avatarId: string };

export type Friend = {
  id: string;
  name: string;
  avatarId: string;
  code: string;
  status: "incoming" | "outgoing" | "accepted";
};

export type Room = {
  id: string;
  title: string;
  visibility: "public" | "private";
  theme: ThemeId;
  inviteCode: string;
  memberIds: string[];
};

export type ChatMessage = {
  id: string;
  roomId: string;
  fromId: string;
  fromName: string;
  avatarId: string;
  body: string;
  gif?: string;
  at: number;
};

export type PartyMember = {
  id: string;
  name: string;
  avatarId: string;
};

type World = {
  profile: Profile | null;
  credits: number;
  ownedSkins: string[];
  ownedWeapons: string[];
  equipped: Loadout;
  equippedWeapon: string;
  paint: string;
  cosmeticColors: Record<string, string>;
  friends: Friend[];
  rooms: Room[];
  messages: ChatMessage[];
  joinedRoomIds: string[];
  party: PartyMember[];
  mode: ModeId;
  rosterSize: number;
  setProfile: (profile: Profile | null) => void;
  setTheme: (roomId: string, theme: ThemeId) => void;
  joinRoom: (roomId: string) => void;
  createRoom: (title: string) => string;
  addRoom: (room: Room) => void;
  joinByCode: (code: string) => string | null;
  sendMessage: (roomId: string, body: string, gif: string | undefined, authorId: string) => ChatMessage | null;
  deleteMessage: (id: string, authorId: string) => void;
  removeMessage: (id: string, authorId: string) => void;
  pushMessage: (message: ChatMessage) => void;
  inviteRegular: (avatarId: string) => void;
  respondFriend: (id: string, accept: boolean) => void;
  addByCode: (code: string, person?: { name: string; avatarId: string; pubkey: string }) => string;
  toggleParty: (member: PartyMember) => void;
  buySkin: (id: string, cost: number) => boolean;
  buyWeapon: (id: string, cost: number) => boolean;
  equipSkin: (id: string) => void;
  setWeapon: (id: string) => void;
  setPaint: (id: string) => void;
  setCosmeticColor: (skinId: string, paintId: string) => void;
  setMode: (mode: ModeId) => void;
  setRosterSize: (n: number) => void;
  award: (amount: number) => void;
};

const regulars = new Set(AVATARS.map((avatar) => avatar.id));

function publicRoom(): Room {
  return {
    id: "digital-world",
    title: "Digital World Chat",
    visibility: "public",
    theme: "black",
    inviteCode: "WORLD",
    memberIds: [],
  };
}

function seedRooms(): Room[] {
  return [publicRoom()];
}

function seedMessages(): ChatMessage[] {
  return [];
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useWorld = create<World>()(
  persist(
    (set, get) => ({
      profile: null,
      credits: 45,
      ownedSkins: [],
      ownedWeapons: ["marker"],
      equipped: [...EMPTY_LOADOUT],
      equippedWeapon: "marker",
      paint: "cyan",
      cosmeticColors: {},
      friends: [],
      rooms: seedRooms(),
      messages: seedMessages(),
      joinedRoomIds: [],
      party: [],
      mode: "dm",
      rosterSize: 6,
      setProfile: (profile) => set({ profile }),
      setTheme: (roomId, theme) =>
        set({
          rooms: get().rooms.map((room) => (room.id === roomId ? { ...room, theme } : room)),
        }),
      joinRoom: (roomId) => {
        const joined = new Set(get().joinedRoomIds);
        joined.add(roomId);
        set({ joinedRoomIds: [...joined] });
      },
      createRoom: (title) => {
        const id = uid("room");
        const code = Math.random().toString(36).slice(2, 6).toUpperCase();
        const room: Room = {
          id,
          title: title.trim() || "Private yard",
          visibility: "private",
          theme: "black",
          inviteCode: code,
          memberIds: [],
        };
        set({
          rooms: [...get().rooms, room],
          joinedRoomIds: [...get().joinedRoomIds, id],
        });
        return id;
      },
      addRoom: (room) => {
        const existing = get().rooms.find((item) => item.id === room.id);
        if (existing) {
          get().joinRoom(existing.id);
          return;
        }
        set({
          rooms: [...get().rooms, room],
          joinedRoomIds: [...new Set([...get().joinedRoomIds, room.id])],
        });
      },
      joinByCode: (code) => {
        const hit = get().rooms.find((room) => room.inviteCode.toLowerCase() === code.trim().toLowerCase());
        if (!hit) return null;
        get().joinRoom(hit.id);
        return hit.id;
      },
      sendMessage: (roomId, body, gif, authorId) => {
        const profile = get().profile;
        if (!profile || !authorId) return null;
        const text = body.trim();
        if (!text && !gif) return null;
        const message: ChatMessage = {
          id: uid("msg"),
          roomId,
          fromId: authorId,
          fromName: profile.username,
          avatarId: profile.avatarId,
          body: text,
          gif,
          at: Date.now(),
        };
        set({ messages: [...get().messages, message] });
        return message;
      },
      deleteMessage: (id, authorId) => {
        set({
          messages: get().messages.filter((message) => {
            if (message.id !== id) return true;
            return message.fromId !== "me" && message.fromId !== authorId;
          }),
        });
      },
      removeMessage: (id, authorId) => {
        const hit = get().messages.find((message) => message.id === id);
        if (hit && hit.fromId !== authorId) return;
        set({ messages: get().messages.filter((message) => message.id !== id) });
      },
      pushMessage: (message) => {
        if (get().messages.some((item) => item.id === message.id)) return;
        const next = [...get().messages, message].sort((a, b) => a.at - b.at).slice(-300);
        set({ messages: next });
      },
      inviteRegular: (avatarId) => {
        const avatar = AVATARS.find((item) => item.id === avatarId);
        if (!avatar) return;
        const existing = get().friends.find((friend) => friend.id === avatar.id);
        if (existing) return;
        set({
          friends: [
            ...get().friends,
            {
              id: avatar.id,
              name: avatar.name,
              avatarId: avatar.id,
              code: avatar.code,
              status: "outgoing",
            },
          ],
        });
        window.setTimeout(() => {
          const current = useWorld.getState();
          useWorld.setState({
            friends: current.friends.map((friend) =>
              friend.id === avatar.id && friend.status === "outgoing"
                ? { ...friend, status: "accepted" }
                : friend,
            ),
          });
        }, 900);
      },
      respondFriend: (id, accept) =>
        set({
          friends: accept
            ? get().friends.map((friend) =>
                friend.id === id ? { ...friend, status: "accepted" } : friend,
              )
            : get().friends.filter((friend) => friend.id !== id),
        }),
      addByCode: (code, person) => {
        const trimmed = code.trim();
        const key = trimmed.toLowerCase();
        if (!/^[a-z0-9_]{2,16}$/.test(key)) return "Type their DigitalWorld ID.";
        if (get().profile?.digitalId.toLowerCase() === key) return "That is you.";
        if (get().friends.some((friend) => friend.code.toLowerCase() === key)) return "Already added.";
        set({
          friends: [
            ...get().friends,
            {
              id: person?.pubkey || uid("pal"),
              name: person?.name || trimmed,
              avatarId: person?.avatarId || "robot",
              code: trimmed,
              status: "accepted",
            },
          ],
        });
        return "Added.";
      },
      toggleParty: (member) => {
        const has = get().party.some((item) => item.id === member.id);
        set({
          party: has ? get().party.filter((item) => item.id !== member.id) : [...get().party, member].slice(0, 7),
        });
      },
      buySkin: (id, cost) => {
        const state = get();
        const item = skinById(id);
        if (!item || state.ownedSkins.includes(id) || state.credits < cost) return false;
        set({
          credits: state.credits - cost,
          ownedSkins: [...state.ownedSkins, id],
          equipped: wornList(state.equipped).includes(id) ? wornList(state.equipped) : [...wornList(state.equipped), id],
        });
        return true;
      },
      buyWeapon: (id, cost) => {
        const state = get();
        if (state.ownedWeapons.includes(id) || state.credits < cost) return false;
        set({
          credits: state.credits - cost,
          ownedWeapons: [...state.ownedWeapons, id],
          equippedWeapon: id,
        });
        return true;
      },
      equipSkin: (id) => {
        if (!skinById(id) || !get().ownedSkins.includes(id)) return;
        const equipped = wornList(get().equipped);
        set({ equipped: equipped.includes(id) ? equipped.filter((worn) => worn !== id) : [...equipped, id] });
      },
      setWeapon: (id) => {
        if (!get().ownedWeapons.includes(id)) return;
        set({ equippedWeapon: id });
      },
      setPaint: (id) => set({ paint: id }),
      setCosmeticColor: (skinId, paintId) =>
        set({ cosmeticColors: { ...get().cosmeticColors, [skinId]: paintId } }),
      setMode: (mode) => set({ mode }),
      setRosterSize: (n) => set({ rosterSize: Math.max(2, Math.min(8, n)) }),
      award: (amount) => set({ credits: get().credits + amount }),
    }),
    {
      name: "digitalworld-v1",
      version: 6,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<World>;
        return { ...current, ...saved, equipped: wornList(saved.equipped) };
      },
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const state = persisted as {
          rooms?: Room[];
          messages?: ChatMessage[];
          friends?: Friend[];
          party?: PartyMember[];
          joinedRoomIds?: string[];
          equipped?: Loadout | { head?: string | null; body?: string | null; legs?: string | null };
          equippedSkin?: string | null;
          cosmeticColors?: Record<string, string>;
        };
        if ((version ?? 0) < 2) {
          const rooms = (state.rooms ?? []).filter((room) => room.visibility !== "public");
          rooms.unshift(publicRoom());
          const roomIds = new Set(rooms.map((room) => room.id));
          state.rooms = rooms;
          state.messages = (state.messages ?? []).filter(
            (message) => message.fromId === "me" && roomIds.has(message.roomId),
          );
          state.friends = (state.friends ?? []).filter((friend) => !regulars.has(friend.id));
          state.party = (state.party ?? []).filter((member) => !regulars.has(member.id));
          state.joinedRoomIds = (state.joinedRoomIds ?? []).filter((id) => roomIds.has(id));
        }
        if ((version ?? 0) < 4) state.cosmeticColors = state.cosmeticColors ?? {};
        state.equipped = wornList(state.equipped ?? state.equippedSkin);
        return state;
      },
    },
  ),
);
