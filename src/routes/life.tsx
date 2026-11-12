import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { act, clock, freshLife, type LifeState } from "@/game/lifesim";

export const Route = createFileRoute("/life")({ component: LifePage });

const KEY = "lifesim-v1";

function readSave(): LifeState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshLife();
    const saved = JSON.parse(raw) as LifeState;
    return { ...freshLife(), ...saved, log: saved.log?.length ? saved.log : freshLife().log };
  } catch {
    return freshLife();
  }
}

function LifePage() {
  const [life, setLife] = useState<LifeState>(freshLife);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
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

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || life.ending) return;
    setLife((current) => act({ ...current, log: [...current.log, `> ${trimmed}`] }, trimmed));
    setText("");
  }

  const home = life.home === "house" ? "House" : life.home === "loft" ? "Loft" : "Studio";

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

        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="Day" value={`${life.day} ${clock(life)}`} />
          <Stat label="Place" value={life.place} />
          <Stat label="Home" value={home} />
          <Stat label="Money" value={`$${life.money}`} />
          <Stat label="Hunger" value={`${life.hunger}`} />
          <Stat label="Tired" value={`${life.tired}`} />
          <Stat label="Job" value={life.job} />
          <Stat label="With" value={life.spouse ?? life.dating ?? "no one"} />
        </div>

        <div ref={logRef} className="h-[46vh] space-y-3 overflow-y-auto rounded-card border border-line bg-panel p-4">
          {life.log.map((line, index) => (
            <p key={`${index}-${line.slice(0, 12)}`} className={line.startsWith("> ") ? "text-cyan" : "text-cream"}>
              {line}
            </p>
          ))}
        </div>

        <p className="text-sm text-mute">Carrying {life.inventory.length ? life.inventory.join(", ") : "nothing"}</p>

        {life.ending ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-xl">{life.ending}</p>
            <button
              type="button"
              className="rounded-full bg-cyan px-4 py-2 font-display text-ink"
              onClick={() => setLife(freshLife())}
            >
              New life
            </button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(text);
            }}
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type what you want to do"
              className="min-w-0 flex-1 rounded-full border border-line bg-ink px-4 py-3"
              autoFocus
            />
            <button type="submit" className="rounded-full bg-cyan px-4 py-3 font-display text-ink">
              Do
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3 py-2">
      <p className="text-xs text-mute uppercase">{label}</p>
      <p className="font-display capitalize">{value}</p>
    </div>
  );
}
