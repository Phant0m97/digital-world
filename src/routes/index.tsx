import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeMark, Wordmark } from "@/components/brand";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell>
      <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <EyeMark className="mb-6 size-36 sm:size-44" />
          <Wordmark />
          <p className="mt-5 max-w-xl text-lg text-mute">
            Pick a face, talk in a plaza or a locked room, then pull your party into a stick-figure paintball yard.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Door to="/chat" kicker="Mode 01" title="Chat" copy="Usernames, low-poly faces, themes, gifs, invites." />
            <Door to="/games" kicker="Mode 02" title="Paintball" copy="Five modes. Credits buy skins and guns." />
          </div>
        </div>
        <div className="rounded-card border border-line bg-panel p-5">
          <p className="font-display text-xs tracking-[0.28em] text-cyan uppercase">How a night goes</p>
          <ol className="mt-4 space-y-4 text-sm">
            <li>
              <span className="font-display text-mag">01</span>
              <p className="text-cream">Choose one of twenty low-poly faces and a name.</p>
            </li>
            <li>
              <span className="font-display text-mag">02</span>
              <p className="text-cream">Join a public room or enter a code. Delete your own lines. Send a gif.</p>
            </li>
            <li>
              <span className="font-display text-mag">03</span>
              <p className="text-cream">Invite friends into a party and drop into the yard. Headshots end it.</p>
            </li>
          </ol>
        </div>
      </section>
    </Shell>
  );
}

function Door({
  to,
  kicker,
  title,
  copy,
}: {
  to: "/chat" | "/games";
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-card border border-line bg-panel-2 p-5 transition hover:border-cyan"
    >
      <p className="font-display text-xs tracking-[0.22em] text-mute uppercase">{kicker}</p>
      <p className="mt-2 font-display text-3xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-mute">{copy}</p>
    </Link>
  );
}
