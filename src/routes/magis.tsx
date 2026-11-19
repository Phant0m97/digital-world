import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Shell } from "@/components/shell";
import { asset } from "@/lib/asset";

export const Route = createFileRoute("/magis")({ component: MagisPage });

type Element = "fire" | "water" | "wind" | "earth";
type CardId = "spark" | "wash" | "breeze" | "pebble" | "fireball" | "blast" | "gust" | "rock" | "inferno" | "tidal" | "tempest" | "quake";
type CardDef = { id: CardId; name: string; element: Element; damage: number; cost: number; tier: number };
type Card = CardDef & { uid: number };
type Kind = "fight" | "rest" | "boss";
type Node = { id: number; floor: number; x: number; kind: Kind; links: number[] };
type Enemy = { uid: number; name: string; element: Element; hp: number; max: number; attack: number; boss: boolean };
type Fight = { enemies: Enemy[]; draw: Card[]; hand: Card[]; discard: Card[]; energy: number; log: string };
type Bonus = Partial<Record<CardId, number>>;

const ELEMENTS: Element[] = ["fire", "water", "wind", "earth"];
const BEATS: Record<Element, Element> = { water: "fire", fire: "wind", wind: "earth", earth: "water" };
const INK: Record<Element, string> = { fire: "#e25b4a", water: "#3aa7ff", wind: "#d6e27a", earth: "#c47a3a" };
const SPELL_ART: Record<CardId, string> = {
  spark: "magis/spark.jpg",
  wash: "magis/wash.jpg",
  breeze: "magis/breeze.jpg",
  pebble: "magis/pebble.jpg",
  fireball: "magis/fireball.jpg",
  blast: "magis/blast.jpg",
  gust: "magis/gust.jpg",
  rock: "magis/rock.jpg",
  inferno: "magis/inferno.jpg",
  tidal: "magis/tidal.jpg",
  tempest: "magis/tempest.jpg",
  quake: "magis/quake.jpg",
};
const SPRITE: Record<Element, string> = { fire: "magis/imp.jpg", water: "magis/serpent.jpg", wind: "magis/harpy.jpg", earth: "magis/golem.jpg" };
const NAMES: Record<Element, string[]> = {
  fire: ["Cinder Imp", "Ash Wolf", "Magma Knight", "Inferno Drake"],
  water: ["Tide Slime", "Ripple Eel", "Sea Knight", "Abyss Serpent"],
  wind: ["Breeze Wisp", "Gale Bat", "Storm Harpy", "Sky Reaver"],
  earth: ["Pebble Crab", "Mud Brute", "Stone Golem", "Quake Titan"],
};
const BOOK: Record<CardId, CardDef> = {
  spark: { id: "spark", name: "Spark", element: "fire", damage: 6, cost: 1, tier: 1 },
  wash: { id: "wash", name: "Wash", element: "water", damage: 6, cost: 1, tier: 1 },
  breeze: { id: "breeze", name: "Breeze", element: "wind", damage: 6, cost: 1, tier: 1 },
  pebble: { id: "pebble", name: "Pebble", element: "earth", damage: 6, cost: 1, tier: 1 },
  fireball: { id: "fireball", name: "Fireball", element: "fire", damage: 13, cost: 1, tier: 2 },
  blast: { id: "blast", name: "Water Blast", element: "water", damage: 13, cost: 1, tier: 2 },
  gust: { id: "gust", name: "Gust", element: "wind", damage: 13, cost: 1, tier: 2 },
  rock: { id: "rock", name: "Rock", element: "earth", damage: 13, cost: 1, tier: 2 },
  inferno: { id: "inferno", name: "Inferno", element: "fire", damage: 22, cost: 2, tier: 3 },
  tidal: { id: "tidal", name: "Tidal Wave", element: "water", damage: 22, cost: 2, tier: 3 },
  tempest: { id: "tempest", name: "Tempest", element: "wind", damage: 22, cost: 2, tier: 3 },
  quake: { id: "quake", name: "Quake", element: "earth", damage: 22, cost: 2, tier: 3 },
};
const MAP: Node[] = [
  { id: 0, floor: 0, x: 0.28, kind: "fight", links: [3, 4] },
  { id: 1, floor: 0, x: 0.5, kind: "fight", links: [4, 5] },
  { id: 2, floor: 0, x: 0.74, kind: "fight", links: [5, 6] },
  { id: 3, floor: 1, x: 0.16, kind: "fight", links: [7] },
  { id: 4, floor: 1, x: 0.38, kind: "rest", links: [7, 8] },
  { id: 5, floor: 1, x: 0.62, kind: "fight", links: [8, 9] },
  { id: 6, floor: 1, x: 0.84, kind: "fight", links: [9] },
  { id: 7, floor: 2, x: 0.28, kind: "fight", links: [10] },
  { id: 8, floor: 2, x: 0.5, kind: "fight", links: [10, 11] },
  { id: 9, floor: 2, x: 0.74, kind: "fight", links: [11] },
  { id: 10, floor: 3, x: 0.34, kind: "rest", links: [12, 13] },
  { id: 11, floor: 3, x: 0.68, kind: "fight", links: [13, 14] },
  { id: 12, floor: 4, x: 0.22, kind: "fight", links: [15] },
  { id: 13, floor: 4, x: 0.5, kind: "fight", links: [15, 16] },
  { id: 14, floor: 4, x: 0.78, kind: "fight", links: [16] },
  { id: 15, floor: 5, x: 0.36, kind: "fight", links: [17] },
  { id: 16, floor: 5, x: 0.66, kind: "rest", links: [17, 18] },
  { id: 17, floor: 6, x: 0.34, kind: "fight", links: [19] },
  { id: 18, floor: 6, x: 0.66, kind: "fight", links: [19] },
  { id: 19, floor: 7, x: 0.5, kind: "boss", links: [] },
];

