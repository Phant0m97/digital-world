export type SketchProject = {
  id: string;
  name: string;
  image: string;
  updated: number;
};

export type SketchPost = {
  id: string;
  title: string;
  author: string;
  image: string;
  at: number;
};

const KEY = "dw-sketch-v1";

type Save = { projects: SketchProject[]; posts: SketchPost[] };

function blank(): Save {
  return { projects: [], posts: [] };
}

export function readSketch(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const saved = JSON.parse(raw) as Save;
    return {
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      posts: Array.isArray(saved.posts) ? saved.posts : [],
    };
  } catch {
    return blank();
  }
}

export function writeSketch(save: Save) {
  localStorage.setItem(KEY, JSON.stringify(save));
}

function stick(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, 640, 640);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#141414";
  ctx.fillStyle = "#141414";
  ctx.lineWidth = 16;
  draw(ctx);
  return canvas.toDataURL("image/png");
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = "#141414";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 42);
  ctx.lineTo(x, y + 170);
  ctx.moveTo(x, y + 80);
  ctx.lineTo(x - 70, y + 130);
  ctx.moveTo(x, y + 80);
  ctx.lineTo(x + 78, y + 40);
  ctx.moveTo(x, y + 170);
  ctx.lineTo(x - 48, y + 270);
  ctx.moveTo(x, y + 170);
  ctx.lineTo(x + 52, y + 270);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - 14, y + 4, 6, 0, Math.PI * 2);
  ctx.arc(x + 16, y + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function starterPosts(): SketchPost[] {
  const scenes: { title: string; draw: (ctx: CanvasRenderingContext2D) => void }[] = [
    {
      title: "Warmup",
      draw: (ctx) => person(ctx, 320, 180, "#141414"),
    },
    {
      title: "Leap",
      draw: (ctx) => {
        person(ctx, 250, 210, "#141414");
        ctx.strokeStyle = "#2ee6ff";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(430, 250, 70, 0.4, Math.PI * 1.4);
        ctx.stroke();
      },
    },
    {
      title: "Duel",
      draw: (ctx) => {
        person(ctx, 200, 190, "#ff2bd6");
        person(ctx, 440, 190, "#2ee6ff");
        ctx.strokeStyle = "#ff4d7d";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(280, 250);
        ctx.lineTo(390, 230);
        ctx.stroke();
      },
    },
    {
      title: "Sprout",
      draw: (ctx) => {
        person(ctx, 220, 200, "#141414");
        ctx.strokeStyle = "#3d8f4a";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(430, 460);
        ctx.lineTo(430, 280);
        ctx.moveTo(430, 340);
        ctx.lineTo(370, 290);
        ctx.moveTo(430, 320);
        ctx.lineTo(500, 260);
        ctx.stroke();
      },
    },
    {
      title: "Night",
      draw: (ctx) => {
        ctx.fillStyle = "#1b2430";
        ctx.fillRect(0, 0, 640, 640);
        person(ctx, 320, 200, "#f4f0e6");
        ctx.fillStyle = "#f2c14e";
        ctx.beginPath();
        ctx.arc(500, 110, 36, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ];
  const now = Date.now();
  return scenes.map((scene, index) => ({
    id: `seed-${index}`,
    title: scene.title,
    author: "Sketch",
    image: stick(scene.draw),
    at: now - (scenes.length - index) * 60_000,
  }));
}
