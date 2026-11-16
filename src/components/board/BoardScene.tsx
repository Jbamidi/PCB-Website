"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Html, Lightformer, Line, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gsap } from "gsap";
import { theme } from "@/lib/themes";
import { BOARD_SIZE, boardItems, boardLeds, type BoardItem } from "./boardData";
import { boardStore, useBoard } from "./store";
import { STOPS, shiftFor, type Stop } from "./stops";
import { power } from "./power";
import { focus } from "./focus";
import { playClick } from "@/lib/sound";
import s from "./board.module.css";

// Units are millimetres. KiCad exports metres with the board centred on (100, 70) mm, which
// is board-local (80, 50); x runs right, z runs toward the viewer (KiCad +y), y is up.
const TOP = 1.6;
const wx = (bx: number) => bx - BOARD_SIZE.w / 2;
const wz = (by: number) => by - BOARD_SIZE.h / 2;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MODEL = `${BASE}/board/parts.glb`;

// The lens from blender/lookdev.py's stills: 40 mm on a 36 mm sensor, framed as 16:9 and
// cropped to the screen like an <img> with object-fit: cover.
const HERO = { pos: new THREE.Vector3(0, 190, 125), frame: [1920, 1080] as const };
const HFOV = 2 * Math.atan(18 / 40);
const VFOV_DEG = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(HFOV / 2) * (HERO.frame[1] / HERO.frame[0])));

/**
 * A camera pose: position, look-at target, lens shift (fractions of the frame width) and
 * where the 16:9 frame is cropped horizontally (0.5 centre, 0.7 as the hero <img>).
 * "hero" scales the mouse parallax, which only runs in the hero view.
 */
type Pose = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; sx: number; sy: number; ox: number; hero: number };
const KEYS = ["px", "py", "pz", "tx", "ty", "tz", "sx", "sy", "ox", "hero"] as const;

/** a tour stop: orbit around its target, framed clear of its card (the overview stays centred) */
function stopPose(stop: Stop): Pose {
  const [d, el, az] = stop.orbit;
  const e = THREE.MathUtils.degToRad(el), a = THREE.MathUtils.degToRad(az);
  const tx = wx(stop.at[0]), tz = wz(stop.at[1]);
  const [sx, sy] = stop.shift ?? [shiftFor(stop.side), 0];
  const hero = stop.id === "hero" ? 1 : 0;
  return { px: tx + d * Math.cos(e) * Math.sin(a), py: TOP + d * Math.sin(e), pz: tz + d * Math.cos(e) * Math.cos(a), tx, ty: TOP, tz, sx, sy, ox: 0.5, hero };
}

/** Top-down over a part, tipped slightly toward the viewer so its markings read */
function partPose(item: BoardItem): Pose {
  const d = THREE.MathUtils.clamp(Math.max(item.w, item.h) * 4.2, 38, 140);
  const cx = wx(item.x), cz = wz(item.y);
  return { px: cx, py: TOP + d, pz: cz + d * 0.22, tx: cx, ty: TOP, tz: cz, sx: 0, sy: 0, ox: 0.5, hero: 0 };
}

