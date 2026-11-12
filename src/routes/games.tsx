import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { asset } from "@/lib/asset";

export const Route = createFileRoute("/games")({ component: GamesPage });

const GAMES = [
  { to: "/paintball", title: "Paintball", image: "games/paintball-duel2.jpg" },
  { to: "/life", title: "LifeSim", image: "games/lifesim.jpg" },
] as const;

function GamesPage() {
  return (
    <Shell>
      <h1 className="font-display text-4xl font-bold">Games</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <Link
            key={game.to}
            to={game.to}
            className="overflow-hidden rounded-card border border-line bg-panel-2 transition hover:border-cyan"
          >
            <img src={asset(game.image)} alt="" className="aspect-video w-full object-cover" />
            <p className="px-5 py-4 font-display text-3xl font-bold">{game.title}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}