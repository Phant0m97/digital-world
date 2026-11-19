import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
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

const ELEMENTS: Element[] = ["fire", "water", "wind", "earth"];
const BEATS: Record<Element, Element> = { water: "fire", fire: "wind", wind: "earth", earth: "water" };
const INK: Record<Element, string> = { fire: "#e25b4a", water: "#3aa7ff", wind: "#d6e27a", earth: "#c47a3a" };
const ART: Record<Element, string> = { fire: "magis/spark.jpg", water: "magis/wash.jpg", wind: "magis/breeze.jpg", earth: "magis/pebble.jpg" };
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
  { id: 0, floor: 0, x: 0.32, kind: "fight", links: [2, 3] },
  { id: 1, floor: 0, x: 0.68, kind: "fight", links: [3, 4] },
  { id: 2, floor: 1, x: 0.2, kind: "fight", links: [5] },
  { id: 3, floor: 1, x: 0.5, kind: "rest", links: [5, 6] },
  { id: 4, floor: 1, x: 0.8, kind: "fight", links: [6] },
  { id: 5, floor: 2, x: 0.34, kind: "fight", links: [7] },
  { id: 6, floor: 2, x: 0.66, kind: "fight", links: [8] },
  { id: 7, floor: 3, x: 0.32, kind: "rest", links: [9] },
  { id: 8, floor: 3, x: 0.68, kind: "fight", links: [9] },
  { id: 9, floor: 4, x: 0.5, kind: "boss", links: [] },
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
function dealt(card: CardDef, foe: Element) {
  return Math.max(1, Math.round(card.damage * factor(card.element, foe)));
}
function nextElement(element: Element) {
  return ELEMENTS[(ELEMENTS.indexOf(element) + 1) % 4]!;
}
function group(node: Node): Enemy[] {
  if (node.kind === "boss") {
    return [{ uid: 1, name: "Changing Heart", element: "fire", hp: 128, max: 128, attack: 16, boss: true }];
  }
  const count = node.floor < 2 ? 2 : 3;
  return Array.from({ length: count }, (_, index) => {
    const element = ELEMENTS[(node.id + index) % 4]!;
    const rank = Math.min(3, node.floor);
    const hp = 16 + node.floor * 8 + index * 4;
    return { uid: index + 1, name: NAMES[element][rank]!, element, hp, max: hp, attack: 5 + node.floor * 2, boss: false };
  });
}
function pool(floor: number) {
  const basic: CardId[] = ["spark", "wash", "breeze", "pebble"];
  const mid: CardId[] = ["fireball", "blast", "gust", "rock"];
  const high: CardId[] = ["inferno", "tidal", "tempest", "quake"];
  if (floor <= 0) return [...basic, "fireball", "blast"] as CardId[];
  if (floor <= 2) return [...basic, ...mid];
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
  const [maxHp] = useState(74);
  const [at, setAt] = useState(-1);
  const [screen, setScreen] = useState<"map" | "fight" | "reward" | "dead" | "won">("map");
  const [fight, setFight] = useState<Fight | null>(null);
  const [choices, setChoices] = useState<CardId[]>([]);
  const [pending, setPending] = useState<Node | null>(null);
  const busy = useRef(false);

  const open = at < 0 ? MAP.filter((node) => node.floor === 0) : MAP.filter((node) => MAP.find((item) => item.id === at)?.links.includes(node.id));

  function enter(node: Node) {
    if (!open.some((item) => item.id === node.id)) return;
    if (node.kind === "rest") {
      setHp((life) => Math.min(maxHp, life + 30));
      setAt(node.id);
      return;
    }
    busy.current = false;
    setPending(node);
    setFight({ enemies: group(node), ...deal(shuffle(deck)), energy: 3, log: node.kind === "boss" ? "The heart changes." : "They step forward." });
    setScreen("fight");
  }

  function play(uid: number, foe: number) {
    if (!fight || busy.current) return;
    const card = fight.hand.find((entry) => entry.uid === uid);
    const enemy = fight.enemies[foe];
    if (!card || !enemy || enemy.hp <= 0 || card.cost > fight.energy) return;
    const amount = dealt(card, enemy.element);
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
      busy.current = true;
      const pile = [...next.draw, ...next.hand, ...next.discard];
      setDeck(pile);
      setAt(pending?.id ?? at);
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
    if (!fight || busy.current) return;
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

  function retry() {
    setDeck(starter());
    setHp(maxHp);
    setAt(-1);
    setScreen("map");
  }

  return (
    <Shell bare>
      <div className="min-h-[calc(100dvh-4.25rem)] bg-[#14080d] text-[#f3e6c8]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/games" className="rounded-full bg-[#e6c27a] px-4 py-2 text-sm text-[#1a0c12]">
            Games
          </Link>
          <p className="font-display text-2xl font-bold tracking-wide">Magis</p>
          <p className="text-sm">
            {hp}/{maxHp} hp · {deck.length} cards
          </p>
        </div>
        {screen === "map" ? <SpireMap at={at} open={open} hp={hp} onEnter={enter} /> : null}
        {screen === "fight" && fight ? <Battle fight={fight} hp={hp} maxHp={maxHp} onPlay={play} onEnd={endTurn} /> : null}
        {screen === "reward" ? <Reward choices={choices} onTake={take} /> : null}
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
            <button type="button" className="mt-6 rounded-full bg-[#e6c27a] px-5 py-3 text-sm text-[#1a0c12]" onClick={retry}>
              Climb again
            </button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function SpireMap({ at, open, hp, onEnter }: { at: number; open: Node[]; hp: number; onEnter: (node: Node) => void }) {
  const width = 640;
  const height = 760;
  const spot = (node: Node) => ({ x: 70 + node.x * (width - 140), y: 80 + node.floor * 150 });
  return (
    <div className="mx-auto max-w-3xl px-3 pb-8">
      <p className="text-sm text-[#e6c27a]">Water beats Fire. Fire beats Wind. Wind beats Earth. Earth beats Water. The other way resists. Only the next nodes are open.</p>
      <p className="mt-1 text-sm">Rest sites heal. You have {hp} hp.</p>
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
          const done = node.id === at || (at >= 0 && node.floor < (MAP.find((item) => item.id === at)?.floor ?? 0));
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

function Battle({ fight, hp, maxHp, onPlay, onEnd }: { fight: Fight; hp: number; maxHp: number; onPlay: (uid: number, foe: number) => void; onEnd: () => void }) {
  const spots = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<{ uid: number; x: number; y: number } | null>(null);
  const card = drag ? fight.hand.find((entry) => entry.uid === drag.uid) : null;

  function drop(event: React.PointerEvent) {
    if (!drag) return;
    const hit = spots.current.findIndex((node) => {
      if (!node) return false;
      const box = node.getBoundingClientRect();
      return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    });
    const uid = drag.uid;
    setDrag(null);
    if (hit >= 0) onPlay(uid, hit);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl flex-col px-3 pb-4" onPointerMove={(event) => drag && setDrag({ ...drag, x: event.clientX, y: event.clientY })} onPointerUp={drop}>
      <div className="flex flex-1 flex-wrap items-end justify-center gap-4 py-6">
        {fight.enemies.map((enemy, index) => (
          <div
            key={enemy.uid}
            ref={(node) => {
              spots.current[index] = node;
            }}
            className={`w-40 text-center ${enemy.hp <= 0 ? "opacity-30" : ""}`}
          >
            <img src={asset(enemy.boss ? "magis/boss.jpg" : SPRITE[enemy.element])} alt="" className="mx-auto h-44 w-32 rounded-2xl border-4 object-cover" style={{ borderColor: INK[enemy.element] }} />
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
          </div>
        ))}
      </div>
      <p className="text-center text-sm">{fight.log}</p>
      <div className="my-2 flex items-center justify-between text-sm">
        <p>
          You {hp}/{maxHp}
        </p>
        <p className="text-[#e6c27a]">{fight.energy} energy</p>
        <p>
          Draw {fight.draw.length} · Discard {fight.discard.length}
        </p>
        <button type="button" className="rounded-full bg-[#e6c27a] px-4 py-2 text-[#1a0c12]" onClick={onEnd}>
          End turn
        </button>
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
        {fight.hand.map((entry) => (
          <button
            key={entry.uid}
            type="button"
            className="relative h-52 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-[#e6c27a] bg-[#1a0c12] text-left disabled:opacity-40"
            disabled={entry.cost > fight.energy}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ uid: entry.uid, x: event.clientX, y: event.clientY });
            }}
          >
            <SpellCard card={entry} foe={fight.enemies.find((enemy) => enemy.hp > 0)?.element} />
          </button>
        ))}
      </div>
      {drag && card ? (
        <div className="pointer-events-none fixed z-20 h-52 w-32 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-[#e6c27a]" style={{ left: drag.x, top: drag.y }}>
          <SpellCard card={card} />
        </div>
      ) : null}
    </div>
  );
}

function SpellCard({ card, foe }: { card: CardDef; foe?: Element }) {
  const amount = foe ? dealt(card, foe) : card.damage;
  const scale = foe ? factor(card.element, foe) : 1;
  return (
    <div className="relative h-full w-full">
      <img src={asset(ART[card.element])} alt="" className="h-32 w-full object-cover" />
      <span className="absolute top-1 left-1 grid size-7 place-items-center rounded-full text-sm font-bold text-[#1a0c12]" style={{ background: INK[card.element] }}>
        {card.cost}
      </span>
      <p className={`px-2 pt-1 text-center text-lg font-bold ${scale < 1 ? "text-[#e25b4a]" : scale > 1 ? "text-[#e6c27a]" : "text-[#f3e6c8]"}`}>{amount}</p>
      <p className="px-1 text-center font-display text-sm leading-tight">{card.name}</p>
    </div>
  );
}

function Reward({ choices, onTake }: { choices: CardId[]; onTake: (id: CardId) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-center">
      <h2 className="font-display text-4xl font-bold">Choose a spell</h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {choices.map((id) => (
          <button key={id} type="button" className="h-64 w-40 overflow-hidden rounded-2xl border-2 border-[#e6c27a] bg-[#1a0c12] text-left" onClick={() => onTake(id)}>
            <SpellCard card={BOOK[id]} />
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
