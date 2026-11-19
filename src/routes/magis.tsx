import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/magis")({ component: MagisPage });

type Element = "fire" | "water" | "wind" | "earth";
type CardId =
  | "spark"
  | "wash"
  | "breeze"
  | "pebble"
  | "fireball"
  | "blast"
  | "gust"
  | "rock"
  | "inferno"
  | "tidal"
  | "tempest"
  | "quake";

type CardDef = { id: CardId; name: string; element: Element; damage: number; cost: number; tier: number; text: string };
type Card = CardDef & { uid: number };
type Enemy = { name: string; element: Element; hp: number; max: number; attack: number; boss: boolean };
type Fight = {
  enemy: Enemy;
  draw: Card[];
  hand: Card[];
  discard: Card[];
  energy: number;
  log: string;
};

const ELEMENTS: Element[] = ["fire", "water", "wind", "earth"];
const BEATS: Record<Element, Element> = { water: "fire", fire: "wind", wind: "earth", earth: "water" };
const INK: Record<Element, string> = { fire: "#e25b4a", water: "#2ec8e6", wind: "#d6e27a", earth: "#c47a3a" };
const NAMES: Record<Element, string[]> = {
  fire: ["Cinder Imp", "Ash Wolf", "Magma Knight", "Inferno Drake"],
  water: ["Tide Slime", "Ripple Eel", "Sea Knight", "Abyss Serpent"],
  wind: ["Breeze Wisp", "Gale Bat", "Storm Harpy", "Sky Reaver"],
  earth: ["Pebble Crab", "Mud Brute", "Stone Golem", "Quake Titan"],
};

const BOOK: Record<CardId, CardDef> = {
  spark: { id: "spark", name: "Spark", element: "fire", damage: 6, cost: 1, tier: 1, text: "A small flame." },
  wash: { id: "wash", name: "Wash", element: "water", damage: 6, cost: 1, tier: 1, text: "A splash of water." },
  breeze: { id: "breeze", name: "Breeze", element: "wind", damage: 6, cost: 1, tier: 1, text: "A cutting gust." },
  pebble: { id: "pebble", name: "Pebble", element: "earth", damage: 6, cost: 1, tier: 1, text: "A thrown stone." },
  fireball: { id: "fireball", name: "Fireball", element: "fire", damage: 13, cost: 1, tier: 2, text: "An upgraded Spark." },
  blast: { id: "blast", name: "Water Blast", element: "water", damage: 13, cost: 1, tier: 2, text: "An upgraded Wash." },
  gust: { id: "gust", name: "Gust", element: "wind", damage: 13, cost: 1, tier: 2, text: "An upgraded Breeze." },
  rock: { id: "rock", name: "Rock", element: "earth", damage: 13, cost: 1, tier: 2, text: "An upgraded Pebble." },
  inferno: { id: "inferno", name: "Inferno", element: "fire", damage: 22, cost: 2, tier: 3, text: "The room catches." },
  tidal: { id: "tidal", name: "Tidal Wave", element: "water", damage: 22, cost: 2, tier: 3, text: "The hall floods." },
  tempest: { id: "tempest", name: "Tempest", element: "wind", damage: 22, cost: 2, tier: 3, text: "The air tears." },
  quake: { id: "quake", name: "Quake", element: "earth", damage: 22, cost: 2, tier: 3, text: "The floor breaks." },
};

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
function dealt(card: CardDef, foe: Element) {
  return Math.round(card.damage * (BEATS[card.element] === foe ? 1.5 : 1));
}
function nextElement(element: Element) {
  return ELEMENTS[(ELEMENTS.indexOf(element) + 1) % 4]!;
}
function foe(level: number, step: number): Enemy {
  const element = ELEMENTS[(level + step) % 4]!;
  const rank = Math.min(3, Math.floor((level - 1) / 2));
  return {
    name: NAMES[element][rank]!,
    element,
    max: 24 + level * 10 + step * 12,
    hp: 24 + level * 10 + step * 12,
    attack: 5 + level,
    boss: false,
  };
}
function boss(level: number): Enemy {
  return { name: "Shifting Core", element: ELEMENTS[(level - 1) % 4]!, max: 52 + level * 18, hp: 52 + level * 18, attack: 7 + level * 2, boss: true };
}
function pool(level: number) {
  const basic: CardId[] = ["spark", "wash", "breeze", "pebble"];
  const mid: CardId[] = ["fireball", "blast", "gust", "rock"];
  const high: CardId[] = ["inferno", "tidal", "tempest", "quake"];
  if (level <= 2) return [...basic, "fireball", "blast"] as CardId[];
  if (level <= 4) return [...basic, ...mid];
  if (level <= 6) return [...mid, ...high];
  return [...mid, ...high];
}
function offer(level: number) {
  const bag = shuffle(pool(level));
  const picked: CardId[] = [];
  for (const id of bag) {
    if (!picked.includes(id)) picked.push(id);
    if (picked.length === 3) break;
  }
  return picked;
}

