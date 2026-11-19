import * as THREE from "three";

export type HotelHud = {
  coins: number;
  stars: number;
  rooms: number;
  dirty: number;
  waiting: number;
  clerk: boolean;
  maid: boolean;
  cook: boolean;
  note: string;
  done: boolean;
  buildCost: number;
  upgradeCost: number;
};

type Need = "none" | "meal" | "towel";
type Guest = {
  id: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
  phase: "queue" | "walk" | "stay" | "leave";
  room: number;
  patience: number;
  stay: number;
  need: Need;
  served: boolean;
  mesh: THREE.Group;
};
type Room = { built: boolean; dirty: boolean; level: number; cleaning: number };

const KEY = "dw-hotel-v1";
const SLOTS = [
  { x: -3.85, z: 0.15 },
  { x: -3.85, z: 4.05 },
  { x: -3.85, z: 7.95 },
  { x: 3.85, z: 0.15 },
  { x: 3.85, z: 4.05 },
  { x: 3.85, z: 7.95 },
];
const LOOKS = [
  { floor: "#f07ab4", blanket: "#ff4f9a", rug: "#6dffb0" },
  { floor: "#6a78ff", blanket: "#d7b4ff", rug: "#ffe27a" },
  { floor: "#8a5cff", blanket: "#ff7ac8", rug: "#9ef3c8" },
  { floor: "#3ecf8e", blanket: "#6a5cff", rug: "#ffd0ea" },
  { floor: "#ffb703", blanket: "#5b4cdb", rug: "#fff6ea" },
  { floor: "#49b6ff", blanket: "#ff5d8f", rug: "#ffe27a" },
];
const SHIRTS = ["#3d7cff", "#ff8a3d", "#3fbf7a", "#f2c14e", "#ff5d8f", "#7a5cff", "#2ec8e6"];

