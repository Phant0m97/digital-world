import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Shell } from "@/components/shell";
import { asset } from "@/lib/asset";

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
  | "quake"
  | "ward"
  | "might"
  | "expose"
  | "soften";
type CardKind = "attack" | "guard" | "might" | "expose" | "soften";
type CardDef = { id: CardId; name: string; element: Element; damage: number; cost: number; tier: number; kind: CardKind; text: string };
type Card = CardDef & { uid: number };
type Kind = "fight" | "rest" | "elite" | "boss";
type Node = { id: number; floor: number; x: number; kind: Kind; links: number[] };
type Enemy = { uid: number; name: string; element: Element; hp: number; max: number; attack: number; boss: boolean; elite: boolean; weak: boolean; vulnerable: boolean; art: string };
type Fight = { enemies: Enemy[]; draw: Card[]; hand: Card[]; discard: Card[]; energy: number; energyMax: number; block: number; might: number; log: string };
type RelicId = "aegis" | "drum" | "hex";
type Look = { robe: string; hat: "point" | "wide" | "hood"; skin: string; gem: Element };

const ELEMENTS: Element[] = ["fire", "water", "wind", "earth"];
const BEATS: Record<Element, Element> = { water: "fire", fire: "wind", wind: "earth", earth: "water" };
const INK: Record<Element, string> = { fire: "#e25b4a", water: "#3aa7ff", wind: "#d6e27a", earth: "#c47a3a" };
const ROBES = ["#6a2a4a", "#1e3f73", "#2f5a32", "#6b3a22", "#3a2a55", "#7a2e2e"];
const SKINS = ["#f0c7a0", "#d9a06a", "#a86b45", "#6d4030"];
const STRONG: CardId[] = ["fireball", "blast", "gust", "rock"];
const RELICS: Record<RelicId, { name: string; text: string }> = {
  aegis: { name: "Aegis Charm", text: "Gain 8 block at the start of each turn." },
  drum: { name: "War Drum", text: "Start each fight with 2 Might." },
  hex: { name: "Hex Bell", text: "Enemies start the fight taking extra damage." },
};
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
  ward: "magis/ward.jpg",
  might: "magis/might.jpg",
  expose: "magis/expose.jpg",
  soften: "magis/soften.jpg",
};
const PORTRAIT: Record<string, string> = {
  "Cinder Imp": "magis/imp.jpg",
  "Ash Wolf": "magis/ash-wolf.jpg",
  "Magma Knight": "magis/magma-knight.jpg",
  "Inferno Drake": "magis/inferno-drake.jpg",
  "Tide Slime": "magis/tide-slime.jpg",
  "Ripple Eel": "magis/ripple-eel.jpg",
  "Sea Knight": "magis/sea-knight.jpg",
  "Abyss Serpent": "magis/serpent.jpg",
  "Breeze Wisp": "magis/breeze-wisp.jpg",
  "Gale Bat": "magis/gale-bat.jpg",
  "Storm Harpy": "magis/harpy.jpg",
  "Sky Reaver": "magis/sky-reaver.jpg",
  "Pebble Crab": "magis/pebble-crab.jpg",
  "Mud Brute": "magis/mud-brute.jpg",
  "Stone Golem": "magis/golem.jpg",
  "Quake Titan": "magis/quake-titan.jpg",
};
const NAMES: Record<Element, string[]> = {
  fire: ["Cinder Imp", "Ash Wolf", "Magma Knight", "Inferno Drake"],
  water: ["Tide Slime", "Ripple Eel", "Sea Knight", "Abyss Serpent"],
  wind: ["Breeze Wisp", "Gale Bat", "Storm Harpy", "Sky Reaver"],
  earth: ["Pebble Crab", "Mud Brute", "Stone Golem", "Quake Titan"],
};
const BOOK: Record<CardId, CardDef> = {
  spark: { id: "spark", name: "Spark", element: "fire", damage: 6, cost: 1, tier: 1, kind: "attack", text: "Deal damage." },
  wash: { id: "wash", name: "Wash", element: "water", damage: 6, cost: 1, tier: 1, kind: "attack", text: "Deal damage." },
  breeze: { id: "breeze", name: "Breeze", element: "wind", damage: 6, cost: 1, tier: 1, kind: "attack", text: "Deal damage." },
  pebble: { id: "pebble", name: "Pebble", element: "earth", damage: 6, cost: 1, tier: 1, kind: "attack", text: "Deal damage." },
  fireball: { id: "fireball", name: "Fireball", element: "fire", damage: 13, cost: 1, tier: 2, kind: "attack", text: "Deal damage." },
  blast: { id: "blast", name: "Water Blast", element: "water", damage: 13, cost: 1, tier: 2, kind: "attack", text: "Deal damage." },
  gust: { id: "gust", name: "Gust", element: "wind", damage: 13, cost: 1, tier: 2, kind: "attack", text: "Deal damage." },
  rock: { id: "rock", name: "Rock", element: "earth", damage: 13, cost: 1, tier: 2, kind: "attack", text: "Deal damage." },
  inferno: { id: "inferno", name: "Inferno", element: "fire", damage: 22, cost: 2, tier: 3, kind: "attack", text: "Deal damage." },
  tidal: { id: "tidal", name: "Tidal Wave", element: "water", damage: 22, cost: 2, tier: 3, kind: "attack", text: "Deal damage." },
  tempest: { id: "tempest", name: "Tempest", element: "wind", damage: 22, cost: 2, tier: 3, kind: "attack", text: "Deal damage." },
  quake: { id: "quake", name: "Quake", element: "earth", damage: 22, cost: 2, tier: 3, kind: "attack", text: "Deal damage." },
  ward: { id: "ward", name: "Ward", element: "earth", damage: 10, cost: 1, tier: 2, kind: "guard", text: "Gain 10 block." },
  might: { id: "might", name: "Might", element: "wind", damage: 2, cost: 1, tier: 2, kind: "might", text: "Your spells deal 2 more for the rest of the fight." },
  expose: { id: "expose", name: "Expose", element: "fire", damage: 0, cost: 1, tier: 2, kind: "expose", text: "That enemy takes more damage." },
  soften: { id: "soften", name: "Soften", element: "water", damage: 0, cost: 1, tier: 2, kind: "soften", text: "That enemy deals less damage." },
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
  { id: 8, floor: 2, x: 0.5, kind: "fight", links: [10] },
  { id: 9, floor: 2, x: 0.74, kind: "fight", links: [10] },
  { id: 10, floor: 3, x: 0.5, kind: "elite", links: [11, 12] },
  { id: 11, floor: 4, x: 0.32, kind: "fight", links: [13, 14] },
  { id: 12, floor: 4, x: 0.68, kind: "fight", links: [14, 15] },
  { id: 13, floor: 5, x: 0.22, kind: "fight", links: [16] },
  { id: 14, floor: 5, x: 0.5, kind: "rest", links: [16] },
  { id: 15, floor: 5, x: 0.78, kind: "fight", links: [16] },
  { id: 16, floor: 6, x: 0.5, kind: "rest", links: [17] },
  { id: 17, floor: 7, x: 0.5, kind: "boss", links: [] },
];

