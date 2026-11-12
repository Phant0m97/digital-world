import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { TinyEye } from "@/components/brand";
import { useWorld } from "@/lib/store";

export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function Shell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const ready = useHydrated();
  const credits = useWorld((state) => state.credits);
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-dvh bg-ink text-cream">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <TinyEye className="size-9 rounded-full" />
          <span className="font-display text-lg font-bold tracking-wide uppercase">DigitalWorld</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <TopLink to="/chat" active={path.startsWith("/chat")}>
            Chat
          </TopLink>
          <TopLink to="/games" active={path.startsWith("/games") || path.startsWith("/play")}>
            Games
          </TopLink>
          <span className="rounded-full border border-line px-3 py-2 font-display text-cyan">
            {ready ? `${credits} cr` : "— cr"}
          </span>
        </nav>
      </header>
      <div className={bare ? "" : "mx-auto w-full max-w-6xl px-4 py-6"}>{children}</div>
    </div>
  );
}

function TopLink({
  to,
  active,
  children,
}: {
  to: "/" | "/chat" | "/games";
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`rounded-full px-3 py-2 ${active ? "bg-cream text-ink" : "text-cream hover:bg-panel-2"}`}
    >
      {children}
    </Link>
  );
}
