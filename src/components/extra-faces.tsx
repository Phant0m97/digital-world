import type { ReactNode } from "react";

const INK = "#141414";
const PAPER = "#f3f0e8";
const LIFE_WALL = "#f4e6d2";
const LIFE_FLOOR = "#e4d0b0";
const SKIN = "#f0c9a0";
const LIFE_INK = "#3a2a22";
const SKETCH_PAPER = "#f6f1e6";
const SKETCH_INK = "#1a1814";

export function GamePortrait({ id, accent }: { id: string; accent: string }) {
  if (PAINT.has(id)) return <PaintPlayer id={id} accent={accent} />;
  if (LIFE.has(id)) return <LifePerson id={id} accent={accent} />;
  return <SketchStick id={id} accent={accent} />;
}

const PAINT = new Set(["mask", "splatter", "hopper", "barrel", "visor", "bandana", "pod", "striker", "goggle", "camo", "drip", "jersey"]);
const LIFE = new Set(["cook", "student", "nurse", "driver", "builder", "farmer", "clerk", "baker", "mail", "coach", "medic", "neighbor"]);

function PaintPlayer({ id, accent }: { id: string; accent: string }) {
  const shirt = id === "jersey" || id === "striker" ? accent : "#ffffff";
  return (
    <g>
      <rect width="80" height="80" fill={PAPER} />
      <ellipse cx="40" cy="74" rx="16" ry="3.2" fill="rgba(20,20,20,0.12)" />
      {id === "splatter" ? (
        <g>
          <circle cx="18" cy="58" r="7" fill={accent} />
          <circle cx="64" cy="22" r="5" fill={accent} />
          <circle cx="22" cy="18" r="3" fill={accent} />
        </g>
      ) : null}
      <line x1="33" y1="54" x2="28" y2="72" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <line x1="47" y1="54" x2="52" y2="72" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <rect x="29" y="36" width="22" height="20" rx="2" fill={shirt} stroke={INK} strokeWidth="3" />
      {id === "camo" ? (
        <g>
          <rect x="32" y="40" width="7" height="6" fill={accent} />
          <rect x="42" y="46" width="6" height="6" fill="#3a4218" />
        </g>
      ) : null}
      {id === "striker" ? <path d="M32 44h16" stroke={INK} strokeWidth="2.4" /> : null}
      <circle cx="40" cy="24" r="12" fill="#ffffff" stroke={INK} strokeWidth="3" />
      {id === "mask" ? (
        <g>
          <path d="M28 20h24v12H28z" fill={INK} />
          <path d="M30 22h20v7H30z" fill={accent} />
        </g>
      ) : null}
      {id === "visor" ? <path d="M29 22h22v6H29z" fill={accent} stroke={INK} strokeWidth="2" /> : null}
      {id === "goggle" ? (
        <g>
          <circle cx="35" cy="24" r="4.5" fill="#d7e6ee" stroke={INK} strokeWidth="2" />
          <circle cx="46" cy="24" r="4.5" fill="#d7e6ee" stroke={INK} strokeWidth="2" />
        </g>
      ) : (
        <g>
          <circle cx="36" cy="24" r="1.5" fill={INK} />
          <circle cx="45" cy="24" r="1.5" fill={INK} />
        </g>
      )}
      {id === "bandana" ? <path d="M29 28h22l-2 8H31z" fill={accent} stroke={INK} strokeWidth="2" /> : null}
      {id === "drip" ? <path d="M48 16c2 8 1 14-2 18" fill={accent} stroke={INK} strokeWidth="2" /> : null}
      {id === "splatter" ? <circle cx="50" cy="40" r="4" fill={accent} /> : null}
      {id === "pod" ? (
        <g>
          <rect x="14" y="40" width="12" height="16" rx="3" fill="#ffffff" stroke={INK} strokeWidth="2" />
          <circle cx="18" cy="46" r="2" fill={accent} />
          <circle cx="23" cy="50" r="2" fill={accent} />
        </g>
      ) : null}
      <rect x="50" y="40" width={id === "barrel" ? 24 : 16} height="6" rx="1.4" fill="#f7f7f7" stroke={INK} strokeWidth="2" />
      {id === "hopper" ? <rect x="54" y="30" width="12" height="10" rx="2" fill={accent} stroke={INK} strokeWidth="2" /> : null}
      <circle cx="58" cy="36" r="3.2" fill={accent} stroke={INK} strokeWidth="2" />
    </g>
  );
}

function LifePerson({ id, accent }: { id: string; accent: string }) {
  const shirt =
    id === "nurse" || id === "baker" || id === "medic"
      ? "#fffaf4"
      : id === "mail"
        ? "#2f6f86"
        : id === "farmer"
          ? "#6d8a45"
          : id === "builder"
            ? "#d9783a"
            : accent;
  return (
    <g>
      <rect width="80" height="80" fill={LIFE_WALL} />
      <rect y="62" width="80" height="18" fill={LIFE_FLOOR} />
      <path d="M16 80c6-18 14-24 24-24s18 6 24 24" fill={shirt} />
      <circle cx="40" cy="34" r="15" fill={SKIN} />
      {lifeHair(id, accent)}
      <circle cx="34" cy="34" r="1.5" fill={LIFE_INK} />
      <circle cx="46" cy="34" r="1.5" fill={LIFE_INK} />
      {id === "clerk" ? <path d="M37 52l3 14h-6z" fill={accent} /> : null}
      {id === "nurse" || id === "medic" ? <path d="M38 58h4v8h-4zM34 60h12v4H34z" fill="#d4544a" /> : null}
      {id === "mail" ? <rect x="50" y="50" width="16" height="12" fill="#fffaf4" stroke={LIFE_INK} strokeWidth="1.4" /> : null}
      {id === "coach" ? <circle cx="58" cy="48" r="4" fill={LIFE_INK} /> : null}
      {id === "driver" ? <circle cx="58" cy="58" r="7" fill="none" stroke={LIFE_INK} strokeWidth="2" /> : null}
      {id === "neighbor" ? (
        <g>
          <rect x="30" y="31" width="8" height="5" rx="1" fill="none" stroke={LIFE_INK} strokeWidth="1.4" />
          <rect x="42" y="31" width="8" height="5" rx="1" fill="none" stroke={LIFE_INK} strokeWidth="1.4" />
        </g>
      ) : null}
    </g>
  );
}

