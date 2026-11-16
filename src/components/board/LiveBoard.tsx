"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BOARD_READY_EVENT } from "./power";
import type { BoardItem } from "./boardData";
import { boardStore, LIVE_KEY, RETURN_KEY } from "./store";
import s from "./board.module.css";

// three.js and the scene load only when the live board is actually shown
const BoardScene = dynamic(() => import("./BoardScene"), { ssr: false });

function webgl2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/** Wide screens with WebGL2 get the live board; phones, Save-Data and "3D off" keep the poster. */
export function canGoLive() {
  if (!window.matchMedia("(min-width: 901px)").matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try {
    if (localStorage.getItem(LIVE_KEY) === "off") return false;
  } catch {}
  return webgl2();
}

function takeReturn(): string | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (!raw) return null;
    const { slug, t } = JSON.parse(raw) as { slug: string; t: number };
    return Date.now() - t < 10 * 60_000 ? slug : null; // only a recent visit counts as "Back"
  } catch {
    return null;
  }
}

/** The live 3D board, layered exactly over the hero poster and faded in once it has drawn. */
export function LiveBoard() {
  const router = useRouter();
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [returnFrom, setReturnFrom] = useState<string | null>(null);

  useEffect(() => {
    const decide = () => {
      const ok = canGoLive();
      // the homepage lays itself out as a scroll story around the board only when it is live
      document.documentElement.toggleAttribute("data-board-live", ok);
      if (!ok) document.documentElement.removeAttribute("data-board-ready");
      if (ok) setReturnFrom((r) => r ?? takeReturn());
      setMount(ok);
      if (!ok) setReady(false);
    };
    decide();
    const mq = window.matchMedia("(min-width: 901px)");
    const onToggle = () => decide();
    mq.addEventListener("change", decide);
    window.addEventListener("jb-board-toggle", onToggle);
    return () => {
      mq.removeEventListener("change", decide);
      window.removeEventListener("jb-board-toggle", onToggle);
      document.documentElement.removeAttribute("data-board-live");
      document.documentElement.removeAttribute("data-board-ready");
      boardStore.set({ live: false, hovered: null, flying: null, stop: "hero", spot: [] });
    };
  }, []);

  const onReady = useCallback(() => {
    // two frames: the first may still be compiling shaders
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setReady(true);
      document.documentElement.setAttribute("data-board-ready", "");
      window.dispatchEvent(new Event(BOARD_READY_EVENT));
      boardStore.set({ live: true });
    }));
  }, []);

  const onNavigate = useCallback(
    (item: BoardItem) => {
      try {
        sessionStorage.setItem(RETURN_KEY, JSON.stringify({ slug: item.slug, t: Date.now() }));
      } catch {}
      router.push(item.href);
    },
    [router],
  );

  if (!mount) return null;
  return (
    <div className={s.live} data-ready={ready || undefined}>
      <BoardScene onNavigate={onNavigate} returnFrom={returnFrom} onReady={onReady} />
    </div>
  );
}

/** the 3D switch in the header, beside PWR: remembered for the visitor; hidden where 3D never runs */
export function LiveToggle() {
  const [off, setOff] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    try {
      setOff(localStorage.getItem(LIVE_KEY) === "off");
    } catch {}
    const mq = window.matchMedia("(min-width: 901px)");
    const sync = () => setWide(mq.matches && webgl2());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  if (!wide) return null;
  const flip = () => {
    const next = !off;
    try {
      if (next) localStorage.setItem(LIVE_KEY, "off");
      else localStorage.removeItem(LIVE_KEY);
    } catch {}
    setOff(next);
    if (next) boardStore.set({ live: false, hovered: null });
    window.dispatchEvent(new Event("jb-board-toggle"));
  };
  return (
    <button type="button" className={s.toggle} onClick={flip} aria-pressed={!off} aria-label="3D board" title={off ? "3D board off: show the still image" : "3D board on"}>
      <span className="led" data-state={off ? "off" : "on"}>3D</span>
      <span className={s.toggleState}>{off ? "Off" : "On"}</span>
    </button>
  );
}
