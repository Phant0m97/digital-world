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
    a: { label: "Sign it and go today", next: "academy" },
    b: { label: "Leave it and go down to the street", next: "corner" },
  },
  note: {
    text: "The note is short. Vale. After dark. Closed shoe shop. Come alone if you want the block to know your name.",
    a: { label: "Go after dark", next: "shop" },
    b: { label: "Ignore it and go down to the street", next: "corner" },
  },
  corner: {
    text: "On the corner, Officer Ruiz stands by an academy poster. Vale watches from the shoe shop doorway.",
    a: { label: "Talk to Officer Ruiz", next: "academy" },
    b: { label: "Talk to Vale", next: "shop" },
  },
  academy: {
    text: "Ruiz taps the poster. \"Show up, tell the truth, and you can wear this city on your chest.\"",
    a: { label: "Join the academy", next: "cadet" },
    b: { label: "Say you need to think", next: "corner" },
  },
  cadet: {
    job: "cadet",
    text: "You are a cadet for a week of nights. A kid runs from a shop. Ruiz is at the far end of the block.",
    a: { label: "Call it in and write the report", next: "report" },
    b: { label: "Let the kid go and say you saw nothing", next: "quiet" },
  },
  report: {
    text: "Ruiz reads your page and holds out a badge. \"You are a police officer. Do not make me regret the ink.\"",
    a: { label: "Take the badge", next: "officer" },
    b: { label: "Ask if the badge can lead higher", next: "civic" },
  },
  quiet: {
    text: "The kid vanishes. By morning Vale knows you looked away. Ruiz does not.",
    a: { label: "Tell Ruiz the truth", next: "report" },
    b: { label: "Find Vale and say you can be useful", next: "shop" },
  },
  officer: {
    job: "officer",
    text: "You are a police officer. The radio is yours, and so is the next call.",
    a: { label: "Take a crew to Vale's shoe shop", next: "raid" },
    b: { label: "Tell Ruiz you want to run for the city", next: "civic" },
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
    text: "The paper calls you the officer who cleared the shoe shop. Ruth at city hall calls before breakfast.",
    a: { label: "Take Ruth's call", next: "civic" },
    b: { label: "Stay on the night shift", next: "officer" },
  },
  shop: {
    text: "Vale sits on a crate. \"We keep this block fed. Tonight you carry a bag three streets. You do not open it.\"",
    a: { label: "Carry the bag", next: "bag" },
    b: { label: "Refuse and leave", next: "corner" },
  },
  bag: {
    text: "The bag is heavy. Nobody stops you. Vale is smiling when you set it down.",
    a: { label: "Ask to stay", next: "member" },
    b: { label: "Say one trip was enough", next: "corner" },
  },
  member: {
    text: "Vale taps your shoulder. \"You are with us. The block will call you a gang member before you do.\"",
    a: { label: "Accept the place", next: "gang" },
    b: { label: "Say you want more than this block", next: "civic" },
  },
  gang: {
    job: "gang",
    text: "You are a gang member. The shoe shop is a kind of office, and people wait to see what you do with it.",
    a: { label: "Collect for the block and keep it quiet", next: "collect" },
    b: { label: "Tell Vale you are going to run for something real", next: "civic" },
  },
  collect: {
    text: "People pay. Some trust you. Some do not. Vale says the next step is yours.",
    a: { label: "Stay loyal to the crew", next: "gang" },
    b: { label: "Use the names you know and call Ruth", next: "civic" },
  },
  civic: {
    text: "Ruth slides one form across the table. \"President is a staircase. The first step is this city, and people already know your name.\"",
    a: { label: "Start the run", next: "trail" },
    b: { label: "Not yet", next: "back" },
  },
  trail: {
    text: "A year of rooms and buses. Two stories get told about you. You pick which one to say out loud.",
    a: { label: "Tell the truth about how you started", next: "truth" },
    b: { label: "Tell the smoother story", next: "smooth" },
  },
  truth: {
    text: "People argue, then they vote. The count is close, and then it is not.",
    a: { label: "Take the office", next: "president" },
    b: { label: "Step aside for a calmer name", next: "aside" },
  },
  smooth: {
    text: "The smoother story wins the week. Then a letter starts to pull a thread.",
    a: { label: "Admit the real story", next: "truth" },
    b: { label: "Drop out before the letter lands", next: "aside" },
  },
  president: {
    job: "president",
    text: "You are President. The first morning is a long table and a short list.",
    a: { label: "Call the block you came from", next: "block" },
    b: { label: "Sign the safety bill first", next: "bill" },
  },
  block: {
    ending: "From the block",
    text: "You call the block before the advisors can stop you. They answer. For one morning the office sounds like home. This is the end of this life.",
    a: { label: "Call the block you came from", next: "block" },
    b: { label: "Sign the safety bill first", next: "bill" },
  },
  bill: {
    ending: "First signature",
    text: "You sign the safety bill before the room finishes sitting down. The city will argue about it for years. This is the end of this life.",
    a: { label: "Call the block you came from", next: "block" },
    b: { label: "Sign the safety bill first", next: "bill" },
  },
  aside: {
    ending: "Stepped aside",
    text: "You step off the stage. The city keeps your name for a season, then mostly does not. This is the end of this life.",
    a: { label: "Call the block you came from", next: "aside" },
    b: { label: "Sign the safety bill first", next: "aside" },
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
  return "corner";
}

export function choose(state: LifeState, index: 0 | 1): LifeState {
  if (state.ending) return state;
  const page = PAGES[state.scene] ?? PAGES.wake!;
  if (page.ending) return state;
  const pick = index === 0 ? page.a : page.b;
  const nextId = pick.next === "back" ? goBack(state.job) : pick.next;
  const next = PAGES[nextId] ?? PAGES.corner!;
  const job = next.job ?? state.job;
  return {
    day: state.day + 1,
    scene: nextId,
    job,
    ending: next.ending ?? null,
    log: [...state.log, `> ${pick.label}`, next.text].slice(-80),
  };
}