function mixPose(a: Pose, b: Pose, t: number, out: Pose) {
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const smooth = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** a flight (click into a part, or Back out of one) layered over the scroll pose */
type Flight = { pose: Pose; k: number };

// ---------------------------------------------------------------- camera

const STOP_POSES = STOPS.map(stopPose);

/**
 * Where the tour puts the camera. Each [data-stop] section's anchor is the scroll
 * position at which it sits centred on screen (the hero's is its top, so the first screen
 * is the overview). Between two anchors the camera eases from one stop to the next,
 * holding still through the middle of each section, so it never moves while you read.
 * Also reports how firmly it is holding (1 at a stop, 0 halfway between).
 */
function scrollPose(out: Pose): { stop: Stop; hold: number } {
  const mid = window.innerHeight / 2;
  const found: { stop: number; a: number }[] = [];
  STOPS.forEach((stop, i) => {
    const el = document.querySelector<HTMLElement>(`[data-stop="${stop.id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    found.push({ stop: i, a: stop.id === "hero" ? r.top : r.top + r.height / 2 - mid });
  });
  if (!found.length) {
    Object.assign(out, STOP_POSES[0]);
    return { stop: STOPS[0], hold: 1 };
  }
  let i = 0;
  while (i < found.length - 1 && found[i + 1].a <= 0) i++;
  const a = found[i], b = found[Math.min(i + 1, found.length - 1)];
  const t = a === b || a.a >= 0 ? 0 : smooth(0.15, 0.85, a.a / (a.a - b.a));
  mixPose(STOP_POSES[a.stop], STOP_POSES[b.stop], t, out);
  return { stop: STOPS[t < 0.5 ? a.stop : b.stop], hold: Math.abs(1 - 2 * t) };
}

const projected = new THREE.Vector3();

function Rig({ flight }: { flight: React.RefObject<Flight> }) {
  const { camera, size, pointer, invalidate } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const drift = useRef(new THREE.Vector2());
  const still = useMemo(reduced, []);
  const base = useRef<Pose>({ ...STOP_POSES[0] });
  const pose = useRef<Pose>({ ...STOP_POSES[0] });
  const current = useRef("");

  useFrame(() => {
    const { stop, hold } = scrollPose(base.current);
    if (stop.id !== current.current) {
      current.current = stop.id;
      boardStore.set({ stop: stop.id, spot: stop.spot });
    }
    const f = flight.current;
    const p = f.k > 0 ? mixPose(base.current, f.pose, f.k, pose.current) : Object.assign(pose.current, base.current);

    // a few millimetres of parallax with the mouse, only in the hero view
    if (!still) {
      const goal = new THREE.Vector2(pointer.x * 6 * p.hero, pointer.y * 3 * p.hero);
      drift.current.lerp(goal, 0.08);
      if (drift.current.distanceToSquared(goal) > 0.0004) invalidate();
    }
    // power-on: the camera starts low over the front edge and eases up into the view
    const low = 1 - power.settle;
    if (low > 0) {
      p.py -= (p.py - TOP) * 0.62 * low;
      p.pz += 40 * low;
      p.ty -= 12 * low;
    }
    cam.position.set(p.px + drift.current.x, p.py + drift.current.y, p.pz);
    cam.lookAt(p.tx, p.ty, p.tz);

    // crop the virtual 16:9 frame the way the poster <img> is cropped (object-fit: cover),
    // then apply the pose's lens shift
    const [fw, fh] = HERO.frame;
    const scale = Math.max(size.width / fw, size.height / fh);
    const iw = fw * scale, ih = fh * scale;
    const ox = (iw - size.width) * p.ox + p.sx * iw;
    const oy = (ih - size.height) * 0.5 - p.sy * iw;
    cam.fov = VFOV_DEG;
    cam.aspect = fw / fh;
    cam.setViewOffset(iw, ih, ox, oy, size.width, size.height);
    cam.updateProjectionMatrix();

    // where the current part sits on screen, for the readout card's leader line
    cam.updateMatrixWorld();
    focus.id = stop.id;
    focus.hold = f.k > 0 ? 0 : hold;
    if (stop.item) {
      projected.set(wx(stop.item.x), TOP + 1, wz(stop.item.y)).project(cam);
      focus.visible = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
      focus.x = ((projected.x + 1) / 2) * size.width + size.left;
      focus.y = ((1 - projected.y) / 2) * size.height + size.top;
    } else focus.visible = false;
  });
  return null;
}

// ---------------------------------------------------------------- board

/** where the board wakes from during power-on: the buck converters along the top edge */
const WAKE = new THREE.Vector2(wx(47), wz(12));
const WAKE_REACH = 200; // mm: far enough to cover the opposite corner

function Surface() {
  const [map, orm, normal] = useTexture([`${BASE}/board/surface-color.webp`, `${BASE}/board/surface-orm.webp`, `${BASE}/board/surface-normal.webp`]);
  const uniforms = useMemo(() => ({ uWake: { value: WAKE }, uRadius: { value: WAKE_REACH } }), []);
  useFrame(() => {
    uniforms.uRadius.value = power.reveal * WAKE_REACH;
  });
  // the mask outside the wake radius stays at a few percent of its light, with a soft
  // 30 mm front, so the board lights from the regulators outward
  const onBeforeCompile = useMemo(
    () => (shader: { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string }) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vBoard;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBoard = (modelMatrix * vec4(position, 1.0)).xz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vBoard;\nuniform vec2 uWake;\nuniform float uRadius;")
        .replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\nfloat wake = 1.0 - smoothstep(uRadius - 30.0, uRadius, distance(vBoard, uWake));\ngl_FragColor.rgb *= mix(0.03, 1.0, wake);",
        );
    },
    [uniforms],
  );
  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    for (const t of [map, orm, normal]) {
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
  }, [map, orm, normal]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={TOP} receiveShadow renderOrder={1}>
      <planeGeometry args={[BOARD_SIZE.w, BOARD_SIZE.h]} />
      <meshPhysicalMaterial
        map={map}
        roughnessMap={orm}
        metalnessMap={orm}
        normalMap={normal}
        normalScale={new THREE.Vector2(0.9, 0.9)}
        roughness={1}
        metalness={1}
        clearcoat={0.35}
        clearcoatRoughness={0.3}
        alphaTest={0.5}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  );
}

/** float copy of a (possibly quantised) geometry, with only what merging needs */
function floatGeometry(g: THREE.BufferGeometry, m: THREE.Matrix4) {
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal"] as const) {
    const a = g.getAttribute(name);
    if (!a) continue;
    const arr = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) {
      arr[i * 3] = a.getX(i);
      arr[i * 3 + 1] = a.getY(i);
      arr[i * 3 + 2] = a.getZ(i);
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, 3));
  }
  if (!out.getAttribute("normal")) out.computeVertexNormals();
  if (g.index) out.setIndex(Array.from(g.index.array));
  out.applyMatrix4(m);
  return out;
}

/**
 * The company's mark printed on the part that stands for the role: Archer Aviation's
 * arch-and-bars mark in black gloss on top of J1's housing. The artwork is
 * public/board/archer-mark.svg (white on transparent, used as the print's alpha), redrawn
 * from the logo; put the official file there to replace it.
 */
const MARKS = { ref: "J1", src: `${BASE}/board/archer-mark.svg`, aspect: 200 / 212 };

function topMark(part: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(part);
  const size = box.getSize(new THREE.Vector3());
  const material = new THREE.MeshPhysicalMaterial({ color: "#030303", roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, alphaTest: 0.05, depthWrite: false, opacity: 0 });
  new THREE.TextureLoader().load(MARKS.src, (tex) => {
    tex.anisotropy = 8;
    material.alphaMap = tex;
    material.opacity = 1;
    material.needsUpdate = true;
  });
  // as large as the housing's top allows, with a margin; the arch points away from the board's front edge
  const h = Math.min(size.z * 0.5, (size.x * 0.5) / MARKS.aspect);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * MARKS.aspect, h), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((box.min.x + box.max.x) / 2, box.max.y + 0.03, (box.min.z + box.max.z) / 2);
  mesh.renderOrder = 2;
  return mesh;
}

const processed = new WeakMap<THREE.Object3D, { statics: THREE.Mesh[]; interactive: THREE.Group[] }>();

/**
 * Loads the parts model. Interactive parts keep their own node (so they can lift);
 * everything else is merged into one mesh per material: a few draw calls instead of ~800.
 */
function Parts({ lifted }: { lifted: Map<string, THREE.Object3D> }) {
  const { gl } = useThree();
  const gltf = useGLTF(MODEL, false, true);
  const { statics, interactive } = useMemo(() => {
    // merging takes a moment, so it is done once per visit and reused when the board remounts (Back)
    const cached = processed.get(gltf.scene);
    if (cached) return cached;
    const root = gltf.scene;
    root.scale.setScalar(1000);
    root.updateMatrixWorld(true);
    const refs = new Set(boardItems.map((i) => i.ref));
    const interactive: THREE.Object3D[] = [];
    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const owner = (o: THREE.Object3D): THREE.Object3D | null => {
      for (let n: THREE.Object3D | null = o; n; n = n.parent) if (refs.has(n.name)) return n;
      return null;
    };
    const seen = new Set<THREE.Object3D>();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const part = owner(mesh);
      if (part) {
        if (!seen.has(part)) {
          seen.add(part);
          interactive.push(part);
        }
        return;
      }
      const mat = mesh.material as THREE.Material;
      if (!byMaterial.has(mat)) byMaterial.set(mat, []);
      byMaterial.get(mat)!.push(floatGeometry(mesh.geometry, mesh.matrixWorld));
    });
    const statics = [...byMaterial].map(([mat, geos]) => {
      const m = new THREE.Mesh(mergeGeometries(geos, false)!, mat);
      // the bare board's top face sits exactly under the textured surface plane; letting it
      // cast would shadow the surface onto itself (white striped shadow acne), so only the
      // parts cast
      const board = mat.name === "fr4_edge";
      m.castShadow = !board;
      m.receiveShadow = !board;
      return m;
    });
    // detach interactive parts into world space so each can be moved on its own
    const parts = interactive.map((p) => {
      const holder = new THREE.Group();
      holder.name = p.name;
      p.updateMatrixWorld(true);
      const clone = p.clone(true);
      clone.matrixAutoUpdate = false;
      clone.matrix.copy(p.matrixWorld);
      clone.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      holder.add(clone);
      if (p.name === MARKS.ref) holder.add(topMark(holder));
      return holder;
    });
    const result = { statics, interactive: parts };
    processed.set(gltf.scene, result);
    return result;
  }, [gltf]);

  useEffect(() => {
    for (const p of interactive) lifted.set(p.name, p);
    reshadow(gl);
  }, [interactive, lifted, gl]);

  return (
    <group>
      {statics.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {interactive.map((p) => (
        <primitive key={p.name} object={p} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- LEDs

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Leds() {
  const glow = useMemo(glowTexture, []);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const still = useMemo(reduced, []);
  const lenses = useRef<(THREE.Mesh | null)[]>([]);
  const RAILS = ["D10", "D11", "D12"];
  useFrame(({ clock }) => {
    boardLeds.forEach((l, i) => {
      const sp = sprites.current[i];
      const lens = lenses.current[i];
      // PWR first, then each rail as its regulator comes up, then the project LEDs with the light
      const on =
        l.ref === "D9" ? power.pwr : RAILS.includes(l.ref) ? (power.rails * 3 > RAILS.indexOf(l.ref) + 0.5 ? 1 : 0) : THREE.MathUtils.clamp(power.reveal * 2 - 0.9, 0, 1);
      const breathe = l.breathe && !still ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2)) : 1;
      if (sp) (sp.material as THREE.SpriteMaterial).opacity = 0.85 * on * breathe;
      if (lens) lens.visible = on > 0.05;
    });
  });
  return (
    <group>
      {boardLeds.map((l, i) => {
        const color = l.color === "planned" ? theme.ledPlanned : theme.ledOn;
        return (
          <group key={l.ref} position={[wx(l.x), TOP + 0.5, wz(l.y)]}>
            <mesh ref={(el) => void (lenses.current[i] = el)}>
              <boxGeometry args={[1.0, 0.25, 0.5]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <sprite ref={(el) => void (sprites.current[i] = el)} scale={[4.2, 4.2, 1]}>
              <spriteMaterial map={glow} color={color} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </sprite>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------- interaction

function Hotspots({ lifted, onOpen }: { lifted: Map<string, THREE.Object3D>; onOpen: (item: BoardItem) => void }) {
  const { gl } = useThree();
  const hovered = useBoard((s) => s.hovered);
  const flying = useBoard((s) => s.flying);
  const still = useMemo(reduced, []);

  // lift the hovered part 1.5 mm on its leads
  useEffect(() => {
    for (const item of boardItems) {
      const node = lifted.get(item.ref);
      if (!node) continue;
      gsap.to(node.position, { y: item.slug === hovered ? 1.5 : 0, duration: still ? 0 : 0.18, ease: "power3.out", overwrite: true, onUpdate: () => reshadow(gl), onComplete: () => reshadow(gl) });
    }
  }, [hovered, lifted, still, gl]);

  const over = (item: BoardItem) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!boardStore.get().flying) boardStore.set({ hovered: item.slug });
    document.body.style.cursor = "pointer";
  };
  const out = (item: BoardItem) => () => {
    if (boardStore.get().hovered === item.slug) boardStore.set({ hovered: null });
    document.body.style.cursor = "";
  };

  const spot = useBoard((s) => s.spot);
  const active = boardItems.find((i) => i.slug === hovered);
  return (
    <group>
      {spot
        .filter((slug) => slug !== hovered)
        .map((slug) => {
          const item = boardItems.find((i) => i.slug === slug);
          return item && !flying ? <Outline key={slug} item={item} faint /> : null;
        })}
      {boardItems.map((item) => (
        <mesh
          key={item.slug}
          position={[wx(item.x), TOP + 2, wz(item.y)]}
          onPointerOver={over(item)}
          onPointerOut={out(item)}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(item);
          }}
        >
          <boxGeometry args={[Math.max(item.w, 6) + 2, 4, Math.max(item.h, 6) + 2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      ))}
      {active && !flying ? <Highlight item={active} /> : null}
    </group>
  );
}

/** cobalt outline around a footprint: bright for the hovered part, faint and dashed for the parts the story is on */
function Outline({ item, faint = false }: { item: BoardItem; faint?: boolean }) {
  const x = wx(item.x), z = wz(item.y), hw = item.w / 2 + 1.2, hh = item.h / 2 + 1.2;
  const pts: [number, number, number][] = [
    [x - hw, TOP + 0.05, z - hh], [x + hw, TOP + 0.05, z - hh], [x + hw, TOP + 0.05, z + hh], [x - hw, TOP + 0.05, z + hh], [x - hw, TOP + 0.05, z - hh],
  ];
  return (
    <Line
      points={pts}
      color={theme.signal}
      lineWidth={faint ? 1.5 : 2.5}
      transparent
      opacity={faint ? 0.6 : 0.95}
      toneMapped={false}
      depthTest={false}
      renderOrder={10}
      dashed={faint}
      dashSize={2}
      gapSize={1.2}
    />
  );
}

/** the hovered part's outline and label card */
function Highlight({ item }: { item: BoardItem }) {
  const x = wx(item.x), z = wz(item.y), hw = item.w / 2 + 1.2, hh = item.h / 2 + 1.2;
  const right = item.x < BOARD_SIZE.w * 0.62;
  return (
    <group>
      <Outline item={item} />
      <Html position={[right ? x + hw : x - hw, TOP + 3, z - hh]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div className={s.label} data-side={right ? "right" : "left"}>
          <p className={s.labelRef}>
            <span className="ref">{item.ref}</span>
            <span className="led" data-state={item.led}>{item.status.split(" · ")[0]}</span>
          </p>
          <p className={s.labelTitle}>{item.title}</p>
          <p className={s.labelLine}>{item.line}</p>
          <p className={s.labelOpen}>{item.kind === "contact" ? "Show contact" : "Open"} →</p>
        </div>
      </Html>
    </group>
  );
}

/** the 5 V path from the USB-C input along the VIN strip to the three buck converters */
const TRACE_MAIN: [number, number][] = [[17, 8], [17, 12], [22, 17], [66, 17]];
const TRACE_STUBS = [32, 47, 62].map((bx) => [[bx, 17], [bx, 10]] as [number, number][]);

function cut(points: [number, number][], t: number): [number, number, number][] {
  // the first fraction t of a polyline, by length
  const seg = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  const out: [number, number, number][] = [[wx(points[0][0]), TOP + 0.1, wz(points[0][1])]];
  for (let i = 0; i < seg.length && left > 0; i++) {
    const f = Math.min(1, left / seg[i]);
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    out.push([wx(x0 + (x1 - x0) * f), TOP + 0.1, wz(y0 + (y1 - y0) * f)]);
    left -= seg[i];
  }
  if (out.length < 2) out.push(out[0]);
  return out;
}

type LineRef = { geometry: { setPositions: (a: number[]) => void }; material: { opacity: number } };

function PowerTrace() {
  const main = useRef<LineRef>(null);
  const stubs = useRef<(LineRef | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const fade = 1 - power.traceFade;
    g.visible = power.trace > 0 && fade > 0.01;
    if (!g.visible) return;
    main.current?.geometry.setPositions(cut(TRACE_MAIN, power.trace).flat());
    if (main.current) main.current.material.opacity = fade;
    // a stub lights once the main run has passed its regulator
    const total = 5 + 7.07 + 44;
    TRACE_STUBS.forEach((pts, i) => {
      const reached = (power.trace * total - (5 + 7.07 + (pts[0][0] - 22))) / 7;
      const st = stubs.current[i];
      if (!st) return;
      st.geometry.setPositions(cut(pts, THREE.MathUtils.clamp(reached, 0, 1)).flat());
      st.material.opacity = fade;
    });
  });
  const start = cut(TRACE_MAIN, 0);
  return (
    <group ref={group}>
      <Line ref={main as never} points={start} color={theme.gold} lineWidth={4.5} transparent toneMapped={false} depthTest={false} renderOrder={11} />
      {TRACE_STUBS.map((pts, i) => (
        <Line key={i} ref={((el: LineRef | null) => void (stubs.current[i] = el)) as never} points={cut(pts, 0)} color={theme.gold} lineWidth={4.5} transparent toneMapped={false} depthTest={false} renderOrder={11} />
      ))}
    </group>
  );
}

/**
 * The canvas renders on demand (frameloop "demand"): nothing is drawn while the page sits
 * still. A frame is requested on scroll, pointer movement and resize, on every tick while
 * a GSAP tween is running (power-on, flights, part lifts), and at a low rate for the slow
 * ambient motion (the breathing planned-work LED, the case-study orbit).
 */
function Driver({ ambientFps }: { ambientFps: number }) {
  const { invalidate } = useThree();
  useEffect(() => {
    const kick = () => invalidate();
    const tick = () => {
      if (gsap.globalTimeline.getChildren(true, true, false).some((t) => t.isActive())) invalidate();
    };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("pointermove", kick, { passive: true });
    window.addEventListener("resize", kick);
    gsap.ticker.add(tick);
    const ambient = reduced() ? 0 : window.setInterval(kick, 1000 / ambientFps);
    kick();
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("pointermove", kick);
      window.removeEventListener("resize", kick);
      gsap.ticker.remove(tick);
      window.clearInterval(ambient);
    };
  }, [invalidate, ambientFps]);
  return null;
}

/** shadows are baked once (the light never moves) and re-baked only while a part is moving */
const reshadow = (gl: THREE.WebGLRenderer) => void (gl.shadowMap.needsUpdate = true);

function Lights() {
  const key = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const { scene } = useThree();
  useFrame(() => {
    const r = power.reveal;
    if (key.current) key.current.intensity = 2.2 * r;
    if (ambient.current) ambient.current.intensity = 0.15 * r;
    scene.environmentIntensity = 0.05 + 0.95 * r;
  });
  return (
    <>
      <ambientLight ref={ambient} intensity={0.15} />
      {/* key from the upper left, casting the soft contact shadows of the parts */}
      <directionalLight
        ref={key}
        position={[-120, 220, 90]}
        intensity={2.2}
        color="#F4F6FF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.25}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={50}
        shadow-camera-far={500}
        shadow-radius={3}
      />
      <Environment resolution={256} frames={1}>
        {/* a neutral studio: one big soft box overhead-left, a cool rim behind, a dim fill */}
        <Lightformer form="rect" intensity={2.4} color="#F4F6FF" position={[-2, 5, 2]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#E6ECFF" position={[1, 2, -5]} scale={[8, 1.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.35} color="#FFFFFF" position={[5, 1, 3]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

// ---------------------------------------------------------------- scene

export type BoardSceneProps = {
  /**
   * "tour": the homepage, camera driven by scroll (the default).
   * "part": a slow orbit around one part, for a case study's header.
   * "map": the whole board from above, for the Projects page; hover and click as on the homepage.
   */
  mode?: "tour" | "part" | "map";
  /** the part to orbit in "part" mode */
  slug?: string;
  /** fly in, then hand over to the page; resolves the navigation */
  onNavigate?: (item: BoardItem) => void;
  /** the part a visitor is coming back from, to fly out of */
  returnFrom?: string | null;
  onReady?: () => void;
};

const FIXED_FOV = 30;

/** the whole board seen from above at 62°, sized so it fills the canvas with a small margin */
function mapPose(width: number, height: number): Pose {
  const aspect = width / height;
  const v = THREE.MathUtils.degToRad(FIXED_FOV / 2);
  const h = Math.atan(Math.tan(v) * aspect);
  const e = THREE.MathUtils.degToRad(62);
  const d = Math.max((BOARD_SIZE.w * 0.56) / Math.tan(h), (BOARD_SIZE.h * Math.sin(e) * 0.6) / Math.tan(v));
  return { px: 0, py: TOP + d * Math.sin(e), pz: d * Math.cos(e), tx: 0, ty: TOP, tz: 2, sx: 0, sy: 0, ox: 0.5, hero: 0 };
}

/** a three-quarter view of one part, turned by angle degrees around it */
function orbitPose(item: BoardItem, angle: number, height: number, width: number): Pose {
  const v = THREE.MathUtils.degToRad(FIXED_FOV / 2);
  const fit = Math.max(item.w, item.h) * 0.95 * Math.max(1, height / width);
  const d = THREE.MathUtils.clamp(fit / Math.tan(v), 45, 220);
  const e = THREE.MathUtils.degToRad(36), a = THREE.MathUtils.degToRad(angle);
  const tx = wx(item.x), tz = wz(item.y);
  return { px: tx + d * Math.cos(e) * Math.sin(a), py: TOP + 2 + d * Math.sin(e), pz: tz + d * Math.cos(e) * Math.cos(a), tx, ty: TOP + 1, tz, sx: 0, sy: 0, ox: 0.5, hero: 0 };
}

/** camera for the "part" and "map" modes: a plain perspective sized to the canvas, with flights layered on */
function FixedRig({ mode, item, flight }: { mode: "part" | "map"; item?: BoardItem; flight: React.RefObject<Flight> }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const still = useMemo(reduced, []);
  const pose = useRef<Pose>(mapPose(1, 1));
  useFrame(({ clock }) => {
    // the close-up turns slowly, about 5° a second, swinging ±40° so the part never shows its back
    const angle = 24 + (still ? 0 : Math.sin(clock.elapsedTime * 0.09) * 40);
    const base = mode === "part" && item ? orbitPose(item, angle, size.height, size.width) : mapPose(size.width, size.height);
    const f = flight.current;
    const p = f.k > 0 ? mixPose(base, f.pose, f.k, pose.current) : Object.assign(pose.current, base);
    cam.position.set(p.px, p.py, p.pz);
    cam.lookAt(p.tx, p.ty, p.tz);
    cam.clearViewOffset();
    cam.fov = FIXED_FOV;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  });
  return null;
}

function Scene({ mode = "tour", slug, onNavigate, returnFrom = null, onReady }: BoardSceneProps) {
  const { gl } = useThree();
  const lifted = useMemo(() => new Map<string, THREE.Object3D>(), []);
  const back = mode === "tour" ? boardItems.find((i) => i.slug === returnFrom) : undefined;
  const item = boardItems.find((i) => i.slug === slug);
  const flight = useRef<Flight>(back ? { pose: partPose(back), k: 1 } : { pose: { ...STOP_POSES[0] }, k: 0 });

  useEffect(() => {
    onReady?.();
    if (!back) return;
    // Back from a case study: start over its part and fly out to wherever the page is scrolled
    const tween = gsap.to(flight.current, { k: 0, duration: reduced() ? 0 : 1.1, ease: "power3.inOut", delay: 0.15 });
    return () => void tween.kill();
  }, [back, onReady]);

  const open = (target: BoardItem) => {
    if (boardStore.get().flying || !onNavigate) return;
    if (target.kind === "contact") {
      if (mode === "tour") document.getElementById("contact")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      else onNavigate(target);
      return;
    }
    boardStore.set({ hovered: null, flying: target.slug });
    document.body.style.cursor = "";
    // press the part down like a tactile switch, then fly onto it
    const node = lifted.get(target.ref);
    if (node) gsap.to(node.position, { y: -0.5, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", onUpdate: () => reshadow(gl) });
    playClick();
    flight.current.pose = partPose(target);
    if (reduced()) {
      flight.current.k = 1;
      onNavigate(target);
      return;
    }
    gsap.to(flight.current, { k: 1, duration: 0.9, delay: 0.1, ease: "power3.inOut", onComplete: () => onNavigate(target) });
  };

  return (
    <>
      <Driver ambientFps={mode === "part" ? 20 : 12} />
      {mode === "tour" ? <Rig flight={flight} /> : <FixedRig mode={mode} item={item} flight={flight} />}
      <Lights />
      <Surface />
      <Parts lifted={lifted} />
      <Leds />
      {mode === "tour" ? <PowerTrace /> : null}
      {mode === "part" ? (item ? <Outline item={item} faint /> : null) : <Hotspots lifted={lifted} onOpen={open} />}
    </>
  );
}

export default function BoardScene(props: BoardSceneProps) {
  return (
    <Canvas
      className={s.canvas}
      shadows="percentage"
      dpr={[1, 1.5]}
      frameloop="demand"
      onCreated={({ gl }) => {
        gl.shadowMap.autoUpdate = false;
        reshadow(gl);
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: VFOV_DEG, near: 5, far: 2000, position: HERO.pos.toArray() }}
      onPointerMissed={() => boardStore.set({ hovered: null })}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL, false, true);
