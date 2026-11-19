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
  cleaning: number;
  prompt: string;
};

type Need = "none" | "meal" | "towel" | "coffee";
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
  waypoints: { x: number; z: number }[];
  ask: number;
};
type Room = { built: boolean; dirty: boolean; level: number; cleaning: number };

const KEY = "dw-hotel-v2";
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
  let note = "WASD to walk. Stand in a dirty room and press Space.";
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
  scene.background = new THREE.Color("#f6e2c4");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 11, 5.2);
  camera.lookAt(0, 0, -2);
  scene.add(new THREE.HemisphereLight("#fff6e4", "#8a9a62", 0.95));
  const sun = new THREE.DirectionalLight("#ffe0b0", 1.15);
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

  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), mat("#6ea84a"));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.04;
  lawn.receiveShadow = true;
  scene.add(lawn);
  box(12.4, 0.08, 15.2, "#e8d2a4", 0, 0.02, 1.7, scene);
  box(2.05, 0.04, 12.6, "#6a46c4", 0, 0.09, 1.7, scene);
  box(12.7, 0.18, 0.28, "#5a3824", 0, 1.32, 9.9, scene);
  box(0.28, 1.25, 16.1, "#5a3824", -6.7, 1.2, 1.7, scene);
  box(0.28, 1.25, 16.1, "#5a3824", 6.7, 1.2, 1.7, scene);
  box(3.4, 0.85, 0.9, "#c4894a", 0, 0.48, -3.5, scene);
  box(1.2, 0.32, 0.08, "#f7f1e6", 0, 1.08, -3.12, scene);
  box(0.55, 0.22, 0.08, "#2a3138", -0.7, 0.98, -3.08, scene);
  const machine = new THREE.Group();
  machine.position.set(2.15, 0, -3.45);
  box(0.72, 1.05, 0.48, "#1a1d22", 0, 0.58, 0, machine);
  box(0.46, 0.62, 0.06, "#d7dbe3", 0, 0.62, 0.24, machine);
  box(0.18, 0.28, 0.12, "#49b6ff", 0.18, 1.05, 0, machine);
  box(0.22, 0.08, 0.22, "#fffaf3", -0.12, 0.42, 0.28, machine);
  box(0.1, 0.08, 0.04, "#3ecf8e", -0.16, 0.78, 0.28, machine);
  box(0.1, 0.08, 0.04, "#e25b4a", 0, 0.78, 0.28, machine);
  scene.add(machine);
  const closet = new THREE.Group();
  closet.position.set(-2.2, 0, -3.4);
  box(0.7, 1.15, 0.42, "#c47a3a", 0, 0.62, 0, closet);
  box(0.5, 0.7, 0.06, "#f7f7f5", 0, 0.7, 0.2, closet);
  box(0.42, 0.08, 0.08, "#fffaf3", 0, 0.95, 0.22, closet);
  box(0.42, 0.08, 0.08, "#e7e2d8", 0, 0.78, 0.22, closet);
  box(0.42, 0.08, 0.08, "#fffaf3", 0, 0.61, 0.22, closet);
  scene.add(closet);
  const wallH = 1.35;
  box(0.28, wallH, 16.7, "#fff4ea", -6.7, wallH / 2, 1.7, scene);
  box(0.28, wallH, 16.7, "#fff4ea", 6.7, wallH / 2, 1.7, scene);
  box(13.9, wallH, 0.28, "#fff4ea", 0, wallH / 2, 9.9, scene);
  box(5.5, wallH, 0.28, "#fff4ea", -3.9, wallH / 2, -6.45, scene);
  box(5.5, wallH, 0.28, "#fff4ea", 3.9, wallH / 2, -6.45, scene);
  box(0.22, wallH, 0.28, "#c47a3a", -1.15, wallH / 2, -6.45, scene);
  box(0.22, wallH, 0.28, "#c47a3a", 1.15, wallH / 2, -6.45, scene);
  const bell = figure("#e23b4a", "#2a3138", "bell", mat);
  bell.position.set(0, 0, -2.15);
  scene.add(bell);
  const cleanBar = new THREE.Group();
  scene.add(cleanBar);
  const cleanBack = box(0.82, 0.1, 0.05, "#1c2126", 0, 1.7, 0, cleanBar);
  const cleanFill = box(0.74, 0.06, 0.05, "#3ecf8e", 0, 1.7, 0.04, cleanBar);
  cleanBack.visible = false;
  cleanFill.visible = false;
  const maidMesh = figure("#2a3138", "#f7f7f5", "maid", mat);
  maidMesh.visible = maid;
  scene.add(maidMesh);
  const cookMesh = figure("#fff6ea", "#e23b4a", "cook", mat);
  cookMesh.visible = cook;
  cookMesh.position.set(2.9, 0, -2.5);
  scene.add(cookMesh);
  const clerkMesh = figure("#e23b4a", "#1c2126", "bell", mat);
  clerkMesh.visible = clerk;
  clerkMesh.position.set(0.85, 0, -3.15);
  scene.add(clerkMesh);
  const heldCup = box(0.14, 0.16, 0.14, "#6b3a22", 0.28, 0.72, 0.16, bell);
  const heldTowel = box(0.22, 0.08, 0.16, "#f7f7f5", 0.28, 0.7, 0.16, bell);
  heldCup.visible = false;
  heldTowel.visible = false;

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
        box(2.7, 0.08, 2.7, "#c4a574", 0, 0.06, 0, group);
        box(0.55, 0.1, 0.1, "#fff6ea", 0, 0.55, 0, group);
        box(0.1, 0.55, 0.1, "#fff6ea", 0, 0.55, 0, group);
        const pad = box(2.7, 0.05, 2.7, "#c4a574", 0, 0.08, 0, group);
        pad.userData = { kind: "room", index };
        roomFloors.push(pad);
        return;
      }
      const floor = box(2.7, 0.08, 2.7, room.dirty ? "#c9856a" : look.floor, 0, 0.06, 0, group);
      floor.userData = { kind: "room", index };
      roomFloors.push(floor);
      const wallH = 0.9;
      box(3.15, wallH, 0.16, "#f4efe6", 0, wallH / 2, 1.42, group);
      box(3.15, wallH, 0.16, "#f4efe6", 0, wallH / 2, -1.42, group);
      box(0.16, wallH, 3.0, "#6b4328", -side * 1.42, wallH / 2, 0, group);
      box(0.16, wallH, 0.95, "#f4efe6", side * 1.42, wallH / 2, -0.95, group);
      box(0.16, wallH, 0.95, "#f4efe6", side * 1.42, wallH / 2, 0.95, group);
      box(0.36, 0.28, 0.05, "#9fd8ff", -side * 1.28, 0.52, 0.1, group);
      box(0.95, 0.2, 0.5, "#8b5a32", -side * 0.35, 0.18, -0.28, group);
      box(0.82, 0.1, 0.4, room.dirty ? "#e7d3c4" : look.blanket, -side * 0.35, 0.3, -0.28, group);
      box(0.24, 0.08, 0.18, "#fffaf3", -side * 0.12, 0.38, -0.28, group);
      box(0.26, 0.28, 0.26, "#6b4328", -side * 0.85, 0.18, 0.35, group);
      box(0.06, 0.16, 0.06, "#f2c14e", -side * 0.85, 0.38, 0.35, group);
      if (room.level >= 2) {
        const rug = box(0.7, 0.04, 0.48, look.rug, side * 0.15, 0.12, 0.15, group);
        rug.castShadow = false;
        rug.receiveShadow = false;
      }
      if (room.level >= 3) box(0.42, 0.24, 0.04, "#1c2126", -side * 0.1, 0.55, -1.2, group);
      if (index % 2 === 0) {
        box(0.62, 0.02, 0.5, "#d7e7ea", side * 0.55, 0.1, -0.55, group);
        box(0.18, 0.2, 0.2, "#f7f7f5", side * 0.55, 0.18, -0.7, group);
      }
      if (room.dirty) box(0.22, 0.12, 0.22, "#6b8f4e", 0.15, 0.14, 0.35, group);
    });
  }

  function takeRoom(guest: Guest) {
    const index = rooms.findIndex((room, i) => room.built && !room.dirty && !guests.some((other) => other.room === i && other.phase !== "leave"));
    if (index < 0) return false;
    const slot = SLOTS[index]!;
    guest.phase = "walk";
    guest.room = index;
    guest.need = "none";
    guest.served = false;
    guest.ask = 12 + Math.random() * 16;
    const door = doorAt(index);
    guest.waypoints = [
      { x: 1.9, z: -4.7 },
      { x: 1.9, z: slot.z },
      { x: door.x, z: door.z },
    ];
    guest.tx = slot.x + (slot.x < 0 ? 0.2 : -0.2);
    guest.tz = slot.z;
    return true;
  }

  function finish(guest: Guest, happy: boolean) {
    guest.phase = "leave";
    const slot = guest.room >= 0 ? SLOTS[guest.room] : null;
    const door = guest.room >= 0 ? doorAt(guest.room) : { x: 0, z: -4 };
    guest.waypoints = slot
      ? [
          { x: door.x, z: door.z },
          { x: 1.9, z: slot.z },
          { x: 1.9, z: -5.2 },
          { x: 0, z: -7.8 },
        ]
      : [{ x: 0, z: -7.8 }];
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
      if (guest.phase === "queue") note = "Give them a room from the desk.";
      else if (guest.need !== "none") note = "Press Space when you are holding what they asked for.";
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
      if (room.dirty && room.cleaning <= 0) note = "Walk in and press Space to clean.";
      hud();
      return;
    }
  }

  function build() {
    const index = rooms.findIndex((room) => !room.built);
    if (index < 0) {
      note = "The hotel is full size.";
      hud();
      return;
    }
    const cost = 120 + rooms.filter((room) => room.built).length * 90;
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
    const price = role === "clerk" ? 280 : role === "maid" ? 320 : 240;
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
    if (coins < 110) {
      note = "An upgrade costs 110.";
      hud();
      return;
    }
    coins -= 110;
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
    const key = `${coins}|${stars}|${built.length}|${note}|${playerClean}|${Math.round((playerClean >= 0 ? rooms[playerClean]!.cleaning : 0) * 40)}|${holding}|${spacePrompt()}`;
    if (key === hudKey) return;
    hudKey = key;
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
      buildCost: 120 + built.length * 90,
      upgradeCost: 110,
      cleaning: playerClean >= 0 ? rooms[playerClean]!.cleaning : 0,
      prompt: spacePrompt(),
    });
  }

  bell.userData.tx = 0;
  bell.userData.tz = -2.15;
  let playerClean = -1;
  let holding: "none" | "coffee" | "towel" = "none";
  let hudKey = "";
  const keys = new Set<string>();
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
      spawn = 18;
      if (guests.filter((guest) => guest.phase !== "leave").length < 4) {
        const mesh = figure(SHIRTS[nextId % SHIRTS.length]!, "#24324a", "guest", mat);
        mesh.traverse((child) => {
          child.userData = { kind: "guest", id: nextId };
        });
        scene.add(mesh);
        guests.push({
          id: nextId,
          x: 0,
          z: -7.8,
          tx: 0,
          tz: -4.6,
          phase: "queue",
          room: -1,
          patience: 48,
          stay: 36,
          need: "none",
          served: false,
          waypoints: [],
          ask: 99,
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
    if (maid && maidCool <= 0 && playerClean < 0) {
      const dirtyIndex = rooms.findIndex((room) => room.built && room.dirty && room.cleaning <= 0);
      if (dirtyIndex >= 0) {
        const spot = doorAt(dirtyIndex);
        maidMesh.userData.tx = spot.x;
        maidMesh.userData.tz = spot.z;
        if (Math.hypot(maidMesh.position.x - spot.x, maidMesh.position.z - spot.z) < 0.8) {
          rooms[dirtyIndex]!.cleaning = 0.01;
          maidCool = 2.4;
        }
      }
    }
    const forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const speed = 2.6;
    const nx = bell.position.x + strafe * speed * dt;
    const nz = bell.position.z - forward * speed * dt;
    if (!blocked(nx, bell.position.z)) bell.position.x = nx;
    if (!blocked(bell.position.x, nz)) bell.position.z = nz;
    if (strafe || forward) bell.rotation.y = Math.atan2(strafe, -forward);
    if (playerClean >= 0) {
      const spot = doorAt(playerClean);
      const room = rooms[playerClean]!;
      if (Math.hypot(bell.position.x - spot.x, bell.position.z - spot.z) > 1.45 || !room.dirty) {
        room.cleaning = 0;
        playerClean = -1;
        note = "Step back into the room and press Space.";
      } else {
        room.cleaning += dt / (3.25 + room.level * 0.9);
        if (room.cleaning >= 1) {
          room.cleaning = 0;
          room.dirty = false;
          playerClean = -1;
          roomSig = "";
          note = "Room cleaned.";
        }
      }
    }
    cleanBar.position.set(bell.position.x, 0, bell.position.z);
    cleanBar.rotation.y = Math.atan2(camera.position.x - bell.position.x, camera.position.z - bell.position.z);
    cleanBack.visible = playerClean >= 0;
    cleanFill.visible = playerClean >= 0;
    if (playerClean >= 0) {
      const amount = Math.max(0.04, rooms[playerClean]!.cleaning);
      cleanFill.scale.x = amount;
      cleanFill.position.x = (amount - 1) * 0.37;
      hud();
    }
    let cleaned = false;
    for (const room of rooms) {
      if (room.cleaning <= 0 || rooms.indexOf(room) === playerClean) continue;
      room.cleaning += dt / 3.75;
      if (room.cleaning >= 1) {
        room.cleaning = 0;
        room.dirty = false;
        cleaned = true;
      }
    }
    if (cleaned) roomSig = "";
    for (const guest of guests) {
      const goal = guest.waypoints[0] ?? { x: guest.tx, z: guest.tz };
      const dx = goal.x - guest.x;
      const dz = goal.z - guest.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.08) {
        const stepLen = Math.min(1.35 * dt, dist);
        const nx = guest.x + (dx / dist) * stepLen;
        const nz = guest.z + (dz / dist) * stepLen;
        const ox = guest.x;
        const oz = guest.z;
        if (!guestSolid(nx, guest.z)) guest.x = nx;
        if (!guestSolid(guest.x, nz)) guest.z = nz;
        if (Math.hypot(guest.x - ox, guest.z - oz) < 0.001 && dist > 0.45 && guest.waypoints.length) guest.waypoints.shift();
        guest.mesh.rotation.y = Math.atan2(dx, dz);
      } else if (guest.waypoints.length) {
        guest.waypoints.shift();
      } else if (guest.phase === "walk") {
        guest.phase = "stay";
        guest.stay = 34 + rooms[guest.room]!.level * 8;
        const pay = 7 + rooms[guest.room]!.level * 4;
        coins += pay;
        note = `Room ${guest.room + 1} paid ${pay}.`;
        hud();
      } else if (guest.phase === "leave" && dist <= 0.08) guest.patience = -2;
      else if (guest.phase === "queue") guest.mesh.rotation.y = 0;
      if (guest.phase === "queue") {
        guest.patience -= dt;
        if (guest.patience <= 0) finish(guest, false);
      }
      if (guest.phase === "stay") {
        guest.stay -= dt;
        if (guest.need === "none" && !guest.served && guest.stay < guest.ask) {
          guest.need = Math.random() < 0.55 ? "coffee" : "towel";
        }
        if (guest.need === "meal" && cook) serve(guest);
        if (guest.stay <= 0) finish(guest, guest.need === "none");
      }
      guest.mesh.position.set(guest.x, 0, guest.z);
      const meal = guest.mesh.getObjectByName("meal");
      const towel = guest.mesh.getObjectByName("towel");
      const bar = guest.mesh.getObjectByName("bar");
      const coffee = guest.mesh.getObjectByName("coffee");
      if (meal) meal.visible = guest.need === "meal";
      if (towel) towel.visible = guest.need === "towel";
      if (coffee) coffee.visible = guest.need === "coffee";
      if (bar) {
        bar.visible = guest.phase === "queue";
        bar.scale.x = Math.max(0.05, guest.patience / 48);
      }
    }
    let line = 0;
    for (const guest of guests) {
      if (guest.phase !== "queue") continue;
      guest.tx = 0;
      guest.tz = -4.55 - line * 0.72;
      line += 1;
    }
    for (let i = guests.length - 1; i >= 0; i -= 1) {
      if (guests[i]!.patience < -1) {
        scene.remove(guests[i]!.mesh);
        guests.splice(i, 1);
      }
    }
    if (maid) stepActor(maidMesh, dt);
    const look = bell.position;
    camera.position.lerp(new THREE.Vector3(look.x, 6.2, look.z + 5.8), 0.12);
    camera.lookAt(look.x, 0.7, look.z);
    heldCup.visible = holding === "coffee";
    heldTowel.visible = holding === "towel";
    rebuildRooms();
    hud();
    renderer.render(scene, camera);
    saveTimer += dt;
    if (saveTimer > 2) {
      saveTimer = 0;
      localStorage.setItem(KEY, JSON.stringify({ coins, clerk, maid, cook, done, rooms, history }));
    }
    raf = requestAnimationFrame(frame);
  }

  function guestSolid(px: number, pz: number) {
    if (walled(px, pz, rooms)) return true;
    if (hitBox(px, pz, 0, -3.5, 1.75, 0.55)) return true;
    if (hitBox(px, pz, 2.15, -3.45, 0.4, 0.3)) return true;
    if (hitBox(px, pz, -2.2, -3.4, 0.4, 0.28)) return true;
    for (let index = 0; index < SLOTS.length; index += 1) {
      const room = rooms[index];
      const slot = SLOTS[index]!;
      if (!room?.built) continue;
      const side = slot.x < 0 ? 1 : -1;
      if (hitBox(px, pz, slot.x - side * 0.35, slot.z - 0.28, 0.48, 0.28)) return true;
      if (hitBox(px, pz, slot.x - side * 0.85, slot.z + 0.35, 0.18, 0.18)) return true;
    }
    return false;
  }

  function blocked(px: number, pz: number) {
    if (walled(px, pz, rooms)) return true;
    if (hitBox(px, pz, 0, -3.5, 1.45, 0.55)) return true;
    if (hitBox(px, pz, 2.15, -3.45, 0.45, 0.35)) return true;
    if (hitBox(px, pz, -2.2, -3.4, 0.45, 0.32)) return true;
    for (let index = 0; index < SLOTS.length; index += 1) {
      const room = rooms[index];
      const slot = SLOTS[index]!;
      if (!room?.built) continue;
      const side = slot.x < 0 ? 1 : -1;
      if (hitBox(px, pz, slot.x - side * 0.35, slot.z - 0.28, 0.48, 0.28)) return true;
      if (hitBox(px, pz, slot.x - side * 0.85, slot.z + 0.35, 0.18, 0.18)) return true;
    }
    for (const guest of guests) {
      if (Math.hypot(px - guest.x, pz - guest.z) < 0.52) return true;
    }
    const staff = [clerk ? clerkMesh : null, maid ? maidMesh : null, cook ? cookMesh : null];
    return staff.some((actor) => actor && Math.hypot(px - actor.position.x, pz - actor.position.z) < 0.5);
  }

  function onKey(event: KeyboardEvent) {
    if (event.code === "Space") event.preventDefault();
    if (event.type === "keydown") keys.add(event.code);
    else keys.delete(event.code);
    if (event.type === "keydown" && event.code === "Space") pressF();
  }

  function nearMachine() {
    return Math.hypot(bell.position.x - 2.15, bell.position.z + 3.45) < 1.35;
  }

  function nearCloset() {
    return Math.hypot(bell.position.x + 2.2, bell.position.z + 3.4) < 1.35;
  }

  function nearDesk() {
    return Math.hypot(bell.position.x, bell.position.z + 2.35) < 1.45;
  }

  function frontGuest() {
    return guests.find((entry) => entry.phase === "queue");
  }

  function stoodIn() {
    let found = -1;
    SLOTS.forEach((slot, index) => {
      if (Math.abs(bell.position.x - slot.x) < 1.35 && Math.abs(bell.position.z - slot.z) < 1.35) found = index;
    });
    return found;
  }

  function roomPrice() {
    return 120 + rooms.filter((room) => room.built).length * 90;
  }

  function spacePrompt() {
    if (playerClean >= 0) return "";
    const guest = [...guests].reverse().find((entry) => entry.phase !== "queue" && Math.hypot(entry.x - bell.position.x, entry.z - bell.position.z) < 1.25);
    if (guest?.need === "coffee" && holding === "coffee") return "Click Space to give coffee";
    if (guest?.need === "towel" && holding === "towel") return "Click Space to give a towel";
    if (guest?.need === "coffee" || guest?.need === "towel") return "";
    if (guest?.need === "meal") return "Click Space to give a meal";
    if (nearDesk() && frontGuest()) return "Click Space to give a room";
    if (nearMachine() && holding !== "coffee") return "Click Space to pour coffee";
    if (nearCloset() && holding !== "towel") return "Click Space to take a towel";
    const here = stoodIn();
    if (here >= 0 && !rooms[here]!.built) return `Pay ${roomPrice()} to buy the rooms`;
    if (here >= 0 && rooms[here]!.built && !rooms[here]!.dirty && rooms[here]!.level < 3 && !guest) return `Pay 110 to upgrade the room`;
    const dirty = rooms.some((room, index) => room.built && room.dirty && Math.hypot(bell.position.x - doorAt(index).x, bell.position.z - doorAt(index).z) < 1.45);
    if (dirty) return "Click Space to clean";
    return "";
  }

  function pressF() {
    const guest = [...guests].reverse().find((entry) => entry.phase !== "queue" && Math.hypot(entry.x - bell.position.x, entry.z - bell.position.z) < 1.25);
    if (guest?.need === "coffee") {
      if (holding !== "coffee") note = "Get coffee from the machine.";
      else {
        serve(guest);
        holding = "none";
        note = "Coffee delivered.";
      }
      hud();
      return;
    }
    if (guest?.need === "towel") {
      if (holding !== "towel") note = "Get a towel from the cupboard.";
      else {
        serve(guest);
        holding = "none";
        note = "Towel delivered.";
      }
      hud();
      return;
    }
    if (guest?.need === "meal") {
      serve(guest);
      hud();
      return;
    }
    if (nearDesk()) {
      const waiting = frontGuest();
      if (!waiting) note = "Nobody is in line.";
      else if (!takeRoom(waiting)) note = "No clean rooms.";
      else note = "Room given.";
      hud();
      return;
    }
    if (nearMachine()) {
      holding = "coffee";
      note = "You are holding coffee.";
      hud();
      return;
    }
    if (nearCloset()) {
      holding = "towel";
      note = "You are holding a towel.";
      hud();
      return;
    }
    const here = stoodIn();
    if (here >= 0 && !rooms[here]!.built) {
      const cost = roomPrice();
      if (coins < cost) note = `A new room costs ${cost}.`;
      else {
        coins -= cost;
        rooms[here] = { built: true, dirty: false, level: 1, cleaning: 0 };
        note = "New room ready.";
      }
      hud();
      return;
    }
    if (here >= 0 && rooms[here]!.built && !rooms[here]!.dirty && rooms[here]!.level < 3) {
      if (coins < 110) note = "An upgrade costs 110.";
      else {
        coins -= 110;
        rooms[here]!.level += 1;
        note = rooms[here]!.level === 2 ? "Better beds." : "Suite linens.";
      }
      hud();
      return;
    }
    let best = 1.45;
    let index = -1;
    rooms.forEach((room, i) => {
      if (!room.built || !room.dirty) return;
      const spot = doorAt(i);
      const dist = Math.hypot(bell.position.x - spot.x, bell.position.z - spot.z);
      if (dist < best) {
        best = dist;
        index = i;
      }
    });
    if (index >= 0) {
      playerClean = index;
      if (rooms[index]!.cleaning <= 0) rooms[index]!.cleaning = 0.001;
      note = "Cleaning. Stay in the room.";
      hud();
      return;
    }
    note = "Stand at the desk, the coffee machine, or the towel cupboard.";
    hud();
  }

  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  rebuildRooms();
  camera.position.set(bell.position.x, 10.5, bell.position.z + 7.6);
  camera.lookAt(bell.position.x, 0, bell.position.z);
  hud();
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      renderer.dispose();
    },
    build,
    hire,
    upgrade,
  };
}

