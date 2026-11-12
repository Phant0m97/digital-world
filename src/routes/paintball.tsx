import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Shell, useHydrated } from "@/components/shell";
import {
  MODES,
  PAINTS,
  SKIN_HEX,
  SKINS,
  WEAPONS,
  paintHex,
  wornList,
  type Dyes,
  type Loadout,
  type ModeId,
} from "@/data/catalog";
import { paintPreview } from "@/game/engine";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/paintball")({ component: GamesPage });

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
  const paint = useWorld((state) => state.paint);
  const cosmeticColors = useWorld((state) => state.cosmeticColors);
  const equipped = useWorld((state) => state.equipped);
  const weapon = useWorld((state) => state.equippedWeapon);
  const ownedSkins = useWorld((state) => state.ownedSkins);
  const ownedWeapons = useWorld((state) => state.ownedWeapons);
  const party = useWorld((state) => state.party);
  const setMode = useWorld((state) => state.setMode);
  const setPaint = useWorld((state) => state.setPaint);
  const setCosmeticColor = useWorld((state) => state.setCosmeticColor);
  const buySkin = useWorld((state) => state.buySkin);
  const buyWeapon = useWorld((state) => state.buyWeapon);
  const equipSkin = useWorld((state) => state.equipSkin);
  const setWeapon = useWorld((state) => state.setWeapon);
  const toggleParty = useWorld((state) => state.toggleParty);
  const profile = useWorld((state) => state.profile);
  const worn = wornList(equipped);
  const [looking, setLooking] = useState<string | null>(null);
  const preview = looking && !worn.includes(looking) ? [...worn, looking] : worn;
  const dyes: Dyes = Object.fromEntries(
    preview.map((id) => [id, cosmeticColors[id] ? paintHex(cosmeticColors[id]) : (SKIN_HEX[id] ?? paintHex(paint))]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Link to="/games" className="text-sm text-cyan">
          Games
        </Link>
        <h1 className="font-display text-3xl font-bold">Paintball</h1>
        <p className="font-display text-xl text-cyan">{credits} cr</p>
        <div className="flex gap-2">
          {PAINTS.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              aria-label={swatch.id}
              onClick={() => setPaint(swatch.id)}
              className={`size-7 rounded-full border-2 ${paint === swatch.id ? "border-cream" : swatch.id === "black" ? "border-mute" : "border-transparent"}`}
              style={{ background: swatch.hex }}
            />
          ))}
        </div>
        <Link
          to="/play"
          search={{ mode, players: 1 }}
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

      <section className="grid items-start gap-6 lg:grid-cols-[7.5rem_1fr]">
        <div className="rounded-card border border-line bg-paper p-2 text-paper-ink">
          <StickPreview loadout={preview} dyes={dyes} paint={paintHex(paint)} />
          <p className="mt-1 text-center font-display text-sm">{profile?.username ?? "You"}</p>
        </div>
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SKINS.map((item) => {
              const owned = ownedSkins.includes(item.id);
              const on = worn.includes(item.id);
              return (
                <article
                  key={item.id}
                  className={`rounded-card border bg-panel p-4 ${looking === item.id || on ? "border-cyan" : "border-line"}`}
                >
                  <button type="button" onClick={() => setLooking(looking === item.id ? null : item.id)} className="w-full text-left">
                    <h3 className="font-display text-xl">{item.name}</h3>
                    <p className="mt-1 text-sm text-mute">{item.cost} cr</p>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {PAINTS.map((swatch) => {
                      const chosen = cosmeticColors[item.id] === swatch.id;
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          aria-label={`${item.name} ${swatch.id}`}
                          onClick={() => {
                            if (!owned) return;
                            setCosmeticColor(item.id, swatch.id);
                          }}
                          disabled={!owned}
                          className={`size-6 rounded-full border-2 disabled:opacity-40 ${chosen ? "border-cream" : swatch.id === "black" ? "border-mute" : "border-transparent"}`}
                          style={{ background: swatch.hex }}
                        />
                      );
                    })}
                  </div>
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => equipSkin(item.id)}
                      className="mt-4 w-full rounded-full bg-cream py-2 text-sm text-ink"
                    >
                      {on ? "Take off" : "Equip"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={credits < item.cost}
                      onClick={() => buySkin(item.id, item.cost)}
                      className="mt-4 w-full rounded-full bg-cyan py-2 text-sm text-ink disabled:opacity-40"
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

      <section>
        <h2 className="mb-4 font-display text-2xl">Weapons</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {WEAPONS.map((item) => {
            const owned = ownedWeapons.includes(item.id);
            const on = weapon === item.id;
            return (
              <article key={item.id} className="rounded-card border border-line bg-panel p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl">{item.name}</h3>
                  <p className="text-sm text-cyan">{item.cost === 0 ? "Owned" : `${item.cost} cr`}</p>
                </div>
                <p className="mt-3 text-sm">
                  <span className="text-cyan">Strong:</span> {item.strength}
                </p>
                <p className="text-sm">
                  <span className="text-mag">Weak:</span> {item.weakness}
                </p>
                <div className="mt-4">
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => setWeapon(item.id)}
                      className="rounded-full bg-cream px-4 py-2 text-sm text-ink"
                    >
                      {on ? "Equipped" : "Equip"}
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

function StickPreview({ loadout, dyes, paint }: { loadout: Loadout; dyes: Dyes; paint: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const worn = loadout.join(",");
  const colors = Object.values(dyes).join(",");
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 180;
    canvas.height = 220;
    paintPreview(canvas, loadout, dyes, paint);
  }, [worn, colors, paint, loadout, dyes]);
  return <canvas ref={ref} width={180} height={220} className="mx-auto block h-40 w-auto rounded-xl" />;
}
