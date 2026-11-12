import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Shell, useHydrated } from "@/components/shell";
import { AVATARS, GIFS, THEMES, type ThemeId } from "@/data/catalog";
import { asset } from "@/lib/asset";
import { ensureIdentity, findSharedRoom, publishDrop, publishMessage, publishRoom, subscribeRoom } from "@/lib/live-chat";
import { useWorld, userCode, type ChatMessage, type Room } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    room: typeof search.room === "string" ? search.room : "",
  }),
  component: ChatPage,
});

function ChatPage() {
  const ready = useHydrated();
  const profile = useWorld((state) => state.profile);
  if (!ready) {
    return (
      <Shell>
        <p className="text-mute">Opening chat…</p>
      </Shell>
    );
  }
  if (!profile) return <ProfileGate />;
  return <ChatApp />;
}

function ProfileGate() {
  const setProfile = useWorld((state) => state.setProfile);
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(AVATARS[0]!.id);
  const clean = name.trim();
  const ok = clean.length >= 2 && clean.length <= 16;
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Pick a face</h1>
        <label className="mt-6 block text-sm text-mute">
          Username
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={16}
            placeholder="Your callsign"
            className="mt-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-cream outline-none focus:border-cyan"
          />
        </label>
        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setAvatarId(avatar.id)}
              className={`rounded-2xl border p-1 text-left ${avatarId === avatar.id ? "border-cyan" : "border-transparent"}`}
            >
              <Avatar id={avatar.id} className="w-full" />
              <span className="mt-1 block truncate px-1 text-xs">{avatar.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!ok}
          onClick={() => setProfile({ username: clean, avatarId })}
          className="mt-6 rounded-full bg-cyan px-5 py-3 font-display text-ink disabled:opacity-40"
        >
          Enter chat
        </button>
      </div>
    </Shell>
  );
}

