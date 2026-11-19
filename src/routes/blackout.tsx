import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountBlackout, type BlackoutHud } from "@/game/blackout";

export const Route = createFileRoute("/blackout")({ component: BlackoutPage });

const empty: BlackoutHud = { hp: 100, power: 1, kills: 0, players: 1, note: "" };

function BlackoutPage() {
  const ready = useHydrated();
  return <Shell bare>{ready ? <Field /> : <p className="p-6 text-mute">Opening Blackout…</p>}</Shell>;
}

function Field() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountBlackout> | null>(null);
  const [hud, setHud] = useState<BlackoutHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountBlackout(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#07080c]">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
          Games
        </Link>
        <div className="max-w-xs rounded-2xl border-2 border-ink bg-[#f3f0e8] px-3 py-2 text-right text-xs text-ink">
          <p>
            HP {hud.hp} · Strength {hud.power} · {hud.kills} kills · {hud.players} here
          </p>
          <p className="mt-1">{hud.note}</p>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 lg:hidden">
        <Pad onChange={(x, y) => api.current?.nudge(x, y)} />
      </div>
    </div>
  );
}

function Pad({ onChange }: { onChange: (x: number, y: number) => void }) {
  const held = useRef({ x: 0, y: 0 });
  function set(x: number, y: number, down: boolean) {
    held.current = down ? { x, y } : { x: 0, y: 0 };
    onChange(held.current.x, held.current.y);
  }
  const key = (label: string, x: number, y: number) => (
    <button
      type="button"
      className="h-12 w-12 rounded-full border-2 border-ink bg-[#f3f0e8] text-sm text-ink"
      onPointerDown={() => set(x, y, true)}
      onPointerUp={() => set(x, y, false)}
      onPointerLeave={() => set(x, y, false)}
    >
      {label}
    </button>
  );
  return (
    <div className="grid grid-cols-3 gap-1">
      <span />
      {key("W", 0, -1)}
      <span />
      {key("A", -1, 0)}
      <span />
      {key("D", 1, 0)}
      <span />
      {key("S", 0, 1)}
      <span />
    </div>
  );
}
