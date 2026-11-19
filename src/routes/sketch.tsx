import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Shell, useHydrated } from "@/components/shell";
import { readSketch, starterPosts, writeSketch, type SketchPost, type SketchProject } from "@/game/sketch";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/sketch")({ component: SketchPage });

const COLORS = ["#141414", "#f6f1e6", "#ff2bd6", "#2ee6ff", "#ff8a3d", "#3d8f4a", "#f2c14e", "#7a4dff"];

function SketchPage() {
  const ready = useHydrated();
  return (
    <Shell>
      {ready ? <Studio /> : <p className="text-mute">Opening Sketch…</p>}
    </Shell>
  );
}

function Studio() {
  const username = useWorld((state) => state.profile?.username ?? "You");
  const [projects, setProjects] = useState<SketchProject[]>([]);
  const [posts, setPosts] = useState<SketchPost[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<SketchPost | null>(null);

  useEffect(() => {
    const saved = readSketch();
    const posts = saved.posts.length ? saved.posts : starterPosts();
    setProjects(saved.projects);
    setPosts(posts);
    if (!saved.posts.length) writeSketch({ projects: saved.projects, posts });
  }, []);

  function persist(nextProjects: SketchProject[], nextPosts: SketchPost[]) {
    setProjects(nextProjects);
    setPosts(nextPosts);
    writeSketch({ projects: nextProjects, posts: nextPosts });
  }

  const open = projects.find((project) => project.id === openId) ?? null;
  if (open) {
    return (
      <Editor
        project={open}
        onBack={(image, name) => {
          const next = projects.map((project) =>
            project.id === open.id ? { ...project, image, name, updated: Date.now() } : project,
          );
          persist(next, posts);
          setOpenId(null);
        }}
        onPost={(image, name) => {
          const post: SketchPost = {
            id: `post-${Date.now()}`,
            title: name,
            author: username,
            image,
            at: Date.now(),
          };
          const nextProjects = projects.map((project) =>
            project.id === open.id ? { ...project, image, name, updated: Date.now() } : project,
          );
          persist(nextProjects, [post, ...posts]);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Sketch</h1>
          <p className="mt-1 text-sm text-mute">Your boards on the right. Posts on the left.</p>
        </div>
        <Link to="/games" className="text-sm text-cyan">
          Games
        </Link>
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_280px]">
        <section>
          <h2 className="font-display text-xs tracking-[0.22em] text-mute uppercase">Posts</h2>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setExpanded(post)}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-[#f6f1e6] p-2"
              >
                <img src={post.image} alt={post.title} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-xs tracking-[0.22em] text-mute uppercase">Projects</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                const project: SketchProject = {
                  id: `board-${Date.now()}`,
                  name: "Untitled",
                  image: "",
                  updated: Date.now(),
                };
                persist([project, ...projects], posts);
                setOpenId(project.id);
              }}
              className="grid aspect-square place-items-center rounded-2xl border border-dashed border-line text-sm text-mute"
            >
              New board
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setOpenId(project.id)}
                className="overflow-hidden rounded-2xl border border-line bg-[#f6f1e6] text-left"
              >
                <span className="flex aspect-square items-center justify-center p-2">
                  {project.image ? (
                    <img src={project.image} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-[#8a8478]">Empty</span>
                  )}
                </span>
                <span className="block truncate bg-panel px-2 py-2 text-xs text-cream">{project.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      {expanded ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/80 p-4" onClick={() => setExpanded(null)}>
          <div className="max-h-[88dvh] max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <img src={expanded.image} alt="" className="max-h-[74dvh] w-auto max-w-[92vw] object-contain" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="font-display text-xl font-bold">{expanded.title}</p>
              <button type="button" className="rounded-full border border-line px-4 py-2 text-sm" onClick={() => setExpanded(null)}>
                Close
              </button>
            </div>
            <p className="text-sm text-mute">
              {expanded.author} · {new Date(expanded.at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Editor({
  project,
  onBack,
  onPost,
}: {
  project: SketchProject;
  onBack: (image: string, name: string) => void;
  onPost: (image: string, name: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(8);
  const [eraser, setEraser] = useState(false);
  const history = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#f6f1e6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!project.image) return;
    const image = new Image();
    image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = project.image;
  }, [project.image]);

  function snapshot() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 20) history.current.shift();
  }

  function pointer(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (event.type === "pointerdown") {
      snapshot();
      drawing.current = true;
      canvas.setPointerCapture(event.pointerId);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    if (!drawing.current) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = eraser ? "#f6f1e6" : color;
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (event.type === "pointerup" || event.type === "pointercancel") drawing.current = false;
  }

  function image() {
    return canvasRef.current?.toDataURL("image/png") ?? project.image;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-full border border-line px-4 py-2 text-sm" onClick={() => onBack(image(), name.trim() || "Untitled")}>
          Boards
        </button>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-2"
        />
        <button type="button" className="rounded-full bg-cyan px-4 py-2 text-ink" onClick={() => onPost(image(), name.trim() || "Untitled")}>
          Post
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            onClick={() => {
              setColor(swatch);
              setEraser(false);
            }}
            className={`size-8 rounded-full border-2 ${color === swatch && !eraser ? "border-cyan" : "border-line"}`}
            style={{ background: swatch }}
          />
        ))}
        <button
          type="button"
          onClick={() => setEraser((value) => !value)}
          className={`rounded-full border px-3 py-2 text-sm ${eraser ? "border-cyan text-cyan" : "border-line"}`}
        >
          Eraser
        </button>
        <label className="text-xs text-mute">
          Size
          <input
            type="range"
            min={2}
            max={36}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="ml-2 align-middle"
          />
        </label>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-2 text-sm"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            const last = history.current.pop();
            if (!canvas || !ctx || !last) return;
            ctx.putImageData(last, 0, 0);
          }}
        >
          Undo
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={640}
        onPointerDown={pointer}
        onPointerMove={pointer}
        onPointerUp={pointer}
        onPointerCancel={pointer}
        className="mt-4 w-full touch-none rounded-2xl border border-line bg-[#f6f1e6]"
      />
    </div>
  );
}