let nextUid = 1;
function make(id: CardId): Card {
  nextUid += 1;
  return { ...BOOK[id], uid: nextUid };
}
function starter(extra: CardId) {
  nextUid = 1;
  return [...Array(5)].flatMap(() => [make("spark"), make("wash")]).concat(make(extra));
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
function attackAmount(card: CardDef, foe: Element, magic: number, might: number, vulnerable: boolean) {
  const base = card.damage + magic * 2 + might;
  return Math.max(1, Math.round(base * factor(card.element, foe) * (vulnerable ? 1.5 : 1)));
}
function needXp(level: number) {
  return 24 + level * 12;
}
function nextElement(element: Element) {
  return ELEMENTS[(ELEMENTS.indexOf(element) + 1) % 4]!;
}
function foeOf(element: Element, rank: number, floor: number, index: number, elite: boolean): Enemy {
  const name = NAMES[element][rank]!;
  const hp = elite ? 78 : 14 + floor * 6 + index * 3;
  return {
    uid: index + 1,
    name: elite ? `Elite ${name}` : name,
    element,
    hp,
    max: hp,
    attack: elite ? 14 : 4 + Math.floor(floor * 1.3),
    boss: false,
    elite,
    weak: false,
    vulnerable: false,
    art: PORTRAIT[name] ?? "magis/imp.jpg",
  };
}
function group(node: Node, hex: boolean): Enemy[] {
  if (node.kind === "boss") {
    return [{ uid: 1, name: "Changing Heart", element: "fire", hp: 160, max: 160, attack: 18, boss: true, elite: false, weak: false, vulnerable: hex, art: "magis/boss.jpg" }];
  }
  if (node.kind === "elite") {
    const element = ELEMENTS[node.id % 4]!;
    const enemy = foeOf(element, 3, node.floor, 0, true);
    return [{ ...enemy, vulnerable: hex }];
  }
  const count = node.floor < 3 ? 2 : 3;
  return Array.from({ length: count }, (_, index) => {
    const element = ELEMENTS[(node.id + index) % 4]!;
    const rank = Math.min(3, Math.floor(node.floor / 2));
    const enemy = foeOf(element, rank, node.floor, index, false);
    return { ...enemy, vulnerable: hex };
  });
}
function xpFor(node: Node) {
  if (node.kind === "boss") return 48;
  if (node.kind === "elite") return 36;
  return 10 + node.floor * 4;
}
function pool(floor: number): CardId[] {
  const basic: CardId[] = ["spark", "wash", "breeze", "pebble", "ward", "might", "expose", "soften"];
  const mid: CardId[] = ["fireball", "blast", "gust", "rock"];
  const high: CardId[] = ["inferno", "tidal", "tempest", "quake"];
  if (floor <= 1) return [...basic, "fireball", "blast"];
  if (floor <= 3) return [...basic, ...mid];
  if (floor <= 5) return [...mid, ...high, "ward", "might", "expose", "soften"];
  return [...mid, ...high, "ward", "might"];
}
function offer(floor: number) {
  const picked: CardId[] = [];
  for (const id of shuffle(pool(floor))) {
    if (!picked.includes(id)) picked.push(id);
    if (picked.length === 3) break;
  }
  return picked;
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

function MagisPage() {
  const [look, setLook] = useState<Look>({ robe: ROBES[0]!, hat: "point", skin: SKINS[0]!, gem: "fire" });
  const [deck, setDeck] = useState<Card[]>([]);
  const [hp, setHp] = useState(74);
  const [maxHp, setMaxHp] = useState(74);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [skill, setSkill] = useState(0);
  const [magic, setMagic] = useState(0);
  const [energyMax, setEnergyMax] = useState(3);
  const [relic, setRelic] = useState<RelicId | null>(null);
  const [at, setAt] = useState(-1);
  const [screen, setScreen] = useState<"create" | "boon" | "map" | "fight" | "reward" | "relic" | "dead" | "won">("create");
  const [fight, setFight] = useState<Fight | null>(null);
  const [choices, setChoices] = useState<CardId[]>([]);
  const [pending, setPending] = useState<Node | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [note, setNote] = useState("");

  const open = at < 0 ? MAP.filter((node) => node.floor === 0) : MAP.filter((node) => MAP.find((item) => item.id === at)?.links.includes(node.id));

  function enter(node: Node) {
    if (!open.some((item) => item.id === node.id)) return;
    if (node.kind === "rest") {
      setHp((life) => Math.min(maxHp, life + 30));
      setAt(node.id);
      setNote("Rested. Healed 30.");
      return;
    }
    setPending(node);
    setFight({
      enemies: group(node, relic === "hex"),
      ...deal(shuffle(deck)),
      energy: energyMax,
      energyMax,
      block: relic === "aegis" ? 8 : 0,
      might: relic === "drum" ? 2 : 0,
      log: node.kind === "boss" ? "The heart changes." : node.kind === "elite" ? "An elite bars the way." : "Play a card.",
    });
    setScreen("fight");
  }

  function grant(amount: number) {
    let nextXp = xp + amount;
    let nextLevel = level;
    let points = 0;
    while (nextXp >= needXp(nextLevel)) {
      nextXp -= needXp(nextLevel);
      nextLevel += 1;
      points += 1;
    }
    setXp(nextXp);
    if (points > 0) {
      setLevel(nextLevel);
      setSkill((value) => value + points);
      setHp(maxHp);
      setNote(`Level ${nextLevel}. Healed. +${points} point.`);
    } else setNote(`+${amount} xp.`);
  }

  function play(uid: number, foe: number) {
    if (!fight) return;
    const card = fight.hand.find((entry) => entry.uid === uid);
    if (!card || card.cost > fight.energy) return;
    const needsFoe = card.kind === "attack" || card.kind === "expose" || card.kind === "soften";
    const enemy = foe >= 0 ? fight.enemies[foe] : undefined;
    if (needsFoe && (!enemy || enemy.hp <= 0)) return;
    let block = fight.block;
    let might = fight.might;
    let log = `${card.name}.`;
    let enemies = fight.enemies;
    if (card.kind === "guard") {
      block += card.damage;
      log = `Ward grants ${card.damage} block.`;
    } else if (card.kind === "might") {
      might += card.damage;
      log = `Might rises to ${might}.`;
    } else if (card.kind === "expose" && enemy) {
      enemies = fight.enemies.map((entry, index) => (index === foe ? { ...entry, vulnerable: true } : entry));
      log = `${enemy.name} is exposed.`;
    } else if (card.kind === "soften" && enemy) {
      enemies = fight.enemies.map((entry, index) => (index === foe ? { ...entry, weak: true } : entry));
      log = `${enemy.name} is softened.`;
    } else if (card.kind === "attack" && enemy) {
      const amount = attackAmount(card, enemy.element, magic, might, enemy.vulnerable);
      enemies = fight.enemies.map((entry, index) => (index === foe ? { ...entry, hp: Math.max(0, entry.hp - amount) } : entry));
      const scale = factor(card.element, enemy.element);
      log = scale < 1 ? `${card.name} is resisted for ${amount}.` : scale > 1 || enemy.vulnerable ? `${card.name} lands hard for ${amount}.` : `${card.name} deals ${amount}.`;
    }
    const next: Fight = {
      ...fight,
      energy: fight.energy - card.cost,
      hand: fight.hand.filter((entry) => entry.uid !== uid),
      discard: [...fight.discard, card],
      enemies,
      block,
      might,
      log,
    };
    setFight(next);
    if (enemies.every((entry) => entry.hp <= 0)) {
      const pile = [...next.draw, ...next.hand, ...next.discard];
      setDeck(pile);
      setAt(pending?.id ?? at);
      if (pending) grant(xpFor(pending));
      setFight(null);
      if (pending?.kind === "boss") {
        setScreen("won");
        return;
      }
      if (pending?.kind === "elite") {
        setScreen("relic");
        return;
      }
      setChoices(offer(pending?.floor ?? 0));
      setScreen("reward");
    }
  }

  function endTurn() {
    if (!fight) return;
    let life = hp;
    let block = fight.block;
    const enemies = fight.enemies.map((enemy) => {
      if (enemy.hp <= 0) return enemy;
      const raw = Math.max(1, Math.round(enemy.attack * (enemy.weak ? 0.65 : 1)));
      const soaked = Math.min(block, raw);
      block -= soaked;
      life -= raw - soaked;
      return enemy.boss ? { ...enemy, element: nextElement(enemy.element) } : enemy;
    });
    const piles = drawCards(fight.draw, [...fight.discard, ...fight.hand], 5);
    setHp(Math.max(0, life));
    if (life <= 0) {
      setScreen("dead");
      setFight(null);
      return;
    }
    setFight({
      ...fight,
      enemies,
      ...piles,
      energy: fight.energyMax,
      block: relic === "aegis" ? 8 : 0,
      log: "They strike.",
    });
  }

  function take(id: CardId) {
    setDeck((pile) => [...pile, make(id)]);
    setScreen("map");
    setFight(null);
  }

  function takeRelic(id: RelicId) {
    setRelic(id);
    setNote(`${RELICS[id].name}. ${RELICS[id].text}`);
    setScreen("map");
  }

  function spend(stat: "hp" | "power" | "energy") {
    if (skill < 1) return;
    setSkill((value) => value - 1);
    if (stat === "hp") {
      setMaxHp((value) => value + 10);
      setHp((value) => value + 10);
    }
    if (stat === "power") setMagic((value) => value + 1);
    if (stat === "energy") setEnergyMax((value) => value + 1);
  }

  function retry() {
    setDeck([]);
    setHp(74);
    setMaxHp(74);
    setLevel(1);
    setXp(0);
    setSkill(0);
    setMagic(0);
    setEnergyMax(3);
    setRelic(null);
    setAt(-1);
    setNote("");
    setFight(null);
    setScreen("create");
  }

  return (
    <Shell bare>
      <div className="min-h-[calc(100dvh-4.25rem)] bg-[#14080d] text-[#f3e6c8]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/games" className="rounded-full bg-[#e6c27a] px-4 py-2 text-sm text-[#1a0c12]">
            Games
          </Link>
          <p className="font-display text-2xl font-bold tracking-wide">Magis</p>
          <div className="flex items-center gap-2 text-sm">
            {screen !== "create" && screen !== "boon" ? (
              <p className="hidden sm:block">
                Lv {level} · {hp}/{maxHp} · {skill} pts
              </p>
            ) : null}
            <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-2" onClick={() => setDeckOpen(true)} disabled={!deck.length}>
              Deck
            </button>
            <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-2" onClick={() => setSkillsOpen(true)} disabled={screen === "create" || screen === "boon"}>
              Skills
            </button>
          </div>
        </div>
        {screen === "create" ? <Creator look={look} onChange={setLook} onNext={() => setScreen("boon")} /> : null}
        {screen === "boon" ? (
          <Boon
            onPick={(id) => {
              setDeck(starter(id));
              setScreen("map");
            }}
          />
        ) : null}
        {screen === "map" ? <SpireMap at={at} open={open} hp={hp} relic={relic} note={note} onEnter={enter} /> : null}
        {screen === "fight" && fight ? <Battle look={look} fight={fight} hp={hp} maxHp={maxHp} magic={magic} onPlay={play} onEnd={endTurn} /> : null}
        {screen === "reward" ? <Reward choices={choices} magic={magic} note={note} onTake={take} /> : null}
        {screen === "relic" ? <RelicPick onTake={takeRelic} /> : null}
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
            <div className="w-full max-w-lg rounded-3xl border border-[#e6c27a] bg-[#1a0c12] p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Skills</h2>
                <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-1 text-sm" onClick={() => setSkillsOpen(false)}>
                  Close
                </button>
              </div>
              <p className="mt-1 text-sm">{skill} points. Health +10. Magic Power +2 spell damage. Energy +1.</p>
              <ul className="mt-4 space-y-2">
                <SkillRow label="Health" detail={`${maxHp} hp`} onSpend={() => spend("hp")} disabled={skill < 1} />
                <SkillRow label="Magic Power" detail={`+${magic * 2} damage`} onSpend={() => spend("power")} disabled={skill < 1} />
                <SkillRow label="Energy" detail={`${energyMax} each turn`} onSpend={() => spend("energy")} disabled={skill < 1} />
              </ul>
            </div>
          </div>
        ) : null}
        {deckOpen ? <DeckBook deck={deck} onClose={() => setDeckOpen(false)} /> : null}
      </div>
    </Shell>
  );
}

