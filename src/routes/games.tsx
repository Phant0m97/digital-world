import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Avatar } from "@/components/avatar";
import { Shell, useHydrated } from "@/components/shell";
import { MODES, PAINTS, SKINS, WEAPONS, paintHex, type ModeId } from "@/data/catalog";
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
  const skin = useWorld((state) => state.equippedSkin);
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
          <h2 className="font-display text-2xl">Paint</h2>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SKINS.map((item) => (
            <SkinCard
              key={item.id}
              id={item.id}
              name={item.name}
              cost={item.cost}
              owned={ownedSkins.includes(item.id)}
              equipped={skin === item.id}
              color={paintHex(paint)}
              credits={credits}
              onBuy={() => buySkin(item.id, item.cost)}
              onEquip={() => equipSkin(skin === item.id ? null : item.id)}
            />
          ))}
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

function SkinCard({
  id,
  name,
  cost,
  owned,
  equipped,
  color,
  credits,
  onBuy,
  onEquip,
}: {
  id: string;
  name: string;
  cost: number;
  owned: boolean;
  equipped: boolean;
  color: string;
  credits: number;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 280;
    canvas.height = 180;
    paintPreview(canvas, equipped || owned ? id : id, color);
  }, [id, color, owned, equipped]);
  return (
    <article className="rounded-card border border-line bg-paper p-3 text-paper-ink">
      <canvas ref={ref} className="h-36 w-full rounded-xl" />
      <h3 className="mt-2 font-display text-lg">{name}</h3>
      <p className="mt-1 text-sm">{cost} cr</p>
      {owned ? (
        <button type="button" onClick={onEquip} className="mt-2 w-full rounded-full bg-paper-ink py-2 text-sm text-cream">
          {equipped ? "Take off" : "Equip"}
        </button>
      ) : (
        <button
          type="button"
          disabled={credits < cost}
          onClick={onBuy}
          className="mt-2 w-full rounded-full bg-paper-ink py-2 text-sm text-cream disabled:opacity-40"
        >
          Buy
        </button>
      )}
    </article>
  );
}
