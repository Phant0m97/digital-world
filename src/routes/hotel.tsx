import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountHotel, type HotelHud } from "@/game/hotel";

export const Route = createFileRoute("/hotel")({ component: HotelPage });

const empty: HotelHud = {
  coins: 0,
  stars: 3,
  rooms: 2,
  dirty: 0,
  waiting: 0,
  clerk: false,
  maid: false,
  cook: false,
  note: "",
  done: false,
  buildCost: 120,
  upgradeCost: 110,
  cleaning: 0,
  prompt: "",
};

function HotelPage() {
  const ready = useHydrated();
  return <Shell bare>{ready ? <Desk /> : <p className="p-6 text-mute">Opening Happy Hotel…</p>}</Shell>;
}

function Desk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountHotel> | null>(null);
  const [hud, setHud] = useState<HotelHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountHotel(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#8fd4ff]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="max-w-xs rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            {hud.coins} coins · {"★".repeat(hud.stars)}
            {"☆".repeat(5 - hud.stars)} · {hud.rooms} rooms
          </p>
          <p>{hud.done ? "The hotel is loved." : "WASD walks. Space cleans, checks in, and serves."}</p>
          <p className="mt-1">{hud.note}</p>
        </div>
      </div>
      {hud.prompt ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-[#f3f0e8] px-4 py-2 text-sm font-bold text-ink">
          {hud.prompt}
        </div>
      ) : null}
      {hud.cleaning > 0 ? (
        <div className="absolute bottom-24 left-1/2 w-56 -translate-x-1/2">
          <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-[#f3f0e8]">
            <div className="h-full bg-[#3ecf8e]" style={{ width: `${Math.round(hud.cleaning * 100)}%` }} />
          </div>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-3 flex flex-wrap gap-2 px-3">
        <button type="button" className="rounded-full bg-cyan px-4 py-3 text-sm text-ink" onClick={() => api.current?.build()}>
          Build room · {hud.buildCost}
        </button>
        <button type="button" className="rounded-full border-2 border-ink bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.upgrade()}>
          Upgrade a room · {hud.upgradeCost}
        </button>
        <button type="button" className="rounded-full border-2 border-ink bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.hire("clerk")} disabled={hud.clerk}>
          {hud.clerk ? "Clerk hired" : "Hire clerk · 280"}
        </button>
        <button type="button" className="rounded-full border-2 border-ink bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.hire("maid")} disabled={hud.maid}>
          {hud.maid ? "Maid hired" : "Hire maid · 320"}
        </button>
        <button type="button" className="rounded-full border-2 border-ink bg-[#f3f0e8] px-4 py-3 text-sm text-ink" onClick={() => api.current?.hire("cook")} disabled={hud.cook}>
          {hud.cook ? "Cook hired" : "Hire cook · 240"}
        </button>
      </div>
    </div>
  );
}
