import Link from "next/link";
import s from "./pages.module.css";

export default function NotFound() {
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <p className={`silk ${s.kicker}`}>DRC · unrouted net</p>
        <h1 className={s.title}>No net at this address</h1>
        <svg className={s.noNet} viewBox="0 0 520 60" aria-hidden="true">
          <path d="M0 30 H170 L190 18 H230" />
          <path d="M290 42 H330 L350 30 H520" />
          <circle cx="230" cy="18" r="6" />
          <circle cx="290" cy="42" r="6" />
          <g className={s.spark}>
            <path d="M252 22 l8 6 -5 3 9 7" />
          </g>
        </svg>
        <p className={s.lede}>
          The trace ends here: the link may be old or mistyped. Everything is reachable from <Link href="/projects">projects</Link>,{" "}
          <Link href="/experience">experience</Link> or the <Link href="/">board</Link>.
        </p>
      </header>
    </div>
  );
}