let nextUid = 1;
function make(id: CardId): Card {
  nextUid += 1;
  return { ...BOOK[id], uid: nextUid };
}
function starter() {
  return [...Array(5)].flatMap(() => [make("spark"), make("wash")]);
}
function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}
function factor(spell: Element, foe: Element) {
  if (BEATS[spell] === foe) return 1.5;
  if (BEATS[foe] === spell) return 0.5;
  return 1;
}
function power(card: CardDef, bonus: Bonus) {
  return card.damage + (bonus[card.id] ?? 0);
}
function dealt(card: CardDef, foe: Element, bonus: Bonus) {
  return Math.max(1, Math.round(power(card, bonus) * factor(card.element, foe)));
}
function needXp(level: number) {
  return 24 + level * 12;
}
function nextElement(element: Element) {
  return ELEMENTS[(ELEMENTS.indexOf(element) + 1) % 4]!;
}
function group(node: Node): Enemy[] {
  if (node.kind === "boss") {
    return [{ uid: 1, name: "Changing Heart", element: "fire", hp: 150, max: 150, attack: 18, boss: true }];
  }
  const count = node.floor < 3 ? 2 : 3;
  return Array.from({ length: count }, (_, index) => {
    const element = ELEMENTS[(node.id + index) % 4]!;
    const rank = Math.min(3, Math.floor(node.floor / 2));
    const hp = 14 + node.floor * 6 + index * 3;
    return { uid: index + 1, name: NAMES[element][rank]!, element, hp, max: hp, attack: 4 + Math.floor(node.floor * 1.3), boss: false };
  });
}
function xpFor(node: Node, enemies: Enemy[]) {
  if (node.kind === "boss") return 48;
  return enemies.reduce((sum, _enemy, index) => sum + 8 + node.floor * 2 + index, 0);
}
function pool(floor: number): CardId[] {
  const basic: CardId[] = ["spark", "wash", "breeze", "pebble"];
  const mid: CardId[] = ["fireball", "blast", "gust", "rock"];
  const high: CardId[] = ["inferno", "tidal", "tempest", "quake"];
  if (floor <= 1) return [...basic, "fireball", "blast"];
  if (floor <= 3) return [...basic, ...mid];
  if (floor <= 5) return [...mid, "inferno", "tidal"];
  return [...mid, ...high];
}
function offer(floor: number) {
  const picked: CardId[] = [];
  for (const id of shuffle(pool(floor))) {
    if (!picked.includes(id)) picked.push(id);
    if (picked.length === 3) break;
  }
  return picked;
}

