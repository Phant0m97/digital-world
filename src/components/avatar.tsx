import type { AvatarKind } from "@/data/catalog";
import { avatarById } from "@/data/catalog";
import { GamePortrait } from "@/components/extra-faces";

type Props = {
  id: string;
  className?: string;
  title?: string;
};

export function Avatar({ id, className, title }: Props) {
  const spec = avatarById(id);
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {spec.group === "base" ? (
        <>
          <rect width="80" height="80" rx="18" fill={spec.bg} />
          <Face kind={spec.kind} accent={spec.accent} dark={spec.dark} light={spec.light} />
        </>
      ) : (
        <GamePortrait id={spec.id} accent={spec.accent} />
      )}
    </svg>
  );
}

function Face({
  kind,
  accent,
  dark,
  light,
}: {
  kind: AvatarKind;
  accent: string;
  dark: string;
  light: string;
}) {
  switch (kind) {
    case "dragon":
      return (
        <g>
          <polygon points="18,62 40,34 62,62" fill={dark} />
          <polygon points="26,46 40,22 58,40 52,54 30,54" fill={accent} />
          <polygon points="50,36 74,34 60,50" fill={dark} />
          <polygon points="28,30 22,10 40,26" fill={light} />
          <polygon points="42,24 50,8 58,28" fill={light} />
          <polygon points="46,40 52,38 50,44" fill={light} />
          <polygon points="58,42 66,40 62,46" fill="#12352a" />
        </g>
      );
    case "robot":
      return (
        <g>
          <rect x="30" y="10" width="20" height="6" fill={accent} />
          <rect x="38" y="16" width="4" height="8" fill={accent} />
          <polygon points="16,32 64,28 68,66 14,68" fill={dark} />
          <polygon points="22,36 38,34 36,48 20,50" fill={accent} />
          <polygon points="44,34 60,32 62,48 46,50" fill={light} />
          <rect x="28" y="54" width="24" height="6" fill={accent} />
        </g>
      );
    case "knight":
      return (
        <g>
          <polygon points="22,28 40,8 58,28 54,36 26,36" fill={accent} />
          <polygon points="36,8 44,8 40,0" fill={light} />
          <polygon points="18,36 62,34 66,70 16,70" fill={dark} />
          <rect x="28" y="44" width="24" height="8" rx="2" fill="#14141c" />
          <polygon points="24,40 56,40 52,48 28,48" fill={light} />
        </g>
      );
    case "wizard":
      return (
        <g>
          <polygon points="40,4 62,40 18,40" fill={accent} />
          <polygon points="34,18 40,8 46,20" fill={light} />
          <polygon points="22,40 58,38 64,72 16,72" fill={dark} />
          <polygon points="26,48 54,46 50,62 30,64" fill={light} />
          <circle cx="34" cy="52" r="2" fill="#14141c" />
          <circle cx="46" cy="52" r="2" fill="#14141c" />
        </g>
      );
    case "wolf":
      return (
        <g>
          <polygon points="18,28 30,10 36,30" fill={accent} />
          <polygon points="44,30 52,8 64,30" fill={dark} />
          <polygon points="16,36 64,32 68,68 12,70" fill={accent} />
          <polygon points="36,48 52,44 48,60 32,58" fill={dark} />
          <polygon points="28,46 34,44 32,50" fill={light} />
          <polygon points="48,44 56,46 52,52" fill="#14141c" />
        </g>
      );
    case "phoenix":
      return (
        <g>
          <polygon points="40,6 58,28 40,22 22,30" fill={accent} />
          <polygon points="14,34 40,20 28,50" fill={light} />
          <polygon points="40,18 66,36 52,52" fill={dark} />
          <polygon points="24,46 56,42 60,70 20,72" fill={accent} />
          <polygon points="36,48 44,46 40,54" fill="#14141c" />
        </g>
      );
    case "astro":
      return (
        <g>
          <circle cx="40" cy="36" r="22" fill={light} />
          <path d="M22 36h36v10H22z" fill={dark} />
          <path d="M24 40h32v4H24z" fill={accent} />
          <rect x="28" y="58" width="24" height="12" rx="3" fill={dark} />
        </g>
      );
    case "ninja":
      return (
        <g>
          <polygon points="16,22 64,18 68,70 12,72" fill={dark} />
          <polygon points="22,34 58,32 56,46 24,48" fill={accent} />
          <polygon points="30,36 36,34 34,44" fill={light} />
          <polygon points="28,18 40,6 48,20" fill={dark} />
        </g>
      );
    case "pirate":
      return (
        <g>
          <polygon points="14,30 40,12 70,26 62,36 18,38" fill={dark} />
          <polygon points="36,14 48,4 46,16" fill={light} />
          <polygon points="20,38 62,36 66,72 16,72" fill={accent} />
          <rect x="24" y="46" width="14" height="10" fill="#14141c" />
          <circle cx="50" cy="50" r="3" fill="#14141c" />
          <path d="M30 60h22l-4 8H34z" fill={dark} />
        </g>
      );
    case "alien":
      return (
        <g>
          <polygon points="40,8 66,28 62,62 18,62 14,28" fill={accent} />
          <circle cx="28" cy="36" r="5" fill={light} />
          <circle cx="40" cy="32" r="5" fill={light} />
          <circle cx="52" cy="36" r="5" fill={light} />
          <circle cx="28" cy="36" r="2" fill="#14141c" />
          <circle cx="40" cy="32" r="2" fill="#14141c" />
          <circle cx="52" cy="36" r="2" fill="#14141c" />
          <polygon points="34,50 46,50 40,58" fill={dark} />
        </g>
      );
    case "samurai":
      return (
        <g>
          <polygon points="18,30 40,10 62,30 56,38 24,38" fill={dark} />
          <polygon points="28,12 34,4 36,16" fill={accent} />
          <polygon points="46,14 54,2 56,18" fill={accent} />
          <polygon points="16,38 64,36 68,72 12,72" fill={accent} />
          <rect x="26" y="46" width="28" height="6" fill="#14141c" />
        </g>
      );
    case "fox":
      return (
        <g>
          <polygon points="16,32 28,8 38,32" fill={accent} />
          <polygon points="42,32 54,6 66,32" fill={dark} />
          <polygon points="18,34 64,32 60,68 20,70" fill={accent} />
          <polygon points="28,48 52,46 40,62" fill={light} />
          <circle cx="32" cy="44" r="2.5" fill="#14141c" />
          <circle cx="48" cy="44" r="2.5" fill="#14141c" />
        </g>
      );
    case "golem":
      return (
        <g>
          <polygon points="18,22 38,14 42,36 16,40" fill={accent} />
          <polygon points="40,16 66,24 62,42 38,34" fill={dark} />
          <polygon points="14,42 40,40 36,70 10,66" fill={dark} />
          <polygon points="38,42 70,40 66,72 34,68" fill={accent} />
          <rect x="24" y="48" width="8" height="6" fill={light} />
          <rect x="48" y="46" width="8" height="6" fill={light} />
        </g>
      );
    case "cat":
      return (
        <g>
          <polygon points="18,32 28,10 40,30" fill={accent} />
          <polygon points="40,30 54,8 64,32" fill={dark} />
          <polygon points="16,34 64,32 60,70 18,72" fill={accent} />
          <polygon points="22,16 30,14 28,26" fill={dark} />
          <polygon points="52,14 60,18 54,28" fill="#14141c" />
          <circle cx="32" cy="46" r="3" fill="#14141c" />
          <circle cx="48" cy="46" r="3" fill="#14141c" />
          <polygon points="36,54 44,54 40,60" fill={dark} />
        </g>
      );
    case "skull":
      return (
        <g>
          <polygon points="20,18 60,16 66,52 14,54" fill={light} />
          <polygon points="24,32 36,28 34,42 22,44" fill="#14141c" />
          <polygon points="44,28 58,30 56,44 42,42" fill="#14141c" />
          <polygon points="36,46 44,46 40,54" fill="#14141c" />
          <rect x="30" y="54" width="20" height="14" fill={accent} />
          <path d="M32 58h4M40 58h4M36 64h6" stroke="#14141c" strokeWidth="2" />
        </g>
      );
    case "cyborg":
      return (
        <g>
          <polygon points="14,24 40,16 42,68 12,66" fill={light} />
          <polygon points="40,16 68,26 66,70 40,66" fill={dark} />
          <circle cx="28" cy="40" r="5" fill="#14141c" />
          <rect x="48" y="34" width="12" height="10" fill={accent} />
          <rect x="36" y="12" width="4" height="10" fill={accent} />
          <path d="M20 56h16M46 58h14" stroke={accent} strokeWidth="2" />
        </g>
      );
    case "shroom":
      return (
        <g>
          <polygon points="12,40 40,12 68,40 58,46 22,46" fill={accent} />
          <circle cx="28" cy="34" r="4" fill={dark} />
          <circle cx="44" cy="28" r="5" fill={dark} />
          <circle cx="54" cy="36" r="3" fill={dark} />
          <polygon points="30,46 50,46 54,72 26,72" fill={light} />
          <circle cx="36" cy="58" r="2" fill="#14141c" />
          <circle cx="44" cy="58" r="2" fill="#14141c" />
        </g>
      );
    case "shark":
      return (
        <g>
          <polygon points="10,44 48,22 74,40 70,58 16,62" fill={accent} />
          <polygon points="48,22 58,6 56,28" fill={dark} />
          <polygon points="58,40 74,36 70,50" fill={light} />
          <polygon points="24,46 30,44 28,50" fill="#14141c" />
          <path d="M36 52h16l-2 4H38z" fill={light} />
        </g>
      );
    case "owl":
      return (
        <g>
          <polygon points="10,36 28,18 36,40" fill={dark} />
          <polygon points="44,40 54,16 72,36" fill={dark} />
          <polygon points="18,30 62,28 66,70 14,72" fill={accent} />
          <circle cx="32" cy="44" r="8" fill={light} />
          <circle cx="50" cy="44" r="8" fill={light} />
          <circle cx="32" cy="44" r="3" fill="#14141c" />
          <circle cx="50" cy="44" r="3" fill="#14141c" />
          <polygon points="36,54 44,54 40,62" fill={dark} />
        </g>
      );
    case "mech":
      return (
        <g>
          <polygon points="18,18 62,16 66,36 14,38" fill={accent} />
          <rect x="36" y="8" width="8" height="10" fill={dark} />
          <polygon points="14,38 66,36 70,72 10,74" fill={dark} />
          <rect x="22" y="46" width="14" height="12" fill={light} />
          <rect x="44" y="46" width="14" height="12" fill={accent} />
          <path d="M20 64h40" stroke={accent} strokeWidth="4" />
        </g>
      );
    default:
      return null;
  }
}
