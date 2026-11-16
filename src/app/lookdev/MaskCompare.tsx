"use client";

import { useState } from "react";
import { themes, themeCssVars, type MaskId } from "@/lib/themes";
import s from "./lookdev.module.css";

/** Swaps the hero render and the page tokens between the three candidate mask colours. */
export function MaskCompare() {
  const [mask, setMask] = useState<MaskId>("green");
  const t = themes[mask];
  return (
    <section className={s.compare} style={themeCssVars(t) as React.CSSProperties} aria-labelledby="mask-h">
      <div className="container">
        <div className={s.compareHead}>
          <h2 id="mask-h">Mask colour</h2>
          <div role="group" aria-label="Mask colour" className={s.switch}>
            {(Object.keys(themes) as MaskId[]).map((id) => (
              <button key={id} type="button" aria-pressed={mask === id} onClick={() => setMask(id)}>
                <span className={s.swatch} style={{ background: themes[id].mask }} aria-hidden="true" />
                {themes[id].label}
              </button>
            ))}
          </div>
        </div>
        <figure className={s.compareFig}>
          <picture>
            <source media="(max-width: 900px)" srcSet={`/lookdev/hero-${mask}-960.webp`} />
            <img src={`/lookdev/hero-${mask}-1920.webp`} alt={`The portfolio board rendered with a ${t.label.toLowerCase()}.`} width={1920} height={1080} />
          </picture>
          <figcaption className="silk">
            {t.label} · page ground {t.ground} · mask {t.mask}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
