import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeMark, Wordmark } from "@/components/brand";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell>
      <section className="py-6">
        <div className="flex flex-col items-center text-center">
          <EyeMark className="mb-6 size-36 sm:size-44" />
          <Wordmark />
          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
            <Door to="/chat" kicker="Mode 01" title="Chat" />
            <Door to="/games" kicker="Mode 02" title="Games" />
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Door({
  to,
  kicker,
  title,
}: {
  to: "/chat" | "/games";
  kicker: string;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-card border border-line bg-panel-2 p-5 transition hover:border-cyan"
    >
      <p className="font-display text-xs tracking-[0.22em] text-mute uppercase">{kicker}</p>
      <p className="mt-2 font-display text-3xl font-bold">{title}</p>
    </Link>
  );
}
