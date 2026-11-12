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
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Paintball</h1>
        <p className="font-display text-xl text-cyan">{credits} cr</p>
        <div className="flex gap-2">
          {PAINTS.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              aria-label={swatch.id}
              onClick={() => setPaint(swatch.id)}
              className={`size-7 rounded-full border-2 ${paint === swatch.id ? "border-cream" : "border-transparent"}`}
              style={{ background: swatch.hex }}
            />
          ))}
        </div>
        <Link
          to="/play"
          search={{ mode, players: rosterSize }}
          className="ml-auto rounded-full bg-cyan px-5 py-2 font-display text-ink"
        >
          Drop in
        </Link>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`rounded-full px-3 py-2 text-sm ${mode === item.id ? "bg-cream text-ink" : "border border-line text-mute"}`}
          >
            {item.name}
          </button>
        ))}
        <label className="ml-auto text-sm text-mute">
          Sticks
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
      </div>
      {party.length > 0 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto">
          {party.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleParty(member)}
              className="flex items-center gap-2 rounded-full bg-panel-2 px-2 py-1 text-sm"
            >
              <Avatar id={member.avatarId} className="size-7" />
              {member.name}
            </button>
          ))}
        </div>
      ) : null}

      <section className="grid min-h-0 flex-1 items-stretch gap-3 lg:grid-cols-[220px_1fr]">
        <div className="flex min-h-0 flex-col rounded-card border border-line bg-paper p-3 text-paper-ink">
          <StickPreview loadout={preview} color={paintHex(paint)} />
          <p className="mt-2 shrink-0 text-center font-display">{profile?.username ?? "You"}</p>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex shrink-0 gap-2">
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
          <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto sm:grid-cols-2">
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
                      className="mt-2 w-full rounded-full bg-cream py-2 text-sm text-ink"
                    >
                      {on ? "Take off" : "Equip"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={credits < item.cost}
                      onClick={() => buySkin(item.id, item.cost)}
                      className="mt-2 w-full rounded-full bg-cyan py-2 text-sm text-ink disabled:opacity-40"
                    >
                      Buy
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {WEAPONS.map((item) => {
            const owned = ownedWeapons.includes(item.id);
            const on = weapon === item.id;
            return (
              <article key={item.id} className="w-56 shrink-0 rounded-card border border-line bg-panel p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display">{item.name}</h3>
                  <p className="text-xs text-cyan">{item.cost === 0 ? "Owned" : `${item.cost} cr`}</p>
                </div>
                <p className="mt-1 text-xs text-mute">{item.strength}</p>
                {owned ? (
                  <button
                    type="button"
                    onClick={() => setWeapon(item.id)}
                    className="mt-2 rounded-full bg-cream px-3 py-1 text-sm text-ink"
                  >
                    {on ? "Equipped" : "Equip"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={credits < item.cost}
                    onClick={() => buyWeapon(item.id, item.cost)}
                    className="mt-2 rounded-full bg-cyan px-3 py-1 text-sm text-ink disabled:opacity-40"
                  >
                    Buy
                  </button>
                )}
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
    canvas.width = 280;
    canvas.height = 640;
    paintPreview(canvas, loadout, color);
  }, [loadout.head, loadout.body, loadout.legs, color]);
  return <canvas ref={ref} width={280} height={640} className="mx-auto h-full min-h-0 w-auto max-w-full rounded-xl" />;
}
