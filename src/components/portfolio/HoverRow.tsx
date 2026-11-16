"use client";

import type { ReactNode } from "react";
import { boardStore, useBoard } from "@/components/board/store";

/** A list row tied to its part on the board: hovering or focusing it lights the part, and the part's hover lights the row */
export function HoverRow({ slug, className, children }: { slug: string; className?: string; children: ReactNode }) {
  const active = useBoard((st) => st.hovered === slug);
  const enter = () => boardStore.set({ hovered: slug });
  const leave = () => {
    if (boardStore.get().hovered === slug) boardStore.set({ hovered: null });
  };
  return (
    <li className={className} data-active={active || undefined} onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave}>
      {children}
    </li>
  );
}
