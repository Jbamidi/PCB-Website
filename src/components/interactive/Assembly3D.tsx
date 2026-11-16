"use client";

// Progressive-enhancement 3D view of the same conceptual assembly. Simple procedural
// boxes from the shared part manifest; renders on demand only (no idle loop), caps
// pixel ratio, and never captures page scroll (zoom and pan disabled).

import { Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BOARD_SIZE, PART_GROUPS, groupOffset, type PartId } from "@/lib/demo-models/assembly";
import { theme } from "@/lib/themes";
import styles from "./assembly.module.css";

class Boundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Assembly3D({
  separation,
  selected,
  onSelect,
  onFail,
}: {
  separation: number;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  onFail: () => void;
}) {
  return (
    <Boundary onFail={onFail}>
      <div className={styles.canvasWrap}>
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [15, 14, 18], fov: 32 }}
          onCreated={({ gl }) => {
            gl.getContext().canvas.addEventListener("webglcontextlost", onFail);
          }}
          aria-label="Rotatable conceptual 3D view of the power distribution unit"
        >
          <color attach="background" args={[theme.ground]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 12, 8]} intensity={1.4} />
          <group position={[-BOARD_SIZE[0] / 2, 0, -BOARD_SIZE[2] / 2]}>
            <mesh position={[BOARD_SIZE[0] / 2, -BOARD_SIZE[1] / 2, BOARD_SIZE[2] / 2]}>
              <boxGeometry args={BOARD_SIZE} />
              <meshStandardMaterial color={theme.rule} roughness={0.9} />
            </mesh>
            {PART_GROUPS.map((g) => {
              const off = groupOffset(g, separation);
              const on = selected === g.id;
              return (
                <group key={g.id} position={off}>
                  {g.blocks.map((b) => (
                    <mesh
                      key={b.id}
                      position={[b.at[0] + b.size[0] / 2, b.at[1] + b.size[1] / 2, b.at[2] + b.size[2] / 2]}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(g.id);
                      }}
                    >
                      <boxGeometry args={b.size} />
                      <meshStandardMaterial
                        color={on ? theme.signal : theme.raised}
                        roughness={0.85}
                        transparent={!!selected && !on}
                        opacity={selected && !on ? 0.5 : 1}
                      />
                    </mesh>
                  ))}
                </group>
              );
            })}
          </group>
          <OrbitControls enableZoom={false} enablePan={false} makeDefault />
        </Canvas>
      </div>
    </Boundary>
  );
}