function ChatApp() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const profile = useWorld((state) => state.profile)!;
  const rooms = useWorld((state) => state.rooms);
  const joined = useWorld((state) => state.joinedRoomIds);
  const messages = useWorld((state) => state.messages);
  const friends = useWorld((state) => state.friends);
  const party = useWorld((state) => state.party);
  const joinRoom = useWorld((state) => state.joinRoom);
  const createRoom = useWorld((state) => state.createRoom);
  const joinByCode = useWorld((state) => state.joinByCode);
  const sendMessage = useWorld((state) => state.sendMessage);
  const deleteMessage = useWorld((state) => state.deleteMessage);
  const removeMessage = useWorld((state) => state.removeMessage);
  const pushMessage = useWorld((state) => state.pushMessage);
  const addRoom = useWorld((state) => state.addRoom);
  const setTheme = useWorld((state) => state.setTheme);
  const respondFriend = useWorld((state) => state.respondFriend);
  const addByCode = useWorld((state) => state.addByCode);
  const toggleParty = useWorld((state) => state.toggleParty);
  const [draft, setDraft] = useState("");
  const [gif, setGif] = useState<string | null>(null);
  const [showGifs, setShowGifs] = useState(false);
  const [code, setCode] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [note, setNote] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [panel, setPanel] = useState<"rooms" | "people">("rooms");
  const [selfId, setSelfId] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const openRooms = rooms.filter((room) => room.visibility === "public" || joined.includes(room.id));
  const active = rooms.find((room) => room.id === search.room) ?? null;
  const thread = messages
    .filter((message) => message.roomId === active?.id)
    .slice()
    .sort((a, b) => a.at - b.at);
  const canTalk = Boolean(active && joined.includes(active.id));

  const activeId = active?.id ?? "";

  useEffect(() => {
    void ensureIdentity().then(setSelfId);
  }, []);

  useEffect(() => {
    if (!activeId || !canTalk) return;
    return subscribeRoom(activeId, pushMessage, removeMessage);
  }, [activeId, canTalk, pushMessage, removeMessage]);

  useLayoutEffect(() => {
    pinned.current = true;
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [activeId]);

  useLayoutEffect(() => {
    const node = scroller.current;
    if (!node || !pinned.current) return;
    node.scrollTop = node.scrollHeight;
  }, [thread.length, activeId]);

  const speakers = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; avatarId: string }>();
    for (const message of thread) {
      if (message.fromId === selfId || message.fromId === "me") continue;
      seen.set(message.fromId, { id: message.fromId, name: message.fromName, avatarId: message.avatarId });
    }
    return [...seen.values()];
  }, [thread, selfId]);

  function openRoom(room: Room) {
    if (!joined.includes(room.id)) return;
    void navigate({ search: { room: room.id } });
  }

  async function onSend() {
    if (!active || !canTalk) return;
    const authorId = selfId || (await ensureIdentity());
    if (!selfId) setSelfId(authorId);
    const message = sendMessage(active.id, draft, gif ?? undefined, authorId);
    setDraft("");
    setGif(null);
    setShowGifs(false);
    if (message) void publishMessage(message);
  }

  const theme = active?.theme ?? "black";

  return (
    <Shell bare>
      <div className="grid h-[calc(100dvh-4.25rem)] overflow-hidden lg:grid-cols-[280px_1fr_280px]">
        <aside className={`${active ? "hidden" : "flex"} min-h-0 flex-col overflow-y-auto border-b border-line lg:flex lg:border-r lg:border-b-0`}>
          <div className="flex gap-2 p-3">
            <button type="button" className={tab(panel === "rooms")} onClick={() => setPanel("rooms")}>
              Rooms
            </button>
            <button type="button" className={tab(panel === "people")} onClick={() => setPanel("people")}>
              People
            </button>
          </div>
          {panel === "rooms" ? (
            <div className="space-y-2 px-3 pb-4">
              {openRooms.map((room) => {
                const inside = joined.includes(room.id);
                return (
                  <div key={room.id} className="rounded-2xl border border-line bg-panel p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{room.title}</p>
                      <span className="text-xs text-mute uppercase">{room.visibility}</span>
                    </div>
                    {inside ? (
                      <button type="button" className="mt-2 text-sm text-cyan" onClick={() => openRoom(room)}>
                        Open
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mt-2 text-sm text-cyan"
                        onClick={() => {
                          joinRoom(room.id);
                          void navigate({ search: { room: room.id } });
                        }}
                      >
                        Join public chat
                      </button>
                    )}
                  </div>
                );
              })}
              <form
                className="rounded-2xl border border-line p-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const id = joinByCode(code);
                  if (id) {
                    setNote("Code accepted.");
                    void navigate({ search: { room: id } });
                    return;
                  }
                  setNote("Looking up that code…");
                  const remote = await findSharedRoom(code);
                  if (!remote) {
                    setNote("No room uses that code.");
                    return;
                  }
                  addRoom(remote);
                  setNote("Code accepted.");
                  void navigate({ search: { room: remote.id } });
                }}
              >
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Invite code"
                  className="w-full rounded-xl border border-line bg-ink px-3 py-2"
                />
                <button type="submit" className="mt-2 text-sm text-cyan">
                  Join with code
                </button>
              </form>
              <form
                className="rounded-2xl border border-line p-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const id = createRoom(roomTitle);
                  const created = useWorld.getState().rooms.find((room) => room.id === id);
                  setRoomTitle("");
                  void navigate({ search: { room: id } });
                  if (!created) return;
                  const shared = await publishRoom(created);
                  setNote(shared ? `Room code ${created.inviteCode}` : "Room saved on this device only.");
                }}
              >
                <input
                  value={roomTitle}
                  onChange={(event) => setRoomTitle(event.target.value)}
                  placeholder="New private room"
                  className="w-full rounded-xl border border-line bg-ink px-3 py-2"
                />
                <button type="submit" className="mt-2 text-sm text-cyan">
                  Create invite
                </button>
              </form>
              {note ? <p className="text-xs text-mute">{note}</p> : null}
            </div>
          ) : (
            <PeoplePanel
              friends={friends}
              party={party}
              friendCode={friendCode}
              setFriendCode={setFriendCode}
              onAdd={() => setNote(addByCode(friendCode))}
              onRespond={respondFriend}
              onParty={toggleParty}
              myCode={userCode(profile.username)}
            />
          )}
        </aside>

        <section className={`${active ? "flex" : "hidden"} min-h-0 flex-col lg:flex`} data-theme={theme} style={themeStyle(theme)}>
          {active ? (
            <>
              <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line/60 bg-ink/55 px-4 py-3 backdrop-blur">
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-sm lg:hidden"
                  onClick={() => void navigate({ search: { room: "" } })}
                >
                  Rooms
                </button>
                <div className="mr-auto">
                  <p className="font-display text-lg font-bold">{active.title}</p>
                  {canTalk ? <p className="text-xs text-cream/80">Code {active.inviteCode}</p> : null}
                </div>
                <label className="text-xs text-cream">
                  Look
                  <select
                    value={active.theme}
                    onChange={(event) => setTheme(active.id, event.target.value as ThemeId)}
                    className="ml-2 rounded-full bg-ink px-3 py-2 text-cream"
                  >
                    {THEMES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </header>
              <div
                ref={scroller}
                onScroll={(event) => {
                  const node = event.currentTarget;
                  pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
                }}
                onLoadCapture={() => {
                  const node = scroller.current;
                  if (node && pinned.current) node.scrollTop = node.scrollHeight;
                }}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {thread.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    mine={message.fromId === selfId || message.fromId === "me"}
                    theme={theme}
                    onDelete={() => {
                      if (message.fromId !== selfId && message.fromId !== "me") return;
                      deleteMessage(message.id, selfId);
                      void publishDrop(message);
                    }}
                  />
                ))}
              </div>
              {canTalk ? (
                <form
                  className="shrink-0 border-t border-line/60 bg-ink/70 p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onSend();
                  }}
                >
                  {gif ? (
                    <img src={asset(`gifs/${gif}.gif`)} alt="" className="mb-2 size-16 rounded-xl" />
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-line px-3 py-3 text-sm"
                      onClick={() => setShowGifs((value) => !value)}
                    >
                      GIF
                    </button>
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Say something"
                      className="min-w-0 flex-1 rounded-full border border-line bg-ink px-4 py-3"
                    />
                    <button type="submit" className="rounded-full bg-cyan px-4 py-3 font-display text-ink">
                      Send
                    </button>
                  </div>
                  {showGifs ? (
                    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {GIFS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGif(item.id)}
                          className={`rounded-xl border p-1 ${gif === item.id ? "border-cyan" : "border-line"}`}
                        >
                          <img src={asset(`gifs/${item.id}.gif`)} alt={item.label} className="w-full" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </form>
              ) : null}
            </>
          ) : (
            <div className="m-auto max-w-md p-6 text-center">
              <p className="font-display text-2xl">No room open</p>
            </div>
          )}
        </section>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-line p-4 lg:block">
          <p className="font-display text-xs tracking-[0.22em] text-mute uppercase">In this room</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2">
              <Avatar id={profile.avatarId} className="size-10" />
              <span>{profile.username}</span>
            </li>
            {speakers.map((member) => (
              <li key={member.id} className="flex items-center gap-2">
                <Avatar id={member.avatarId} className="size-10" />
                <p className="truncate">{member.name}</p>
              </li>
            ))}
          </ul>
          <Link to="/games" className="mt-6 block rounded-full bg-mag px-4 py-3 text-center font-display text-ink">
            Party up and play
          </Link>
        </aside>
      </div>
    </Shell>
  );
}

