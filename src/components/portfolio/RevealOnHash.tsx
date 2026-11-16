"use client";

import { useEffect } from "react";

/**
 * Opens any collapsed <details> that contains the element a #fragment points at, so
 * links like /experience/eco-illini#architecture land on visible content.
 */
export function RevealOnHash() {
  useEffect(() => {
    const reveal = (hash: string, scroll: boolean) => {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      let node: HTMLElement | null = target;
      let opened = false;
      while (node) {
        if (node instanceof HTMLDetailsElement && !node.open) {
          node.open = true;
          opened = true;
        }
        node = node.parentElement;
      }
      if (opened || scroll) target.scrollIntoView({ block: "start" });
    };

    reveal(window.location.hash, false);
    const onHash = () => reveal(window.location.hash, true);
    // in-page links: open before the browser scrolls
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.pathname !== window.location.pathname) return;
      reveal(a.hash, false);
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