function MagisPage() {
  const [deck, setDeck] = useState<Card[]>(() => starter());
  const [hp, setHp] = useState(74);
  const [maxHp, setMaxHp] = useState(74);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [skill, setSkill] = useState(0);
  const [bonus, setBonus] = useState<Bonus>({});
  const [at, setAt] = useState(-1);
  const [screen, setScreen] = useState<"map" | "fight" | "reward" | "dead" | "won">("map");
  const [fight, setFight] = useState<Fight | null>(null);
  const [choices, setChoices] = useState<CardId[]>([]);
  const [pending, setPending] = useState<Node | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [note, setNote] = useState("");

  const open = at < 0 ? MAP.filter((node) => node.floor === 0) : MAP.filter((node) => MAP.find((item) => item.id === at)?.links.includes(node.id));

  function enter(node: Node) {
    if (!open.some((item) => item.id === node.id)) return;
    if (node.kind === "rest") {
      setHp((life) => Math.min(maxHp, life + 30));
      setAt(node.id);
      return;
    }
    setPending(node);
    setFight({ enemies: group(node), ...deal(shuffle(deck)), energy: 3, log: node.kind === "boss" ? "The heart changes." : "Click a card, then an enemy." });
    setScreen("fight");
  }

  function grant(amount: number) {
    let nextXp = xp + amount;
    let nextLevel = level;
    let points = 0;
    let extra = 0;
    while (nextXp >= needXp(nextLevel)) {
      nextXp -= needXp(nextLevel);
      nextLevel += 1;
      points += 1;
      extra += 8;
    }
    setXp(nextXp);
    if (points > 0) {
      const full = maxHp + extra;
      setLevel(nextLevel);
      setSkill((value) => value + points);
      setMaxHp(full);
      setHp(full);
      setNote(`Level ${nextLevel}. Healed to ${full}. +${points} skill.`);
    } else setNote(`+${amount} xp.`);
  }

  function play(uid: number, foe: number) {
    if (!fight) return;
    const card = fight.hand.find((entry) => entry.uid === uid);
    const enemy = fight.enemies[foe];
    if (!card || !enemy || enemy.hp <= 0 || card.cost > fight.energy) return;
    const amount = dealt(card, enemy.element, bonus);
    const enemies = fight.enemies.map((entry, index) => (index === foe ? { ...entry, hp: Math.max(0, entry.hp - amount) } : entry));
    const next: Fight = {
      ...fight,
      energy: fight.energy - card.cost,
      hand: fight.hand.filter((entry) => entry.uid !== uid),
      discard: [...fight.discard, card],
      enemies,
      log: factor(card.element, enemy.element) < 1 ? `${card.name} is resisted for ${amount}.` : factor(card.element, enemy.element) > 1 ? `${card.name} finds a weakness for ${amount}.` : `${card.name} deals ${amount}.`,
    };
    setFight(next);
    if (enemies.every((entry) => entry.hp <= 0)) {
      const pile = [...next.draw, ...next.hand, ...next.discard];
      setDeck(pile);
      setAt(pending?.id ?? at);
      if (pending) grant(xpFor(pending, fight.enemies));
      if (pending?.kind === "boss") {
        setScreen("won");
        setFight(null);
        return;
      }
      setChoices(offer(pending?.floor ?? 0));
      setScreen("reward");
      setFight(null);
    }
  }

  function endTurn() {
    if (!fight) return;
    let life = hp;
    const enemies = fight.enemies.map((enemy) => {
      if (enemy.hp <= 0) return enemy;
      life -= enemy.attack;
      return enemy.boss ? { ...enemy, element: nextElement(enemy.element) } : enemy;
    });
    const piles = drawCards(fight.draw, [...fight.discard, ...fight.hand], 5);
    setHp(Math.max(0, life));
    if (life <= 0) {
      setScreen("dead");
      setFight(null);
      return;
    }
    setFight({ ...fight, enemies, ...piles, energy: 3, log: "They strike." });
  }

  function take(id: CardId) {
    setDeck((pile) => [...pile, make(id)]);
    setScreen("map");
    setFight(null);
  }

  function upgrade(id: CardId) {
    if (skill < 1) return;
    setSkill((value) => value - 1);
    setBonus((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function retry() {
    setDeck(starter());
    setHp(74);
    setMaxHp(74);
    setLevel(1);
    setXp(0);
    setSkill(0);
    setBonus({});
    setAt(-1);
    setNote("");
    setScreen("map");
  }

  const known = ([...new Set(deck.map((card) => card.id))] as CardId[]).sort((a, b) => BOOK[a].tier - BOOK[b].tier || BOOK[a].name.localeCompare(BOOK[b].name));

  return (
    <Shell bare>
      <div className="min-h-[calc(100dvh-4.25rem)] bg-[#14080d] text-[#f3e6c8]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/games" className="rounded-full bg-[#e6c27a] px-4 py-2 text-sm text-[#1a0c12]">
            Games
          </Link>
          <p className="font-display text-2xl font-bold tracking-wide">Magis</p>
          <div className="flex items-center gap-3 text-sm">
            <p>
              Lv {level} · {xp}/{needXp(level)} · {hp}/{maxHp} · {skill} skill
            </p>
            <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-2" onClick={() => setSkillsOpen(true)}>
              Skills
            </button>
          </div>
        </div>
        {screen === "map" ? <SpireMap at={at} open={open} hp={hp} onEnter={enter} /> : null}
        {screen === "fight" && fight ? <Battle fight={fight} hp={hp} maxHp={maxHp} bonus={bonus} onPlay={play} onEnd={endTurn} /> : null}
        {screen === "reward" ? <Reward choices={choices} bonus={bonus} note={note} onTake={take} /> : null}
        {screen === "dead" ? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h2 className="font-display text-4xl font-bold">The run ends.</h2>
            <button type="button" className="mt-6 rounded-full bg-[#e6c27a] px-5 py-3 text-sm text-[#1a0c12]" onClick={retry}>
              New run
            </button>
          </div>
        ) : null}
        {screen === "won" ? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h2 className="font-display text-4xl font-bold">The heart stills.</h2>
            <p className="mt-2 text-sm">{note}</p>
            <button type="button" className="mt-6 rounded-full bg-[#e6c27a] px-5 py-3 text-sm text-[#1a0c12]" onClick={retry}>
              Climb again
            </button>
          </div>
        ) : null}
        {skillsOpen ? (
          <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4">
            <div className="max-h-[80dvh] w-full max-w-lg overflow-auto rounded-3xl border border-[#e6c27a] bg-[#1a0c12] p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Skills</h2>
                <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-1 text-sm" onClick={() => setSkillsOpen(false)}>
                  Close
                </button>
              </div>
              <p className="mt-1 text-sm">{skill} skill points. One point raises a spell by 1 damage.</p>
              <ul className="mt-4 space-y-2">
                {known.map((id) => (
                  <li key={id} className="flex items-center gap-3 rounded-2xl border border-[#e6c27a]/40 p-2">
                    <img src={asset(SPELL_ART[id])} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold">{BOOK[id].name}</p>
                      <p className="text-sm">
                        {power(BOOK[id], bonus)} damage {bonus[id] ? `(+${bonus[id]})` : ""}
                      </p>
                    </div>
                    <button type="button" className="rounded-full bg-[#e6c27a] px-3 py-2 text-sm text-[#1a0c12] disabled:opacity-40" disabled={skill < 1} onClick={() => upgrade(id)}>
                      +1
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function SpireMap({ at, open, hp, onEnter }: { at: number; open: Node[]; hp: number; onEnter: (node: Node) => void }) {
  const width = 640;
  const height = 1040;
  const spot = (node: Node) => ({ x: 70 + node.x * (width - 140), y: 70 + node.floor * 125 });
  return (
    <div className="mx-auto max-w-3xl px-3 pb-8">
      <p className="text-sm text-[#e6c27a]">Water beats Fire. Fire beats Wind. Wind beats Earth. Earth beats Water. The other way resists. Only the next nodes are open.</p>
      <p className="mt-1 text-sm">Rest sites heal. You have {hp} hp. The boss waits at the top.</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full rounded-3xl border border-[#e6c27a]/30 bg-[#2a1018]">
        {MAP.flatMap((node) =>
          node.links.map((id) => {
            const next = MAP.find((item) => item.id === id)!;
            const a = spot(node);
            const b = spot(next);
            return <line key={`${node.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e6c27a" strokeWidth="3" opacity="0.45" />;
          }),
        )}
        {MAP.map((node) => {
          const pos = spot(node);
          const ready = open.some((item) => item.id === node.id);
          const here = MAP.find((item) => item.id === at);
          const done = node.id === at || (here ? node.floor < here.floor : false);
          const fill = node.kind === "boss" ? "#e25b4a" : node.kind === "rest" ? "#3ecf8e" : "#c9a15b";
          return (
            <g key={node.id} onClick={() => ready && onEnter(node)} style={{ cursor: ready ? "pointer" : "default" }}>
              <circle cx={pos.x} cy={pos.y} r={node.kind === "boss" ? 28 : 22} fill={ready ? fill : done ? "#5c4632" : "#1a0c12"} stroke="#e6c27a" strokeWidth={ready ? 4 : 2} />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={ready || done ? "#1a0c12" : "#e6c27a"} fontSize="12" fontWeight="700">
                {node.kind === "rest" ? "Rest" : node.kind === "boss" ? "Boss" : "Fight"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Battle({ fight, hp, maxHp, bonus, onPlay, onEnd }: { fight: Fight; hp: number; maxHp: number; bonus: Bonus; onPlay: (uid: number, foe: number) => void; onEnd: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [striking, setStriking] = useState(false);
  useEffect(() => {
    if (!striking) return;
    const timer = window.setTimeout(() => setStriking(false), 700);
    return () => window.clearTimeout(timer);
  }, [striking]);

  function strike() {
    setPicked(null);
    setStriking(true);
    onEnd();
  }

  const topDiscard = fight.discard[fight.discard.length - 1];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl flex-col px-3 pb-4">
      <style>{`@keyframes magis-hit{0%,100%{transform:scale(1)}45%{transform:scale(1.12);filter:brightness(1.45)}}`}</style>
      <div className="flex flex-1 flex-wrap items-end justify-center gap-4 py-6">
        {fight.enemies.map((enemy, index) => (
          <button
            key={enemy.uid}
            type="button"
            className={`w-40 text-center ${enemy.hp <= 0 ? "opacity-30" : ""} ${picked !== null && enemy.hp > 0 ? "rounded-2xl ring-2 ring-[#e6c27a]" : ""}`}
            onClick={() => {
              if (picked === null || enemy.hp <= 0) return;
              const uid = picked;
              setPicked(null);
              onPlay(uid, index);
            }}
          >
            <img
              src={asset(enemy.boss ? "magis/boss.jpg" : SPRITE[enemy.element])}
              alt=""
              className="mx-auto h-44 w-32 rounded-2xl border-4 object-cover"
              style={{ borderColor: INK[enemy.element], animation: striking && enemy.hp > 0 ? "magis-hit 0.7s ease" : undefined }}
            />
            <p className="mt-2 font-display text-lg font-bold leading-tight">{enemy.name}</p>
            <p className="text-xs uppercase" style={{ color: INK[enemy.element] }}>
              {enemy.element}
            </p>
            <div className="mx-auto mt-1 h-2 w-28 overflow-hidden rounded-full bg-[#1a0c12]">
              <div className="h-full" style={{ width: `${(enemy.hp / enemy.max) * 100}%`, background: INK[enemy.element] }} />
            </div>
            <p className="text-xs">
              {enemy.hp}/{enemy.max} · hits {enemy.attack}
              {enemy.boss ? `, then ${nextElement(enemy.element)}` : ""}
            </p>
          </button>
        ))}
      </div>
      <p className="text-center text-sm">{picked !== null ? "Click an enemy." : fight.log}</p>
      <div className="my-2 flex items-center justify-between text-sm">
        <p>
          You {hp}/{maxHp}
        </p>
        <p className="text-[#e6c27a]">{fight.energy} energy</p>
        <button type="button" className="rounded-full bg-[#e6c27a] px-4 py-2 text-[#1a0c12]" onClick={strike}>
          End turn
        </button>
      </div>
      <div className="flex items-end justify-center gap-3 pb-2">
        <Pile label="Discard" count={fight.discard.length}>
          {topDiscard ? <SpellCard card={topDiscard} bonus={bonus} /> : <EmptyPile />}
        </Pile>
        <div className="flex gap-2 overflow-x-auto">
          {fight.hand.map((entry) => (
            <button
              key={entry.uid}
              type="button"
              className={`relative h-52 w-32 shrink-0 overflow-hidden rounded-2xl border-2 bg-[#1a0c12] text-left disabled:opacity-40 ${picked === entry.uid ? "border-[#fff6d8] ring-2 ring-[#fff6d8]" : "border-[#e6c27a]"}`}
              disabled={entry.cost > fight.energy}
              onClick={() => setPicked((current) => (current === entry.uid ? null : entry.uid))}
            >
              <SpellCard card={entry} bonus={bonus} foe={fight.enemies.find((enemy) => enemy.hp > 0)?.element} />
            </button>
          ))}
        </div>
        <Pile label="Draw" count={fight.draw.length}>
          {fight.draw.length ? <CardBack /> : <EmptyPile />}
        </Pile>
      </div>
    </div>
  );
}

function Pile({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  return (
    <div className="w-28 shrink-0 text-center">
      <div className="h-44 overflow-hidden rounded-2xl">{children}</div>
      <p className="mt-1 text-xs">
        {label} {count}
      </p>
    </div>
  );
}

function EmptyPile() {
  return <div className="h-full rounded-2xl border border-dashed border-[#e6c27a]/40" />;
}

function CardBack() {
  return (
    <div className="relative h-full rounded-2xl border-2 border-[#e6c27a] bg-[#241018]">
      <CornerMark element="fire" className="top-2 left-2" />
      <CornerMark element="water" className="top-2 right-2" />
      <CornerMark element="wind" className="bottom-2 left-2" />
      <CornerMark element="earth" className="right-2 bottom-2" />
      <div className="absolute inset-6 rounded-xl border border-[#e6c27a]/50" />
    </div>
  );
}

function CornerMark({ element, className }: { element: Element; className: string }) {
  const mark = element === "fire" ? "▲" : element === "water" ? "●" : element === "wind" ? "〰" : "■";
  return (
    <span className={`absolute text-sm font-bold ${className}`} style={{ color: INK[element] }}>
      {mark}
    </span>
  );
}

function SpellCard({ card, bonus, foe }: { card: CardDef; bonus: Bonus; foe?: Element }) {
  const amount = foe ? dealt(card, foe, bonus) : power(card, bonus);
  const scale = foe ? factor(card.element, foe) : 1;
  const frame = card.tier === 3 ? "shadow-[inset_0_0_0_3px_#e25b4a]" : card.tier === 2 ? "shadow-[inset_0_0_0_3px_#f2c14e]" : "";
  return (
    <div className={`relative h-full w-full ${frame}`}>
      <img src={asset(SPELL_ART[card.id])} alt="" className="h-28 w-full object-cover" />
      <span className="absolute top-1 left-1 grid size-7 place-items-center rounded-full text-sm font-bold text-[#1a0c12]" style={{ background: INK[card.element] }}>
        {card.cost}
      </span>
      <p className={`px-2 pt-1 text-center text-lg font-bold ${scale < 1 ? "text-[#e25b4a]" : scale > 1 ? "text-[#e6c27a]" : "text-[#f3e6c8]"}`}>{amount}</p>
      <p className="px-1 text-center font-display text-sm leading-tight">{card.name}</p>
    </div>
  );
}

function Reward({ choices, bonus, note, onTake }: { choices: CardId[]; bonus: Bonus; note: string; onTake: (id: CardId) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-center">
      <h2 className="font-display text-4xl font-bold">Choose a spell</h2>
      <p className="mt-2 text-sm">{note}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {choices.map((id) => (
          <button key={id} type="button" className="h-64 w-40 overflow-hidden rounded-2xl border-2 border-[#e6c27a] bg-[#1a0c12] text-left" onClick={() => onTake(id)}>
            <SpellCard card={BOOK[id]} bonus={bonus} />
          </button>
        ))}
      </div>
    </div>
  );
}

function deal(pile: Card[]) {
  const draw = [...pile];
  const hand = draw.splice(0, 5);
  return { draw, hand, discard: [] as Card[] };
}

function drawCards(draw: Card[], discard: Card[], count: number) {
  const deck = [...draw];
  const used = [...discard];
  const hand: Card[] = [];
  for (let i = 0; i < count; i += 1) {
    if (!deck.length) {
      deck.push(...shuffle(used));
      used.length = 0;
    }
    const card = deck.shift();
    if (!card) break;
    hand.push(card);
  }
  return { draw: deck, hand, discard: used };
}