function SkillRow({ label, detail, onSpend, disabled }: { label: string; detail: string; onSpend: () => void; disabled: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[#e6c27a]/40 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold">{label}</p>
        <p className="text-sm">{detail}</p>
      </div>
      <button type="button" className="rounded-full bg-[#e6c27a] px-3 py-2 text-sm text-[#1a0c12] disabled:opacity-40" disabled={disabled} onClick={onSpend}>
        +1
      </button>
    </li>
  );
}

function DeckBook({ deck, onClose }: { deck: Card[]; onClose: () => void }) {
  const counts = new Map<CardId, number>();
  for (const card of deck) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  const ids = [...counts.keys()].sort((a, b) => BOOK[a].tier - BOOK[b].tier || BOOK[a].name.localeCompare(BOOK[b].name));
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4">
      <div className="max-h-[84dvh] w-full max-w-3xl overflow-auto rounded-3xl border border-[#e6c27a] bg-[#1a0c12] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Deck · {deck.length}</h2>
          <button type="button" className="rounded-full border border-[#e6c27a] px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ids.map((id) => (
            <li key={id} className="flex items-center gap-3 rounded-2xl border border-[#e6c27a]/40 p-2">
              <img src={asset(SPELL_ART[id])} alt="" className="h-16 w-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">
                  {BOOK[id].name} ×{counts.get(id)}
                </p>
                <p className="text-sm">{BOOK[id].text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Creator({ look, onChange, onNext }: { look: Look; onChange: (look: Look) => void; onNext: () => void }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
      <div className="rounded-3xl border border-[#e6c27a]/40 bg-[#2a1018] p-4 text-center">
        <WizardFigure look={look} />
        <p className="mt-2 font-display text-xl font-bold">Your wizard</p>
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold">Shape the mage</h2>
        <Swatches label="Robe" values={ROBES} current={look.robe} onPick={(robe) => onChange({ ...look, robe })} />
        <Swatches label="Skin" values={SKINS} current={look.skin} onPick={(skin) => onChange({ ...look, skin })} />
        <p className="mt-4 text-sm">Hat</p>
        <div className="mt-2 flex gap-2">
          {(["point", "wide", "hood"] as const).map((hat) => (
            <button key={hat} type="button" className={`rounded-full px-3 py-2 text-sm capitalize ${look.hat === hat ? "bg-[#e6c27a] text-[#1a0c12]" : "border border-[#e6c27a]"}`} onClick={() => onChange({ ...look, hat })}>
              {hat}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm">Staff gem</p>
        <div className="mt-2 flex gap-2">
          {ELEMENTS.map((gem) => (
            <button key={gem} type="button" className={`size-9 rounded-full border-2 ${look.gem === gem ? "border-white" : "border-transparent"}`} style={{ background: INK[gem] }} onClick={() => onChange({ ...look, gem })} />
          ))}
        </div>
        <button type="button" className="mt-6 rounded-full bg-[#e6c27a] px-5 py-3 text-sm text-[#1a0c12]" onClick={onNext}>
          Choose a starting spell
        </button>
      </div>
    </div>
  );
}

function Swatches({ label, values, current, onPick }: { label: string; values: string[]; current: string; onPick: (value: string) => void }) {
  return (
    <div className="mt-4">
      <p className="text-sm">{label}</p>
      <div className="mt-2 flex gap-2">
        {values.map((value) => (
          <button key={value} type="button" className={`size-9 rounded-full border-2 ${current === value ? "border-white" : "border-transparent"}`} style={{ background: value }} onClick={() => onPick(value)} />
        ))}
      </div>
    </div>
  );
}

function Boon({ onPick }: { onPick: (id: CardId) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-center">
      <h2 className="font-display text-4xl font-bold">One stronger spell</h2>
      <p className="mt-2 text-sm">It joins five Sparks and five Washes.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {STRONG.map((id) => (
          <button key={id} type="button" className="h-64 w-40 overflow-hidden rounded-2xl border-2 border-[#e6c27a] bg-[#1a0c12] text-left" onClick={() => onPick(id)}>
            <SpellCard card={BOOK[id]} shown={BOOK[id].damage} />
          </button>
        ))}
      </div>
    </div>
  );
}

function WizardFigure({ look }: { look: Look }) {
  return (
    <svg viewBox="0 0 140 200" className="mx-auto h-52 w-36">
      <path d="M48 100 L16 150" stroke={look.robe} strokeWidth="16" strokeLinecap="round" />
      <path d="M92 100 L124 138" stroke={look.robe} strokeWidth="16" strokeLinecap="round" />
      <path d="M70 86 L112 196 L28 196 Z" fill={look.robe} />
      <line x1="124" y1="78" x2="128" y2="196" stroke="#6b4328" strokeWidth="5" />
      <circle cx="122" cy="70" r="11" fill={INK[look.gem]} />
      <circle cx="70" cy="70" r="24" fill={look.skin} />
      {look.hat === "point" ? <polygon points="70,6 100,64 40,64" fill={look.robe} /> : null}
      {look.hat === "wide" ? (
        <>
          <ellipse cx="70" cy="58" rx="46" ry="10" fill={look.robe} />
          <rect x="52" y="22" width="36" height="36" rx="8" fill={look.robe} />
        </>
      ) : null}
      {look.hat === "hood" ? <path d="M38 78 Q70 12 102 78 Q70 52 38 78" fill={look.robe} /> : null}
      <circle cx="61" cy="70" r="2.4" fill="#1a0c12" />
      <circle cx="79" cy="70" r="2.4" fill="#1a0c12" />
    </svg>
  );
}

function SpireMap({ at, open, hp, relic, note, onEnter }: { at: number; open: Node[]; hp: number; relic: RelicId | null; note: string; onEnter: (node: Node) => void }) {
  const width = 640;
  const height = 1080;
  const spot = (node: Node) => ({ x: 70 + node.x * (width - 140), y: 70 + node.floor * 125 });
  return (
    <div className="mx-auto max-w-3xl px-3 pb-8">
      <p className="text-sm text-[#e6c27a]">Water beats Fire. Fire beats Wind. Wind beats Earth. Earth beats Water. The other way resists.</p>
      <p className="mt-1 text-sm">
        You have {hp} hp. An elite waits halfway up. A rest sits just before the boss.
        {relic ? ` Relic: ${RELICS[relic].name}.` : ""} {note}
      </p>
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
          const fill = node.kind === "boss" ? "#e25b4a" : node.kind === "rest" ? "#3ecf8e" : node.kind === "elite" ? "#c084fc" : "#c9a15b";
          const label = node.kind === "rest" ? "Rest" : node.kind === "boss" ? "Boss" : node.kind === "elite" ? "Elite" : "Fight";
          return (
            <g key={node.id} onClick={() => ready && onEnter(node)} style={{ cursor: ready ? "pointer" : "default" }}>
              <circle cx={pos.x} cy={pos.y} r={node.kind === "boss" || node.kind === "elite" ? 28 : 22} fill={ready ? fill : done ? "#5c4632" : "#1a0c12"} stroke="#e6c27a" strokeWidth={ready ? 4 : 2} />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={ready || done ? "#1a0c12" : "#e6c27a"} fontSize="12" fontWeight="700">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Battle({ look, fight, hp, maxHp, magic, onPlay, onEnd }: { look: Look; fight: Fight; hp: number; maxHp: number; magic: number; onPlay: (uid: number, foe: number) => void; onEnd: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [striking, setStriking] = useState(false);
  useEffect(() => {
    if (!striking) return;
    const timer = window.setTimeout(() => setStriking(false), 700);
    return () => window.clearTimeout(timer);
  }, [striking]);
  const topDiscard = fight.discard[fight.discard.length - 1];
  const pickedCard = fight.hand.find((card) => card.uid === picked);

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] px-28 pb-6 sm:px-36">
      <style>{`@keyframes magis-hit{0%,100%{transform:scale(1)}45%{transform:scale(1.12);filter:brightness(1.45)}}`}</style>
      <div className="fixed bottom-6 left-2 z-20 w-24 sm:left-4 sm:w-28">
        <Pile label="Draw" count={fight.draw.length}>
          {fight.draw.length ? <CardBack /> : <EmptyPile />}
        </Pile>
      </div>
      <div className="fixed right-2 bottom-6 z-20 w-24 sm:right-4 sm:w-28">
        <Pile label="Discard" count={fight.discard.length}>
          {topDiscard ? <SpellCard card={topDiscard} shown={shownValue(topDiscard, magic, fight.might)} /> : <EmptyPile />}
        </Pile>
      </div>
      <div className="flex items-end gap-4 py-4">
        <div className="w-36 shrink-0 text-center">
          <WizardFigure look={look} />
          <p className="font-display text-lg font-bold">
            {hp}/{maxHp}
          </p>
          <p className="text-xs text-[#9fd8ff]">Block {fight.block}</p>
          <p className="text-xs text-[#e6c27a]">Might {fight.might}</p>
        </div>
        <div className="flex flex-1 flex-wrap items-end justify-center gap-4">
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
                src={asset(enemy.art)}
                alt=""
                className="mx-auto h-44 w-32 rounded-2xl border-4 object-cover"
                style={{ borderColor: INK[enemy.element], animation: striking && enemy.hp > 0 ? "magis-hit 0.7s ease" : undefined }}
              />
              <p className="mt-2 font-display text-lg font-bold leading-tight">{enemy.name}</p>
              <p className="text-xs uppercase" style={{ color: INK[enemy.element] }}>
                {enemy.element}
                {enemy.vulnerable ? " · exposed" : ""}
                {enemy.weak ? " · softened" : ""}
              </p>
              <div className="mx-auto mt-1 h-2 w-28 overflow-hidden rounded-full bg-[#1a0c12]">
                <div className="h-full" style={{ width: `${(enemy.hp / enemy.max) * 100}%`, background: INK[enemy.element] }} />
              </div>
              <p className="text-xs">
                {enemy.hp}/{enemy.max} · hits {enemy.weak ? Math.max(1, Math.round(enemy.attack * 0.65)) : enemy.attack}
                {enemy.boss ? `, then ${nextElement(enemy.element)}` : ""}
              </p>
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-sm">{pickedCard ? (pickedCard.kind === "guard" || pickedCard.kind === "might" ? pickedCard.name : "Click an enemy.") : fight.log}</p>
      <div className="my-2 flex items-center justify-center gap-4 text-sm">
        <p className="text-[#e6c27a]">
          {fight.energy}/{fight.energyMax} energy
        </p>
        <button
          type="button"
          className="rounded-full bg-[#e6c27a] px-4 py-2 text-[#1a0c12]"
          onClick={() => {
            setPicked(null);
            setStriking(true);
            onEnd();
          }}
        >
          End turn
        </button>
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
        {fight.hand.map((entry) => {
          const self = entry.kind === "guard" || entry.kind === "might";
          return (
            <button
              key={entry.uid}
              type="button"
              className={`relative h-52 w-32 shrink-0 overflow-hidden rounded-2xl border-2 bg-[#1a0c12] text-left disabled:opacity-40 ${picked === entry.uid ? "border-[#fff6d8] ring-2 ring-[#fff6d8]" : "border-[#e6c27a]"}`}
              disabled={entry.cost > fight.energy}
              onClick={() => {
                if (self) {
                  onPlay(entry.uid, -1);
                  return;
                }
                setPicked((current) => (current === entry.uid ? null : entry.uid));
              }}
            >
              <SpellCard card={entry} shown={shownValue(entry, magic, fight.might, fight.enemies.find((enemy) => enemy.hp > 0))} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shownValue(card: CardDef, magic: number, might: number, foe?: Enemy) {
  if (card.kind === "guard") return card.damage;
  if (card.kind === "might") return card.damage;
  if (card.kind === "expose") return 0;
  if (card.kind === "soften") return 0;
  if (!foe) return card.damage + magic * 2 + might;
  return attackAmount(card, foe.element, magic, might, foe.vulnerable);
}

function Pile({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  return (
    <div className="text-center">
      <div className="h-40 overflow-hidden rounded-2xl sm:h-44">{children}</div>
      <p className="mt-1 text-xs">
        {label} {count}
      </p>
    </div>
  );
}

function EmptyPile() {
  return <div className="h-full rounded-2xl border border-dashed border-[#e6c27a]/40 bg-[#14080d]/80" />;
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

function SpellCard({ card, shown }: { card: CardDef; shown: number }) {
  const frame = card.tier === 3 ? "shadow-[inset_0_0_0_3px_#e25b4a]" : card.tier === 2 ? "shadow-[inset_0_0_0_3px_#f2c14e]" : "";
  const face = card.kind === "expose" ? "Mark" : card.kind === "soften" ? "Weak" : card.kind === "might" ? `+${shown}` : String(shown);
  return (
    <div className={`relative h-full w-full ${frame}`}>
      <img src={asset(SPELL_ART[card.id])} alt="" className="h-28 w-full object-cover" />
      <span className="absolute top-1 left-1 grid size-7 place-items-center rounded-full text-sm font-bold text-[#1a0c12]" style={{ background: INK[card.element] }}>
        {card.cost}
      </span>
      <p className="px-2 pt-1 text-center text-lg font-bold text-[#f3e6c8]">{face}</p>
      <p className="px-1 text-center font-display text-sm leading-tight">{card.name}</p>
    </div>
  );
}

function Reward({ choices, magic, note, onTake }: { choices: CardId[]; magic: number; note: string; onTake: (id: CardId) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-center">
      <h2 className="font-display text-4xl font-bold">Choose a spell</h2>
      <p className="mt-2 text-sm">{note}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {choices.map((id) => (
          <button key={id} type="button" className="h-64 w-40 overflow-hidden rounded-2xl border-2 border-[#e6c27a] bg-[#1a0c12] text-left" onClick={() => onTake(id)}>
            <SpellCard card={BOOK[id]} shown={shownValue(BOOK[id], magic, 0)} />
          </button>
        ))}
      </div>
    </div>
  );
}

function RelicPick({ onTake }: { onTake: (id: RelicId) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center">
      <h2 className="font-display text-4xl font-bold">The elite drops a relic</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(Object.keys(RELICS) as RelicId[]).map((id) => (
          <button key={id} type="button" className="rounded-3xl border-2 border-[#e6c27a] bg-[#1a0c12] p-4 text-left" onClick={() => onTake(id)}>
            <p className="font-display text-xl font-bold">{RELICS[id].name}</p>
            <p className="mt-2 text-sm">{RELICS[id].text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