function doorAt(index: number) {
  const slot = SLOTS[index]!;
  const side = slot.x < 0 ? 1 : -1;
  return { x: slot.x + side * 0.7, z: slot.z };
}

function hitBox(px: number, pz: number, x: number, z: number, hx: number, hz: number) {
  return Math.abs(px - x) < hx + 0.26 && Math.abs(pz - z) < hz + 0.26;
}

function walled(px: number, pz: number, rooms: Room[]) {
  if (px < -7.3 || px > 7.3 || pz > 10.3 || pz < -8.4) return true;
  if (Math.abs(px + 6.7) < 0.42 && pz > -6.7 && pz < 10.1) return true;
  if (Math.abs(px - 6.7) < 0.42 && pz > -6.7 && pz < 10.1) return true;
  if (Math.abs(pz - 9.9) < 0.42 && Math.abs(px) < 7.05) return true;
  if (Math.abs(pz + 6.45) < 0.42 && Math.abs(px) > 1.2 && Math.abs(px) < 7.05) return true;
  return SLOTS.some((slot, index) => {
    if (!rooms[index]?.built) return false;
    const side = slot.x < 0 ? 1 : -1;
    const pad = 0.28;
    const hit = (x: number, z: number, hx: number, hz: number) => Math.abs(px - x) < hx && Math.abs(pz - z) < hz;
    if (hit(slot.x, slot.z + 1.42, 1.62, pad)) return true;
    if (hit(slot.x, slot.z - 1.42, 1.62, pad)) return true;
    if (hit(slot.x - side * 1.42, slot.z, pad, 1.55)) return true;
    return hit(slot.x + side * 1.42, slot.z, pad, 1.55) && Math.abs(pz - slot.z) > 0.5;
  });
}

