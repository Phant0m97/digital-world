import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { choose, freshLife, roleName, sceneChoices, type LifeState } from "@/game/lifesim";

export const Route = createFileRoute("/life")({ component: LifePage });

const KEY = "lifesim-v2";

function readSave(): LifeState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshLife();
    const saved = JSON.parse(raw) as LifeState;
    if (!saved.scene || !saved.log?.length) return freshLife();
    return { ...freshLife(), ...saved };
  } catch {
    return freshLife();
  }
}

function LifePage() {
  const [life, setLife] = useState<LifeState>(freshLife);
  const [ready, setReady] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLife(readSave());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(life));
  }, [life, ready]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [life.log.length]);

  const choices = sceneChoices(life);

  return (
    <Shell>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs tracking-[0.28em] text-cyan uppercase">Game 02</p>
            <h1 className="font-display text-4xl font-bold">LifeSim</h1>
          </div>
          <Link to="/games" className="text-sm text-cyan">
            Games
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Day" value={`${life.day}`} />
          <Stat label="Role" value={roleName(life.job)} />
        </div>

        <div ref={logRef} className="h-[46vh] space-y-3 overflow-y-auto rounded-card border border-line bg-panel p-4">
          {life.log.map((line, index) => (
            <p key={`${index}-${line.slice(0, 16)}`} className={line.startsWith("> ") ? "text-cyan" : "text-cream"}>
              {line}
            </p>
          ))}
        </div>

        {life.ending ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-xl">{life.ending}</p>
            <button type="button" className="rounded-full bg-cyan px-4 py-2 font-display text-ink" onClick={() => setLife(freshLife())}>
              New life
            </button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((choice, index) => (
              <button
                key={choice.label}
                type="button"
                onClick={() => setLife((current) => choose(current, index as 0 | 1))}
                className="min-h-11 rounded-2xl border border-line px-4 py-3 text-left"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3 py-2">
      <p className="text-xs text-mute uppercase">{label}</p>
      <p className="font-display">{value}</p>
    </div>
  );
}