function tab(on: boolean) {
  return `rounded-full px-3 py-2 text-sm ${on ? "bg-cream text-ink" : "text-mute"}`;
}

function themeStyle(theme: ThemeId): { backgroundImage?: string; backgroundColor?: string; backgroundSize?: string; backgroundPosition?: string } {
  if (theme === "fantasy") {
    return {
      backgroundImage: `linear-gradient(rgba(7,7,11,0.35), rgba(7,7,11,0.55)), url(${asset("backgrounds/fantasy.jpg")})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (theme === "doodle") {
    return {
      backgroundImage: `url(${asset("backgrounds/doodle.jpg")})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (theme === "cyber") {
    return {
      backgroundImage: `linear-gradient(rgba(7,7,11,0.45), rgba(7,7,11,0.62)), url(${asset("backgrounds/cyber.jpg")})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (theme === "white") return { backgroundColor: "#f7f4ee" };
  return { backgroundColor: "#07070b" };
}

function bubbleClass(theme: ThemeId, mine: boolean) {
  if (theme === "white") return mine ? "bg-paper-ink text-cream" : "border border-line bg-paper text-paper-ink";
  if (theme === "fantasy") return "bubble-fantasy";
  if (theme === "doodle") return "bubble-doodle";
  if (theme === "cyber") {
    return mine
      ? "border border-cyan bg-ink/80 text-cream shadow-[inset_0_0_0_1px_var(--color-mag)]"
      : "border border-mag bg-ink/75 text-cream";
  }
  return mine ? "bg-cyan text-ink" : "bg-panel-2 text-cream";
}

function MessageRow({
  message,
  mine,
  theme,
  onDelete,
}: {
  message: ChatMessage;
  mine: boolean;
  theme: ThemeId;
  onDelete: () => void;
}) {
  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <Avatar id={message.avatarId} className="size-9 shrink-0" />
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${bubbleClass(theme, mine)}`}>
        <p className="text-xs opacity-70">{message.fromName}</p>
        {message.body ? <p>{message.body}</p> : null}
        {message.gif ? (
          <img src={asset(`gifs/${message.gif}.gif`)} alt="" className="mt-1 h-20 rounded-lg" />
        ) : null}
        {mine ? (
          <button type="button" onClick={onDelete} className="mt-1 text-xs underline opacity-70">
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PeoplePanel({
  friends,
  party,
  friendCode,
  setFriendCode,
  onAdd,
  onRespond,
  onParty,
  myCode,
}: {
  friends: ReturnType<typeof useWorld.getState>["friends"];
  party: ReturnType<typeof useWorld.getState>["party"];
  friendCode: string;
  setFriendCode: (value: string) => void;
  onAdd: () => void;
  onRespond: (id: string, accept: boolean) => void;
  onParty: (member: { id: string; name: string; avatarId: string }) => void;
  myCode: string;
}) {
  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-mute">Your code {myCode}</p>
      <div className="flex gap-2">
        <input
          value={friendCode}
          onChange={(event) => setFriendCode(event.target.value)}
          placeholder="Friend code"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 py-2"
        />
        <button type="button" onClick={onAdd} className="rounded-xl bg-panel-2 px-3">
          Add
        </button>
      </div>
      {friends.map((friend) => (
        <div key={friend.id} className="rounded-2xl border border-line p-3">
          <div className="flex items-center gap-2">
            <Avatar id={friend.avatarId} className="size-10" />
            <div>
              <p>{friend.name}</p>
              <p className="text-xs text-mute">
                {friend.code} · {friend.status}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {friend.status === "incoming" ? (
              <>
                <button type="button" className="text-cyan" onClick={() => onRespond(friend.id, true)}>
                  Accept
                </button>
                <button type="button" className="text-mute" onClick={() => onRespond(friend.id, false)}>
                  Decline
                </button>
              </>
            ) : null}
            {friend.status === "accepted" ? (
              <button
                type="button"
                className="text-cyan"
                onClick={() => onParty({ id: friend.id, name: friend.name, avatarId: friend.avatarId })}
              >
                {party.some((member) => member.id === friend.id) ? "Remove from party" : "Invite to party"}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
