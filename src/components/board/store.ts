"use client";

import { useSyncExternalStore } from "react";

// Shared between the 3D board and the HTML part list: hovering or focusing a part in
// either lights it in both.
type State = {
  /** slug of the part under the pointer or keyboard focus */
  hovered: string | null;
  /** slug of the part the camera is flying into */
  flying: string | null;
  /** the live board is on screen (rather than the poster) */
  live: boolean;
  /** the scroll story's current stop, and the parts it outlines */
  stop: string;
  spot: string[];
};

let state: State = { hovered: null, flying: null, live: false, stop: "hero", spot: [] };
const listeners = new Set<() => void>();

export const boardStore = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

const serverState: State = { hovered: null, flying: null, live: false, stop: "hero", spot: [] };

export function useBoard<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(boardStore.subscribe, () => pick(state), () => pick(serverState));
}

/** sessionStorage key: the part a visitor flew into, so Back can fly out from it */
export const RETURN_KEY = "jb-board-return";
/** localStorage key: "off" when the visitor chose the plain list over the live board */
export const LIVE_KEY = "jb-board-3d";
