export type Job = "none" | "cadet" | "officer" | "gang" | "president";

export type LifeState = {
  day: number;
  scene: string;
  job: Job;
  log: string[];
  ending: string | null;
};

type Choice = {
  label: string;
  next: string;
};

type Page = {
  text: string;
  job?: Job;
  ending?: string;
  a: Choice;
  b: Choice;
};

const PAGES: Record<string, Page> = {
  wake: {
    text: "You wake in a rented room above a loud street. Two papers were slid under the door in the night.",
    a: { label: "Read the neat flyer", next: "flyer" },
    b: { label: "Read the pencil note", next: "note" },
  },
  flyer: {
    text: "The flyer is from the city academy. They want neighbors to walk a beat. The signature line is blank.",
    a: { label: "Sign it", next: "kitchen" },
    b: { label: "Leave it and go downstairs", next: "stoop" },
  },
  kitchen: {
    text: "You sign the flyer. The kettle screams. Rent is on the counter, short by a little, and the academy does not pay until you last a week.",
    a: { label: "Go to Ruiz anyway", next: "academy" },
    b: { label: "Look for a day's pay first", next: "diner" },
  },
  diner: {
    text: "Marco at the diner needs a closer. One shift, cash tonight, and he talks while he pours.",
    a: { label: "Work the shift, then find Ruiz", next: "academy" },
    b: { label: "Ask who runs the block after dark", next: "shop" },
  },
  note: {
    text: "The note is short. Vale. After dark. Closed shoe shop. Come alone if you want the block to know your name.",
    a: { label: "Go after dark", next: "shop" },
    b: { label: "Ignore it and go downstairs", next: "stoop" },
  },
  stoop: {
    text: "June is on the stoop with a coffee. \"Ruiz wants walkers. Vale wants hands. The block is picking sides.\"",
    a: { label: "Ask where Ruiz is", next: "academy" },
    b: { label: "Ask where Vale is", next: "shop" },
  },
  corner: {
    text: "On the corner, Officer Ruiz stands by an academy poster. Vale watches from the shoe shop doorway.",
    a: { label: "Talk to Officer Ruiz", next: "academy" },
    b: { label: "Talk to Vale", next: "shop" },
  },
  academy: {
    text: "Ruiz taps the poster. \"Show up, tell the truth, and you can wear this city on your chest.\"",
    a: { label: "Join the academy", next: "drill" },
    b: { label: "Say you need to think", next: "stoop" },
  },
  drill: {
    text: "The yard is painted lines and shouting. Ruiz times a run. Halfway along, a classmate goes down hard.",
    a: { label: "Finish the run", next: "paced" },
    b: { label: "Stop and help them up", next: "helped" },
  },
  paced: {
    text: "You finish first. Ruiz writes your name without looking up. Tonight you get a radio and a paper map.",
    a: { label: "Take the night shift", next: "cadet" },
    b: { label: "Ask what happens if you hesitate", next: "cadet" },
  },
  helped: {
    text: "You come in last. The classmate, Ellis, nods once. Ruiz writes your name anyway and points you at the night map.",
    a: { label: "Take the night shift", next: "cadet" },
    b: { label: "Ask Ellis what the block is really like", next: "cadet" },
  },
  cadet: {
    job: "cadet",
    text: "You are a cadet. A kid runs from a shop with a fistful of something small. Ruiz is at the far end of the block.",
    a: { label: "Call it in and write the report", next: "report" },
    b: { label: "Let the kid go and say you saw nothing", next: "quiet" },
  },
  report: {
    text: "Ruiz reads your page and holds out a badge. \"You are a police officer. Do not make me regret the ink.\"",
    a: { label: "Take the badge", next: "sworn" },
    b: { label: "Ask if the badge can lead higher", next: "civic" },
  },
  quiet: {
    text: "The kid vanishes down an alley you could have closed. By morning Vale knows you looked away. Ruiz does not.",
    a: { label: "Tell Ruiz the truth", next: "report" },
    b: { label: "Find Vale and say you can be useful", next: "shop" },
  },
  sworn: {
    text: "You say the oath in a room that smells like floor wax. Ellis claps once. The radio on your belt is already talking.",
    a: { label: "Clip the radio on", next: "officer" },
    b: { label: "Ask Ruiz about the city, not the street", next: "civic" },
  },
  officer: {
    job: "officer",
    text: "You are a police officer. The radio is yours, and two calls come in at once.",
    a: { label: "Take the night calls", next: "dispatch" },
    b: { label: "Tell Ruiz you want to run for the city", next: "civic" },
  },
  dispatch: {
    text: "The radio will only do one. An apartment on Fourth is loud. The alley behind Marco's diner is quiet in a bad way.",
    a: { label: "Go to the apartment", next: "fourth" },
    b: { label: "Go to the alley", next: "alley" },
  },
  fourth: {
    text: "A door, a loud voice, and a kid sitting on the hall floor with their knees up. Nobody is bleeding. Everybody is tired.",
    a: { label: "Stay until the house goes quiet", next: "stayed" },
    b: { label: "Call for backup and wait outside", next: "backup" },
  },
  stayed: {
    text: "You stay. The voice drops. The kid learns your name. Ruiz hears, later, that you did not leave.",
    a: { label: "Keep walking the beat", next: "beat" },
    b: { label: "Ask for a warrant on the shoe shop", next: "raid" },
  },
  backup: {
    text: "Backup arrives late. The hall is empty and the kettle is still warm. Your report is the only thing that happened.",
    a: { label: "Write it plain and keep walking", next: "beat" },
    b: { label: "Ask for a warrant on the shoe shop", next: "raid" },
  },
  alley: {
    text: "Two of Vale's people stand over a crate that is not shoes. They see the badge and stop talking.",
    a: { label: "Step in", next: "raid" },
    b: { label: "Watch, then write the names down", next: "watch" },
  },
  watch: {
    text: "You leave with names and no arrest. Ruth at city hall reads the report before Ruiz does.",
    a: { label: "Let Ruth use it", next: "civic" },
    b: { label: "Take it back to the beat", next: "beat" },
  },
  beat: {
    text: "Weeks of small honest work. A captain says your name in a room you are not in. The shoe shop is still open.",
    a: { label: "Stay until the beat is your life", next: "nightend" },
    b: { label: "Ask for sergeant", next: "sergeant" },
  },
  sergeant: {
    text: "They pin a new bar on your collar. Ruiz says the shoe shop can be yours to enter, or yours to rise above.",
    a: { label: "Lead the raid", next: "raid" },
    b: { label: "Use the rank to call Ruth", next: "civic" },
  },
  raid: {
    text: "The shop is quiet. Vale looks at your badge. \"You can end this, or you can own the story.\"",
    a: { label: "Arrest him", next: "press" },
    b: { label: "Let him walk if he leaves the block", next: "mercy" },
  },
  mercy: {
    text: "Vale leaves before dawn. The block stays noisy, and your badge stays clean enough to argue with.",
    a: { label: "Stay on the night shift", next: "officer" },
    b: { label: "Use the quiet to call city hall", next: "civic" },
  },
  press: {
    text: "The paper calls you the officer who cleared the shoe shop. Ruth calls before breakfast. Ellis leaves a note that just says, \"Careful.\"",
    a: { label: "Take Ruth's call", next: "civic" },
    b: { label: "Stay on the night shift", next: "officer" },
  },
  shop: {
    text: "Vale sits on a crate. \"We keep this block fed. Tonight you carry a bag three streets. You do not open it.\"",
    a: { label: "Carry the bag", next: "bag" },
    b: { label: "Refuse and leave", next: "stoop" },
  },
  bag: {
    text: "The bag is heavy. Nobody stops you. Vale is smiling when you set it down, and he is not done.",
    a: { label: "Ask what the second night is", next: "second" },
    b: { label: "Say one trip was enough", next: "stoop" },
  },
  second: {
    text: "A corner store is late. Vale says you knock, you ask plain, and nobody gets hurt. He says that like a rule he intends to keep.",
    a: { label: "Knock and ask plain", next: "knock" },
    b: { label: "Tell him no", next: "stoop" },
  },
  knock: {
    text: "The owner pays half and watches your hands the whole time. The rest of the money stays under the tray.",
    a: { label: "Take half and leave it there", next: "member" },
    b: { label: "Tell Vale the rest can wait", next: "soft" },
  },
  soft: {
    text: "Vale shrugs. \"Soft. But the block heard you.\" He still taps the crate beside him, offering the place.",
    a: { label: "Take the place", next: "gang" },
    b: { label: "Walk away", next: "stoop" },
  },
  member: {
    text: "Vale taps your shoulder. \"You are with us. The block will call you a gang member before you do.\"",
    a: { label: "Accept the place", next: "gang" },
    b: { label: "Say you want more than this block", next: "civic" },
  },
  gang: {
    job: "gang",
    text: "You are a gang member. The shoe shop is a kind of office. A crew from the next block wants the corner.",
    a: { label: "Meet them at the park", next: "park" },
    b: { label: "Tell Vale you are going to run for something real", next: "civic" },
  },
  park: {
    text: "The park is pigeons and a fountain that works. The other crew is early. Vale is late on purpose.",
    a: { label: "Stand with Vale", next: "stood" },
    b: { label: "Talk both crews down", next: "talked" },
  },
  stood: {
    text: "It stays words. Barely. After, Vale calls you family, and the corner store locks its gate a little earlier.",
    a: { label: "Keep the shop and the quiet", next: "collect" },
    b: { label: "Say this cannot be the whole life", next: "civic" },
  },
  talked: {
    text: "Both crews leave without a mark. Vale is not sure he likes the quiet. You know every name on the block anyway.",
    a: { label: "Stay and collect", next: "collect" },
    b: { label: "Call Ruth", next: "civic" },
  },
  collect: {
    text: "People pay. Some trust you. Some do not. June, from the stoop, pays last and says your name like a warning.",
    a: { label: "Keep the shop for good", next: "shopend" },
    b: { label: "Use the names you know and call Ruth", next: "civic" },
  },
  civic: {
    text: "Ruth slides one form across the table. \"President is a staircase. The first step is a room with twelve folding chairs.\"",
    a: { label: "Start the run", next: "speech" },
    b: { label: "Not yet", next: "back" },
  },
  speech: {
    text: "Twelve people, a humming light, four minutes. Your voice cracks once, on the name of the block.",
    a: { label: "Stay and shake hands", next: "hands" },
    b: { label: "Leave before the hard question", next: "trail" },
  },
  hands: {
    text: "Ruth says a district seat is real if you want the stairs one at a time. The big race can wait, or it cannot.",
    a: { label: "File for the seat", next: "district" },
    b: { label: "Skip the seat and aim higher", next: "trail" },
  },
  district: {
    text: "You win a small seat. The work is lights, rent, and a flood warning on your old block.",
    a: { label: "Send the money home first", next: "homebill" },
    b: { label: "Save it for the national run", next: "trail" },
  },
  homebill: {
    text: "The block gets the lights back. The papers use your name in a headline that is almost kind.",
    a: { label: "Ride that into the race", next: "trail" },
    b: { label: "Stay in the seat", next: "seatend" },
  },
  trail: {
    text: "A year of rooms and buses. Two stories get told about you. A debate hall is next, and they will ask which one is true.",
    a: { label: "Go ready to tell the truth", next: "debate" },
    b: { label: "Go ready with the smoother story", next: "spin" },
  },
  debate: {
    text: "Hot lights. One question, asked twice, about the badge or the bag. The room waits.",
    a: { label: "Answer it straight", next: "count" },
    b: { label: "Dodge it", next: "spin" },
  },
  spin: {
    text: "The smoother story wins the week. Then a letter starts to pull a thread, and Ruth will not take your call.",
    a: { label: "Admit the real story", next: "count" },
    b: { label: "Drop out before the letter lands", next: "aside" },
  },
  count: {
    text: "The count takes all night. A tray of coffee goes cold. The last precinct is a town you have driven through once.",
    a: { label: "Stay for the last numbers", next: "president" },
    b: { label: "Step aside for a calmer name", next: "aside" },
  },
  president: {
    job: "president",
    text: "You are President. The first morning is a long table, a short list, and one empty chair.",
    a: { label: "Choose who sits closest", next: "cabinet" },
    b: { label: "Hear the crisis first", next: "crisis" },
  },
  cabinet: {
    text: "Ruiz would make the building feel like a precinct. A neighbor from the block would make it feel like home. One chair.",
    a: { label: "Seat Ruiz", next: "crisis" },
    b: { label: "Seat a neighbor", next: "crisis" },
  },
  crisis: {
    text: "A river is over the road on your old block. Advisors want a speech from the desk. The block wants sandbags.",
    a: { label: "Go there yourself", next: "sand" },
    b: { label: "Sign the safety bill from the desk", next: "bill" },
  },
  sand: {
    text: "You stand in water to your ankles. Someone hands you a bag. For an hour you are not President. Then the car is waiting.",
    a: { label: "Call the block when you get back", next: "block" },
    b: { label: "Sign the bill with wet hands", next: "bill" },
  },
  block: {
    ending: "From the block",
    text: "You call the block before the advisors can stop you. They answer. For one morning the office sounds like home. This is the end of this life.",
    a: { label: "Stay", next: "block" },
    b: { label: "Stay", next: "block" },
  },
  bill: {
    ending: "First signature",
    text: "You sign the safety bill before the room finishes sitting down. The city will argue about it for years. This is the end of this life.",
    a: { label: "Stay", next: "bill" },
    b: { label: "Stay", next: "bill" },
  },
  aside: {
    ending: "Stepped aside",
    text: "You step off the stage. The city keeps your name for a season, then mostly does not. This is the end of this life.",
    a: { label: "Stay", next: "aside" },
    b: { label: "Stay", next: "aside" },
  },
  nightend: {
    ending: "The night shift",
    text: "You keep the beat. Years later the kid from the hall still says your name when a radio crackles. You were a police officer, and you stayed one. This is the end of this life.",
    a: { label: "Stay", next: "nightend" },
    b: { label: "Stay", next: "nightend" },
  },
  shopend: {
    ending: "The shop",
    text: "You keep the shoe shop. The block pays, eats, and argues, and Vale grows old in the back room. You were a gang member, and the corner held. This is the end of this life.",
    a: { label: "Stay", next: "shopend" },
    b: { label: "Stay", next: "shopend" },
  },
  seatend: {
    ending: "The seat",
    text: "You stay in the district seat. The lights stay on. Nobody calls you President, and the block still knocks. This is the end of this life.",
    a: { label: "Stay", next: "seatend" },
    b: { label: "Stay", next: "seatend" },
  },
};

