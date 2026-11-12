import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Shell, useHydrated } from "@/components/shell";
import { AVATARS, GIFS, THEMES, type ThemeId } from "@/data/catalog";
import { asset } from "@/lib/asset";
import { claimDigitalId, ensureIdentity, findClaimedId, findSharedRoom, hasSavedPassword, publishDrop, publishMessage, publishRoom, savePassword, signInAccount, subscribeRoom } from "@/lib/live-chat";
import { useWorld, type ChatMessage, type Room } from "@/lib/store";

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
  if (!profile?.digitalId) return <ProfileGate />;
  return <ChatApp />;
}

function ProfileGate() {
  const profile = useWorld((state) => state.profile);
  const setProfile = useWorld((state) => state.setProfile);
  const [mode, setMode] = useState<"create" | "signin">("signin");
  const [name, setName] = useState(profile?.username ?? "");
  const [digitalId, setDigitalId] = useState("");
  const [password, setPassword] = useState("");
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? AVATARS[0]!.id);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = name.trim();
  const id = digitalId.trim();
  const idOk = /^[A-Za-z0-9_]{2,16}$/.test(id);
  const createOk = clean.length >= 2 && clean.length <= 16 && idOk && password.length >= 4 && !busy;
  const signOk = idOk && password.length >= 4 && !busy;
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold">{mode === "signin" ? "Sign in" : "Pick a face"}</h1>
        <div className="mt-5 flex gap-2">
          <button type="button" className={mode === "signin" ? "rounded-full bg-cyan px-4 py-2 text-ink" : "rounded-full border border-line px-4 py-2"} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button type="button" className={mode === "create" ? "rounded-full bg-cyan px-4 py-2 text-ink" : "rounded-full border border-line px-4 py-2"} onClick={() => setMode("create")}>
            Create account
          </button>
        </div>
        {mode === "create" ? (
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
        ) : null}
        <label className="mt-4 block text-sm text-mute">
          DigitalWorld ID
          <input
            value={digitalId}
            onChange={(event) => setDigitalId(event.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
            maxLength={16}
            placeholder="Unique ID"
            className="mt-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-cream outline-none focus:border-cyan"
          />
        </label>
        <label className="mt-4 block text-sm text-mute">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            maxLength={64}
            placeholder="At least 4 characters"
            className="mt-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-cream outline-none focus:border-cyan"
          />
        </label>
        {mode === "create" ? (
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
        ) : null}
        {note ? <p className="mt-4 text-sm text-mute">{note}</p> : null}
        <button
          type="button"
          disabled={mode === "create" ? !createOk : !signOk}
          onClick={() => {
            setBusy(true);
            if (mode === "signin") {
              setNote("Signing in…");
              void signInAccount(id, password).then((result) => {
                setBusy(false);
                if (!result.ok) {
                  setNote(result.reason);
                  return;
                }
                setProfile({ username: result.username, digitalId: result.digitalId, avatarId: result.avatarId });
              });
              return;
            }
            setNote("Checking that ID…");
            void claimDigitalId(id, clean, avatarId).then(async (result) => {
              if (!result.ok) {
                setBusy(false);
                setNote(result.reason);
                return;
              }
              const saved = await savePassword(id, password);
              setBusy(false);
              if (!saved.ok) {
                setNote(saved.reason);
                return;
              }
              setProfile({ username: clean, digitalId: id, avatarId });
            });
          }}
          className="mt-6 rounded-full bg-cyan px-5 py-3 font-display text-ink disabled:opacity-40"
        >
          {mode === "signin" ? "Sign in" : "Enter chat"}
        </button>
      </div>
    </Shell>
  );
}

