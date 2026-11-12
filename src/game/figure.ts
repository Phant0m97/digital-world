import { SKIN_HEX, type Loadout } from "@/data/catalog";

const INK = "#141414";

type Figure = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: number;
  aim: number;
  color: string;
  weapon: string;
  alive: boolean;
  grounded: boolean;
  invuln: number;
  respawn: number;
  loadout: Loadout;
  dyes: Record<string, string>;
};

function shade(hex: string, delta: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.max(0, Math.min(255, ((n >> shift) & 255) + delta))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

function camoPalette(hex: string) {
  return [shade(hex, -72), shade(hex, -36), hex, shade(hex, 48), "#3a2a1c", shade(hex, -96), shade(hex, 18), "#1a2214"];
}

function hashId(id: string) {
  let value = 2166136261;
  for (let i = 0; i < id.length; i += 1) value = Math.imul(value ^ id.charCodeAt(i), 16777619);
  return value >>> 0;
}

function noise(seed: number, a: number, b: number) {
  const value = Math.sin(seed * 7e-4 + a * 12.9898 + b * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function stroke(ctx: CanvasRenderingContext2D, width = 3.15) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function ink(ctx: CanvasRenderingContext2D, width = 3.15) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintCamo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  color: string,
  skipBase: boolean,
) {
  const palette = camoPalette(color);
  if (!skipBase) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  }
  for (let i = 0; i < 11; i += 1) {
    ctx.fillStyle = palette[(seed + i) % palette.length]!;
    ctx.beginPath();
    ctx.ellipse(
      x + noise(seed, i, 1) * w,
      y + noise(seed, i, 2) * h,
      Math.max(3, w * (0.16 + noise(seed, i, 3) * 0.28)),
      Math.max(2.4, h * (0.1 + noise(seed, i, 4) * 0.2)),
      noise(seed, i, 5) * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawCape(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, facing: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - facing * 2, y + 2);
  ctx.quadraticCurveTo(x - facing * 22, y + h * 0.45, x - facing * 14, y + h + 10);
  ctx.lineTo(x + facing * 4, y + h * 0.2);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.6);
  ctx.restore();
}

function drawBeanie(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.15, r * 1.02, Math.PI, 0, false);
  ctx.lineTo(x + r * 0.95, y + r * 0.05);
  ctx.lineTo(x - r * 0.95, y + r * 0.05);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.6);
  ctx.fillStyle = shade(color, -40);
  ctx.fillRect(x - r * 0.9, y - r * 0.08, r * 1.8, r * 0.22);
}

function drawMohawk(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.22, y - r * 0.2);
  ctx.lineTo(x - r * 0.08, y - r * 1.55);
  ctx.lineTo(x + r * 0.16, y - r * 0.15);
  ctx.lineTo(x + r * 0.05, y - r * 1.35);
  ctx.lineTo(x + r * 0.28, y - r * 0.1);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.4);
}

function drawVisor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x - r * 0.95, y - r * 0.18, r * 1.9, r * 0.55, r * 0.2);
  ctx.fill();
  stroke(ctx, 2.2);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x - r * 0.55, y - r * 0.05, r * 0.28, 2);
}

function drawBandana(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.82, y + r * 0.48);
  ctx.quadraticCurveTo(x, y + r * 0.32, x + r * 0.82, y + r * 0.48);
  ctx.lineTo(x + r * 0.7, y + r * 1.02);
  ctx.quadraticCurveTo(x, y + r * 1.22, x - r * 0.7, y + r * 1.02);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.6);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x - r * 0.28, y + r * 0.68, r * 0.34, 1.3);
}

