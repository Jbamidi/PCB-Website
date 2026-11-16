"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { search, type SearchEntry } from "./searchIndex";
import s from "./nav.module.css";

const OPEN_EVENT = "jb-search-open";

/** The header button that opens net search (and shows its shortcut) */
export function SearchButton() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return (
    <button type="button" className={s.searchButton} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} aria-keyshortcuts="Control+K Meta+K /">
      <span>Search</span>
      <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

/**
 * Net search: like probing a net by name. Ctrl K, ⌘K or / opens it from anywhere; type a
 * part (U3), a project, a section or a skill; arrow keys move, Enter opens, Esc closes.
 */
export function NetSearch({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => search(index, query), [index, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const open = () => {
      if (dialog.current?.open) return;
      setQuery("");
      dialog.current?.showModal();
      requestAnimationFrame(() => input.current?.focus());
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (e: SearchEntry) => {
    dialog.current?.close();
    router.push(e.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <dialog ref={dialog} className={s.search} aria-label="Search the site" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className={s.searchPanel}>
        <div className={s.searchField}>
          <span className="silk" aria-hidden="true">Net</span>
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="A part (U3), project, section or skill"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id={listId} role="listbox" className={s.results} aria-label="Results">
          {results.map((r, i) => (
            <li
              key={`${r.href}-${r.title}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(r)}
            >
              <span className={s.resultKind}>{r.ref ?? r.kind}</span>
              <span className={s.resultText}>
                <span className={s.resultTitle}>{r.title}</span>
                {r.detail ? <span className={s.resultDetail}>{r.detail}</span> : null}
              </span>
              <span className={s.resultTag}>{r.kind}</span>
            </li>
          ))}
          {!results.length ? <li className={s.noResults}>No net by that name.</li> : null}
        </ul>
        <p className={s.searchHint} aria-hidden="true">
          <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open
        </p>
      </div>
    </dialog>
  );
}
