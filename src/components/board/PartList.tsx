"use client";

import Link from "next/link";
import type { BoardItem } from "./boardData";
import { boardStore, useBoard } from "./store";
import s from "./board.module.css";

/**
 * Every part on the board as a plain link: the keyboard and screen-reader route to the
 * same places as the 3D board, the whole menu on phones, and a two-way index on desktop
 * (hover or focus a row and its part lights on the board, and the reverse).
 */
export function PartList({ items }: { items: BoardItem[] }) {
  const hovered = useBoard((st) => st.hovered);
  const enter = (slug: string) => () => boardStore.set({ hovered: slug });
  const leave = (slug: string) => () => {
    if (boardStore.get().hovered === slug) boardStore.set({ hovered: null });
  };
  return (
    <ul className={s.parts}>
      {items.map((i) => (
        <li key={i.slug} data-active={hovered === i.slug || undefined}>
          <Link href={i.href} onPointerEnter={enter(i.slug)} onPointerLeave={leave(i.slug)} onFocus={enter(i.slug)} onBlur={leave(i.slug)}>
            <span className="ref">{i.ref}</span>
            <span className={s.partTitle}>{i.title}</span>
            <span className="led" data-state={i.led}>
              <span className="visually-hidden">{i.status}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
