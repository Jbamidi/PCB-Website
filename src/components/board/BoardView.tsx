"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BoardItem } from "./boardData";
import { canGoLive } from "./LiveBoard";
import s from "./board.module.css";

const BoardScene = dynamic(() => import("./BoardScene"), { ssr: false });

/**
 * The live board in a box on an inner page: a slow close-up of one part ("part", case
 * studies) or the whole board from above ("map", Projects). Same rules as the homepage:
 * wide screens with WebGL2 and 3D left on; otherwise the fallback (if any) shows.
 */
export function BoardView({ mode, slug, className, fallback = null }: { mode: "part" | "map"; slug?: string; className?: string; fallback?: ReactNode }) {
  const router = useRouter();
  const [live, setLive] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const decide = () => setLive(canGoLive());
    decide();
    const mq = window.matchMedia("(min-width: 901px)");
    mq.addEventListener("change", decide);
    window.addEventListener("jb-board-toggle", decide);
    return () => {
      mq.removeEventListener("change", decide);
      window.removeEventListener("jb-board-toggle", decide);
    };
  }, []);

  const onReady = useCallback(() => requestAnimationFrame(() => requestAnimationFrame(() => setReady(true))), []);
  const onNavigate = useCallback((item: BoardItem) => router.push(item.href), [router]);

  if (live === false) return <>{fallback}</>;
  return (
    <div className={`${s.view} ${className ?? ""}`} data-ready={ready || undefined} aria-hidden="true">
      {live ? <BoardScene mode={mode} slug={slug} onReady={onReady} onNavigate={onNavigate} /> : null}
    </div>
  );
}
