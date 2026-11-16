// Turns KiCad's parts-only export (board/web/parts-raw.glb: component models and the bare
// board body, no copper) into the model the live board loads, public/board/parts.glb:
// - KiCad's flat colours become real materials (epoxy, tin, gold, ceramic …)
// - BGA solder balls are dropped (they sit under the package and cost ~40% of the triangles)
// - primitives are joined per part, then meshes are simplified, quantised and
//   meshopt-compressed (the site merges the passives into a few draw calls at load)
// Every main part keeps its node name (its reference designator, e.g. "U3") so the
// site can lift it on hover.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import board from "../board/parts.json" with { type: "json" };

const IN = "board/web/parts-raw.glb";
const OUT = "public/board/parts.glb";

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();

// refs the site interacts with: everything in parts.json plus their neighbours stay named
const keep = new Set(Object.values(board.parts).map((p) => p.ref));

// ---- materials
const srgb = (h) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255) ** 2.2);
const make = (name, hex, metal, rough) =>
  doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metal).setRoughnessFactor(rough);
const M = {
  epoxy: make("epoxy", "#161718", 0, 0.52),
  tin: make("tin", "#C9CCCE", 1, 0.32),
  gold: make("gold", "#D4AE62", 1, 0.26),
  ceramic: make("ceramic", "#9C8C6C", 0, 0.62),
  steel: make("steel", "#B4B8BC", 1, 0.42), // shields and shells
  fr4: make("fr4_edge", "#1E2416", 0, 0.8),
};
const classify = (mat, meshName) => {
  const [r, g, b] = mat.getBaseColorFactor();
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (meshName === "portfolio_PCB") return M.fr4;
  if (lum < 0.13 && Math.max(r, g, b) - Math.min(r, g, b) < 0.08) return M.epoxy;
  const grey = Math.max(r, g, b) - Math.min(r, g, b) < 0.1;
  if (grey && lum > 0.45) return M.tin;
  if (grey) return M.steel;
  if (r > 0.6 && g > 0.4 && b < 0.45 && r - b > 0.35) return M.gold;
  if (Math.abs(r - 0.44) < 0.05 && Math.abs(g - 0.40) < 0.05) return M.ceramic;
  if (r > 0.7 && g > 0.7 && b > 0.55) return M.ceramic;
  return null; // keep its own colour (tantalum orange, terminal green …) but fix the PBR values
};

let dropped = 0;
for (const mesh of root.listMeshes()) {
  const isBga = /BGA/.test(mesh.getName());
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    const to = mat ? classify(mat, mesh.getName()) : M.epoxy;
    if (isBga && (to === M.tin || to === M.steel)) {
      prim.dispose();
      dropped++;
      continue;
    }
    if (to) prim.setMaterial(to);
    else mat.setMetallicFactor(0).setRoughnessFactor(0.5);
  }
}

await doc.transform(
  dedup(),
  join({ keepNamed: false }),
  weld({}),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.55, error: 0.0004, lockBorder: false }),
  prune({ keepLeaves: false }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);

// main parts must still be reachable by name
const names = new Set(root.listNodes().map((n) => n.getName()));
const missing = [...keep].filter((r) => !names.has(r) && !/^U9\d$|^U1$/.test(r)); // DNP footprints have no model
await io.write(OUT, doc);

let tris = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? 0) / 3;
const { size } = await import("node:fs").then((fs) => fs.promises.stat(OUT));
console.log(`build-web-board: ${(size / 1e6).toFixed(2)} MB, ${Math.round(tris)} triangles, ${root.listMeshes().length} meshes, dropped ${dropped} BGA ball primitives`);
if (missing.length) console.log("named parts missing from the model:", missing.join(", "));
