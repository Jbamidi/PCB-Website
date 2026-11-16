"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { onSoundChange, setSound, soundOn } from "@/lib/sound";
import { SearchButton } from "@/components/nav/NetSearch";
import { LiveToggle } from "@/components/board/LiveBoard";
import styles from "./layout.module.css";

const NAV = [
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // close on navigation
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // the PWR badge doubles as the sound switch (off until the visitor turns it on)
  const [sound, setSoundState] = useState(false);
  useEffect(() => {
    setSoundState(soundOn());
    return onSoundChange(setSoundState);
  }, []);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.brand}>
          <button
            type="button"
            className={styles.pwr}
            aria-pressed={sound}
            aria-label="Bench sounds"
            title={sound ? "Sound on: relay click and mains hum" : "Sound off"}
            onClick={() => setSound(!sound)}
          >
            <i />
            PWR
            <span className={styles.pwrSound} aria-hidden="true">{sound ? "♪" : ""}</span>
          </button>
          <LiveToggle />
          <Link href="/" className={styles.name} aria-current={pathname === "/" ? "page" : undefined}>
            {profile.name}
          </Link>
        </div>
        <SearchButton />
        <nav aria-label="Primary" className={styles.nav}>
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          ref={buttonRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <div
        id="mobile-menu"
        ref={panelRef}
        className={styles.mobilePanel}
        hidden={!open}
        onBlur={(e) => {
          // dismiss when focus leaves both the panel and its trigger
          const next = e.relatedTarget as Node | null;
          if (next && !panelRef.current?.contains(next) && next !== buttonRef.current) setOpen(false);
        }}
      >
        <nav aria-label="Primary, mobile" className="container">
          <ul>
            <li><Link href="/">Home</Link></li>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
            <li><Link href="/#contact">Contact</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
