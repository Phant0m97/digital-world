import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Shell, useHydrated } from "@/components/shell";
import {
  PAPER,
  deleteSketch,
  postSketch,
  readProjects,
  removeProject,
  saveProject,
  toggleHeart,
  watchWall,
  type SketchProject,
  type SketchStroke,
  type StrokePen,
  type WallSnapshot,
} from "@/lib/sketch-wall";
import { useWorld } from "@/lib/store";

export const Route = createFileRoute("/sketch")({ component: SketchPage });

const EMPTY: WallSnapshot = { posts: [], hearts: {}, me: "" };
type PenId = Exclude<StrokePen, "erase">;
const BRUSHES: { group: string; items: { id: PenId; name: string; cost: number }[] }[] = [
  {
    group: "Sketching",
    items: [
      { id: "pencil", name: "Pencil", cost: 0 },
      { id: "charcoal", name: "Charcoal", cost: 0 },
    ],
  },
  {
    group: "Inking",
    items: [
      { id: "pen", name: "Pen", cost: 0 },
      { id: "ink", name: "Ink", cost: 0 },
      { id: "marker", name: "Marker", cost: 0 },
    ],
  },
  {
    group: "Painting",
    items: [
      { id: "watercolor", name: "Watercolor", cost: 0 },
      { id: "neon", name: "Neon", cost: 24 },
    ],
  },
  {
    group: "Airbrush",
    items: [
      { id: "spray", name: "Spray", cost: 18 },
      { id: "highlighter", name: "Highlighter", cost: 12 },
      { id: "smudge", name: "Smudge", cost: 0 },
    ],
  },
];
const PENS = BRUSHES.flatMap((group) => group.items);

type Layer = { id: string; name: string; hidden: boolean; strokes: SketchStroke[] };

function freshLayers(): Layer[] {
  return [{ id: "layer-1", name: "1", hidden: false, strokes: [] }];
}

