// Plots the top layers the surface bake needs, one black-and-white SVG each, cropped to the board.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const KICAD = "C:/Program Files/KiCad/10.0/bin/kicad-cli.exe";
mkdirSync("board/web/layers", { recursive: true });
for (const layer of ["F.Cu", "F.Mask", "F.Silkscreen"]) {
  execFileSync(KICAD, ["pcb", "export", "svg", "-o", `board/web/layers/${layer}.svg`, "--mode-single", "-l", layer, "--black-and-white",
    "--page-size-mode", "2", "--exclude-drawing-sheet", "--drill-shape-opt", "2", "board/portfolio.kicad_pcb"], { stdio: "ignore" });
}
console.log("export-layers: F.Cu, F.Mask, F.Silkscreen");
