export type EvidenceKind =
  | "measured"
  | "simulated"
  | "analytical"
  | "illustrative"
  | "reported"
  | "planned"
  | "proposed"
  | "browser"
  | "cad"
  | "conceptual";

export const evidenceLabel: Record<EvidenceKind, string> = {
  measured: "Measured result",
  simulated: "Simulated",
  analytical: "Analytical model",
  illustrative: "Illustrative",
  reported: "Reported result",
  planned: "Planned",
  proposed: "Proposed architecture",
  browser: "Browser demonstration",
  cad: "Render of the design file",
  conceptual: "Conceptual illustration",
};

/** Outcome kinds worth naming inline; ordinary stated results read better unlabeled. */
export const flaggedOutcomeKinds: EvidenceKind[] = ["planned", "proposed", "simulated", "measured"];

export type Category = "pcb" | "fpga" | "embedded" | "dsp";

export const categoryLabel: Record<Category, string> = {
  pcb: "PCB & analog",
  fpga: "FPGA & digital",
  embedded: "Embedded",
  dsp: "DSP & GPU",
};

export type Decision = { title: string; choice: string; alternative: string; tradeoff: string };
export type Outcome = { text: string; kind: EvidenceKind };
export type Section = { id: string; title: string; body: string[] };
export type ExternalLink = { label: string; href: string };

export type Composition = "plate" | "signal" | "research";

/** The one decision or debugging story shown up front on a detail page. */
export type Highlight = { label: string; title: string; body: string };

export type CaseStudy = {
  slug: string;
  kind: "experience" | "project";
  title: string;
  shortTitle?: string;
  /** Index entry, 15–25 words */
  line: string;
  /** Homepage / index summary */
  summary: string;
  categories: Category[];
  domain: string;
  status: string;
  role: string;
  timeframe?: string;
  tools: string[];
  /** Lede under the title: what it does and why it matters */
  problem: string;
  /** "What I did": personal contribution, one or two short paragraphs */
  intro: string[];
  introTitle?: string;
  /** Open design questions, for work in progress */
  questions?: string[];
  composition: Composition;
  outcomes: Outcome[];
  resultTitle?: string;
  /** Limits that change how a result should be read; always visible */
  limits: string[];
  highlight: Highlight;
  demoIntro?: string;
  /** Deeper notes, each a named expandable section. Ids double as anchors. */
  details: Section[];
  /** Secondary decisions, shown in their own expandable section (#decisions) */
  decisions: Decision[];
  links: ExternalLink[];
  related: string[];
  heroAsset?: string;
};

