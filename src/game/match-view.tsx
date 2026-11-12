import { useEffect, useRef, useState } from "react";
import { createMatch, type HudSnap, type MatchResult, type MatchSetup, type TouchState } from "@/game/engine";

const emptyHud: HudSnap = {
  mode: "dm",
  timeLeft: 90,
  hp: 2,
  weapon: "Standard Marker",
  youScore: 0,
  leader: "",
  leaderScore: 0,
  team0: 0,
  team1: 0,
  crystal0: 18,
  crystal1: 18,
  alive: 0,
  feed: [],
  ended: false,
};

export function MatchView({
  setup,
  onEnd,
}: {
  setup: MatchSetup;
  onEnd: (result: MatchResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<ReturnType<typeof createMatch> | null>(null);
  const [hud, setHud] = useState<HudSnap>(emptyHud);
  const touch = useRef<TouchState>({ moveX: 0, jump: false, drop: false, fire: false, aim: null });
  const stick = useRef<{ id: number | null; originX: number }>({ id: null, originX: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const match = createMatch(canvas, setup, onEnd);
    api.current = match;
    const timer = window.setInterval(() => setHud(match.getHud()), 120);
    return () => {
      window.clearInterval(timer);
      match.destroy();
      api.current = null;
    };
    // setup is fixed for the life of this view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push(partial: Partial<TouchState>) {
    Object.assign(touch.current, partial);
    api.current?.setTouch(touch.current);
  }

  return (
    <div className="arena-shell relative h-full min-h-[70dvh]">
      <canvas ref={canvasRef} className="arena-canvas h-full w-full" />
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-end">
        <div className="rounded-2xl bg-ink/80 px-3 py-2 text-right text-xs text-cream">
          <p>{hud.weapon}</p>
          <p>
            You {hud.youScore} · Lead {hud.leader} {hud.leaderScore}
          </p>
          {hud.mode === "tdm" ? (
            <p>
              Left {hud.team0} · Right {hud.team1}
            </p>
          ) : null}
          {hud.mode === "crystal" ? (
            <p>
              Gems {hud.crystal0} / {hud.crystal1}
            </p>
          ) : null}
          {hud.mode === "lms" ? <p>{hud.alive} still standing</p> : null}
          {hud.feed[0] ? <p className="mt-1 text-cyan">{hud.feed[0]}</p> : null}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-3 flex items-end justify-between gap-3 px-3 lg:hidden">
        <div
          className="touch-btn relative size-28 rounded-full border border-ink/30 bg-cream/70"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            stick.current = { id: event.pointerId, originX: event.clientX };
          }}
          onPointerMove={(event) => {
            if (stick.current.id !== event.pointerId) return;
            const dx = event.clientX - stick.current.originX;
            push({ moveX: Math.max(-1, Math.min(1, dx / 40)) });
          }}
          onPointerUp={(event) => {
            if (stick.current.id === event.pointerId) stick.current.id = null;
            push({ moveX: 0 });
          }}
        >
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-paper-ink">Move</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="touch-btn rounded-full bg-cream px-4 text-sm text-paper-ink"
            onPointerDown={() => push({ jump: true })}
            onPointerUp={() => push({ jump: false })}
            onPointerCancel={() => push({ jump: false })}
          >
            Jump
          </button>
          <button
            type="button"
            className="touch-btn rounded-full bg-mag px-4 text-sm text-ink"
            onPointerDown={() => push({ fire: true, aim: touch.current.aim ?? 0 })}
            onPointerUp={() => push({ fire: false })}
            onPointerCancel={() => push({ fire: false })}
          >
            Paint
          </button>
        </div>
      </div>
    </div>
  );
}