function SketchPage() {
  const hydrated = useHydrated();
  const profile = useWorld((state) => state.profile);
  const credits = useWorld((state) => state.credits);
  const ownedPens = useWorld((state) => state.ownedPens) ?? [];
  const buyPen = useWorld((state) => state.buyPen);
  const award = useWorld((state) => state.award);
  const [wall, setWall] = useState<WallSnapshot>(EMPTY);
  const [title, setTitle] = useState("");
  const [guest, setGuest] = useState("");
  const [layers, setLayers] = useState<Layer[]>(freshLayers);
  const pictureRef = useRef<Layer[]>(layers);
  const [activeId, setActiveId] = useState("layer-1");
  const [penId, setPenId] = useState<PenId>("ink");
  const [width, setWidth] = useState(18);
  const [hue, setHue] = useState(188);
  const [shade, setShade] = useState(30);
  const [colorAmt, setColorAmt] = useState(100);
  const [erase, setErase] = useState(false);
  const [panel, setPanel] = useState<"brush" | "color" | "layers" | null>(null);
  const [pick, setPick] = useState(false);
  const [mirror, setMirror] = useState(false);
  const pastRef = useRef<Layer[][]>([]);
  const futureRef = useRef<Layer[][]>([]);
  const [steps, setSteps] = useState({ undo: 0, redo: 0 });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<SketchProject[]>([]);
  const [confirm, setConfirm] = useState<{ kind: "post" | "save"; id: string } | null>(null);
  const [sheet, setSheet] = useState<"posts" | "saved" | null>(null);
  const [menu, setMenu] = useState(true);
  const [cover, setCover] = useState(false);
  const commitRef = useRef<(() => void) | null>(null);
  const color = hsvToHex(hue, colorAmt / 100, shade / 100);
  const pen = PENS.find((item) => item.id === penId) ?? PENS[0];
  const owned = pen.cost === 0 || ownedPens.includes(pen.id);
  const tool: StrokePen = erase ? "erase" : pen.id;
  const active = layers.find((layer) => layer.id === activeId) ?? layers[0]!;
  const visible = layers.filter((layer) => !layer.hidden).flatMap((layer) => layer.strokes);

  useEffect(() => watchWall((next) => {
    setWall(next);
    setSeen(true);
  }), []);

  useEffect(() => {
    setProjects(readProjects());
  }, []);

  useEffect(() => {
    if (!openId && !confirm && !sheet && !cover) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (openId) setOpenId(null);
      else if (sheet) setSheet(null);
      else setCover(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, confirm, sheet, cover]);

  useEffect(() => {
    if (!wall.me) return;
    const paid = readPaidHearts();
    let fresh = 0;
    for (const post of wall.posts) {
      if (post.author !== wall.me) continue;
      for (const liker of wall.hearts[post.id] ?? []) {
        if (liker === wall.me) continue;
        const key = `${post.id}:${liker}`;
        if (paid.has(key)) continue;
        paid.add(key);
        fresh += 1;
      }
    }
    if (!fresh) return;
    writePaidHearts(paid);
    award(fresh * 5);
  }, [wall, award]);

  const open = wall.posts.find((post) => post.id === openId) ?? null;
  const name = profile?.username || guest.trim() || "Guest";

  function replaceLayers(next: Layer[]) {
    pictureRef.current = next;
    setLayers(next);
  }

  function cloneLayers(list: Layer[]): Layer[] {
    return list.map((layer) => ({
      ...layer,
      strokes: layer.strokes.map((stroke) => ({ ...stroke, p: stroke.p.map((pt) => [pt[0], pt[1]] as [number, number]) })),
    }));
  }

  function editLayers(next: Layer[]) {
    pastRef.current = [...pastRef.current, cloneLayers(pictureRef.current)].slice(-40);
    futureRef.current = [];
    replaceLayers(next);
    setSteps({ undo: pastRef.current.length, redo: 0 });
  }

  function clearHistory() {
    pastRef.current = [];
    futureRef.current = [];
    setSteps({ undo: 0, redo: 0 });
  }

  function undo() {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneLayers(pictureRef.current));
    replaceLayers(prev);
    setSteps({ undo: pastRef.current.length, redo: futureRef.current.length });
  }

  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(cloneLayers(pictureRef.current));
    replaceLayers(next);
    setSteps({ undo: pastRef.current.length, redo: futureRef.current.length });
  }

  function patchActive(next: (strokes: SketchStroke[]) => SketchStroke[], reveal = false) {
    editLayers(
      pictureRef.current.map((layer) =>
        layer.id === active.id ? { ...layer, hidden: reveal ? false : layer.hidden, strokes: next(layer.strokes) } : layer,
      ),
    );
  }

  function addLayer() {
    if (layers.length >= 4) return;
    const id = `layer-${Date.now().toString(36)}`;
    editLayers([...pictureRef.current, { id, name: String(pictureRef.current.length + 1), hidden: false, strokes: [] }]);
    setActiveId(id);
  }

  function publish() {
    commitRef.current?.();
    const drawing = pictureRef.current.filter((layer) => !layer.hidden).flatMap((layer) => layer.strokes);
    if (!drawing.length || busy) return;
    const caption = title;
    replaceLayers(freshLayers());
    setActiveId("layer-1");
    setTitle("");
    setProjectId(null);
    setBusy(true);
    setNote("Posting…");
    clearHistory();
    void postSketch({ name, avatarId: profile?.avatarId || "", title: caption, strokes: drawing }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setNote(result.reason);
        return;
      }
      setNote(result.shared ? "Posted." : "Posted here. Others will see it when the connection catches up.");
    });
  }

  function save() {
    commitRef.current?.();
    const stored = saveProject({
      id: projectId,
      title,
      layers: pictureRef.current.map((layer) => ({
        id: layer.id,
        hidden: layer.hidden,
        strokes: layer.strokes.map((stroke) => ({ ...stroke, p: stroke.p.map((pt) => [pt[0], pt[1]] as [number, number]) })),
      })),
    });
    if (!stored) {
      setNote("Draw something before saving.");
      return;
    }
    setProjectId(stored.id);
    setProjects(readProjects());
    setNote("Saved. It stays on this device until you post it.");
  }

  function startNew() {
    replaceLayers(freshLayers());
    setActiveId("layer-1");
    setTitle("");
    setProjectId(null);
    setNote("");
    clearHistory();
    setMenu(false);
  }

  function openProject(project: SketchProject) {
    const next = project.layers.length
      ? project.layers.map((layer) => ({ ...layer, name: layer.id }))
      : freshLayers();
    replaceLayers(next);
    setActiveId(next[0]!.id);
    setTitle(project.title);
    setProjectId(project.id);
    setSheet(null);
    setNote("Opened. You can keep drawing.");
    clearHistory();
    setMenu(false);
  }

  function moveLayer(direction: -1 | 1) {
    const list = pictureRef.current;
    const index = list.findIndex((layer) => layer.id === active.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item!);
    editLayers(next);
  }

  function remove(id: string) {
    void deleteSketch(id).then((ok) => {
      if (!ok) {
        setNote("You can only delete your own posts.");
        return;
      }
      if (openId === id) setOpenId(null);
      setNote("Deleted.");
    });
  }

  function confirmDelete() {
    if (!confirm) return;
    const pending = confirm;
    setConfirm(null);
    if (pending.kind === "post") {
      remove(pending.id);
      return;
    }
    removeProject(pending.id);
    if (projectId === pending.id) setProjectId(null);
    setProjects(readProjects());
  }

  if (menu && hydrated) {
    return (
      <Shell>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs tracking-[0.22em] text-cyan uppercase">Game 03</p>
            <h1 className="font-display text-3xl font-bold">Sketch</h1>
          </div>
          <button type="button" onClick={startNew} className="min-h-11 rounded-full bg-cyan px-4 font-display text-ink">
            New board
          </button>
        </div>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_300px]">
          <section>
            <h2 className="font-display text-xs tracking-[0.22em] text-mute uppercase">Posts</h2>
            {!seen ? <p className="mt-3 text-mute">Looking for drawings…</p> : null}
            {seen && wall.posts.length === 0 ? (
              <p className="mt-3 rounded-card border border-line bg-panel-2 px-4 py-6 text-mute">Nothing posted yet. Draw a board and post it.</p>
            ) : null}
            <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
              {wall.posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setOpenId(post.id)}
                  className="aspect-square overflow-hidden rounded-2xl border border-line bg-[#f6f1e6] p-1.5"
                >
                  <SketchView strokes={post.strokes} className="block h-full w-full" />
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-xs tracking-[0.22em] text-mute uppercase">Projects</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => openProject(project)}
                  className="overflow-hidden rounded-2xl border border-line bg-[#f6f1e6] text-left"
                >
                  <span className="block aspect-square p-1.5">
                    <SketchView
                      strokes={project.layers.filter((layer) => !layer.hidden).flatMap((layer) => layer.strokes)}
                      className="block h-full w-full"
                    />
                  </span>
                  <span className="block truncate bg-panel px-2 py-2 text-xs text-cream">{project.title || "Untitled"}</span>
                </button>
              ))}
            </div>
            {projects.length === 0 ? <p className="mt-3 text-sm text-mute">Save a board and it shows up here.</p> : null}
          </section>
        </div>
        {open ? (
          <PaintingDialog
            post={open}
            count={wall.hearts[open.id]?.length ?? 0}
            liked={Boolean(wall.me && wall.hearts[open.id]?.includes(wall.me))}
            top={wall.posts[0]?.id === open.id && (wall.hearts[open.id]?.length ?? 0) > 0}
            onClose={() => setOpenId(null)}
            onHeart={() => void toggleHeart(open.id, !(wall.me && wall.hearts[open.id]?.includes(wall.me)))}
            onDelete={open.author === wall.me ? () => setConfirm({ kind: "post", id: open.id }) : undefined}
          />
        ) : null}
        {confirm ? (
          <div role="dialog" aria-modal="true" aria-label="Are you sure?" className="fixed inset-0 z-40 grid place-items-center bg-ink/80 p-4" onClick={() => setConfirm(null)}>
            <div className="w-full max-w-sm rounded-card border border-line bg-panel p-4" onClick={(event) => event.stopPropagation()}>
              <p className="font-display text-xl font-bold">Delete this?</p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="flex-1 rounded-full border border-line py-2" onClick={() => setConfirm(null)}>
                  Keep
                </button>
                <button type="button" className="flex-1 rounded-full bg-mag py-2 text-ink" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-cyan uppercase">Game 03</p>
          <h1 className="font-display text-3xl font-bold">Sketch</h1>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setMenu(true)} className="min-h-11 rounded-full border border-line px-3 text-sm">
            Boards
          </button>
          <button type="button" onClick={() => setSheet((open) => (open === "saved" ? null : "saved"))} className="min-h-11 rounded-full border border-line px-3 text-sm">
            Saved
          </button>
          <button type="button" onClick={() => setSheet((open) => (open === "posts" ? null : "posts"))} className="min-h-11 rounded-full border border-line px-3 text-sm">
            Posts
          </button>
          <button type="button" onClick={() => setCover((on) => !on)} className="min-h-11 rounded-full border border-line px-3 text-sm">
            {cover ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>
      <div className={cover ? "fixed inset-0 z-30 flex flex-col bg-ink" : "relative mt-3 flex h-[calc(100dvh-7.25rem)] min-h-[28rem] flex-col overflow-hidden rounded-card border border-line"}>
        <div className="relative min-h-0 flex-1">
          <DrawBoard
            layers={layers}
            activeId={active.id}
            color={color}
            width={width}
            pen={tool}
            locked={!erase && !owned}
            commitRef={commitRef}
            picking={pick}
            onPick={(hex) => {
              const next = hexToHsv(hex);
              setHue(next.h);
              setColorAmt(next.s);
              setShade(Math.max(12, Math.min(100, next.v)));
              setErase(false);
              setPick(false);
              setPanel("color");
            }}
            onStroke={(stroke) => {
              const total = pictureRef.current.reduce((sum, layer) => sum + layer.strokes.length, 0);
              if (total >= 240) {
                setNote("This picture is full.");
                return false;
              }
              patchActive((strokes) => {
              const flipped = mirror
                ? { ...stroke, p: stroke.p.map((pt) => [1000 - pt[0], pt[1]] as [number, number]) }
                : null;
              return flipped ? [...strokes, stroke, flipped] : [...strokes, stroke];
            }, true);
              return true;
            }}
          />
          <div className="pointer-events-auto absolute top-3 left-3 z-20 flex flex-col gap-1 rounded-2xl bg-ink/85 p-1">
            <Rail label="Brush" on={panel === "brush" && !erase && !pick} press={() => { setErase(false); setPick(false); setPanel((open) => (open === "brush" ? null : "brush")); }} />
            <Rail label="Erase" on={erase} press={() => { setErase(true); setPick(false); setPanel(null); }} />
            <Rail label="Smudge" on={!erase && !pick && penId === "smudge"} press={() => { setPenId("smudge"); setErase(false); setPick(false); setPanel(null); }} />
            <Rail label="Pick" on={pick} press={() => { setPick((on) => !on); setErase(false); setPanel(null); }} />
            <button type="button" aria-label="Color" onClick={() => { setErase(false); setPick(false); setPanel((open) => (open === "color" ? null : "color")); }} className={`size-11 rounded-full border-2 ${panel === "color" ? "border-cyan" : "border-cream"}`} style={{ background: color }} />
            <Rail label="Layers" on={panel === "layers"} press={() => setPanel((open) => (open === "layers" ? null : "layers"))} />
            <Rail label="Undo" on={false} press={undo} disabled={steps.undo === 0} />
            <Rail label="Redo" on={false} press={redo} disabled={steps.redo === 0} />
          </div>
          {panel === "brush" ? (
            <div className="pointer-events-auto absolute top-3 bottom-16 left-20 z-20 w-64 overflow-auto rounded-2xl border border-line bg-ink/95 p-3">
              {BRUSHES.map((group) => (
                <div key={group.group} className="mb-3">
                  <p className="text-xs tracking-wide text-mute uppercase">{group.group}</p>
                  <div className="mt-1 grid gap-1">
                    {group.items.map((item) => {
                      const has = item.cost === 0 || ownedPens.includes(item.id);
                      const on = !erase && penId === item.id;
                      return (
                        <button key={item.id} type="button" onClick={() => { setPenId(item.id); setErase(false); setPick(false); }} className={`rounded-xl border px-3 py-2 text-left text-sm ${on ? "border-cyan text-cyan" : "border-line"}`}>
                          {item.name}{has ? "" : ` · ${item.cost} cr`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!erase && !owned ? (
                <button type="button" disabled={credits < pen.cost} onClick={() => { const bought = buyPen(pen.id, pen.cost); setNote(bought ? `${pen.name} is yours.` : `You need ${pen.cost} cr for ${pen.name}.`); }} className="mb-3 w-full rounded-full bg-cyan py-2 font-display text-ink disabled:opacity-40">
                  {credits < pen.cost ? `Need ${pen.cost} cr` : `Buy ${pen.name}`}
                </button>
              ) : null}
              <label className="block text-sm text-mute">Size<input type="range" min={4} max={64} value={width} onChange={(event) => setWidth(Number(event.target.value))} className="mt-1 w-full" /></label>
              <button type="button" aria-pressed={mirror} onClick={() => setMirror((on) => !on)} className={`mt-3 w-full rounded-full border px-3 py-2 text-sm ${mirror ? "border-cyan text-cyan" : "border-line"}`}>Symmetry</button>
            </div>
          ) : null}
          {panel === "color" ? (
            <div className="pointer-events-auto absolute top-3 left-20 z-20 w-64 rounded-2xl border border-line bg-ink/95 p-3">
              <ColorWheel hue={hue} onHue={(next) => { setHue(next); setErase(false); }} />
              <label className="mt-3 block text-sm text-mute">Shade<input type="range" min={12} max={100} value={shade} onChange={(event) => { setShade(Number(event.target.value)); setErase(false); }} className="mt-1 w-full" /></label>
              <label className="mt-3 block text-sm text-mute">Color<input type="range" min={0} max={100} value={colorAmt} onChange={(event) => { setColorAmt(Number(event.target.value)); setErase(false); }} className="mt-1 w-full" /></label>
            </div>
          ) : null}
          {panel === "layers" ? (
            <div className="pointer-events-auto absolute top-3 left-20 z-20 w-56 rounded-2xl border border-line bg-ink/95 p-3">
              {layers.map((layer, index) => (
                <button key={layer.id} type="button" onClick={() => setActiveId(layer.id)} className={`mb-1 w-full rounded-xl border px-3 py-2 text-left text-sm ${layer.id === active.id ? "border-cyan text-cyan" : "border-line"} ${layer.hidden ? "opacity-50" : ""}`}>Layer {index + 1}</button>
              ))}
              <div className="mt-2 flex flex-wrap gap-1">
                <button type="button" onClick={addLayer} disabled={layers.length >= 4} className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">Add</button>
                <button type="button" onClick={() => editLayers(pictureRef.current.map((layer) => layer.id === active.id ? { ...layer, hidden: !layer.hidden } : layer))} className="rounded-full border border-line px-3 py-2 text-sm">{active.hidden ? "Show" : "Hide"}</button>
                <button type="button" disabled={layers[0]?.id === active.id} onClick={() => moveLayer(-1)} className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">Down</button>
                <button type="button" disabled={layers[layers.length - 1]?.id === active.id} onClick={() => moveLayer(1)} className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">Up</button>
                <button type="button" disabled={layers.length < 2} onClick={() => { const next = pictureRef.current.filter((layer) => layer.id !== active.id); editLayers(next); setActiveId(next[0]!.id); }} className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">Delete</button>
                <button type="button" disabled={!active.strokes.length} onClick={() => patchActive(() => [])} className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">Clear</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-line bg-ink p-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={42}
              placeholder="Title, if you want one"
              className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 py-3 text-cream outline-none focus:border-cyan"
            />
            {!profile ? (
              <input
                value={guest}
                onChange={(event) => setGuest(event.target.value)}
                maxLength={16}
                placeholder="Your name"
                className="w-32 rounded-xl border border-line bg-ink px-3 py-3 text-cream outline-none focus:border-cyan"
              />
            ) : null}
            <button
              type="button"
              onClick={save}
              className="rounded-full border border-line px-5 py-3 font-display"
            >
              Save
            </button>
            <button type="button" onClick={startNew} className="rounded-full border border-line px-5 py-3 font-display">
              New
            </button>
            <button
              type="button"
              disabled={!visible.length || busy}
              onClick={publish}
              className="rounded-full bg-cyan px-5 py-3 font-display font-bold text-ink disabled:opacity-40"
            >
              Post
            </button>
          </div>
          {note ? <p className="shrink-0 px-2 pb-2 text-sm text-mute">{note}</p> : null}
        {sheet === "saved" ? (
          <section className="absolute inset-3 z-20 overflow-auto rounded-card border border-line bg-ink/95 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">Saved</h2>
              <button type="button" onClick={() => setSheet(null)} className="min-h-11 rounded-full border border-line px-3 text-sm">
                Close
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-mute">Nothing saved yet. Save keeps a project here without posting it.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {projects.map((project) => (
                  <div key={project.id} className="overflow-hidden rounded-2xl border border-line bg-[#f6f1e6]">
                    <button type="button" onClick={() => openProject(project)} className="block w-full text-left">
                      <span className="block aspect-square p-2">
                        <SketchView
                          strokes={project.layers.filter((layer) => !layer.hidden).flatMap((layer) => layer.strokes)}
                          className="block h-full w-full"
                        />
                      </span>
                      <span className="block truncate bg-ink px-2 py-2 text-sm text-cream">{project.title || "Untitled"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: "save", id: project.id })}
                      className="w-full bg-ink py-2 text-sm text-mute"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          </section>
        ) : null}
        {sheet === "posts" ? (
        <section className="absolute inset-3 z-20 overflow-auto rounded-card border border-line bg-ink/95 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Posts</h2>
            <button type="button" onClick={() => setSheet(null)} className="min-h-11 rounded-full border border-line px-3 text-sm">
              Close
            </button>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
            {!hydrated || !seen ? <p className="col-span-full text-mute">Looking for drawings…</p> : null}
            {hydrated && seen && wall.posts.length === 0 ? (
              <p className="col-span-full rounded-card border border-line bg-panel-2 px-4 py-6 text-mute">
                Nothing posted yet. Post the first picture.
              </p>
            ) : null}
            {wall.posts.map((post) => {
              const count = wall.hearts[post.id]?.length ?? 0;
              const liked = Boolean(wall.me && wall.hearts[post.id]?.includes(wall.me));
              return (
                <article key={post.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenId(post.id)}
                    className="block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-[#f6f1e6] p-1.5 text-left"
                  >
                    <SketchView strokes={post.strokes} className="block h-full w-full" />
                  </button>
                  {post.author === wall.me ? (
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: "post", id: post.id })}
                      className="absolute bottom-2 left-2 min-h-11 rounded-full border border-line bg-ink/80 px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  ) : null}
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
              onDelete={open.author === wall.me ? () => setConfirm({ kind: "post", id: open.id }) : undefined}
            />
          ) : null}
        </section>
        ) : null}
        {confirm ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Are you sure?"
            className="fixed inset-0 z-40 grid place-items-center bg-ink/80 p-4"
            onClick={() => setConfirm(null)}
          >
            <div
              className="w-full max-w-sm rounded-card border border-line bg-panel p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="font-display text-2xl font-bold">Are you sure?</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={confirmDelete} className="min-h-11 flex-1 rounded-full bg-cyan py-2 font-display text-ink">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirm(null)} className="min-h-11 flex-1 rounded-full border border-line py-2">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
  onDelete,
}: {
  post: { id: string; title: string; name: string; strokes: SketchStroke[] };
  count: number;
  liked: boolean;
  top: boolean;
  onClose: () => void;
  onHeart: () => void;
  onDelete?: () => void;
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
        <SketchView strokes={post.strokes} className="aspect-square w-full bg-[#f6f1e6]" />
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
          {onDelete ? (
            <button type="button" onClick={onDelete} className="min-h-11 rounded-full border border-line px-4 py-2">
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PAID_HEARTS = "dw-sketch-paid-hearts-v1";

function readPaidHearts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PAID_HEARTS) || "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writePaidHearts(paid: Set<string>) {
  localStorage.setItem(PAID_HEARTS, JSON.stringify([...paid].slice(-500)));
}

function Rail({ label, on, press, disabled = false }: { label: string; on: boolean; press: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} aria-pressed={on} onClick={press} className={`min-h-11 rounded-xl px-2 py-2 text-xs disabled:opacity-40 ${on ? "bg-cream text-ink" : "text-cream"}`}>
      {label}
    </button>
  );
}

function ColorWheel({ hue, onHue }: { hue: number; onHue: (hue: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = 144;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const radius = 54;
    for (let degree = 0; degree < 360; degree += 1) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${degree} 92% 52%)`;
      ctx.lineWidth = 22;
      const rad = ((degree - 0.6) * Math.PI) / 180;
      const end = ((degree + 0.6) * Math.PI) / 180;
      ctx.arc(center, center, radius, rad, end);
      ctx.stroke();
    }
    const mark = (hue * Math.PI) / 180;
    ctx.beginPath();
    ctx.fillStyle = PAPER;
    ctx.arc(center + Math.cos(mark) * radius, center + Math.sin(mark) * radius, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [hue]);

  function pick(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(x, y) < 28) return;
    onHue(Math.round((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  }

  return (
    <canvas
      ref={ref}
      aria-label="Color wheel"
      className="size-24 touch-none rounded-full"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event);
      }}
    />
  );
}

function hexToHsv(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: Math.round(hue), s: Math.round((max === 0 ? 0 : delta / max) * 100), v: Math.round(max * 100) };
}

function hsvToHex(h: number, s: number, v: number) {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (section < 1) [red, green, blue] = [chroma, x, 0];
  else if (section < 2) [red, green, blue] = [x, chroma, 0];
  else if (section < 3) [red, green, blue] = [0, chroma, x];
  else if (section < 4) [red, green, blue] = [0, x, chroma];
  else if (section < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];
  const match = v - chroma;
  const channel = (value: number) => Math.round((value + match) * 255).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function DrawBoard({
  layers,
  activeId,
  color,
  width,
  pen,
  locked,
  commitRef,
  picking,
  onPick,
  onStroke,
}: {
  layers: Layer[];
  activeId: string;
  color: string;
  width: number;
  pen: StrokePen;
  locked: boolean;
  commitRef: { current: (() => void) | null };
  picking: boolean;
  onPick: (hex: string) => void;
  onStroke: (stroke: SketchStroke) => boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [pan, setPan] = useState(false);
  const layersRef = useRef(layers);
  const activeRef = useRef(activeId);
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const penRef = useRef(pen);
  const lockedRef = useRef(locked);
  const pickingRef = useRef(picking);
  const onPickRef = useRef(onPick);
  const panRef = useRef(false);
  const current = useRef<SketchStroke | null>(null);
  const lastPoint = useRef<[number, number] | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(null);
  layersRef.current = layers;
  activeRef.current = activeId;
  colorRef.current = color;
  widthRef.current = width;
  penRef.current = pen;
  lockedRef.current = locked;
  pickingRef.current = picking;
  onPickRef.current = onPick;
  panRef.current = pan;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (current.current && layers.some((layer) => layer.strokes.includes(current.current!))) current.current = null;
    const draw = () => paintLayers(canvas, layersRef.current, current.current, activeRef.current);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [layers]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      setView((next) => ({ ...next, z: Math.min(8, Math.max(0.35, next.z * factor)) }));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  function paperPoint(clientX: number, clientY: number): [number, number] | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    const x = Math.round(((clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((clientY - rect.top) / rect.height) * 1000);
    return [Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))];
  }

  function paint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintLayers(canvas, layersRef.current, current.current, activeRef.current);
  }

  function finish(keepUntilStored: boolean) {
    const stroke = current.current;
    if (!stroke || stroke.p.length === 0) {
      current.current = null;
      return;
    }
    const end = lastPoint.current;
    const tail = stroke.p[stroke.p.length - 1];
    if (end && tail && (tail[0] !== end[0] || tail[1] !== end[1])) stroke.p.push(end);
    const stored = onStroke(stroke);
    if (!stored || !keepUntilStored) current.current = null;
    paint();
  }

  commitRef.current = () => finish(true);

  function pinchOf() {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return null;
    const [a, b] = pts;
    return { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), midX: (a!.x + b!.x) / 2, midY: (a!.y + b!.y) / 2 };
  }

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden bg-[#12121a] touch-none"
      style={{ containerType: "size" }}
      onPointerDown={(event) => {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        event.currentTarget.setPointerCapture(event.pointerId);
        if (pointers.current.size > 1) {
          current.current = null;
          pinch.current = pinchOf();
          paint();
          return;
        }
        if (panRef.current || event.button === 1) return;
        if (pickingRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
            const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
            if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              if (pixel[3]! > 8) {
                const hex = `#${[pixel[0], pixel[1], pixel[2]].map((part) => part!.toString(16).padStart(2, "0")).join("")}`;
                onPickRef.current(hex);
              }
            }
          }
          return;
        }
        if (event.button !== 0 || lockedRef.current) return;
        const start = paperPoint(event.clientX, event.clientY);
        if (!start) return;
        lastPoint.current = start;
        current.current = { c: colorRef.current, w: widthRef.current, a: 1, pen: penRef.current, p: [start] };
        paint();
      }}
      onPointerMove={(event) => {
        const prev = pointers.current.get(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size > 1) {
          const next = pinchOf();
          const last = pinch.current;
          if (next && last && last.dist > 0) {
            const scale = next.dist / last.dist;
            setView((view) => ({
              z: Math.min(8, Math.max(0.35, view.z * scale)),
              x: view.x + (next.midX - last.midX),
              y: view.y + (next.midY - last.midY),
            }));
          }
          pinch.current = next;
          return;
        }
        if (panRef.current || event.buttons === 4) {
          if (!prev) return;
          const dx = event.clientX - prev.x;
          const dy = event.clientY - prev.y;
          setView((view) => ({ ...view, x: view.x + dx, y: view.y + dy }));
          return;
        }
        const stroke = current.current;
        if (!stroke) return;
        const next = paperPoint(event.clientX, event.clientY);
        if (!next) return;
        lastPoint.current = next;
        const last = stroke.p[stroke.p.length - 1]!;
        if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 2) return;
        stroke.p.push(next);
        paint();
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        pinch.current = null;
        if (pointers.current.size === 0) finish(true);
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        pinch.current = null;
        if (pointers.current.size === 0) finish(true);
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 aspect-[4/3]"
        style={{
          width: "min(calc(100cqw - 1rem), calc((100cqh - 3.75rem) * 4 / 3))",
          transform: `translate(calc(-50% + ${view.x}px), calc(-50% - 1.5rem + ${view.y}px)) scale(${view.z})`,
        }}
      >
        <canvas ref={canvasRef} className="aspect-[4/3] w-full bg-cream shadow-[0_12px_40px_rgba(0,0,0,0.45)]" />
      </div>
      <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-2" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => setView((next) => ({ ...next, z: Math.max(0.35, next.z / 1.2) }))} className="min-h-11 rounded-full border border-line bg-ink/80 px-3 text-sm">
          −
        </button>
        <button type="button" onClick={() => setView({ x: 0, y: 0, z: 1 })} className="min-h-11 rounded-full border border-line bg-ink/80 px-3 text-sm">
          Fit
        </button>
        <button type="button" onClick={() => setView((next) => ({ ...next, z: Math.min(8, next.z * 1.2) }))} className="min-h-11 rounded-full border border-line bg-ink/80 px-3 text-sm">
          +
        </button>
        <button
          type="button"
          aria-pressed={pan}
          onClick={() => setPan((on) => !on)}
          className={`min-h-11 rounded-full border px-3 text-sm ${pan ? "border-cyan bg-ink/80 text-cyan" : "border-line bg-ink/80"}`}
        >
          Move
        </button>
      </div>
    </div>
  );
}

function SketchView({ strokes, className }: { strokes: SketchStroke[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => paintLayers(canvas, [{ id: "flat", name: "1", hidden: false, strokes }]);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes]);
  return <canvas ref={ref} className={className} />;
}

let scratch: HTMLCanvasElement | null = null;

function paintLayers(canvas: HTMLCanvasElement, layers: Layer[], ghost?: SketchStroke | null, activeId?: string) {
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width;
    scratch.height = height;
  }
  const off = scratch.getContext("2d");
  if (!off) return;
  for (const layer of layers) {
    if (layer.hidden && !(ghost && layer.id === activeId)) continue;
    off.setTransform(1, 0, 0, 1, 0, 0);
    off.clearRect(0, 0, width, height);
    for (const stroke of layer.strokes) drawStroke(off, stroke, width, height);
    if (ghost && layer.id === activeId) drawStroke(off, ghost, width, height);
    ctx.drawImage(scratch, 0, 0);
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: SketchStroke, width: number, height: number) {
  const line = Math.max(1, (stroke.w / 1000) * width);
  const fade = stroke.a ?? 1;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.c;
  ctx.fillStyle = stroke.c;
  ctx.globalAlpha = fade;
  ctx.shadowBlur = 0;
  ctx.lineWidth = line;
  if (stroke.pen === "erase") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
  } else if (stroke.pen === "pencil") {
    ctx.globalAlpha = 0.45 * fade;
    ctx.lineWidth = Math.max(1, line * 0.55);
  } else if (stroke.pen === "marker") {
    ctx.globalAlpha = 0.88 * fade;
    ctx.lineCap = "butt";
    ctx.lineWidth = line * 1.2;
  } else if (stroke.pen === "highlighter") {
    ctx.globalAlpha = 0.35 * fade;
    ctx.lineCap = "butt";
    ctx.lineWidth = line * 2.4;
  } else if (stroke.pen === "neon") {
    ctx.shadowColor = stroke.c;
    ctx.shadowBlur = line;
    ctx.lineWidth = Math.max(1, line * 0.55);
  } else if (stroke.pen === "pen") {
    ctx.lineWidth = Math.max(1, line * 0.34);
  } else if (stroke.pen === "charcoal") {
    ctx.globalAlpha = 0.55 * fade;
    ctx.lineWidth = line * 0.9;
  } else if (stroke.pen === "watercolor") {
    ctx.globalAlpha = 0.28 * fade;
    ctx.lineWidth = line * 2.1;
  } else if (stroke.pen === "smudge") {
    ctx.globalAlpha = 0.16 * fade;
    ctx.shadowColor = stroke.c;
    ctx.shadowBlur = line;
    ctx.lineWidth = line * 2.6;
  }
  if (stroke.pen === "spray") {
    const reach = Math.max(2, line * 0.7);
    stroke.p.forEach(([x, y], index) => {
      const px = (x / 1000) * width;
      const py = (y / 1000) * height;
      for (let dot = 0; dot < 6; dot += 1) {
        const angle = (((index * 17 + dot * 53) % 360) * Math.PI) / 180;
        const dist = (((index * 13 + dot * 29) % 100) / 100) * reach;
        ctx.globalAlpha = 0.28 * fade;
        ctx.beginPath();
        ctx.arc(px + Math.cos(angle) * dist, py + Math.sin(angle) * dist, Math.max(0.7, line * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
    return;
  }
  const [first] = stroke.p;
  if (!first) {
    ctx.restore();
    return;
  }
  if (stroke.p.length === 1) {
    ctx.beginPath();
    ctx.arc((first[0] / 1000) * width, (first[1] / 1000) * height, line / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  stroke.p.forEach(([x, y], index) => {
    const px = (x / 1000) * width;
    const py = (y / 1000) * height;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}
