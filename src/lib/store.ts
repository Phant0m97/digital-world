import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AVATARS, type ModeId, type ThemeId } from "@/data/catalog";

export type Profile = { username: string; avatarId: string };

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
  equippedSkin: string | null;
  equippedWeapon: string;
  paint: string;
  friends: Friend[];
  rooms: Room[];
  messages: ChatMessage[];
  joinedRoomIds: string[];
  party: PartyMember[];
  mode: ModeId;
  rosterSize: number;
  setProfile: (profile: Profile) => void;
  setTheme: (roomId: string, theme: ThemeId) => void;
  joinRoom: (roomId: string) => void;
  createRoom: (title: string) => string;
  joinByCode: (code: string) => string | null;
  sendMessage: (roomId: string, body: string, gif?: string) => void;
  deleteMessage: (id: string) => void;
  pushMessage: (message: ChatMessage) => void;
  inviteRegular: (avatarId: string) => void;
  respondFriend: (id: string, accept: boolean) => void;
  addByCode: (code: string) => string;
  toggleParty: (member: PartyMember) => void;
  buySkin: (id: string, cost: number) => boolean;
  buyWeapon: (id: string, cost: number) => boolean;
  equipSkin: (id: string | null) => void;
  setWeapon: (id: string) => void;
  setPaint: (id: string) => void;
  setMode: (mode: ModeId) => void;
  setRosterSize: (n: number) => void;
  award: (amount: number) => void;
};

const regulars = AVATARS.map((a) => a.id);

function seedRooms(): Room[] {
  return [
    {
      id: "plaza",
      title: "The Plaza",
      visibility: "public",
      theme: "cyber",
      inviteCode: "PLAZA",
      memberIds: regulars.slice(0, 8),
    },
    {
      id: "keep",
      title: "Dragon Keep",
      visibility: "public",
      theme: "fantasy",
      inviteCode: "KEEP",
      memberIds: regulars.slice(4, 12),
    },
    {
      id: "doodle",
      title: "Stick Yard",
      visibility: "public",
      theme: "doodle",
      inviteCode: "YARD",
      memberIds: regulars.slice(8, 18),
    },
  ];
}

function seedMessages(): ChatMessage[] {
  const now = Date.now();
  const line = (
    roomId: string,
    avatarId: string,
    body: string,
    ago: number,
    gif?: string,
  ): ChatMessage => {
    const avatar = AVATARS.find((a) => a.id === avatarId)!;
    return {
      id: `${roomId}-${ago}`,
      roomId,
      fromId: avatarId,
      fromName: avatar.name,
      avatarId,
      body,
      gif,
      at: now - ago,
    };
  };
  return [
    line("plaza", "robot", "Night market lights are up. Who is painting tonight?", 1000 * 60 * 18),
    line("plaza", "ninja", "Bring a hopper or don't peek mid.", 1000 * 60 * 12),
    line("plaza", "cyborg", "", 1000 * 60 * 8, "glitch"),
    line("keep", "dragon", "Castle side is windy. Dragon says the high wood is free.", 1000 * 60 * 40),
    line("keep", "wizard", "Crystal games at dusk. Don't shoot your own gem.", 1000 * 60 * 22),
    line("keep", "knight", "", 1000 * 60 * 6, "dragon"),
    line("doodle", "cat", "Stick yard is doodling again. Bandanas half off.", 1000 * 60 * 30),
    line("doodle", "fox", "King of the yellow box. I will live there.", 1000 * 60 * 9),
    line("doodle", "skull", "", 1000 * 60 * 4, "splat"),
  ];
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
      equippedSkin: null,
      equippedWeapon: "marker",
      paint: "cyan",
      friends: [
        {
          id: "ninja",
          name: "Null",
          avatarId: "ninja",
          code: "NULL-2201",
          status: "incoming",
        },
      ],
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
      joinByCode: (code) => {
        const hit = get().rooms.find((room) => room.inviteCode.toLowerCase() === code.trim().toLowerCase());
        if (!hit) return null;
        get().joinRoom(hit.id);
        return hit.id;
      },
      sendMessage: (roomId, body, gif) => {
        const profile = get().profile;
        if (!profile) return;
        const text = body.trim();
        if (!text && !gif) return;
        const message: ChatMessage = {
          id: uid("msg"),
          roomId,
          fromId: "me",
          fromName: profile.username,
          avatarId: profile.avatarId,
          body: text,
          gif,
          at: Date.now(),
        };
        set({ messages: [...get().messages, message] });
      },
      deleteMessage: (id) => {
        set({
          messages: get().messages.filter((message) => !(message.id === id && message.fromId === "me")),
        });
      },
      pushMessage: (message) => set({ messages: [...get().messages, message] }),
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
      addByCode: (code) => {
        const trimmed = code.trim().toUpperCase();
        const avatar = AVATARS.find((item) => item.code.toUpperCase() === trimmed);
        if (avatar) {
          const existing = get().friends.find((friend) => friend.id === avatar.id);
          if (!existing) {
            set({
              friends: [
                ...get().friends,
                {
                  id: avatar.id,
                  name: avatar.name,
                  avatarId: avatar.id,
                  code: avatar.code,
                  status: "incoming",
                },
              ],
            });
          }
          return `Invite from ${avatar.name} is waiting.`;
        }
        const id = uid("pal");
        set({
          friends: [
            ...get().friends,
            {
              id,
              name: `Guest ${trimmed.slice(0, 4) || "PAL"}`,
              avatarId: "robot",
              code: trimmed || "GUEST",
              status: "outgoing",
            },
          ],
        });
        return "Invite saved on this device. Plaza regulars accept instantly — use their code.";
      },
      toggleParty: (member) => {
        const has = get().party.some((item) => item.id === member.id);
        set({
          party: has ? get().party.filter((item) => item.id !== member.id) : [...get().party, member].slice(0, 7),
        });
      },
      buySkin: (id, cost) => {
        const state = get();
        if (state.ownedSkins.includes(id) || state.credits < cost) return false;
        set({ credits: state.credits - cost, ownedSkins: [...state.ownedSkins, id], equippedSkin: id });
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
      equipSkin: (id) => set({ equippedSkin: id }),
      setWeapon: (id) => {
        if (!get().ownedWeapons.includes(id)) return;
        set({ equippedWeapon: id });
      },
      setPaint: (id) => set({ paint: id }),
      setMode: (mode) => set({ mode }),
      setRosterSize: (n) => set({ rosterSize: Math.max(2, Math.min(8, n)) }),
      award: (amount) => set({ credits: get().credits + amount }),
    }),
    { name: "digitalworld-v1" },
  ),
);

export function userCode(name: string) {
  let hash = 0;
  for (const char of name.toUpperCase()) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  const stem = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "YOU";
  return `${stem}-${(hash % 9000) + 1000}`;
}
