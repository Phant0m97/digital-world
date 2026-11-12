import { asset } from "@/lib/asset";

export function EyeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="dw-eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#07070b" />
          <stop offset="100%" stopColor="#101018" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#dw-eye-glow)" />
      <path d="M100 8a92 92 0 0 0 0 184" fill="none" stroke="#2ee6ff" strokeWidth="10" />
      <path d="M100 8a92 92 0 0 1 0 184" fill="none" stroke="#ff2bd6" strokeWidth="10" />
      <path
        d="M100 16a84 84 0 0 0 0 168"
        fill="none"
        stroke="#ff2bd6"
        strokeWidth="2"
        opacity="0.7"
        transform="translate(-4 1)"
      />
      <path
        d="M100 16a84 84 0 0 1 0 168"
        fill="none"
        stroke="#2ee6ff"
        strokeWidth="2"
        opacity="0.7"
        transform="translate(4 -1)"
      />
      <polygon points="34,62 96,48 90,118 28,124" fill="#f4f0e6" />
      <polygon points="104,48 166,62 172,124 110,118" fill="#f4f0e6" />
      <polygon points="48,74 82,66 78,108 44,112" fill="#07070b" />
      <polygon points="118,66 152,74 156,112 122,108" fill="#07070b" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-display text-[0.72rem] tracking-[0.42em] text-cyan uppercase">Enter the yard</p>
      <h1 className="glitch font-display text-5xl font-extrabold tracking-tight text-cream uppercase sm:text-7xl">
        DigitalWorld
      </h1>
    </div>
  );
}

export function TinyEye({ className }: { className?: string }) {
  return <img src={asset("favicon.svg")} alt="" className={className} />;
}