export function mountHotel(canvas: HTMLCanvasElement, onHud: (hud: HotelHud) => void) {
  const save = load();
  let coins = save.coins;
  let clerk = save.clerk;
  let maid = save.maid;
  let cook = save.cook;
  let note = "Tap a guest to check them in. Tap a dirty room to clean it.";
  let done = save.done;
  const rooms: Room[] = save.rooms;
  const guests: Guest[] = [];
  const history: boolean[] = save.history;
  let nextId = 1;
  let spawn = 1.2;
  let clerkCool = 0;
  let maidCool = 0;
  let roomSig = "";

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#8fd4ff");
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(0.2, 18.5, 7.2);
  camera.lookAt(0, 0, 1.6);
  scene.add(new THREE.HemisphereLight("#fff4d2", "#6aa84f", 0.85));
  const sun = new THREE.DirectionalLight("#fff1c9", 1.35);
  sun.position.set(6, 14, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  scene.add(sun);

  const mat = (color: string) => new THREE.MeshLambertMaterial({ color });
  function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, parent: THREE.Object3D) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), mat("#7ed36a"));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.04;
  lawn.receiveShadow = true;
  scene.add(lawn);
  box(14, 0.08, 18, "#d7dbe3", 0, 0, 1.2, scene);
  box(2.5, 0.04, 14.2, "#5b4cdb", 0, 0.09, 2.4, scene);
  for (let i = 0; i < 12; i += 1) {
    box(2.7, 0.02, 0.28, i % 2 ? "#ffe27a" : "#f6b73c", 0, 0.1, -3.6 + i * 1.15, scene);
  }
  box(2.4, 0.7, 0.7, "#c47a3a", 0, 0.4, -3.5, scene);
  box(0.7, 0.28, 0.45, "#2a3138", -0.4, 0.86, -3.45, scene);
  box(0.35, 0.08, 0.28, "#8fd4ff", -0.4, 1.02, -3.45, scene);
  box(0.45, 0.32, 0.28, "#e23b4a", 0.7, 0.2, -4.6, scene);
  const bell = figure("#e23b4a", "#2a3138", "bell", mat);
  bell.position.set(0, 0, -2.15);
  scene.add(bell);
  const maidMesh = figure("#2a3138", "#f7f7f5", "maid", mat);
  maidMesh.visible = maid;
  scene.add(maidMesh);
  const cookMesh = figure("#fff6ea", "#e23b4a", "cook", mat);
  cookMesh.visible = cook;
  cookMesh.position.set(5.3, 0, -3.2);
  scene.add(cookMesh);
  const clerkMesh = figure("#e23b4a", "#1c2126", "bell", mat);
  clerkMesh.visible = clerk;
  clerkMesh.position.set(0.85, 0, -3.15);
  scene.add(clerkMesh);
  box(1.5, 0.9, 1.2, "#f4f6f8", 5.3, 0.5, -3.2, scene);
  box(1.2, 0.5, 0.7, "#c47a3a", 5.3, 1.15, -3.2, scene);

  const roomGroups: THREE.Group[] = SLOTS.map(() => {
    const group = new THREE.Group();
    scene.add(group);
    return group;
  });
  const roomFloors: THREE.Mesh[] = [];

  function rebuildRooms() {
    const sig = rooms.map((room) => `${room.built}:${room.dirty}:${room.level}`).join("|");
    if (sig === roomSig) return;
    roomSig = sig;
    roomFloors.length = 0;
    SLOTS.forEach((slot, index) => {
      const group = roomGroups[index]!;
      group.clear();
      group.position.set(slot.x, 0, slot.z);
      const room = rooms[index]!;
      const look = LOOKS[index]!;
      const side = slot.x < 0 ? 1 : -1;
      if (!room.built) {
        box(3.15, 0.08, 3.15, "#c4a574", 0, 0.06, 0, group);
        box(0.7, 0.12, 0.12, "#fff6ea", 0, 0.7, 0, group);
        box(0.12, 0.7, 0.12, "#fff6ea", 0, 0.7, 0, group);
        const pad = box(3.15, 0.05, 3.15, "#c4a574", 0, 0.08, 0, group);
        pad.userData = { kind: "room", index };
        roomFloors.push(pad);
        return;
      }
      const floor = box(3.15, 0.08, 3.15, room.dirty ? "#c9856a" : look.floor, 0, 0.06, 0, group);
      floor.userData = { kind: "room", index };
      roomFloors.push(floor);
      const wallH = 0.82;
      box(3.2, wallH, 0.1, "#fff4ea", 0, wallH / 2, 1.55, group);
      box(3.2, wallH, 0.1, "#fff4ea", 0, wallH / 2, -1.55, group);
      box(0.1, wallH, 3.2, "#ffe27a", -side * 1.55, wallH / 2, 0, group);
      box(0.1, wallH, 0.95, "#fff4ea", side * 1.55, wallH / 2, -1.05, group);
      box(0.1, wallH, 0.95, "#fff4ea", side * 1.55, wallH / 2, 1.05, group);
      box(0.55, 0.45, 0.08, "#9fd8ff", -side * 1.52, 0.55, 0.35, group);
      box(1.35, 0.28, 0.7, "#c47a3a", -side * 0.7, 0.28, -0.55, group);
      box(1.2, 0.16, 0.62, room.dirty ? "#e7d3c4" : look.blanket, -side * 0.7, 0.46, -0.55, group);
      box(0.38, 0.14, 0.28, "#fffaf3", -side * 0.25, 0.56, -0.55, group);
      box(0.38, 0.42, 0.38, "#8b5a32", -side * 1.15, 0.28, 0.85, group);
      box(0.12, 0.28, 0.12, "#f2c14e", -side * 1.15, 0.62, 0.85, group);
      box(0.28, 0.16, 0.28, "#fff6ea", -side * 1.15, 0.78, 0.85, group);
      if (room.level >= 2) box(1.3, 0.03, 0.9, look.rug, side * 0.35, 0.12, 0.35, group);
      if (room.level >= 3) {
        box(0.7, 0.4, 0.06, "#1c2126", -side * 0.2, 0.7, -1.42, group);
        box(0.55, 0.28, 0.02, "#7ecbff", -side * 0.2, 0.72, -1.38, group);
      }
      if (index % 2 === 0) {
        box(1.15, 0.02, 1.05, "#8fd4ff", side * 0.85, 0.11, -0.95, group);
        box(0.28, 0.32, 0.36, "#f7f7f5", side * 0.85, 0.28, -1.15, group);
        box(0.32, 0.08, 0.32, "#f2c14e", side * 0.85, 0.46, -1.05, group);
      }
      if (room.dirty) {
        box(0.35, 0.2, 0.35, "#6b8f4e", 0.45, 0.2, 0.7, group);
        box(0.28, 0.16, 0.28, "#8b5a32", -0.2, 0.16, 0.85, group);
      }
    });
  }

  function takeRoom(guest: Guest) {
    const index = rooms.findIndex((room, i) => room.built && !room.dirty && !guests.some((other) => other.room === i && other.phase !== "leave"));
    if (index < 0) return false;
    const slot = SLOTS[index]!;
    guest.phase = "walk";
    guest.room = index;
    guest.tx = slot.x + (slot.x < 0 ? 0.35 : -0.35);
    guest.tz = slot.z + 0.15;
    guest.need = "none";
    return true;
  }

  function finish(guest: Guest, happy: boolean) {
    guest.phase = "leave";
    guest.tx = 0;
    guest.tz = -8;
    history.push(happy);
    if (history.length > 12) history.shift();
    if (guest.room >= 0) rooms[guest.room]!.dirty = true;
    if (!happy) note = "A guest left unhappy.";
  }

  function serve(guest: Guest) {
    if (guest.need === "none") return;
    guest.served = true;
    guest.need = "none";
    coins += 8;
    note = "Need handled. They left a tip.";
    hud();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onPointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(scene.children, true).find((item) => item.object.userData.kind);
    if (!hit) return;
    const data = hit.object.userData as { kind: string; id?: number; index?: number };
    if (data.kind === "guest") {
      const guest = guests.find((entry) => entry.id === data.id);
      if (!guest) return;
      if (guest.phase === "queue") {
        if (!takeRoom(guest)) note = "No clean rooms. Clean one or build another.";
        else note = "Checked in.";
      } else if (guest.need !== "none") serve(guest);
      hud();
      return;
    }
    if (data.kind === "room" && data.index !== undefined) {
      const room = rooms[data.index];
      if (!room) return;
      if (!room.built) {
        build();
        return;
      }
      if (room.dirty && room.cleaning <= 0) {
        room.cleaning = 0.01;
        const slot = SLOTS[data.index]!;
        bell.userData.tx = slot.x + (slot.x < 0 ? 1.7 : -1.7);
        bell.userData.tz = slot.z;
        note = "Cleaning.";
        hud();
      }
    }
  }

  function build() {
    const index = rooms.findIndex((room) => !room.built);
    if (index < 0) {
      note = "The hotel is full size.";
      hud();
      return;
    }
    const cost = 40 + rooms.filter((room) => room.built).length * 30;
    if (coins < cost) {
      note = `A new room costs ${cost}.`;
      hud();
      return;
    }
    coins -= cost;
    rooms[index] = { built: true, dirty: false, level: 1, cleaning: 0 };
    note = "New room ready.";
    hud();
  }

  function hire(role: "clerk" | "maid" | "cook") {
    const price = role === "clerk" ? 80 : role === "maid" ? 90 : 70;
    const owned = role === "clerk" ? clerk : role === "maid" ? maid : cook;
    if (owned) return;
    if (coins < price) {
      note = `${role[0]!.toUpperCase()}${role.slice(1)} costs ${price}.`;
      hud();
      return;
    }
    coins -= price;
    if (role === "clerk") clerk = true;
    if (role === "maid") maid = true;
    if (role === "cook") cook = true;
    clerkMesh.visible = clerk;
    maidMesh.visible = maid;
    cookMesh.visible = cook;
    note = role === "clerk" ? "The clerk watches the desk." : role === "maid" ? "The maid grabs a cart." : "The cook covers room service.";
    hud();
  }

  function upgrade() {
    const room = rooms.find((entry) => entry.built && entry.level < 3);
    if (!room) {
      note = "Every room is already plush.";
      hud();
      return;
    }
    if (coins < 45) {
      note = "An upgrade costs 45.";
      hud();
      return;
    }
    coins -= 45;
    room.level += 1;
    note = room.level === 2 ? "Better beds." : "Suite linens.";
    hud();
  }

  function hud() {
    const built = rooms.filter((room) => room.built);
    const ratio = history.length ? history.filter(Boolean).length / history.length : 0.6;
    const stars = history.length < 3 ? 3 : Math.max(1, Math.min(5, Math.round(1 + ratio * 4)));
    if (!done && stars >= 5 && coins >= 500 && built.length >= 6) {
      done = true;
      note = "Happy Hotel. Guests keep coming.";
    }
    onHud({
      coins,
      stars,
      rooms: built.length,
      dirty: built.filter((room) => room.dirty).length,
      waiting: guests.filter((guest) => guest.phase === "queue").length,
      clerk,
      maid,
      cook,
      note,
      done,
      buildCost: 40 + built.length * 30,
      upgradeCost: 45,
    });
  }

  bell.userData.tx = 0;
  bell.userData.tz = -2.15;
  let raf = 0;
  let last = performance.now();
  let saveTimer = 0;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 6.2;
      if (guests.filter((guest) => guest.phase !== "leave").length < 8) {
        const mesh = figure(SHIRTS[nextId % SHIRTS.length]!, "#24324a", "guest", mat);
        mesh.traverse((child) => {
          child.userData = { kind: "guest", id: nextId };
        });
        scene.add(mesh);
        guests.push({
          id: nextId,
          x: 0,
          z: -7.6,
          tx: 0,
          tz: -4.6,
          phase: "queue",
          room: -1,
          patience: 16,
          stay: 11,
          need: "none",
          served: false,
          mesh,
        });
        nextId += 1;
      }
    }
    clerkCool -= dt;
    maidCool -= dt;
    if (clerk && clerkCool <= 0) {
      const waiting = guests.find((guest) => guest.phase === "queue");
      if (waiting && takeRoom(waiting)) clerkCool = 1.5;
    }
    if (maid && maidCool <= 0) {
      const dirtyIndex = rooms.findIndex((room) => room.built && room.dirty && room.cleaning <= 0);
      if (dirtyIndex >= 0) {
        rooms[dirtyIndex]!.cleaning = 0.01;
        const slot = SLOTS[dirtyIndex]!;
        maidMesh.userData.tx = slot.x + (slot.x < 0 ? 1.7 : -1.7);
        maidMesh.userData.tz = slot.z;
        maidCool = 1.7;
      }
    }
    let cleaned = false;
    for (const room of rooms) {
      if (room.cleaning <= 0) continue;
      room.cleaning += dt * (maid ? 0.85 : 0.7);
      if (room.cleaning >= 1) {
        room.cleaning = 0;
        room.dirty = false;
        cleaned = true;
      }
    }
    if (cleaned) roomSig = "";
    for (const guest of guests) {
      const step = 2.4 * dt;
      const dx = guest.tx - guest.x;
      const dz = guest.tz - guest.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.08) {
        guest.x += (dx / dist) * Math.min(step, dist);
        guest.z += (dz / dist) * Math.min(step, dist);
        guest.mesh.rotation.y = Math.atan2(dx, dz);
      } else if (guest.phase === "walk") {
        guest.phase = "stay";
        guest.stay = 9 + rooms[guest.room]!.level;
        coins += 16 + rooms[guest.room]!.level * 12;
        note = `Room ${guest.room + 1} paid ${16 + rooms[guest.room]!.level * 12}.`;
        hud();
      } else if (guest.phase === "leave" && dist <= 0.08) guest.patience = -2;
      if (guest.phase === "queue") {
        guest.patience -= dt;
        if (guest.patience <= 0) finish(guest, false);
      }
      if (guest.phase === "stay") {
        guest.stay -= dt;
        if (guest.need === "none" && !guest.served && guest.stay < 6 && guest.stay > 5.75) guest.need = Math.random() < 0.5 ? "meal" : "towel";
        if (guest.need === "meal" && cook) serve(guest);
        if (guest.stay <= 0) finish(guest, guest.need === "none");
      }
      guest.mesh.position.set(guest.x, 0, guest.z);
      const meal = guest.mesh.getObjectByName("meal");
      const towel = guest.mesh.getObjectByName("towel");
      const bar = guest.mesh.getObjectByName("bar");
      if (meal) meal.visible = guest.need === "meal";
      if (towel) towel.visible = guest.need === "towel";
      if (bar) {
        bar.visible = guest.phase === "queue";
        bar.scale.x = Math.max(0.05, guest.patience / 16);
      }
    }
    let line = 0;
    for (const guest of guests) {
      if (guest.phase !== "queue") continue;
      guest.tx = line % 2 === 0 ? -0.55 : 0.55;
      guest.tz = -4.5 - Math.floor(line / 2) * 0.7;
      line += 1;
    }
    for (let i = guests.length - 1; i >= 0; i -= 1) {
      if (guests[i]!.patience < -1) {
        scene.remove(guests[i]!.mesh);
        guests.splice(i, 1);
      }
    }
    stepActor(bell, dt);
    if (maid) stepActor(maidMesh, dt);
    rebuildRooms();
    renderer.render(scene, camera);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, clerk, maid, cook, done, rooms, history }));
    }
    raf = requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", onPointer);
  rebuildRooms();
  hud();
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointer);
      renderer.dispose();
    },
    build,
    hire,
    upgrade,
  };
}

