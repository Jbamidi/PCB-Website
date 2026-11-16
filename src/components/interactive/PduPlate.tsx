"use client";

import Image from "next/image";
import { useState } from "react";
import { asset } from "@/content/publicAssets";
import { AssemblyExplorer } from "./AssemblyExplorer";
import styles from "./assembly.module.css";

/**
 * The PDU plate: the Blender render of the KiCad design by default, with the conceptual
 * exploded drawing one click away. Each view keeps its own caption so the two kinds of
 * evidence are never confused.
 */
export function PduPlate({ idPrefix }: { idPrefix: string }) {
  const render = asset("eco-illini-pdu-render");
  const [view, setView] = useState<"render" | "groups">(render.src ? "render" : "groups");

  return (
    <div>
      {render.src ? (
        <div role="group" aria-label="Board view" className={styles.views}>
          <button type="button" className="text-btn" aria-pressed={view === "render"} onClick={() => setView("render")}>
            Board render
          </button>
          <button type="button" className="text-btn" aria-pressed={view === "groups"} onClick={() => setView("groups")}>
            Functional groups
          </button>
        </div>
      ) : null}
      {view === "render" && render.src ? (
        <figure className={styles.renderFig}>
          <Image src={render.src} alt={render.alt} width={render.width} height={render.height} sizes="(max-width: 1023px) 100vw, 900px" priority className={styles.renderImg} />
          <figcaption className={styles.viewCaption}>
            <em>Render of the design file.</em> {render.caption}
          </figcaption>
        </figure>
      ) : (
        <figure className={styles.renderFig}>
          <AssemblyExplorer idPrefix={idPrefix} />
          <figcaption className={styles.viewCaption}>
            <em>Conceptual illustration.</em> The board drawn as four functional groups; positions are schematic, not CAD geometry.
          </figcaption>
        </figure>
      )}
    </div>
  );
}