export function freshLife(): LifeState {
  const first = PAGES.wake!;
  return {
    day: 1,
    scene: "wake",
    job: "none",
    ending: null,
    log: [first.text],
  };
}

export function roleName(job: Job) {
  if (job === "officer") return "Police officer";
  if (job === "gang") return "Gang member";
  if (job === "president") return "President";
  if (job === "cadet") return "Cadet";
  return "Neighbor";
}

export function sceneChoices(state: LifeState): { label: string }[] {
  const page = PAGES[state.scene] ?? PAGES.wake!;
  if (page.ending || state.ending) return [];
  return [{ label: page.a.label }, { label: page.b.label }];
}

function goBack(job: Job) {
  if (job === "gang") return "gang";
  if (job === "officer") return "officer";
  if (job === "cadet") return "cadet";
  return "stoop";
}

export function choose(state: LifeState, index: 0 | 1): LifeState {
  if (state.ending) return state;
  const page = PAGES[state.scene] ?? PAGES.wake!;
  if (page.ending) return state;
  const pick = index === 0 ? page.a : page.b;
  const nextId = pick.next === "back" ? goBack(state.job) : pick.next;
  const next = PAGES[nextId] ?? PAGES.stoop!;
  const job = next.job ?? state.job;
  return {
    day: state.day + 1,
    scene: nextId,
    job,
    ending: next.ending ?? null,
    log: [...state.log, `> ${pick.label}`, next.text].slice(-160),
  };
}
