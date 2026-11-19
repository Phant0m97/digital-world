import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountRuins, type RuinsHud } from "@/game/ruins";

export const Route = createFileRoute("/ruins")({ component: RuinsPage });

const empty: RuinsHud = { hp: 6, maxHp: 6, gold: 0, area: "Camp", note: "", blade: 1, won: false };

function RuinsPage() {
  const ready = useHydrated();
  return (
    <Shell bare>
      {ready ? <Expedition /> : <p className="p-6 text-mute">Opening Ruins…</p>}
    </Shell>
  );
}

function Expedition() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountRuins> | null>(null);
  const [hud, setHud] = useState<RuinsHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountRuins(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#1a2218]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            {hud.area} · {"♥".repeat(hud.hp)}
            {"♡".repeat(Math.max(0, hud.maxHp - hud.hp))}
          </p>
          <p>
            {hud.gold} gold · blade {hud.blade}
          </p>
          <p className="mt-1 max-w-56">{hud.won ? "The crypt is yours." : hud.note}</p>
        </div>
      </div>
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
        <div className="ml-auto flex gap-2">
          <button type="button" className="rounded-full bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.useStation()}>
            Use
          </button>
          <button type="button" className="rounded-full bg-mag px-4 py-3 text-sm text-ink" onClick={() => api.current?.swing()}>
            Swing
          </button>
        </div>
      </div>
    </div>
  );
}
