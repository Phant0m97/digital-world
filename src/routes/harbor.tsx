import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountHarbor, type HarborHud } from "@/game/harbor";

export const Route = createFileRoute("/harbor")({ component: HarborPage });

const empty: HarborHud = { coins: 0, hold: [], cap: 5, rod: 0, note: "", storm: false, done: false };

function HarborPage() {
  const ready = useHydrated();
  return <Shell bare>{ready ? <Sea /> : <p className="p-6 text-mute">Opening Harbor…</p>}</Shell>;
}

function Sea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountHarbor> | null>(null);
  const [hud, setHud] = useState<HarborHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountHarbor(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#1f6f8a]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="max-w-xs rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            {hud.coins} coins · hold {hud.hold.length}/{hud.cap} · rod {hud.rod}
            {hud.storm ? " · squall" : ""}
          </p>
          <p>{hud.done ? "The cutter is paid off." : "Earn 400 for the cutter."}</p>
          <p className="mt-1">{hud.note}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-3 flex items-end justify-between gap-2 px-3">
        <div className="flex gap-2 lg:hidden">
          <button type="button" className="rounded-full bg-[#f3f0e8] px-3 py-3 text-sm text-ink" onPointerDown={() => api.current?.nudge(-1, 1)} onPointerUp={() => api.current?.nudge(0, 0)}>
            Port
          </button>
          <button type="button" className="rounded-full bg-[#f3f0e8] px-3 py-3 text-sm text-ink" onPointerDown={() => api.current?.nudge(0, 1)} onPointerUp={() => api.current?.nudge(0, 0)}>
            Ahead
          </button>
          <button type="button" className="rounded-full bg-[#f3f0e8] px-3 py-3 text-sm text-ink" onPointerDown={() => api.current?.nudge(1, 1)} onPointerUp={() => api.current?.nudge(0, 0)}>
            Starboard
          </button>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="rounded-full bg-cyan px-4 py-3 text-sm text-ink" onClick={() => api.current?.cast()}>
            Cast / sell
          </button>
          <button type="button" className="rounded-full bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.buy("hold")}>
            Bigger hold
          </button>
          <button type="button" className="rounded-full bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.buy("rod")}>
            Better rod
          </button>
        </div>
      </div>
    </div>
  );
}
