import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { mountBreach, type BreachHud } from "@/game/breach";

export const Route = createFileRoute("/breach")({ component: BreachPage });

const empty: BreachHud = {
  hp: 100,
  armor: 0,
  money: 800,
  mag: 12,
  reserve: 36,
  weapon: "Sidearm",
  round: 1,
  attackScore: 0,
  holdScore: 0,
  phase: "buy",
  timer: 12,
  side: "Plant",
  bomb: "",
  prompt: "",
  note: "",
  locked: false,
};

function BreachPage() {
  const ready = useHydrated();
  return <Shell bare>{ready ? <Match /> : <p className="p-6 text-mute">Loading Breach…</p>}</Shell>;
}

function Match() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof mountBreach> | null>(null);
  const [hud, setHud] = useState<BreachHud>(empty);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mounted = mountBreach(canvas, setHud);
    api.current = mounted;
    return () => mounted.destroy();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4.25rem)] bg-[#8b9096]">
      <canvas ref={canvasRef} className="h-full w-full cursor-crosshair" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="size-3 rounded-full border-2 border-white/90" />
      </div>
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-3 text-sm text-[#f4f1ea]">
        <Link to="/games" className="pointer-events-auto rounded-full bg-[#1c2126] px-4 py-2">
          Games
        </Link>
        <div className="rounded-2xl bg-[#1c2126]/85 px-3 py-2 text-right">
          <p>
            Plant {hud.attackScore} · Hold {hud.holdScore} · Round {hud.round}
          </p>
          <p>
            {hud.side} · {hud.bomb}
          </p>
          <p>{hud.note}</p>
        </div>
      </div>
      {hud.prompt ? <p className="absolute top-20 left-1/2 -translate-x-1/2 rounded-full bg-[#1c2126]/90 px-4 py-2 text-sm text-[#f4f1ea]">{hud.prompt}</p> : null}
      {!hud.locked ? <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-sm text-white">Click to look. WASD moves. Shoot with the mouse.</p> : null}
      <div className="pointer-events-none absolute bottom-4 left-4 text-[#f4f1ea]">
        <p className="font-display text-4xl font-bold">{hud.hp}</p>
        <p className="text-sm">
          {hud.weapon} {hud.mag}/{hud.reserve} · vest {hud.armor}
        </p>
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 text-right text-[#f2c14e]">
        <p className="font-display text-3xl font-bold">${hud.money}</p>
        <p className="text-sm text-[#f4f1ea]">{hud.phase === "live" ? `${hud.timer}s` : hud.phase === "buy" ? `Buy ${hud.timer}s` : hud.phase}</p>
      </div>
      {hud.phase === "buy" ? (
        <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-2">
          <Buy label="Sidearm · 0" onClick={() => api.current?.buy("pistol")} />
          <Buy label="Carbine · 2700" onClick={() => api.current?.buy("rifle")} />
          <Buy label="Bolt · 4300" onClick={() => api.current?.buy("bolt")} />
          <Buy label="Buck · 1500" onClick={() => api.current?.buy("buck")} />
          <Buy label="Vest · 650" onClick={() => api.current?.buy("armor")} />
        </div>
      ) : null}
      {hud.phase === "match" ? (
        <button type="button" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e2c14e] px-5 py-3 font-bold text-[#1c2126]" onClick={() => api.current?.restart()}>
          New match
        </button>
      ) : null}
    </div>
  );
}

function Buy({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="rounded-full bg-[#1c2126] px-3 py-2 text-sm text-[#f4f1ea]" onClick={onClick}>
      {label}
    </button>
  );
}
