import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/games")({ component: GamesPage });

const GAMES = [
  { to: "/paintball", title: "Paintball" },
  { to: "/life", title: "LifeSim" },
] as const;

function GamesPage() {
  return (
    <Shell>
      <h1 className="font-display text-4xl font-bold">Games</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {GAMES.map((game) => (
          <Link
            key={game.to}
            to={game.to}
            className="rounded-card border border-line bg-panel-2 p-5 transition hover:border-cyan"
          >
            <p className="font-display text-3xl font-bold">{game.title}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