function ChatApp() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const profile = useWorld((state) => state.profile)!;
  const setProfile = useWorld((state) => state.setProfile);
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
  const [panel, setPanel] = useState<"rooms" | "people" | "profile">("rooms");
  const [selfId, setSelfId] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [passwordNote, setPasswordNote] = useState("");
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
    let stop = false;
    void claimDigitalId(profile.digitalId, profile.username, profile.avatarId).then((result) => {
      if (stop || result.ok || result.offline) return;
      setProfile({ ...profile, digitalId: "" });
    });
    return () => {
      stop = true;
    };
  }, [profile.avatarId, profile.digitalId, profile.username, setProfile]);

  useEffect(() => {
    void ensureIdentity().then(setSelfId);
  }, []);

  useEffect(() => {
    let stop = false;
    void hasSavedPassword(profile.digitalId).then((saved) => {
      if (!stop) setNeedPassword(!saved);
    });
    return () => {
      stop = true;
    };
  }, [profile.digitalId]);

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
      {needPassword ? (
        <form
          className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPasswordNote("Saving…");
            void savePassword(profile.digitalId, accountPassword).then((result) => {
              if (!result.ok) {
                setPasswordNote(result.reason);
                return;
              }
              setNeedPassword(false);
              setAccountPassword("");
            });
          }}
        >
          <p className="text-sm">Set a password so you can sign in on another device.</p>
          <input
            value={accountPassword}
            onChange={(event) => setAccountPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="rounded-full border border-line bg-ink px-4 py-2"
          />
          <button type="submit" className="rounded-full bg-cyan px-4 py-2 text-ink">
            Save
          </button>
          {passwordNote ? <p className="text-xs text-mute">{passwordNote}</p> : null}
        </form>
      ) : null}
      <div className="grid h-[calc(100dvh-4.25rem)] overflow-hidden lg:grid-cols-[280px_1fr_280px]">
        <aside className={`${active ? "hidden" : "flex"} min-h-0 flex-col overflow-y-auto border-b border-line lg:flex lg:border-r lg:border-b-0`}>
          <div className="flex flex-wrap gap-2 p-3">
            <button type="button" className={tab(panel === "rooms")} onClick={() => setPanel("rooms")}>
              Rooms
            </button>
            <button type="button" className={tab(panel === "people")} onClick={() => setPanel("people")}>
              People
            </button>
            <button type="button" className={tab(panel === "profile")} onClick={() => setPanel("profile")}>
              Profile
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
          ) : panel === "people" ? (
            <PeoplePanel
              friends={friends}
              party={party}
              friendCode={friendCode}
              setFriendCode={setFriendCode}
              onAdd={() => {
                setNote("Looking up that ID…");
                void findClaimedId(friendCode)
                  .then((found) => {
                    if (!found) {
                      setNote("No one has that DigitalWorld ID.");
                      return;
                    }
                    setNote(addByCode(found.digitalId, found));
                    setFriendCode("");
                  })
                  .catch(() => setNote("Couldn't look that up. Try again."));
              }}
              onRespond={respondFriend}
              onParty={toggleParty}
              myCode={profile.digitalId}
            />
          ) : (
            <ProfilePanel />
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
                className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-3"
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
          <Link to="/paintball" className="mt-6 block rounded-full bg-mag px-4 py-3 text-center font-display text-ink">
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
      <div className={`max-w-[80%] rounded-2xl px-3 py-1 ${bubbleClass(theme, mine)}`}>
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

function ProfilePanel() {
  const profile = useWorld((state) => state.profile)!;
  const setProfile = useWorld((state) => state.setProfile);
  const [name, setName] = useState(profile.username);
  const [digitalId, setDigitalId] = useState(profile.digitalId);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile.username);
    setDigitalId(profile.digitalId);
    setAvatarId(profile.avatarId);
  }, [profile.avatarId, profile.digitalId, profile.username]);

  return (
    <div className="space-y-3 px-3 pb-4">
      <label className="block text-sm text-mute">
        Username
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={16}
          className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-cream"
        />
      </label>
      <label className="block text-sm text-mute">
        DigitalWorld ID
        <input
          value={digitalId}
          onChange={(event) => setDigitalId(event.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
          maxLength={16}
          className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-cream"
        />
      </label>
      <label className="block text-sm text-mute">
        New password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Leave blank to keep"
          className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-cream"
        />
      </label>
      <div className="grid grid-cols-4 gap-2">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => setAvatarId(avatar.id)}
            className={`rounded-2xl border p-1 ${avatarId === avatar.id ? "border-cyan" : "border-transparent"}`}
          >
            <Avatar id={avatar.id} className="w-full" />
          </button>
        ))}
      </div>
      {note ? <p className="text-xs text-mute">{note}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          const clean = name.trim();
          const id = digitalId.trim();
          if (clean.length < 2 || clean.length > 16) {
            setNote("Username needs 2 to 16 characters.");
            return;
          }
          if (!/^[A-Za-z0-9_]{2,16}$/.test(id)) {
            setNote("ID needs 2 to 16 letters, numbers, or underscores.");
            return;
          }
          setBusy(true);
          setNote("Saving…");
          void claimDigitalId(id, clean, avatarId).then(async (result) => {
            if (!result.ok) {
              setBusy(false);
              setNote(result.reason);
              return;
            }
            if (password) {
              const saved = await savePassword(id, password);
              if (!saved.ok) {
                setBusy(false);
                setNote(saved.reason);
                return;
              }
            }
            setProfile({ username: clean, digitalId: id, avatarId });
            setPassword("");
            setBusy(false);
            setNote("Saved.");
          });
        }}
        className="w-full rounded-full bg-cyan py-2 text-ink disabled:opacity-40"
      >
        Save profile
      </button>
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
      <p className="text-xs text-mute">Your DigitalWorld ID {myCode}</p>
      <div className="flex gap-2">
        <input
          value={friendCode}
          onChange={(event) => setFriendCode(event.target.value)}
          placeholder="DigitalWorld ID"
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
