import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { AVATARS, MODES, PAINTS, SKINS, paintHex, weaponById, type CosmeticSlot, type Dyes, type Loadout, type ModeId } from "@/data/catalog";
import { MatchView } from "@/game/match-view";
import type { MatchFighterSetup, MatchResult, MatchSetup } from "@/game/engine";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: MODES.some((mode) => mode.id === search.mode) ? (search.mode as ModeId) : "dm",
    players: clampPlayers(Number(search.players) || 6),
  }),
  component: PlayPage,
});

function clampPlayers(value: number) {
  if (!Number.isFinite(value)) return 6;
  return Math.max(2, Math.min(8, Math.round(value)));
}

function botLoadout(n: number): Loadout {
  const pick = (slot: CosmeticSlot, salt: number) => {
    const options = [null, ...SKINS.filter((item) => item.slot === slot).map((item) => item.id)];
    return options[(n + salt) % options.length] ?? null;
  };
  return { head: pick("head", 1), body: pick("body", 3), legs: pick("legs", 5) };
}

function botDyes(n: number): Dyes {
  const hex = (salt: number) => PAINTS[(n + salt) % PAINTS.length]!.hex;
  return { head: hex(1), body: hex(3), legs: hex(5) };
}

function PlayPage() {
  const ready = useHydrated();
  const search = Route.useSearch();
  const profile = useWorld((state) => state.profile);
  const paint = useWorld((state) => state.paint);
  const loadout = useWorld((state) => state.equipped);
  const cosmeticColors = useWorld((state) => state.cosmeticColors);
  const weapon = useWorld((state) => state.equippedWeapon);
  const party = useWorld((state) => state.party);
  const award = useWorld((state) => state.award);
  const [result, setResult] = useState<MatchResult | null>(null);
  const paid = useRef(false);

  const setup = useMemo<MatchSetup>(() => {
    const youName = profile?.username || "You";
    const others: MatchFighterSetup[] = [];
    const colors = PAINTS.map((item) => item.hex).filter((hex) => hex !== paintHex(paint));
    const youDyes: Dyes = {
      head: paintHex(loadout.head ? (cosmeticColors[loadout.head] ?? paint) : paint),
      body: paintHex(loadout.body ? (cosmeticColors[loadout.body] ?? paint) : paint),
      legs: paintHex(loadout.legs ? (cosmeticColors[loadout.legs] ?? paint) : paint),
    };
    party.forEach((member, index) => {
      others.push({
        name: member.name,
        color: colors[index % colors.length]!,
        loadout: botLoadout(index + 1),
        dyes: botDyes(index + 1),
        weapon: index % 2 === 0 ? "marker" : "spray",
        bot: true,
      });
    });
    const target = Math.max(search.players, others.length + 1);
    let cursor = 0;
    while (others.length + 1 < target) {
      const avatar = AVATARS[cursor % AVATARS.length]!;
      if (avatar.name !== youName && !others.some((entry) => entry.name === avatar.name)) {
        others.push({
          name: avatar.name,
          color: colors[(others.length + 2) % colors.length]!,
          loadout: botLoadout(cursor + 2),
          dyes: botDyes(cursor + 4),
          weapon: WEAPON_CYCLE[cursor % WEAPON_CYCLE.length]!,
          bot: true,
        });
      }
      cursor += 1;
      if (cursor > 40) break;
    }
    return {
      mode: search.mode,
      you: {
        name: youName,
        color: paintHex(paint),
        loadout,
        dyes: youDyes,
        weapon,
        bot: false,
      },
      others,
    };
  }, [cosmeticColors, paint, party, profile?.username, search.mode, search.players, loadout, weapon]);

  if (!ready) {
    return (
      <Shell bare>
        <p className="p-6 text-mute">Loading the yard…</p>
      </Shell>
    );
  }

  return (
    <Shell bare>
      <div className="flex h-[calc(100dvh-4.25rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-sm">
          <p className="font-display">{MODES.find((mode) => mode.id === search.mode)?.name}</p>
          <p className="text-mute">{weaponById(weapon).name}</p>
          <Link to="/paintball" className="ml-auto text-cyan">
            Leave yard
          </Link>
        </div>
        <div className="relative min-h-0 flex-1">
          <MatchView
            key={`${search.mode}-${search.players}-${setup.others.map((entry) => entry.name).join("-")}`}
            setup={setup}
            onEnd={(next) => {
              if (!paid.current) {
                paid.current = true;
                if (next.youCredits) award(next.youCredits);
              }
              setResult(next);
            }}
          />
          {result ? (
            <div className="absolute inset-0 grid place-items-center bg-ink/75 p-4">
              <div className="w-full max-w-md rounded-card border border-line bg-panel p-5">
                <p className="font-display text-xs tracking-[0.22em] text-cyan uppercase">Yard closed</p>
                <h2 className="mt-1 font-display text-3xl">{result.title}</h2>
                <ol className="mt-4 space-y-2">
                  {result.placements.map((row) => (
                    <li key={row.name} className="flex items-center gap-2 text-sm">
                      <span className="w-6 font-display text-mute">{row.rank}</span>
                      <span className="size-3 rounded-full" style={{ background: row.color }} />
                      <span className={row.you ? "text-cyan" : ""}>{row.name}</span>
                      <span className="ml-auto text-mute">{row.score} pts</span>
                      <span className="w-14 text-right text-cyan">{row.credits ? `+${row.credits}` : ""}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex gap-2">
                  <Link to="/paintball" className="rounded-full bg-cyan px-4 py-3 font-display text-ink">
                    Back to locker
                  </Link>
                  <button type="button" className="rounded-full border border-line px-4 py-3" onClick={() => window.location.reload()}>
                    Rematch
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

const WEAPON_CYCLE = ["marker", "splatter", "needle", "spray", "longarm", "hopper"];

