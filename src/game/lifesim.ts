export type Place = "apartment" | "street" | "work" | "park" | "diner" | "shop" | "hall" | "hospital";
export type Home = "studio" | "loft" | "house";
export type Job = "none" | "barista" | "clerk" | "nurse" | "coder";

export type LifeState = {
  day: number;
  hour: number;
  place: Place;
  home: Home;
  money: number;
  hunger: number;
  tired: number;
  job: Job;
  shifts: number;
  study: number;
  spouse: string | null;
  dating: string | null;
  inventory: string[];
  rentIn: number;
  affection: Record<string, number>;
  met: string[];
  visitor: string | null;
  flags: string[];
  log: string[];
  ending: string | null;
};

export const PEOPLE: { id: string; name: string }[] = [
  { id: "june", name: "June" },
  { id: "marco", name: "Marco" },
  { id: "priya", name: "Priya" },
  { id: "ellis", name: "Ellis" },
  { id: "sam", name: "Sam" },
  { id: "ruth", name: "Ruth" },
];

const RENT: Record<Home, number> = { studio: 30, loft: 70, house: 120 };

export function freshLife(): LifeState {
  return {
    day: 1,
    hour: 8,
    place: "apartment",
    home: "studio",
    money: 40,
    hunger: 25,
    tired: 10,
    job: "none",
    shifts: 0,
    study: 0,
    spouse: null,
    dating: null,
    inventory: ["keys", "bread"],
    rentIn: 7,
    affection: {},
    met: [],
    visitor: null,
    flags: [],
    ending: null,
    log: [
      "You wake in a small studio. The street is one flight down. Rent is due in a week. Type what you want to do.",
    ],
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function personName(id: string | null) {
  return PEOPLE.find((person) => person.id === id)?.name ?? "someone";
}

function has(words: string[], ...need: string[]) {
  return need.every((word) => words.includes(word));
}

function any(words: string[], ...opts: string[]) {
  return opts.some((word) => words.includes(word));
}

function placeName(place: Place, home: Home) {
  if (place === "apartment") return home === "house" ? "your house" : home === "loft" ? "your loft" : "your studio";
  if (place === "street") return "the street";
  if (place === "work") return "work";
  if (place === "park") return "the park";
  if (place === "diner") return "the diner";
  if (place === "shop") return "the shop";
  if (place === "hall") return "city hall";
  return "the hospital";
}

function push(state: LifeState, line: string): LifeState {
  return { ...state, log: [...state.log, line].slice(-100) };
}

function pass(state: LifeState, hours: number, hunger: number, tired: number): LifeState {
  let hour = state.hour + hours;
  let day = state.day;
  let rentIn = state.rentIn;
  while (hour >= 24) {
    hour -= 24;
    day += 1;
    rentIn -= 1;
  }
  return {
    ...state,
    hour,
    day,
    rentIn,
    hunger: clamp(state.hunger + hunger),
    tired: clamp(state.tired + tired),
  };
}

function finish(state: LifeState, ending: string, line: string): LifeState {
  return { ...push(state, line), ending };
}

function after(state: LifeState): LifeState {
  if (state.ending) return state;
  if (state.hunger >= 100) {
    return push(
      { ...state, place: "hospital", hunger: 40, tired: Math.min(state.tired, 40), money: Math.max(0, state.money - 25) },
      "You fold. You wake in a hospital bed with a bill and a paper cup of water.",
    );
  }
  if (state.tired >= 100) {
    const robbed = state.place === "street";
    return push(
      {
        ...state,
        tired: 20,
        place: robbed ? "street" : state.place,
        money: robbed ? Math.max(0, state.money - 15) : state.money,
        hour: (state.hour + 6) % 24,
      },
      robbed
        ? "Your legs quit. You sleep against a shutter and wake lighter by fifteen dollars."
        : "You drop where you stand and sleep like a stone. The clock jumps.",
    );
  }
  if (state.rentIn <= 0 && !state.flags.includes("rent-called")) {
    return push(
      { ...state, flags: [...state.flags, "rent-called"] },
      `Rent is due for the ${state.home}: $${RENT[state.home]}. Type pay rent.`,
    );
  }
  if (state.rentIn <= -2 && state.money < RENT[state.home]) {
    return finish(
      state,
      "Evicted",
      "The lock is changed. Your things sit in two bags on the stair. This life in the apartment is over.",
    );
  }
  if (state.day >= 40 && state.spouse && state.home === "house" && state.hunger < 50 && !state.flags.includes("settled")) {
    return push(
      { ...state, flags: [...state.flags, "settled"] },
      `The house is quiet in a good way. ${personName(state.spouse)} leaves a mug where you will find it. You could keep going, or type settle down.`,
    );
  }
  return state;
}

function say(state: LifeState, line: string, hours = 1, hunger = 4, tired = 3): LifeState {
  return after(push(pass(state, hours, hunger, tired), line));
}

function own(state: LifeState, item: string) {
  return state.inventory.includes(item);
}

function giveItem(state: LifeState, item: string): LifeState {
  return { ...state, inventory: [...state.inventory, item] };
}

function takeItem(state: LifeState, item: string): LifeState {
  const index = state.inventory.indexOf(item);
  if (index < 0) return state;
  const inventory = state.inventory.slice();
  inventory.splice(index, 1);
  return { ...state, inventory };
}

function like(state: LifeState, id: string, amount: number): LifeState {
  return {
    ...state,
    affection: { ...state.affection, [id]: clamp((state.affection[id] ?? 0) + amount) },
    met: state.met.includes(id) ? state.met : [...state.met, id],
  };
}

function meetStreet(state: LifeState): LifeState {
  const roll = Math.floor(Math.random() * 8);
  if (roll === 0) {
    return say(
      { ...like(state, "june", 4), visitor: "june" },
      "June from the landing steps into your path. “You look like you have not eaten. Walk with me, or tell me to get lost.”",
      1,
      2,
      2,
    );
  }
  if (roll === 1) {
    return say(
      { ...like(state, "marco", 3), visitor: "marco" },
      "A man in a diner apron, Marco, waves you down. “We are short a pair of hands. Ask me about a job if you want one.”",
      1,
      2,
      2,
    );
  }
  if (roll === 2) {
    return say(
      { ...like(state, "ellis", 5), visitor: "ellis" },
      "Ellis is playing a soft song on a bench and looks up. “You can sit. Or you can keep walking. Both are allowed.”",
      1,
      2,
      2,
    );
  }
  if (roll === 3) {
    return say(
      { ...like(state, "priya", 3), visitor: "priya" },
      "Priya from the corner shop calls your name wrong, then gets it right. “Sale on bread. Also, I am bored. Talk to me.”",
      1,
      2,
      2,
    );
  }
  if (roll === 4) {
    return say(
      state,
      own(state, "wallet")
        ? "The street is just people and a bus that is not yours."
        : "A wallet lies by the curb. You can take the wallet or leave it.",
      1,
      2,
      2,
    );
  }
  if (roll === 5) {
    return say(
      { ...like(state, "sam", 2), visitor: "sam" },
      "Sam in scrubs is off shift and lost. “Hospital is that way. If you ever want real work, study, then come find me.”",
      1,
      2,
      2,
    );
  }
  if (roll === 6) {
    return say(
      state,
      "A dog with a paper tag circles your ankles, then runs toward the park. You could follow it.",
      1,
      2,
      2,
    );
  }
  return say(state, "You walk a block. Nobody wants anything from you. That is its own kind of luck.", 1, 3, 3);
}

function look(state: LifeState): LifeState {
  const here = placeName(state.place, state.home);
  const body =
    state.hunger > 75 ? " Your stomach is loud." : state.hunger > 45 ? " You could eat." : " You are not hungry yet.";
  const rest = state.tired > 75 ? " Your eyes keep closing." : state.tired > 45 ? " You are getting tired." : "";
  const who = state.visitor ? ` ${personName(state.visitor)} is still here.` : "";
  const rent =
    state.place === "apartment" ? ` Rent for the ${state.home} is $${RENT[state.home]}, due in ${state.rentIn} day${state.rentIn === 1 ? "" : "s"}.` : "";
  return say(state, `You are at ${here}.${body}${rest}${who}${rent}`, 0, 0, 0);
}

function go(state: LifeState, place: Place): LifeState {
  if (state.place === place) return say(state, `You are already at ${placeName(place, state.home)}.`, 0, 0, 0);
  let next = { ...state, place, visitor: null as string | null };
  if (place === "street") return meetStreet(next);
  if (place === "apartment") {
    const spouse = state.spouse ? ` ${personName(state.spouse)} is home.` : "";
    return say(next, `You climb back to ${placeName("apartment", state.home)}.${spouse}`, 1, 2, 2);
  }
  if (place === "work") {
    if (state.job === "none") return say(state, "You do not have a workplace yet. Try the diner, the shop, or the hospital.", 0, 0, 0);
    return say(next, "You badge in, or pretend the door already knows you.", 1, 3, 2);
  }
  const lines: Record<Place, string> = {
    apartment: "",
    street: "",
    work: "",
    park: "The park is mostly pigeons and one working fountain.",
    diner: "The diner smells like coffee and the grill.",
    shop: "The shop bell rings. Priya does not look up right away.",
    hall: "City hall smells like paper and floor wax. Ruth stamps things behind the glass.",
    hospital: "The hospital is bright and too clean. Sam might be on the ward.",
  };
  return say(next, lines[place], 1, 3, 3);
}

function eat(state: LifeState, words: string[]): LifeState {
  if (any(words, "cook", "groceries") && own(state, "groceries") && state.place === "apartment") {
    return say(takeItem(state, "groceries"), "You cook a real meal. The plate is ugly and the food is good.", 1, -35, 4);
  }
  if (own(state, "bread")) {
    return say(takeItem(state, "bread"), "You eat the bread. It helps. It is still just bread.", 1, -22, 1);
  }
  if (state.place === "diner") {
    if (state.money < 12) return say(state, "A plate is twelve dollars. You do not have it.", 0, 0, 0);
    return say({ ...state, money: state.money - 12 }, "You order the plate. It comes fast and hot.", 1, -30, 2);
  }
  if (state.place === "shop" && state.money >= 8) {
    return say({ ...state, money: state.money - 8 }, "You buy bread and eat it on the step.", 1, -20, 1);
  }
  return say(state, "Nothing to eat. Buy bread, buy groceries, or go to the diner.", 0, 0, 0);
}

function sleep(state: LifeState): LifeState {
  if (state.place !== "apartment") {
    return say(state, "You can nap here, but a real sleep wants a bed. Go home.", 1, 2, -8);
  }
  const hours = state.hour <= 8 ? 8 - state.hour : 24 - state.hour + 8;
  const spouse = state.spouse ? ` ${personName(state.spouse)} is a warm shape on the other side of the bed.` : "";
  return say(state, `You sleep until morning.${spouse}`, hours, 8, -state.tired);
}

function buy(state: LifeState, words: string[]): LifeState {
  const catalog: { keys: string[]; item: string; cost: number; places: Place[]; line: string }[] = [
    { keys: ["bread", "food"], item: "bread", cost: 8, places: ["shop", "diner"], line: "You buy a loaf of bread." },
    { keys: ["coffee"], item: "coffee", cost: 4, places: ["diner", "shop"], line: "You buy a coffee. It is too hot and exactly right." },
    { keys: ["groceries", "grocery"], item: "groceries", cost: 15, places: ["shop"], line: "You buy groceries. Enough to cook." },
    { keys: ["flowers", "flower"], item: "flowers", cost: 12, places: ["shop", "park"], line: "You buy flowers. They will not last. That is the point." },
    { keys: ["ring"], item: "ring", cost: 80, places: ["shop"], line: "The ring is simple. It still costs eighty dollars." },
    { keys: ["book"], item: "book", cost: 10, places: ["shop"], line: "You buy a used book with a cracked spine." },
    { keys: ["meds", "medicine"], item: "meds", cost: 18, places: ["shop", "hospital"], line: "You buy medicine." },
    { keys: ["laptop", "computer"], item: "laptop", cost: 200, places: ["shop"], line: "You buy a secondhand laptop. The fan complains and then agrees." },
  ];
  const pick = catalog.find((entry) => any(words, ...entry.keys));
  if (!pick) return say(state, "Buy what? Bread, coffee, groceries, flowers, a ring, a book, meds, or a laptop.", 0, 0, 0);
  if (!pick.places.includes(state.place)) return say(state, `You cannot buy that at ${placeName(state.place, state.home)}.`, 0, 0, 0);
  if (own(state, pick.item) && pick.item !== "bread" && pick.item !== "coffee") {
    return say(state, `You already have a ${pick.item}.`, 0, 0, 0);
  }
  if (state.money < pick.cost) return say(state, `That is $${pick.cost}. You are short.`, 0, 0, 0);
  let next = { ...state, money: state.money - pick.cost };
  if (pick.item === "coffee") {
    return say(next, "You drink the coffee standing up. Tiredness backs off a little.", 1, 2, -12);
  }
  next = giveItem(next, pick.item);
  return say(next, pick.line, 1, 1, 1);
}

function jobPay(job: Job, shifts: number) {
  const base = job === "barista" ? 40 : job === "clerk" ? 48 : job === "nurse" ? 70 : job === "coder" ? 90 : 0;
  return shifts >= 8 ? base + 15 : base;
}

function work(state: LifeState): LifeState {
  if (state.job === "none") return say(state, "You have no job. Ask Marco, Priya, or Sam, or type apply.", 0, 0, 0);
  if (state.tired > 85) return say(state, "You are too tired to finish a shift. Sleep first.", 0, 0, 0);
  const pay = jobPay(state.job, state.shifts);
  let next: LifeState = { ...state, place: "work", money: state.money + pay, shifts: state.shifts + 1, visitor: null };
  let line = `You work a ${state.job} shift and take home $${pay}.`;
  if (next.shifts === 5) line += " Someone says you are getting faster.";
  if (next.shifts === 8) line += " They raise your pay.";
  if (next.shifts === 14 && state.job === "coder") {
    line += " A client asks for you by name. The work is yours if you want to keep it.";
    next = { ...next, flags: [...next.flags, "known-coder"] };
  }
  if (next.shifts === 12 && state.job === "nurse") line += " Sam lets you close a chart without hovering.";
  return say(next, line, 8, 18, 28);
}

function apply(state: LifeState, words: string[]): LifeState {
  if (state.job !== "none" && !any(words, "quit")) {
    return say(state, `You already work as a ${state.job}. Quit first if you want another life.`, 0, 0, 0);
  }
  if (any(words, "quit")) {
    if (state.job === "none") return say(state, "You are already unemployed.", 0, 0, 0);
    return say({ ...state, job: "none" }, "You quit. The next morning is very wide.", 1, 2, 2);
  }
  if ((state.place === "diner" || state.visitor === "marco") && (any(words, "barista", "diner", "marco", "job", "apply", "hire") || words.length < 3)) {
    return say({ ...like(state, "marco", 6), job: "barista", visitor: null }, "Marco throws you an apron. “You start when you type work.”", 1, 2, 2);
  }
  if ((state.place === "shop" || state.visitor === "priya") && any(words, "clerk", "shop", "priya", "job", "apply", "hire")) {
    return say({ ...like(state, "priya", 6), job: "clerk" }, "Priya shrugs. “You can run the register. Do not pocket the gum.”", 1, 2, 2);
  }
  if ((state.place === "hospital" || state.visitor === "sam") && state.study >= 2) {
    return say({ ...like(state, "sam", 8), job: "nurse" }, "Sam reads your notes and nods. “You are hired. It will be tiring on purpose.”", 2, 3, 3);
  }
  if ((state.place === "hospital" || state.visitor === "sam") && state.study < 2) {
    return say(like(state, "sam", 1), "Sam says study at home at least twice, then come back.", 1, 1, 1);
  }
  if (own(state, "laptop") && any(words, "coder", "code", "laptop", "computer")) {
    return say({ ...state, job: "coder" }, "You answer an ad from the laptop and get a trial. Type work when you can stay awake.", 1, 2, 2);
  }
  return say(state, "Nobody is hiring you here. Try the diner, the shop, the hospital after studying, or buy a laptop and apply to code.", 0, 0, 0);
}

function talk(state: LifeState, words: string[]): LifeState {
  const named = PEOPLE.find((person) => words.includes(person.id) || words.includes(person.name.toLowerCase()));
  const id = named?.id ?? state.visitor;
  if (!id) return say(state, "Nobody is waiting on your words. Walk the street.", 0, 0, 0);
  const name = personName(id);
  let next = like(state, id, 4);
  const affection = next.affection[id] ?? 0;
  if (id === "marco" && state.job === "none") {
    return say(next, `${name} dries a glass. “Ask me for a job and the apron is yours.”`, 1, 2, 1);
  }
  if (id === "sam") {
    return say(next, state.study >= 2 ? `${name} says the ward can use you. Type apply.` : `${name} talks about nights and charts. “Study, then we will see.”`, 1, 2, 1);
  }
  if (id === "ruth" || state.place === "hall") {
    return say(
      like(next, "ruth", 2),
      "Ruth slides a housing sheet under the glass. A loft wants a deposit. A house wants more, or a spouse and a steady job.",
      1,
      1,
      1,
    );
  }
  if (affection > 55) {
    return say(next, `${name} talks like you are already in the story. Affection is high. Flowers would not hurt. A ring might.`, 1, 2, 1);
  }
  return say(next, `${name} stays for a few minutes. You learn a small true thing and forget to write it down.`, 1, 2, 2);
}

function romance(state: LifeState, words: string[]): LifeState {
  const named = PEOPLE.find((person) => words.includes(person.id) || words.includes(person.name.toLowerCase()));
  const id = named?.id ?? state.dating ?? state.visitor;
  if (!id) return say(state, "Ask out whom? Name them, or talk to someone first.", 0, 0, 0);
  if (state.spouse) return say(state, `You are married to ${personName(state.spouse)}.`, 0, 0, 0);
  const name = personName(id);
  const affection = state.affection[id] ?? 0;
  if (own(state, "flowers") && any(words, "flowers", "flower", "give")) {
    return say(
      { ...takeItem(like(state, id, 18), "flowers"), dating: id },
      `You give ${name} the flowers. They keep them. You are dating.`,
      1,
      2,
      2,
    );
  }
  if (any(words, "propose", "marry", "wedding", "ring")) {
    if (!own(state, "ring")) return say(state, "You need a ring from the shop.", 0, 0, 0);
    if (affection < 40) {
      return say(like(state, id, -5), `${name} laughs once, not unkindly. “That is a no.”`, 1, 2, 3);
    }
    if (affection < 70) {
      return say(like(state, id, 2), `${name} closes your hand over the ring. “Not yet. Keep showing up.”`, 1, 2, 2);
    }
    return say(
      { ...takeItem(like(state, id, 10), "ring"), spouse: id, dating: null, visitor: null },
      `${name} says yes. It is not a big wedding. It is a yes. They live with you now.`,
      3,
      4,
      6,
    );
  }
  if (affection < 25) return say(like(state, id, 2), `${name} is not there yet. Talk more. Bring flowers.`, 1, 1, 1);
  if (affection >= 40) {
    return say({ ...like(state, id, 8), dating: id }, `${name} says yes to a walk and a second plan. You are dating.`, 2, 3, 3);
  }
  return say(like(state, id, 3), `${name} smiles and does not promise anything.`, 1, 1, 1);
}

function move(state: LifeState, words: string[]): LifeState {
  const wantHouse = any(words, "house");
  const wantLoft = any(words, "loft");
  const out = any(words, "out", "leave", "move");
  if (!out && !wantHouse && !wantLoft) return say(state, "Move where? A loft, a house, or move out of this place.", 0, 0, 0);
  if (state.place !== "apartment" && state.place !== "hall") {
    return say(state, "Figure out housing at home or at city hall.", 0, 0, 0);
  }
  if (wantHouse || (out && state.spouse && state.money >= 200)) {
    if (state.money < 200) return say(state, "A house needs $200 up front. You are not there.", 0, 0, 0);
    if (!state.spouse && state.money < 800) return say(state, "Alone, the house wants $800. With a spouse, $200 is enough.", 0, 0, 0);
    const cost = state.spouse ? 200 : 800;
    return say(
      { ...state, money: state.money - cost, home: "house", place: "apartment", rentIn: 7 },
      state.spouse
        ? `You and ${personName(state.spouse)} take the keys to a narrow house. The studio is someone else's now.`
        : "You buy your way into a house alone. The rooms sound bigger at night.",
      5,
      6,
      10,
    );
  }
  if (state.home === "loft" && !wantHouse) return say(state, "You already left the studio. A house is the next move.", 0, 0, 0);
  if (state.money < 120) return say(state, "Moving to a loft needs $120. Keep working.", 0, 0, 0);
  if (state.job === "none" && !state.spouse) return say(state, "Ruth will not sign a loft without a job or a spouse.", 0, 0, 0);
  return say(
    { ...state, money: state.money - 120, home: "loft", place: "apartment", rentIn: 7 },
    "You move out of the studio and into a loft with a real window. The street looks different from this high.",
    4,
    5,
    8,
  );
}

function payRent(state: LifeState): LifeState {
  const due = RENT[state.home];
  if (state.place !== "apartment" && state.place !== "hall") return say(state, "Pay rent at home or at city hall.", 0, 0, 0);
  if (state.money < due) return say(state, `Rent is $${due}. You do not have it.`, 0, 0, 0);
  return say(
    { ...state, money: state.money - due, rentIn: 7, flags: state.flags.filter((flag) => flag !== "rent-called") },
    `You pay $${due}. The ${state.home} is yours for another week.`,
    1,
    1,
    1,
  );
}

function use(state: LifeState, words: string[]): LifeState {
  if (any(words, "meds", "medicine") && own(state, "meds")) {
    return say({ ...takeItem(state, "meds"), hunger: clamp(state.hunger - 5) }, "The medicine knocks the edge off. You feel less wrecked.", 1, 0, -8);
  }
  if (any(words, "book") && own(state, "book")) return study(state);
  if (any(words, "coffee") && own(state, "coffee")) {
    return say(takeItem(state, "coffee"), "You drink the coffee.", 1, 1, -12);
  }
  if (any(words, "laptop") && own(state, "laptop")) {
    return say({ ...state, study: state.study + 1 }, "You practice on the laptop until the room gets dark.", 2, 4, 6);
  }
  return say(state, "Use what? Meds, the book, coffee, or the laptop.", 0, 0, 0);
}

function study(state: LifeState): LifeState {
  if (state.place !== "apartment" && !own(state, "book")) {
    return say(state, "Study at home. A book helps.", 0, 0, 0);
  }
  const next = { ...state, study: state.study + 1 };
  const line =
    next.study >= 2
      ? "The notes start to connect. Sam would take you seriously now."
      : "You study until the sentence you are on stops meaning anything.";
  return say(next, line, 3, 6, 8);
}

function special(state: LifeState, words: string[]): LifeState | null {
  if (any(words, "steal", "rob", "shoplift")) {
    if (state.flags.includes("stole")) {
      return finish(state, "Arrested", "This time someone calls it in. The shift at the station is long, and this run of days ends there.");
    }
    return say(
      { ...state, money: state.money + 20, flags: [...state.flags, "stole"] },
      "You take twenty dollars that are not yours. It sits wrong in your pocket.",
      1,
      2,
      4,
    );
  }
  if (any(words, "follow") && any(words, "dog")) {
    return say(
      { ...giveItem(like(state, "ellis", 6), "leash"), place: "park", visitor: "ellis" },
      "You follow the dog to the park. Ellis has the other end of a story about it. They let you keep the spare leash like a joke that became a gift.",
      1,
      3,
      3,
    );
  }
  if (any(words, "take", "pick") && any(words, "wallet")) {
    if (state.flags.includes("wallet")) return say(state, "The curb is empty this time.", 0, 0, 0);
    return say(
      { ...giveItem(state, "wallet"), flags: [...state.flags, "wallet"], money: state.money + 25 },
      "The wallet has twenty-five dollars and no name you recognize. You keep the money. You can also return the wallet at city hall.",
      1,
      1,
      1,
    );
  }
  if (any(words, "return") && any(words, "wallet") && own(state, "wallet")) {
    return say(
      { ...takeItem(like(state, "ruth", 15), "wallet"), place: "hall" },
      "Ruth finds the owner. They leave you a thank-you and nothing else, which feels clean.",
      2,
      2,
      2,
    );
  }
  if (any(words, "settle")) {
    if (state.spouse && state.home === "house") {
      return finish(
        state,
        "Settled",
        `You and ${personName(state.spouse)} stop treating every day like a test. The house holds. This is a good ending.`,
      );
    }
    return say(state, "You are not ready to settle. A spouse and a house would change that.", 0, 0, 0);
  }
  if (any(words, "leave", "quit") && any(words, "town", "city")) {
    return finish(state, "Left town", "You buy a bus ticket with whatever is left and watch the apartment blocks get small. Another life, not this one.");
  }
  if (any(words, "divorce") && state.spouse) {
    const name = personName(state.spouse);
    return say({ ...state, spouse: null, dating: null }, `${name} packs a bag without a speech. The rooms get louder.`, 2, 2, 6);
  }
  if (any(words, "invite") && state.dating && state.place === "apartment") {
    return say(
      { ...state, visitor: state.dating },
      `${personName(state.dating)} comes over. The studio looks smaller with two people in it, and better.`,
      2,
      3,
      2,
    );
  }
  if (any(words, "shower")) {
    if (state.place !== "apartment") return say(state, "The shower is at home.", 0, 0, 0);
    return say(state, "You shower. It does not fix your life. It fixes the last few hours.", 1, 1, -6);
  }
  if (any(words, "exercise", "jog", "run")) {
    const place = state.place === "apartment" ? "park" : state.place;
    return say({ ...state, place }, "You run until your lungs file a complaint. Hunger rises. Your head is clearer.", 1, 8, 6);
  }
  if (any(words, "read")) return study(state);
  if (any(words, "wait", "sit")) {
    return say(state, "You let time move without you.", 2, 4, 2);
  }
  if (any(words, "help")) {
    return say(
      state,
      "Type a sentence. Try: look, inventory, walk to the street, go home, eat, sleep, buy bread, talk, apply for a job, work, pay rent, study, ask june out, give flowers, propose, move out, shower, jog, use meds.",
      0,
      0,
      0,
    );
  }
  if (any(words, "inventory", "inv", "bag")) {
    const items = state.inventory.length ? state.inventory.join(", ") : "nothing";
    return say(state, `You are carrying ${items}.`, 0, 0, 0);
  }
  if (any(words, "status", "stats", "self")) return look(state);
  return null;
}

export function act(state: LifeState, raw: string): LifeState {
  if (state.ending) return state;
  const text = raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return state;
  const words = text.split(" ");
  const extra = special(state, words);
  if (extra) return extra;
  if (any(words, "look", "where", "around")) return look(state);
  if (any(words, "sleep", "nap", "bed", "rest") && !any(words, "street")) return sleep(state);
  if (any(words, "home", "apartment", "studio") || (words.includes("back") && words.includes("home"))) return go(state, "apartment");
  if (any(words, "park")) return go(state, "park");
  if (any(words, "diner", "cafe", "restaurant")) return go(state, "diner");
  if (any(words, "shop", "store")) return go(state, "shop");
  if (any(words, "hall")) return go(state, "hall");
  if (any(words, "hospital", "clinic")) return go(state, "hospital");
  if (any(words, "street", "outside", "walk", "stroll")) return go(state, "street");
  if (any(words, "eat", "cook", "hungry")) return eat(state, words);
  if (any(words, "buy", "order", "get") && any(words, "bread", "food", "coffee", "groceries", "grocery", "flowers", "flower", "ring", "book", "meds", "medicine", "laptop", "computer")) {
    return buy(state, words);
  }
  if (any(words, "pay") && any(words, "rent")) return payRent(state);
  if (words.includes("move") || (any(words, "rent") && any(words, "loft", "house", "apartment"))) return move(state, words);
  if (any(words, "quit") && any(words, "job", "work")) return apply(state, ["quit"]);
  if (any(words, "apply", "hire", "hired") || (any(words, "get", "want", "need", "ask") && any(words, "job"))) return apply(state, words);
  if (words.includes("work") || words.includes("shift")) return work(state);
  if (any(words, "study", "learn", "homework")) return study(state);
  if (any(words, "propose", "marry", "wedding") || (any(words, "ask") && any(words, "out", "date"))) return romance(state, words);
  if (any(words, "date", "flirt", "romance")) return romance(state, words);
  if (any(words, "give") && any(words, "flowers", "flower")) return romance(state, [...words, "flowers"]);
  if (any(words, "talk", "speak", "chat", "hello", "hi")) return talk(state, words);
  if (any(words, "use", "drink", "take") && any(words, "meds", "medicine", "book", "coffee", "laptop")) return use(state, words);
  if (any(words, "go", "head", "visit", "enter")) {
    return say(state, "Go where? Home, the street, the park, the diner, the shop, city hall, the hospital, or work.", 0, 0, 0);
  }
  return say(state, `You try to ${text}. Nothing in this city answers that. Type help.`, 0, 1, 1);
}

export function clock(state: LifeState) {
  const h = state.hour % 12 || 12;
  const suffix = state.hour < 12 ? "am" : "pm";
  return `${h}${suffix}`;
}
