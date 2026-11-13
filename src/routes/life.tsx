import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { act, clock, freshLife, PEOPLE, type LifeState, type Place } from "@/game/lifesim";

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

  function submit(label: string, command: string) {
    if (life.ending) return;
    setLife((current) => act({ ...current, log: [...current.log, `> ${label}`] }, command));
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
          <div className="flex flex-wrap gap-2">
            {choices(life).map((action) => (
              <button
                key={action.command}
                type="button"
                onClick={() => submit(action.label, action.command)}
                className="min-h-11 rounded-full border border-line px-3 py-2 text-sm"
              >
                {action.label}
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
      <p className="font-display capitalize">{value}</p>
    </div>
  );
}

function choices(life: LifeState) {
  const actions: { label: string; command: string }[] = [{ label: "Look", command: "look" }];
  const places: { label: string; command: string; place: Place }[] = [
    { label: "Home", command: "go home", place: "apartment" },
    { label: "Street", command: "walk the street", place: "street" },
    { label: "Park", command: "go to the park", place: "park" },
    { label: "Diner", command: "go to the diner", place: "diner" },
    { label: "Shop", command: "go to the shop", place: "shop" },
    { label: "City hall", command: "go to city hall", place: "hall" },
    { label: "Hospital", command: "go to the hospital", place: "hospital" },
  ];
  for (const place of places) {
    if (place.place !== life.place) actions.push(place);
  }
  if (life.job !== "none") {
    actions.push({ label: "Work", command: "work" }, { label: "Quit job", command: "quit job" });
  } else if (life.inventory.includes("laptop")) {
    actions.push({ label: "Apply to code", command: "apply coder" });
  } else {
    actions.push({ label: "Apply for a job", command: "apply for a job" });
  }
  actions.push({ label: "Eat", command: "eat" }, { label: "Sleep", command: "sleep" }, { label: "Jog", command: "jog" });
  if (life.place === "apartment") {
    actions.push({ label: "Shower", command: "shower" }, { label: "Study", command: "study" }, { label: "Pay rent", command: "pay rent" });
  }
  if (life.place === "hall") actions.push({ label: "Pay rent", command: "pay rent" });
  if ((life.place === "apartment" || life.place === "hall") && life.home === "studio") {
    actions.push({ label: "Move to loft", command: "move to a loft" });
  }
  if ((life.place === "apartment" || life.place === "hall") && life.home !== "house") {
    actions.push({ label: "Move to house", command: "move to a house" });
  }
  const shop = life.place === "shop" || life.place === "diner";
  if (shop) actions.push({ label: "Buy bread", command: "buy bread" }, { label: "Buy coffee", command: "buy coffee" });
  if (life.place === "shop") {
    if (!life.inventory.includes("groceries")) actions.push({ label: "Buy groceries", command: "buy groceries" });
    if (!life.inventory.includes("book")) actions.push({ label: "Buy book", command: "buy book" });
    if (!life.inventory.includes("laptop")) actions.push({ label: "Buy laptop", command: "buy laptop" });
    if (!life.inventory.includes("ring")) actions.push({ label: "Buy ring", command: "buy ring" });
  }
  if ((life.place === "shop" || life.place === "park") && !life.inventory.includes("flowers")) {
    actions.push({ label: "Buy flowers", command: "buy flowers" });
  }
  if ((life.place === "shop" || life.place === "hospital") && !life.inventory.includes("meds")) {
    actions.push({ label: "Buy meds", command: "buy meds" });
  }
  if (life.inventory.includes("groceries") && life.place === "apartment") actions.push({ label: "Cook", command: "cook groceries" });
  if (life.inventory.includes("meds")) actions.push({ label: "Use meds", command: "use meds" });
  if (life.inventory.includes("book")) actions.push({ label: "Read book", command: "use book" });
  if (life.inventory.includes("coffee")) actions.push({ label: "Drink coffee", command: "use coffee" });
  if (life.inventory.includes("laptop")) actions.push({ label: "Use laptop", command: "use laptop" });
  const here = new Map<string, string>();
  const locals: Partial<Record<Place, string>> = { diner: "marco", shop: "priya", hospital: "sam", hall: "ruth" };
  const local = locals[life.place];
  if (local) here.set(local, local);
  if (life.visitor) here.set(life.visitor, life.visitor);
  if (life.dating) here.set(life.dating, life.dating);
  if (life.spouse) here.set(life.spouse, life.spouse);
  for (const person of PEOPLE) {
    if (!here.has(person.id)) continue;
    actions.push({ label: `Talk to ${person.name}`, command: `talk to ${person.name}` });
  }
  const someone = life.visitor || life.dating || local;
  if (someone && !life.spouse) {
    actions.push({ label: "Ask out", command: "ask out" });
    if (life.inventory.includes("flowers")) actions.push({ label: "Give flowers", command: "give flowers" });
    if (life.inventory.includes("ring")) actions.push({ label: "Propose", command: "propose" });
  }
  if (life.dating && life.place === "apartment") actions.push({ label: "Invite over", command: "invite" });
  if (life.spouse && life.home === "house") actions.push({ label: "Settle", command: "settle" });
  if (life.inventory.includes("wallet")) actions.push({ label: "Return wallet", command: "return wallet" });
  const last = [...life.log].reverse().find((line) => !line.startsWith("> ")) ?? "";
  if (/dog/i.test(last)) actions.push({ label: "Follow the dog", command: "follow the dog" });
  if (/wallet/i.test(last) && !life.inventory.includes("wallet") && !life.flags.includes("wallet")) {
    actions.push({ label: "Take wallet", command: "take the wallet" });
  }
  return actions;
}
