import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Shell, useHydrated } from "@/components/shell";
import {
  MODES,
  PAINTS,
  SKINS,
  WEAPONS,
  paintHex,
  skinById,
  type CosmeticSlot,
  type Loadout,
  type ModeId,
} from "@/data/catalog";
import { paintPreview } from "@/game/engine";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  const ready = useHydrated();
  return (
    <Shell>
      {ready ? <Locker /> : <p className="text-mute">Opening the locker…</p>}
    </Shell>
  );
}

function Locker() {
  const credits = useWorld((state) => state.credits);
  const mode = useWorld((state) => state.mode);
  const rosterSize = useWorld((state) => state.rosterSize);
  const paint = useWorld((state) => state.paint);
  const equipped = useWorld((state) => state.equipped);
  const weapon = useWorld((state) => state.equippedWeapon);
  const ownedSkins = useWorld((state) => state.ownedSkins);
  const ownedWeapons = useWorld((state) => state.ownedWeapons);
  const party = useWorld((state) => state.party);
  const setMode = useWorld((state) => state.setMode);
  const setRosterSize = useWorld((state) => state.setRosterSize);
  const setPaint = useWorld((state) => state.setPaint);
  const buySkin = useWorld((state) => state.buySkin);
  const buyWeapon = useWorld((state) => state.buyWeapon);
  const equipSkin = useWorld((state) => state.equipSkin);
  const setWeapon = useWorld((state) => state.setWeapon);
  const toggleParty = useWorld((state) => state.toggleParty);
  const profile = useWorld((state) => state.profile);
  const [slot, setSlot] = useState<CosmeticSlot>("head");
  const [looking, setLooking] = useState<string | null>(null);
  const preview: Loadout = { ...equipped };
  const peeked = skinById(looking);
  if (peeked && peeked.slot === slot) preview[peeked.slot] = peeked.id;
  const slots: { id: CosmeticSlot; label: string }[] = [
    { id: "head", label: "Head" },
    { id: "body", label: "Body" },
    { id: "legs", label: "Legs" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.28em] text-cyan uppercase">Game 01</p>
          <h1 className="font-display text-4xl font-bold">Paintball</h1>
        </div>
        <p className="font-display text-2xl text-cyan">{credits} cr</p>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`rounded-card border p-4 text-left ${mode === item.id ? "border-cyan bg-panel-2" : "border-line bg-panel"}`}
          >
            <p className="font-display text-xl">{item.name}</p>
          </button>
        ))}
      </section>

      <section className="rounded-card border border-line bg-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-display">Party</p>
          <label className="text-sm text-mute">
            Sticks in the yard
            <input
              type="range"
              min={2}
              max={8}
              value={rosterSize}
              onChange={(event) => setRosterSize(Number(event.target.value))}
              className="ml-2 align-middle"
            />
            <span className="ml-2 text-cream">{rosterSize}</span>
          </label>
          <Link
            to="/play"
            search={{ mode, players: rosterSize }}
            className="ml-auto rounded-full bg-cyan px-5 py-3 font-display text-ink"
          >
            Drop in
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-panel-2 px-3 py-2 text-sm">
            {profile?.username ?? "Guest"} (you)
          </span>
          {party.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleParty(member)}
              className="flex items-center gap-2 rounded-full bg-panel-2 px-2 py-1 text-sm"
            >
              <Avatar id={member.avatarId} className="size-8" />
              {member.name}
            </button>
          ))}
          {party.length === 0 ? (
            <Link to="/chat" search={{ room: "" }} className="self-center text-sm text-cyan">
              Invite friends from chat
            </Link>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl">Cosmetics</h2>
          <div className="flex gap-2">
            {PAINTS.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                aria-label={swatch.id}
                onClick={() => setPaint(swatch.id)}
                className={`size-8 rounded-full border-2 ${paint === swatch.id ? "border-cream" : "border-transparent"}`}
                style={{ background: swatch.hex }}
              />
            ))}
          </div>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
          <div className="rounded-card border border-line bg-paper p-3 text-paper-ink">
            <StickPreview loadout={preview} color={paintHex(paint)} />
            <p className="mt-2 text-center font-display">{profile?.username ?? "You"}</p>
          </div>
          <div>
            <div className="mb-3 flex gap-2">
              {slots.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSlot(item.id);
                    setLooking(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${slot === item.id ? "bg-cream text-ink" : "border border-line text-mute"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SKINS.filter((item) => item.slot === slot).map((item) => {
                const owned = ownedSkins.includes(item.id);
                const on = equipped[item.slot] === item.id;
                return (
                  <article
                    key={item.id}
                    className={`rounded-card border bg-panel p-3 ${looking === item.id || on ? "border-cyan" : "border-line"}`}
                  >
                    <button type="button" onClick={() => setLooking(looking === item.id ? null : item.id)} className="w-full text-left">
                      <h3 className="font-display text-lg">{item.name}</h3>
                      <p className="text-sm text-mute">{item.cost} cr</p>
                    </button>
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => equipSkin(item.id)}
                        className="mt-3 w-full rounded-full bg-cream py-2 text-sm text-ink"
                      >
                        {on ? "Take off" : "Equip"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={credits < item.cost}
                        onClick={() => buySkin(item.id, item.cost)}
                        className="mt-3 w-full rounded-full bg-cyan py-2 text-sm text-ink disabled:opacity-40"
                      >
                        Buy
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Weapons</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {WEAPONS.map((item) => {
            const owned = ownedWeapons.includes(item.id);
            const equipped = weapon === item.id;
            return (
              <article key={item.id} className="rounded-card border border-line bg-panel p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl">{item.name}</h3>
                  <p className="text-sm text-cyan">{item.cost === 0 ? "Owned" : `${item.cost} cr`}</p>
                </div>
                <p className="mt-2 text-sm">
                  <span className="text-cyan">Strong:</span> {item.strength}
                </p>
                <p className="text-sm">
                  <span className="text-mag">Weak:</span> {item.weakness}
                </p>
                <div className="mt-3">
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => setWeapon(item.id)}
                      className="rounded-full bg-cream px-4 py-2 text-sm text-ink"
                    >
                      {equipped ? "Equipped" : "Equip"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={credits < item.cost}
                      onClick={() => buyWeapon(item.id, item.cost)}
                      className="rounded-full bg-cyan px-4 py-2 text-sm text-ink disabled:opacity-40"
                    >
                      Buy
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StickPreview({ loadout, color }: { loadout: Loadout; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 240;
    canvas.height = 420;
    paintPreview(canvas, loadout, color);
  }, [loadout.head, loadout.body, loadout.legs, color]);
  return <canvas ref={ref} width={240} height={420} className="mx-auto block h-auto w-[200px] max-w-full rounded-xl" />;
}