function stepActor(actor: THREE.Group, dt: number) {
  const tx = Number(actor.userData.tx ?? actor.position.x);
  const tz = Number(actor.userData.tz ?? actor.position.z);
  const dx = tx - actor.position.x;
  const dz = tz - actor.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) return;
  const step = Math.min(dist, 2.6 * dt);
  actor.position.x += (dx / dist) * step;
  actor.position.z += (dz / dist) * step;
  actor.rotation.y = Math.atan2(dx, dz);
}

function figure(shirt: string, pants: string, kind: "guest" | "bell" | "maid" | "cook", mat: (color: string) => THREE.MeshLambertMaterial) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.24), mat(kind === "maid" ? "#f7f7f5" : shirt));
  body.position.y = 0.58;
  body.castShadow = true;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.2), mat(kind === "maid" ? "#2a3138" : pants));
  legs.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat("#ffd2a8"));
  head.position.y = 1.02;
  head.castShadow = true;
  group.add(body, legs, head);
  if (kind === "bell") {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 10), mat("#e23b4a"));
    hat.position.y = 1.24;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 10), mat("#f2c14e"));
    band.position.y = 1.18;
    group.add(hat, band);
  }
  if (kind === "cook") {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.22, 10), mat("#fffaf3"));
    hat.position.y = 1.26;
    group.add(hat);
  }
  const meal = new THREE.Group();
  meal.name = "meal";
  meal.position.set(0.28, 1.35, 0);
  meal.visible = false;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 10), mat("#fffaf3"));
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat("#e25b4a"));
  food.position.y = 0.08;
  meal.add(plate, food);
  const towel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.16), mat("#f7f7f5"));
  towel.name = "towel";
  towel.position.set(0.28, 1.35, 0);
  towel.visible = false;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.06), mat("#2ec8e6"));
  bar.name = "bar";
  bar.position.y = 1.4;
  bar.visible = false;
  group.add(meal, towel, bar);
  return group;
}

function load() {
  const rooms: Room[] = SLOTS.map((_, index) => ({ built: index < 2, dirty: index === 1, level: 1, cleaning: 0 }));
  const base = { coins: 60, clerk: false, maid: false, cook: false, done: false, rooms, history: [] as boolean[] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<typeof base>;
    return {
      ...base,
      ...saved,
      rooms: saved.rooms?.length === SLOTS.length ? saved.rooms : base.rooms,
      history: saved.history ?? [],
    };
  } catch {
    return base;
  }
}
