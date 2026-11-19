import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountFoundry, type FoundryHud } from "@/game/foundry";

export const Route = createFileRoute("/foundry")({ component: FoundryPage });

const empty: FoundryHud = {
  gold: 0,
  ore: { iron: 0, copper: 0, coal: 0 },
  bars: { iron: 0, copper: 0 },
  orders: [],
  note: "",
  smelt: 0,
  forging: false,
  marker: 0,
  strikes: [],
  done: false,
  zone: "",
};

function FoundryPage() {
  const ready = useHydrated();
  return <Shell bare>{ready ? <Shop /> : <p className="p-6 text-mute">Opening Foundry…</p>}</Shell>;
}

function Shop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountFoundry> | null>(null);
  const [hud, setHud] = useState<FoundryHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountFoundry(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#cbb59a]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="max-w-sm rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            {hud.gold} gold · {hud.zone}
            {hud.smelt > 0 ? ` · smelting ${hud.smelt.toFixed(0)}s` : ""}
          </p>
          <p>
            ore {hud.ore.iron}i {hud.ore.copper}c {hud.ore.coal} coal · bars {hud.bars.iron}i {hud.bars.copper}c
          </p>
          <p>{hud.done ? "The week is won." : "Earn 250 gold."}</p>
          <p className="mt-1">{hud.note}</p>
          <p className="mt-1">
            {hud.orders.map((order) => `${order.metal} ${order.item} ${Math.ceil(order.patience)}s`).join(" · ")}
          </p>
        </div>
      </div>
      {hud.forging ? (
        <div className="absolute top-28 right-3 left-3 mx-auto h-4 max-w-md overflow-hidden rounded-full border-2 border-ink bg-[#f3f0e8]">
          <div className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-cyan/70" />
          <div className="absolute top-0 h-full w-1 bg-ink" style={{ left: `${hud.marker * 100}%` }} />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-3 flex items-end justify-between gap-2 px-3">
        <div
          className="relative size-28 rounded-full border border-ink/30 bg-[#f3f0e8]/80 lg:hidden"
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width / 2);
            const y = event.clientY - (rect.top + rect.height / 2);
            api.current?.nudge(Math.abs(x) > 12 ? Math.sign(x) : 0, Math.abs(y) > 12 ? Math.sign(y) : 0);
          }}
          onPointerUp={() => api.current?.nudge(0, 0)}
          onPointerCancel={() => api.current?.nudge(0, 0)}
        />
        <button type="button" className="ml-auto rounded-full bg-mag px-4 py-3 text-sm text-ink" onClick={() => api.current?.use()}>
          Use
        </button>
      </div>
    </div>
  );
}