function MagisPage() {
  const [deck, setDeck] = useState<Card[]>(() => starter());
  const [hp, setHp] = useState(76);
  const [maxHp] = useState(76);
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState<"levels" | "fight" | "reward" | "dead">("levels");
  const [fight, setFight] = useState<Fight | null>(null);
  const [choices, setChoices] = useState<CardId[]>([]);
  const busy = useRef(false);

  function begin(nextLevel: number, pile = deck, life = hp) {
    const enemy = foe(nextLevel, 0);
    busy.current = false;
    setLevel(nextLevel);
    setStep(0);
    setHp(life);
    setDeck(pile);
    setFight({ enemy, ...deal(shuffle(pile)), energy: 3, log: `${enemy.name} steps in.` });
    setScreen("fight");
  }

  function play(uid: number) {
    if (!fight || busy.current) return;
    const card = fight.hand.find((entry) => entry.uid === uid);
    if (!card || card.cost > fight.energy || fight.enemy.hp <= 0) return;
    const amount = dealt(card, fight.enemy.element);
    const left = fight.enemy.hp - amount;
    const next: Fight = {
      ...fight,
      energy: fight.energy - card.cost,
      hand: fight.hand.filter((entry) => entry.uid !== uid),
      discard: [...fight.discard, card],
      enemy: { ...fight.enemy, hp: Math.max(0, left) },
      log: BEATS[card.element] === fight.enemy.element ? `${card.name} hits a weakness for ${amount}.` : `${card.name} deals ${amount}.`,
    };
    setFight(next);
    if (left <= 0) {
      busy.current = true;
      winFight(next);
    }
  }

  function endTurn() {
    if (!fight || fight.enemy.hp <= 0) return;
    const hurt = Math.max(0, hp - fight.enemy.attack);
    const element = fight.enemy.boss ? nextElement(fight.enemy.element) : fight.enemy.element;
    const piles = drawCards(fight.draw, [...fight.discard, ...fight.hand], 5);
    setHp(hurt);
    if (hurt <= 0) {
      setScreen("dead");
      setFight(null);
      return;
    }
    setFight({
      ...fight,
      enemy: { ...fight.enemy, element },
      draw: piles.draw,
      hand: piles.hand,
      discard: piles.discard,
      energy: 3,
      log: fight.enemy.boss ? `Hit for ${fight.enemy.attack}. It becomes ${element}.` : `${fight.enemy.name} hits for ${fight.enemy.attack}.`,
    });
  }

  function winFight(current: Fight) {
    const pile = [...current.draw, ...current.hand, ...current.discard];
    setDeck(pile);
    if (step >= 2 || current.enemy.boss) {
      setChoices(offer(level));
      setScreen("reward");
      setFight(null);
      return;
    }
    const nextStep = step + 1;
    const enemy = nextStep >= 2 ? boss(level) : foe(level, nextStep);
    const healed = Math.min(maxHp, hp + 10);
    setHp(healed);
    setStep(nextStep);
    setFight({ enemy, ...deal(shuffle(pile)), energy: 3, log: enemy.boss ? "The boss shifts between elements." : "Another foe." });
    busy.current = false;
  }

  function take(id: CardId) {
    const pile = [...deck, make(id)];
    const nextLevel = Math.min(8, level + 1);
    setDeck(pile);
    setScreen("levels");
    setLevel(nextLevel);
    setStep(0);
    setFight(null);
  }

  function retry() {
    const pile = starter();
    setDeck(pile);
    setHp(maxHp);
    setStep(0);
    setScreen("levels");
  }

  return (
    <Shell bare>
      <div className="min-h-[calc(100dvh-4.25rem)] bg-[#1b1424] text-[#f3f0e8]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/games" className="rounded-full bg-[#f3f0e8] px-4 py-2 text-sm text-ink">
            Games
          </Link>
          <p className="font-display text-2xl font-bold">Magis</p>
          <p className="text-sm">
            {hp}/{maxHp} hp · Level {level}
          </p>
        </div>
        {screen === "levels" ? <Levels deck={deck.length} onPick={(value) => begin(value, deck, Math.max(30, hp))} /> : null}
        {screen === "fight" && fight ? <Battle fight={fight} hp={hp} maxHp={maxHp} onPlay={play} onEnd={endTurn} /> : null}
        {screen === "reward" ? <Reward choices={choices} onTake={take} /> : null}
        {screen === "dead" ? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h2 className="font-display text-4xl font-bold">The spell fizzled.</h2>
            <p className="mt-3 text-sm">Your deck resets to 5 Sparks and 5 Washes.</p>
            <button type="button" className="mt-6 rounded-full bg-cyan px-5 py-3 text-sm text-ink" onClick={retry}>
              New run
            </button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function Levels({ deck, onPick }: { deck: number; onPick: (level: number) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10">
      <p className="text-sm text-[#d9c7a4]">Water beats Fire. Fire beats Wind. Wind beats Earth. Earth beats Water. A match deals half again as much.</p>
      <p className="mt-2 text-sm">Pick a level. Two foes, then a boss that changes elements. {deck} cards in your deck.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
          <button key={value} type="button" className="rounded-2xl border border-[#f3f0e8]/30 bg-[#2a2033] px-3 py-4 text-left" onClick={() => onPick(value)}>
            <p className="font-display text-2xl font-bold">Level {value}</p>
            <p className="mt-1 text-xs text-[#d9c7a4]">{NAMES[ELEMENTS[(value) % 4]!]![Math.min(3, Math.floor((value - 1) / 2))]} and worse</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Battle({ fight, hp, maxHp, onPlay, onEnd }: { fight: Fight; hp: number; maxHp: number; onPlay: (uid: number) => void; onEnd: () => void }) {
  const foeHp = Math.max(0, fight.enemy.hp);
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl flex-col px-3 pb-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-64 rounded-3xl border-4 px-4 py-5 text-center" style={{ borderColor: INK[fight.enemy.element], background: "#24182c" }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: INK[fight.enemy.element] }}>
            {fight.enemy.element}
            {fight.enemy.boss ? " · shifts" : ""}
          </p>
          <p className="font-display text-3xl font-bold">{fight.enemy.name}</p>
          <div className="mx-auto mt-3 h-3 w-48 overflow-hidden rounded-full bg-[#1b1424]">
            <div className="h-full" style={{ width: `${(foeHp / fight.enemy.max) * 100}%`, background: INK[fight.enemy.element] }} />
          </div>
          <p className="mt-2 text-sm">
            {foeHp}/{fight.enemy.max}
          </p>
          <p className="mt-2 text-sm text-[#d9c7a4]">
            {fight.enemy.boss ? `Hits for ${fight.enemy.attack}, then becomes ${nextElement(fight.enemy.element)}` : `Hits for ${fight.enemy.attack}`}
          </p>
        </div>
        <p className="mt-4 text-sm">{fight.log}</p>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <p>
          You {hp}/{maxHp}
        </p>
        <p>{fight.energy} energy</p>
        <p>
          Draw {fight.draw.length} · Discard {fight.discard.length}
        </p>
        <button type="button" className="rounded-full bg-[#f3f0e8] px-4 py-2 text-ink" onClick={onEnd}>
          End turn
        </button>
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
        {fight.hand.map((card) => {
          const amount = dealt(card, fight.enemy.element);
          const strong = BEATS[card.element] === fight.enemy.element;
          return (
            <button
              key={card.uid}
              type="button"
              disabled={card.cost > fight.energy}
              onClick={() => onPlay(card.uid)}
              className="h-44 w-32 shrink-0 rounded-2xl border-2 border-[#1b1424] bg-[#f3f0e8] p-2 text-left text-ink disabled:opacity-40"
            >
              <span className="inline-flex size-6 items-center justify-center rounded-full text-xs font-bold text-[#1b1424]" style={{ background: INK[card.element] }}>
                {card.cost}
              </span>
              <p className="mt-2 font-display text-lg font-bold leading-tight">{card.name}</p>
              <p className="text-xs uppercase" style={{ color: INK[card.element] }}>
                {card.element}
              </p>
              <p className="mt-2 text-sm font-bold">{strong ? `${amount} weak` : `${amount} damage`}</p>
              <p className="text-xs">{card.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Reward({ choices, onTake }: { choices: CardId[]; onTake: (id: CardId) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-center">
      <h2 className="font-display text-4xl font-bold">The level falls.</h2>
      <p className="mt-2 text-sm">Choose one spell. Stronger ones show up as you climb.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {choices.map((id) => {
          const card = BOOK[id];
          return (
            <button key={id} type="button" className="h-52 w-40 rounded-2xl border-2 bg-[#f3f0e8] p-3 text-left text-ink" style={{ borderColor: INK[card.element] }} onClick={() => onTake(id)}>
              <p className="font-display text-2xl font-bold leading-tight">{card.name}</p>
              <p className="mt-1 text-xs uppercase" style={{ color: INK[card.element] }}>
                {card.element} · cost {card.cost}
              </p>
              <p className="mt-4 text-sm">Deal {card.damage}. {card.text}</p>
            </button>
          );
        })}
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
