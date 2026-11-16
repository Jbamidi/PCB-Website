"use client";

import { useLayoutEffect, useState } from "react";
import { gsap } from "gsap";
import { BOARD_READY_EVENT, power, powerDown, powerUp } from "@/components/board/power";
import { playClick, playHum } from "@/lib/sound";

const SEEN = "jb-powered";

/**
 * The homepage power-on, played over the hero (the section holding this component).
 *
 * With the live 3D board, on a first visit: the hero waits in the dark until the board has
 * drawn, then one timeline runs both. The PWR LED flickers on, the 5 V trace draws from
 * the USB-C input to the regulators, the three rail LEDs light in turn, light spreads
 * across the board from the power section outward, the name prints, and the camera
 * eases up from a low angle into the hero view (about 2.4 s).
 *
 * Without it (phones, 3D off): the same beats on the poster image in about 1.8 s.
 * Repeat visits get a 0.6 s fade. Any key, click, wheel or touch, or Skip, jumps to the end.
 * Parts are marked with data-po; with reduced motion nothing here runs.
 */
export function PowerOn() {
  const [running, setRunning] = useState(false);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>("[data-po-root]");
    if (!root) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
      sessionStorage.setItem(SEEN, "1");
    } catch {}
    const live = document.documentElement.hasAttribute("data-board-live") && window.scrollY < 40;

    const q = (sel: string) => root.querySelectorAll<HTMLElement>(`[data-po="${sel}"]`);
    const [board, name, rest] = [q("board"), q("name"), q("rest")];
    const all = [...board, ...name, ...rest];

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
      onComplete: () => {
        gsap.set(all, { clearProps: "all" });
        powerUp();
        setRunning(false);
      },
    });

    // the beats shared by both versions, on the page's own text: the name prints, then its line
    const pageBeats = (nameAt: number, restAt: number) => {
      gsap.set(name, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(rest, { autoAlpha: 0, y: 12 });
      tl.to(name, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power2.inOut" }, nameAt)
        .to(rest, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.06 }, restAt)
        .call(() => playClick(), [], 0.15);
    };

    if (seen) {
      tl.fromTo(board, { filter: "brightness(0.15)" }, { filter: "brightness(1)", duration: 0.5 })
        .fromTo([...name, ...rest], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.04 }, 0.1);
    } else if (live) {
      setRunning(true);
      powerDown();
      pageBeats(1.15, 1.6);
      tl.to(power, { pwr: 1, duration: 0.04, ease: "none" }, 0.15)
        .to(power, { pwr: 0.3, duration: 0.04, ease: "none" })
        .to(power, { pwr: 1, duration: 0.04, ease: "none" })
        .to(power, { trace: 1, duration: 0.55, ease: "power2.inOut" }, 0.3)
        .to(power, { rails: 1, duration: 0.54, ease: "none" }, 0.6)
        .to(power, { reveal: 1, duration: 0.9, ease: "power2.inOut" }, 0.95)
        .to(power, { traceFade: 1, duration: 0.5, ease: "power1.in" }, 1.35)
        .to(power, { settle: 1, duration: 1.2, ease: "expo.out" }, 1.2)
        .call(() => playHum(), [], 0.9);
    } else {
      setRunning(true);
      gsap.set(board, { filter: "brightness(0.04) saturate(0.4)" });
      pageBeats(1.1, 1.5);
      tl.to(board, { filter: "brightness(1) saturate(1)", duration: 0.7, ease: "power2.inOut" }, 0.9).call(() => playHum(0.6, 0.4, 1.2), [], 0.9);
    }

    const start = () => {
      root.removeAttribute("data-po-pending");
      tl.play();
    };
    // the live version starts with the board: wait for its first frame (or give up and run anyway)
    let waiting = 0;
    const onReady = () => {
      window.clearTimeout(waiting);
      start();
    };
    if (live && !seen) {
      window.addEventListener(BOARD_READY_EVENT, onReady, { once: true });
      waiting = window.setTimeout(onReady, 3500);
    } else start();

    const skip = () => tl.progress(1);
    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));
    return () => {
      window.clearTimeout(waiting);
      window.removeEventListener(BOARD_READY_EVENT, onReady);
      events.forEach((e) => window.removeEventListener(e, skip));
      tl.progress(1).kill();
      powerUp();
    };
  }, []);

  return running ? (
    <button type="button" className="po-skip">
      Skip
    </button>
  ) : null;
}