function lifeHair(id: string, accent: string): ReactNode {
  if (id === "cook") return <path d="M24 24h32v8H24z" fill="#fffaf4" />;
  if (id === "student") return <path d="M40 12l22 8-22 6-22-6z" fill={LIFE_INK} />;
  if (id === "nurse") return <path d="M26 22h28v6H26z" fill="#fffaf4" />;
  if (id === "driver" || id === "coach" || id === "mail") return <path d="M24 24h32l-4 8H28z" fill={id === "mail" ? "#1d4e63" : LIFE_INK} />;
  if (id === "builder") return <path d="M22 26h36l-2 8H24z" fill="#f0c14a" />;
  if (id === "farmer") return <ellipse cx="40" cy="24" rx="22" ry="6" fill="#c4a574" />;
  if (id === "baker") return <ellipse cx="40" cy="18" rx="14" ry="8" fill="#fffaf4" />;
  if (id === "clerk") return <path d="M26 22c4-8 24-8 28 0" fill={LIFE_INK} />;
  if (id === "medic") return <path d="M26 20c2-8 26-8 28 2" fill={accent} />;
  return <path d="M24 24c2-10 30-10 32 2" fill={LIFE_INK} />;
}

function SketchStick({ id, accent }: { id: string; accent: string }) {
  return (
    <g>
      <rect width="80" height="80" fill={SKETCH_PAPER} />
      <g fill="none" stroke={SKETCH_INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="34" cy="24" r="8" />
        <line x1="34" y1="32" x2="34" y2="52" />
        <line x1="34" y1="38" x2="22" y2="48" />
        <line x1="34" y1="38" x2="50" y2="34" />
        <line x1="34" y1="52" x2="24" y2="68" />
        <line x1="34" y1="52" x2="46" y2="68" />
        {sketchProp(id, accent)}
      </g>
    </g>
  );
}

function sketchProp(id: string, accent: string): ReactNode {
  if (id === "pencil") {
    return (
      <g>
        <line x1="50" y1="34" x2="68" y2="18" />
        <path d="M66 16l6 2-4 4z" fill={accent} stroke={SKETCH_INK} />
      </g>
    );
  }
  if (id === "brush") {
    return (
      <g>
        <line x1="50" y1="34" x2="66" y2="20" />
        <path d="M64 16l8 2-6 8z" fill={accent} stroke={SKETCH_INK} />
      </g>
    );
  }
  if (id === "inkpot") {
    return (
      <g>
        <rect x="54" y="40" width="14" height="16" fill={SKETCH_INK} stroke={SKETCH_INK} />
        <circle cx="66" cy="44" r="3" fill={accent} stroke="none" />
      </g>
    );
  }
  if (id === "eraser") {
    return <rect x="50" y="30" width="16" height="10" rx="2" fill={accent} stroke={SKETCH_INK} />;
  }
  if (id === "palette") {
    return (
      <g>
        <ellipse cx="58" cy="36" rx="12" ry="8" fill={SKETCH_PAPER} stroke={SKETCH_INK} />
        <circle cx="54" cy="34" r="2" fill={accent} stroke="none" />
        <circle cx="62" cy="38" r="2" fill="#ff2bd6" stroke="none" />
      </g>
    );
  }
  if (id === "marker") {
    return <rect x="50" y="28" width="8" height="20" rx="2" fill={accent} stroke={SKETCH_INK} />;
  }
  if (id === "spraycan") {
    return (
      <g>
        <rect x="52" y="28" width="10" height="16" rx="2" fill={accent} stroke={SKETCH_INK} />
        <circle cx="68" cy="24" r="2" fill={accent} stroke="none" />
        <circle cx="72" cy="18" r="1.5" fill={accent} stroke="none" />
      </g>
    );
  }
  if (id === "ruler") {
    return <line x1="48" y1="30" x2="70" y2="42" />;
  }
  if (id === "notebook") {
    return (
      <g>
        <rect x="50" y="28" width="18" height="16" fill={SKETCH_PAPER} stroke={SKETCH_INK} />
        <line x1="59" y1="28" x2="59" y2="44" />
      </g>
    );
  }
  if (id === "crayon") {
    return <rect x="50" y="30" width="14" height="8" rx="2" fill={accent} stroke={SKETCH_INK} />;
  }
  if (id === "nib") {
    return <path d="M50 34l16-12 2 6-14 10z" fill={SKETCH_INK} />;
  }
  return (
    <g>
      <path d="M52 48l8-28 8 28" />
      <rect x="56" y="28" width="12" height="10" fill={accent} stroke={SKETCH_INK} />
    </g>
  );
}
