import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import type { CropId, FarmHud } from "@/game/farm";

export const Route = createFileRoute("/farm")({ component: FarmPage });

const empty: FarmHud = {
  coins: 0,
  seeds: { wheat: 0, carrot: 0, pumpkin: 0 },
  selected: "wheat",
  note: "Loading the field…",
  day: 1,
  seasonDone: false,
};

function FarmPage() {
  const ready = useHydrated();
  return (
    <Shell bare>
      {ready ? <Field /> : <p className="p-6 text-mute">Opening Acre…</p>}
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

  return (
    <div className="relative h-[calc(100dvh-4.25rem)]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>Day {hud.day} · {hud.coins} coins</p>
          <p>{hud.seasonDone ? "Season won. Keep farming." : "Earn 200 to finish the season."}</p>
          <p className="mt-1">{hud.note}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-end justify-between gap-2 px-3">
        <div className="flex gap-2 lg:hidden">
          <Pad
            onChange={(x, z) => api.current?.nudge(x, z)}
          />
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
            Use plot
          </button>
        </div>
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
    <button
      type="button"
      className="size-10 rounded-xl bg-[#f3f0e8] text-sm text-ink"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}
