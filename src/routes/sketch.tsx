import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import {
  PAPER,
  PENS,
  WIDTHS,
  postSketch,
  toggleHeart,
  watchWall,
  type Pen,
  type SketchColor,
  type SketchStroke,
  type WallSnapshot,
  type Width,
} from "@/lib/sketch-wall";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/sketch")({ component: SketchPage });

const EMPTY: WallSnapshot = { posts: [], hearts: {}, me: "" };

function SketchPage() {
  const hydrated = useHydrated();
  const profile = useWorld((state) => state.profile);
  const [wall, setWall] = useState<WallSnapshot>(EMPTY);
  const [title, setTitle] = useState("");
  const [guest, setGuest] = useState("");
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [pen, setPen] = useState<Pen>(PENS[0]);
  const [width, setWidth] = useState<Width>(WIDTHS[1]);
  const [erase, setErase] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => watchWall((next) => {
    setWall(next);
    setSeen(true);
  }), []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const open = wall.posts.find((post) => post.id === openId) ?? null;

  const name = profile?.username || guest.trim() || "Guest";

  function publish() {
    if (!strokes.length || busy) return;
    const drawing = strokes;
    const caption = title;
    setStrokes([]);
    setTitle("");
    setBusy(true);
    setNote("Posting…");
    void postSketch({ name, avatarId: profile?.avatarId || "", title: caption, strokes: drawing }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setNote(result.reason);
        return;
      }
      setStrokes([]);
      setTitle("");
      setNote(result.shared ? "Posted on the wall." : "Posted here. The wall will catch up when it can.");
    });
  }

  return (
    <Shell>
      <p className="font-display text-xs tracking-[0.22em] text-cyan uppercase">Mode 03</p>
      <h1 className="font-display text-4xl font-bold">Sketch</h1>
      <p className="mt-2 max-w-xl text-mute">
        Draw a picture and post it. Heart the ones you like. The drawings with the most hearts stay at the top.
      </p>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-panel p-4">
          <div className="flex flex-wrap items-center gap-2">
            {PENS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color === PENS[0] ? "Ink" : color === PENS[1] ? "Cyan" : "Magenta"}
                onClick={() => {
                  setPen(color);
                  setErase(false);
                }}
                className={`size-11 rounded-full border-2 ${!erase && pen === color ? "border-cyan" : "border-line"}`}
                style={{ background: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => setErase(true)}
              className={`rounded-full border px-3 py-2 text-sm ${erase ? "border-cyan text-cyan" : "border-line text-cream"}`}
            >
              Eraser
            </button>
            {WIDTHS.map((size, index) => (
              <button
                key={size}
                type="button"
                onClick={() => setWidth(size)}
                className={`rounded-full border px-3 py-2 text-sm ${width === size ? "border-cyan text-cyan" : "border-line text-cream"}`}
              >
                {index === 0 ? "Thin" : index === 1 ? "Mid" : "Thick"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStrokes((current) => current.slice(0, -1))}
              disabled={!strokes.length}
              className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setStrokes([])}
              disabled={!strokes.length}
              className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <DrawBoard
            strokes={strokes}
            color={erase ? PAPER : pen}
            width={width}
            onStroke={(stroke) => setStrokes((current) => [...current, stroke].slice(-60))}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={42}
              placeholder="Title, if you want one"
              className="w-full rounded-xl border border-line bg-ink px-3 py-3 text-cream outline-none focus:border-cyan"
            />
            <button
              type="button"
              disabled={!strokes.length || busy}
              onClick={publish}
              className="rounded-full bg-cyan px-5 py-3 font-display font-bold text-ink disabled:opacity-40"
            >
              Post
            </button>
          </div>
          {profile ? (
            <p className="mt-3 text-sm text-mute">Posting as {profile.username}</p>
          ) : (
            <label className="mt-3 block text-sm text-mute">
              Your name
              <input
                value={guest}
                onChange={(event) => setGuest(event.target.value)}
                maxLength={16}
                placeholder="Guest"
                className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-cream outline-none focus:border-cyan"
              />
            </label>
          )}
          {note ? <p className="mt-3 text-sm text-mute">{note}</p> : null}
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold">The wall</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {!hydrated || !seen ? <p className="col-span-full text-mute">Looking for drawings…</p> : null}
            {hydrated && seen && wall.posts.length === 0 ? (
              <p className="col-span-full rounded-card border border-line bg-panel-2 px-4 py-6 text-mute">
                Nothing on the wall yet. Post the first picture.
              </p>
            ) : null}
            {wall.posts.map((post, index) => {
              const count = wall.hearts[post.id]?.length ?? 0;
              const liked = Boolean(wall.me && wall.hearts[post.id]?.includes(wall.me));
              return (
                <article key={post.id} className="relative overflow-hidden rounded-2xl border border-line bg-panel-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(post.id)}
                    className="block w-full text-left"
                  >
                    <SketchView strokes={post.strokes} className="aspect-square w-full bg-cream" />
                    <p className="truncate px-2 py-2 text-sm">
                      {post.title || "Untitled"}
                      {index === 0 && count > 0 ? " · Top" : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-pressed={liked}
                    aria-label={liked ? `Unheart ${post.title || "drawing"}` : `Heart ${post.title || "drawing"}`}
                    onClick={() => void toggleHeart(post.id, !liked)}
                    className={`absolute top-2 right-2 inline-flex min-h-11 items-center gap-1 rounded-full border px-2 py-1 text-sm ${liked ? "border-mag bg-ink/80 text-mag" : "border-line bg-ink/80 text-cream"}`}
                  >
                    <Heart className={`size-4 ${liked ? "fill-mag" : "fill-transparent"}`} />
                    <span className="font-display">{count}</span>
                  </button>
                </article>
              );
            })}
          </div>
          {open ? (
            <PaintingDialog
              post={open}
              count={wall.hearts[open.id]?.length ?? 0}
              liked={Boolean(wall.me && wall.hearts[open.id]?.includes(wall.me))}
              top={wall.posts[0]?.id === open.id && (wall.hearts[open.id]?.length ?? 0) > 0}
              onClose={() => setOpenId(null)}
              onHeart={() => void toggleHeart(open.id, !(wall.me && wall.hearts[open.id]?.includes(wall.me)))}
            />
          ) : null}
        </section>
      </div>
    </Shell>
  );
}

function PaintingDialog({
  post,
  count,
  liked,
  top,
  onClose,
  onHeart,
}: {
  post: { id: string; title: string; name: string; strokes: SketchStroke[] };
  count: number;
  liked: boolean;
  top: boolean;
  onClose: () => void;
  onHeart: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.title || "Painting"}
      className="fixed inset-0 z-30 grid place-items-center bg-ink/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-card border border-line bg-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <SketchView strokes={post.strokes} className="aspect-[4/3] w-full bg-cream" />
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-bold">{post.title || "Untitled"}</p>
            <p className="truncate text-sm text-mute">
              {post.name}
              {top ? " · Top" : ""}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? "Unheart painting" : "Heart painting"}
            onClick={onHeart}
            className={`ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 ${liked ? "border-mag text-mag" : "border-line text-cream"}`}
          >
            <Heart className={`size-5 ${liked ? "fill-mag" : "fill-transparent"}`} />
            <span className="font-display">{count}</span>
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-line px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawBoard({
  strokes,
  color,
  width,
  onStroke,
}: {
  strokes: SketchStroke[];
  color: SketchColor;
  width: Width;
  onStroke: (stroke: SketchStroke) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef(strokes);
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const current = useRef<SketchStroke | null>(null);
  strokesRef.current = strokes;
  colorRef.current = color;
  widthRef.current = width;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => paint(canvas, current.current ? [...strokesRef.current, current.current] : strokesRef.current);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes]);

  function point(event: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000);
    return [Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))];
  }

  function finish(canvas: HTMLCanvasElement) {
    const stroke = current.current;
    current.current = null;
    if (!stroke || stroke.p.length === 0) return;
    onStroke(stroke);
    paint(canvas, [...strokesRef.current, stroke]);
  }

  return (
    <canvas
      ref={canvasRef}
      className="mt-4 aspect-[4/3] w-full touch-none rounded-2xl bg-cream"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        current.current = { c: colorRef.current, w: widthRef.current, p: [point(event)] };
        paint(event.currentTarget, [...strokesRef.current, current.current]);
      }}
      onPointerMove={(event) => {
        const stroke = current.current;
        if (!stroke) return;
        const next = point(event);
        const last = stroke.p[stroke.p.length - 1]!;
        if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 6) return;
        stroke.p.push(next);
        paint(event.currentTarget, [...strokesRef.current, stroke]);
      }}
      onPointerUp={(event) => finish(event.currentTarget)}
      onPointerCancel={(event) => finish(event.currentTarget)}
    />
  );
}

function SketchView({ strokes, className }: { strokes: SketchStroke[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => paint(canvas, strokes);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes]);
  return <canvas ref={ref} className={className} />;
}

function paint(canvas: HTMLCanvasElement, strokes: SketchStroke[]) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  for (const stroke of strokes) {
    const line = (stroke.w / 1000) * width;
    ctx.strokeStyle = stroke.c;
    ctx.fillStyle = stroke.c;
    ctx.lineWidth = line;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const [first] = stroke.p;
    if (!first) continue;
    if (stroke.p.length === 1) {
      ctx.beginPath();
      ctx.arc((first[0] / 1000) * width, (first[1] / 1000) * height, line / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    stroke.p.forEach(([x, y], index) => {
      const px = (x / 1000) * width;
      const py = (y / 1000) * height;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
}