function drawGas(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = "#1a1c20";
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 2.4);
  const lens = (lx: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(lx, y + r * 0.02, r * 0.3, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx, 2.2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(lx - r * 0.08, y - r * 0.08, r * 0.08, r * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
  };
  lens(x - r * 0.32);
  lens(x + r * 0.32);
  ctx.fillStyle = "#2a2e34";
  roundRect(ctx, x - r * 0.18, y + r * 0.42, r * 0.36, r * 0.55, 3);
  ctx.fill();
  stroke(ctx, 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.78, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawSwat(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, -r * 0.32, r * 1.08, Math.PI, 0, false);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  paintCamo(ctx, -r * 1.3, -r * 1.25, r * 2.6, r * 1.45, seed, color, false);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -r * 0.32, r * 1.08, Math.PI, 0, false);
  ctx.closePath();
  stroke(ctx, 3.1);
  ctx.restore();
}

function drawEyes(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number) {
  const shift = facing * 1.05;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 4.15 + shift, y + 0.6, 2.25, 0, Math.PI * 2);
  ctx.arc(x + 4.15 + shift, y + 0.6, 2.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawGun(ctx: CanvasRenderingContext2D, x: number, y: number, aim: number, weapon: string, paint: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aim);
  const body = (bx: number, by: number, w: number, h: number, r = 1.6) => {
    ctx.fillStyle = "#f7f7f7";
    roundRect(ctx, bx, by, w, h, r);
    ctx.fill();
    stroke(ctx, 2.15);
  };
  const kind =
    weapon === "longarm" ? "sniper" : weapon === "hopper" ? "cannon" : weapon === "spray" ? "hose" : weapon;
  if (kind === "sniper") {
    body(-2, -2.4, 28, 4.8, 1.4);
    body(6, -6.2, 8, 3.4, 1);
  } else if (kind === "splatter") {
    body(0, -6, 14, 3.6, 1.2);
    body(0, 2.4, 14, 3.6, 1.2);
  } else if (kind === "cannon") {
    body(-1, -6, 16, 12, 4);
    body(12, -3.2, 7, 6.4, 2);
  } else if (kind === "hose") {
    body(0, -2, 12, 4, 2);
    ink(ctx, 2.4);
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.quadraticCurveTo(-4, 8, -8, 6);
    ctx.stroke();
  } else if (kind === "ricochet") {
    ctx.fillStyle = "#f4f4f4";
    ctx.beginPath();
    ctx.arc(6, 0, 6.2, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx, 2.15);
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.arc(6, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    body(0, -3, 14, 6, 1.6);
    body(11, -1.8, 7, 3.6, 1.2);
    body(1, 2.2, 4.5, 5.5, 1.2);
  }
  if (kind !== "ricochet") {
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.arc(kind === "cannon" ? 5 : 6, kind === "splatter" ? -8 : -6.2, kind === "hose" ? 3.1 : 3.6, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx, 2);
  }
  ctx.restore();
}

function dye(figure: Figure, id: string) {
  return figure.dyes[id] ?? SKIN_HEX[id] ?? "#ff3d6e";
}

export function drawDigiFigure(ctx: CanvasRenderingContext2D, figure: Figure, now: number) {
  const cx = figure.x + figure.w / 2;
  const feet = figure.y + 64;
  const worn = new Set(figure.loadout);
  const paint = figure.color;
  if (!figure.alive && figure.respawn > 2.4) {
    ctx.save();
    ctx.translate(cx, feet - 8);
    ctx.rotate(0.4);
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const speed = Math.min(1, Math.abs(figure.vx) / 220);
  const phase = (now / 1000) * 13;
  const swing = figure.grounded ? Math.sin(phase) * 5.5 * speed : figure.vy < 0 ? -2.2 : 1.6;
  const lift = figure.grounded ? Math.abs(Math.sin(phase)) * 1.4 * speed : 0;
  ctx.save();
  if (figure.invuln > 0 && Math.sin(now / 1000 * 28) > 0) ctx.globalAlpha = 0.45;
  if (!figure.alive) ctx.globalAlpha = 0.35;
  ctx.translate(0, lift);
  if (figure.grounded) {
    ctx.fillStyle = "rgba(20, 20, 20, 0.13)";
    ctx.beginPath();
    ctx.ellipse(cx, feet + 1, 12, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const head = { x: cx, y: figure.y + 16 };
  const headR = 13.4;
  const bodyW = 17.5;
  const bodyX = cx - bodyW / 2;
  const bodyY = head.y + headR - 7;
  const hip = bodyY + 30;
  const seed = hashId(String(figure.id));
  const gas = worn.has("gas");
  ink(ctx, 3.35);
  const leg = (offset: number, step: number) => {
    ctx.beginPath();
    ctx.moveTo(cx + offset, hip - 0.5);
    ctx.lineTo(cx + offset + step * 0.85, feet);
    ctx.stroke();
  };
  leg(-4.3, -swing);
  leg(4.3, swing);
  const shoulder = hip - 16.2;
  const handX = cx + figure.facing * (bodyW * 0.42);
  const muzzleX = handX + Math.cos(figure.aim) * 13;
  const muzzleY = shoulder + Math.sin(figure.aim) * 10;
  ctx.beginPath();
  ctx.moveTo(handX, shoulder);
  ctx.lineTo(muzzleX, muzzleY);
  ctx.stroke();
  if (worn.has("cape")) drawCape(ctx, cx, bodyY, 30, figure.facing, dye(figure, "cape"));
  const hoodie = worn.has("hoodie");
  const swat = worn.has("swat");
  ctx.save();
  roundRect(ctx, bodyX, bodyY, bodyW, 30, 1.5);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, 34);
  if (!hoodie && !swat && !gas) {
    ctx.fillStyle = "rgba(170,170,170,0.45)";
    ctx.fillRect(bodyX, bodyY + 30 * 0.78, bodyW, 30 * 0.22);
  }
  if (gas) {
    ctx.fillStyle = dye(figure, "gas");
    ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, 34);
  } else {
    if (hoodie) {
      ctx.fillStyle = dye(figure, "hoodie");
      ctx.fillRect(bodyX - 2, bodyY - 2, bodyW + 4, 34);
    }
    if (swat) paintCamo(ctx, bodyX, bodyY, bodyW, 30, seed, dye(figure, "swat"), hoodie);
  }
  ctx.restore();
  roundRect(ctx, bodyX, bodyY, bodyW, 30, 1.5);
  stroke(ctx, 3.15);
  if (gas) {
    ctx.fillStyle = dye(figure, "gas");
    ctx.beginPath();
    ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx, 3.2);
    drawGas(ctx, head.x, head.y, headR, dye(figure, "gas"));
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx, 3.2);
    if (worn.has("mohawk")) drawMohawk(ctx, head.x, head.y, headR, dye(figure, "mohawk"));
    if (worn.has("beanie")) drawBeanie(ctx, head.x, head.y, headR, dye(figure, "beanie"));
    if (swat) drawSwat(ctx, head.x, head.y, headR, seed, dye(figure, "swat"));
    drawEyes(ctx, head.x, head.y, figure.facing);
    if (worn.has("bandana")) drawBandana(ctx, head.x, head.y, headR, dye(figure, "bandana"));
    if (worn.has("visor")) drawVisor(ctx, head.x, head.y, headR, dye(figure, "visor"));
  }
  drawGun(ctx, muzzleX, muzzleY, figure.aim, figure.weapon, paint);
  ctx.restore();
  if (figure.name) {
    ctx.save();
    ctx.font = "800 13px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.strokeText(figure.name, cx, figure.y - 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(figure.name, cx, figure.y - 16);
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.arc(cx, figure.y - 6, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