function bubbleSprite(kind: "coffee" | "towel") {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 140;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.Sprite();
  g.fillStyle = "#fffaf3";
  g.beginPath();
  g.moveTo(28, 14);
  g.arcTo(136, 14, 136, 92, 20);
  g.arcTo(136, 92, 24, 92, 20);
  g.arcTo(24, 92, 24, 14, 20);
  g.arcTo(24, 14, 136, 14, 20);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(64, 90);
  g.lineTo(80, 128);
  g.lineTo(98, 90);
  g.closePath();
  g.fill();
  if (kind === "coffee") {
    g.fillStyle = "#f7f4ee";
    g.fillRect(58, 34, 34, 38);
    g.fillStyle = "#6b3a22";
    g.beginPath();
    g.ellipse(75, 46, 13, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#c47a3a";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(94, 50, 9, -1, 1);
    g.stroke();
  } else {
    g.fillStyle = "#d5e3ea";
    g.fillRect(50, 30, 58, 42);
    g.strokeStyle = "#7f9aaa";
    g.lineWidth = 3;
    g.strokeRect(50, 30, 58, 42);
    g.beginPath();
    g.moveTo(50, 44);
    g.lineTo(108, 44);
    g.moveTo(50, 56);
    g.lineTo(108, 56);
    g.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
  sprite.scale.set(0.82, 0.72, 1);
  sprite.position.set(0, 1.65, 0);
  sprite.name = kind;
  sprite.visible = false;
  return sprite;
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
  const towel = bubbleSprite("towel");
  const coffee = bubbleSprite("coffee");
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.06), mat("#2ec8e6"));
  bar.name = "bar";
  bar.position.y = 1.4;
  bar.visible = false;
  group.add(meal, towel, coffee, bar);
  return group;
}

function load() {
  const rooms: Room[] = SLOTS.map((_, index) => ({ built: index < 1, dirty: false, level: 1, cleaning: 0 }));
  const base = { coins: 40, clerk: false, maid: false, cook: false, done: false, rooms, history: [] as boolean[] };
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
