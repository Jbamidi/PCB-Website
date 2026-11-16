// Single source of truth for colour. The selected mask sets CSS custom properties on
// <html>; the 3D board and the Blender look-dev script use the same values.

export type MaskId = "green" | "black" | "blue";

export type Theme = {
  id: MaskId;
  label: string;
  /** page ground, the board at night */
  ground: string;
  /** solder mask colour on the board itself */
  mask: string;
  /** raised panels, instrument bezels */
  raised: string;
  /** pad outlines and quiet rules */
  rule: string;
  /** silkscreen white: body text */
  silk: string;
  muted: string;
  copper: string;
  gold: string;
  /** cobalt signal: links, hover path, selection */
  signal: string;
  /** status LEDs: built or demonstrated / in progress or planned */
  ledOn: string;
  ledPlanned: string;
};

const shared = {
  silk: "#ECE9DF",
  copper: "#C9814B",
  gold: "#D8B46A",
  signal: "#5B86FF",
  ledOn: "#5EDC9C",
  ledPlanned: "#FFB648",
};

export const themes: Record<MaskId, Theme> = {
  green: { id: "green", label: "Green-black mask", ground: "#0C1512", mask: "#0F3A27", raised: "#132019", rule: "#1F3329", muted: "#93A39A", ...shared },
  black: { id: "black", label: "Matte black mask", ground: "#0D0F10", mask: "#141617", raised: "#17191B", rule: "#272A2D", muted: "#9A9EA2", ...shared },
  blue: { id: "blue", label: "Deep blue mask", ground: "#0B1220", mask: "#0C1E3D", raised: "#121B2C", rule: "#1F2C44", muted: "#97A3B8", ...shared },
};

/** The mask in use. Change this one line to re-skin the site; Phase 0 compares all three. */
export const MASK: MaskId = "green";
export const theme = themes[MASK];

export function themeCssVars(t: Theme): Record<string, string> {
  return {
    "--ground": t.ground,
    "--mask": t.mask,
    "--raised": t.raised,
    "--rule": t.rule,
    "--silk": t.silk,
    "--muted": t.muted,
    "--copper": t.copper,
    "--gold": t.gold,
    "--signal": t.signal,
    "--led-on": t.ledOn,
    "--led-planned": t.ledPlanned,
    // names the pages carried over from Website_2.0 use, mapped onto the board palette
    "--paper": t.ground,
    "--surface": t.raised,
    "--ink": t.silk,
    "--accent": t.signal,
    "--accent-2": t.copper,
    "--on-accent": t.ground,
  };
}

/** Chart colours: series 1 is the primary path, series 2 the second. */
export const chartColors = {
  series1: theme.signal,
  series2: theme.copper,
  axis: theme.muted,
  grid: theme.rule,
  ink: theme.silk,
};
