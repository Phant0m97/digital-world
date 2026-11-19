import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { BIZ_COST, COSMETICS, SKINS, type BizId, type Cosmetic, type CropId, type FarmHud, type Look } from "@/game/farm";

export const Route = createFileRoute("/farm")({ component: FarmPage });

const empty: FarmHud = {
  coins: 0,
  seeds: { wheat: 0, carrot: 0, pumpkin: 0 },
  selected: "wheat",
  note: "Loading the field…",
  day: 1,
  seasonDone: false,
  inside: false,
  creating: false,
  look: { skin: "#f3d2b3", shirt: "#2ec8e6", pants: "#245c66", hat: "straw", hair: "brown" },
  owned: [],
  shopLevel: 0,
  restLevel: 0,
  near: null,
};

function FarmPage() {
  const ready = useHydrated();
  return (
    <Shell bare>
      {ready ? <Field /> : <p className="p-6 text-mute">Opening PolyFarm…</p>}
    </Shell>
  );
}

function Field() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<Awaited<ReturnType<typeof import("@/game/farm").mountFarm>> | null>(null);
  const [hud, setHud] = useState<FarmHud>(empty);
  const crops: CropId[] = ["wheat", "carrot", "pumpkin"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let destroy = () => {};
    void import("@/game/farm").then((mod) => {
      if (dead) return;
      const mounted = mod.mountFarm(canvas, setHud);
      api.current = mounted;
      destroy = mounted.destroy;
    });
    return () => {
      dead = true;
      destroy();
    };
  }, []);

  const biz: BizId | null = hud.near === "shop" || hud.near === "restaurant" ? hud.near : null;
  const bizLevel = biz === "shop" ? hud.shopLevel : biz === "restaurant" ? hud.restLevel : 0;

  return (
    <div className="relative h-[calc(100dvh-4.25rem)]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            PolyFarm · Day {hud.day} · {hud.coins} coins{hud.inside ? " · Inside" : ""}
          </p>
          <p>{hud.seasonDone ? "Season won. Keep farming." : "Earn 200 to finish the season."}</p>
          <p className="mt-1">{hud.note}</p>
        </div>
      </div>
      {hud.creating ? (
        <Creator
          look={hud.look}
          onLook={(look) => api.current?.previewLook(look)}
          onStart={() => api.current?.confirmLook()}
        />
      ) : null}
      {hud.near === "village" && !hud.creating ? (
        <Stall hud={hud} onWear={(id) => api.current?.wear(id)} />
      ) : null}
      {biz && !hud.creating ? (
        <div className="absolute top-16 left-3 w-56 rounded-2xl border-2 border-ink bg-[#f3f0e8] p-3 text-sm text-ink">
          <p className="font-display text-xl font-bold capitalize">{biz}</p>
          <p className="mt-1 text-xs">{bizLevel === 0 ? "Nothing is built here yet." : `Level ${bizLevel} of 3. It pays out each day.`}</p>
          {bizLevel < 3 ? (
            <button type="button" className="mt-3 rounded-full bg-cyan px-3 py-2 text-sm" onClick={() => api.current?.upgrade(biz)}>
              {bizLevel === 0 ? "Set up" : "Upgrade"} · {BIZ_COST[biz][bizLevel]} coins
            </button>
          ) : (
            <p className="mt-2 text-xs">Fully upgraded.</p>
          )}
        </div>
      ) : null}
      {hud.creating ? null : (
        <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-end justify-between gap-2 px-3">
          <div className="flex gap-2 lg:hidden">
            <Pad onChange={(x, z) => api.current?.nudge(x, z)} />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {crops.map((crop) => (
              <button
                key={crop}
                type="button"
                onClick={() => api.current?.select(crop)}
                className={`rounded-full px-3 py-2 text-sm capitalize ${hud.selected === crop ? "bg-cyan text-ink" : "bg-[#f3f0e8] text-ink"}`}
              >
                {crop} {hud.seeds[crop]}
              </button>
            ))}
            <button type="button" className="rounded-full bg-mag px-3 py-2 text-sm text-ink" onClick={() => api.current?.buy()}>
              Buy seed
            </button>
            <button type="button" className="rounded-full bg-cream px-3 py-2 text-sm text-ink" onClick={() => api.current?.act()}>
              Use
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Creator({ look, onLook, onStart }: { look: Look; onLook: (look: Partial<Look>) => void; onStart: () => void }) {
  const free = COSMETICS.filter((item) => item.price === 0);
  return (
    <div className="absolute top-16 bottom-4 left-3 flex w-[min(24rem,calc(100%-1.5rem))] flex-col gap-3 overflow-auto rounded-2xl border-2 border-ink bg-[#f3f0e8] p-4 text-ink">
      <p className="font-display text-2xl font-bold">Your farmer</p>
      <Swatches label="Skin" values={SKINS} selected={look.skin} onPick={(skin) => onLook({ skin })} />
      <Choices label="Hair" items={free.filter((item) => item.slot === "hair")} selected={look.hair} onPick={(item) => onLook({ hair: item.hair })} />
      <Choices label="Hat" items={free.filter((item) => item.slot === "hat")} selected={look.hat} onPick={(item) => onLook({ hat: item.hat })} />
      <Choices label="Shirt" items={free.filter((item) => item.slot === "shirt")} selected={look.shirt} onPick={(item) => onLook({ shirt: item.color })} />
      <Choices label="Pants" items={free.filter((item) => item.slot === "pants")} selected={look.pants} onPick={(item) => onLook({ pants: item.color })} />
      <button type="button" className="mt-auto rounded-full bg-cyan px-4 py-3 text-sm font-bold" onClick={onStart}>
        Start farming
      </button>
    </div>
  );
}

function Stall({ hud, onWear }: { hud: FarmHud; onWear: (id: string) => void }) {
  return (
    <div className="absolute top-16 bottom-24 left-3 w-[min(22rem,calc(100%-1.5rem))] overflow-auto rounded-2xl border-2 border-ink bg-[#f3f0e8] p-3 text-ink">
      <p className="font-display text-2xl font-bold">Village stall</p>
      <div className="mt-2 flex flex-col gap-1">
        {COSMETICS.map((item) => {
          const owned = hud.owned.includes(item.id);
          return (
            <button key={item.id} type="button" className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-left text-sm" onClick={() => onWear(item.id)}>
              <span>{item.name}</span>
              <span>{owned ? "Wear" : `${item.price} coins`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Swatches({ label, values, selected, onPick }: { label: string; values: string[]; selected: string; onPick: (value: string) => void }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex gap-2">
        {values.map((value) => (
          <button key={value} type="button" className={`size-8 rounded-full border-2 ${selected === value ? "border-ink" : "border-transparent"}`} style={{ background: value }} onClick={() => onPick(value)} />
        ))}
      </div>
    </div>
  );
}

function Choices({
  label,
  items,
  selected,
  onPick,
}: {
  label: string;
  items: Cosmetic[];
  selected: string;
  onPick: (item: Cosmetic) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((item) => {
          const value = item.color || item.hat || item.hair;
          return (
            <button key={item.id} type="button" className={`rounded-full px-3 py-1 text-sm ${value === selected ? "bg-cyan" : "bg-white/70"}`} onClick={() => onPick(item)}>
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pad({ onChange }: { onChange: (x: number, z: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      <span />
      <Hold label="N" onDown={() => onChange(0, -1)} onUp={() => onChange(0, 0)} />
      <span />
      <Hold label="W" onDown={() => onChange(-1, 0)} onUp={() => onChange(0, 0)} />
      <span />
      <Hold label="E" onDown={() => onChange(1, 0)} onUp={() => onChange(0, 0)} />
      <span />
      <Hold label="S" onDown={() => onChange(0, 1)} onUp={() => onChange(0, 0)} />
      <span />
    </div>
  );
}

function Hold({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button type="button" className="size-10 rounded-xl bg-[#f3f0e8] text-sm text-ink" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp}>
      {label}
    </button>
  );
}
