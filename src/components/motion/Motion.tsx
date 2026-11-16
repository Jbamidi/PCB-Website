"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Site-wide motion, mounted once in the layout:
 * - Lenis smooths wheel scrolling (it only smooths; the page never refuses to scroll)
 *   and drives GSAP ScrollTrigger so scroll scenes stay in step.
 * - Anything marked data-reveal fades up 12 px, once, as it enters.
 * - Internal links change page inside a View Transition: the old page fades, the new
 *   one rises, and the header (view-transition-name: site-header) holds still.
 * With reduced motion there is no smoothing, no reveal and no transition.
 */
export function Motion() {
  const pathname = usePathname();
  const router = useRouter();
  const lenisRef = useRef<Lenis | null>(null);
  const popped = useRef(false);
  // the homepage tour is long (a screen and a half per part), so the wheel moves twice as far there
  const wheelBoost = useRef(1);
  wheelBoost.current = pathname === "/" ? 2 : 1;
  const arrived = useRef<(() => void) | null>(null);

  // smooth scrolling, tied to the GSAP ticker
  useEffect(() => {
    if (reduced()) return;
    const lenis = new Lenis({
      lerp: 0.12,
      anchors: { offset: -80 },
      autoRaf: false,
      virtualScroll: (data) => {
        if (data.event.type === "wheel") {
          data.deltaX *= wheelBoost.current;
          data.deltaY *= wheelBoost.current;
        }
        return true;
      },
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Back and Forward restore the old scroll position, so they must not jump to the top
  useEffect(() => {
    const onPop = () => void (popped.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // per page: land at the top (unless linked to an anchor or going back), then set up reveals
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
    if (!window.location.hash && !popped.current) lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    popped.current = false;
    if (reduced()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      // only hide what is still below the fold, so nothing already on screen blinks
      const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
      if (!below.length) return;
      gsap.set(below, { autoAlpha: 0, y: 12 });
      ScrollTrigger.batch(below, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out", stagger: 0.06, overwrite: true }),
      });
    });
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pathname]);

  // page changes inside a View Transition
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!("startViewTransition" in document) || reduced() || document.visibilityState !== "visible") return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.origin !== window.location.origin) return;
      if (a.pathname === window.location.pathname) return; // same page: anchors and filters scroll in place
      if (/\.(pdf|png|jpe?g|webp|svg)$/i.test(a.pathname)) return;
      e.preventDefault();
      e.stopPropagation(); // keep next/link from navigating a second time
      const href = a.pathname + a.search + a.hash;
      const vt = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timeout = window.setTimeout(resolve, 1200);
            arrived.current = () => {
              window.clearTimeout(timeout);
              // wait one frame so the new page has painted before the snapshot
              requestAnimationFrame(() => resolve());
            };
            router.push(href);
          }),
      );
      // a skipped transition (hidden tab, rapid clicks) still navigates; it just isn't animated
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
