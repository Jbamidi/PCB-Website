// Bounded model of the VisionVest output decision, written from the documented firmware
// behaviour. Illustrative command flow; not a firmware emulator.
//   - a phone command is live while (now - receivedAt) < ttlMs
//   - local ultrasonic hazards only participate in awareness mode
//   - precedence: danger hazard > live phone command > caution hazard > idle
//   - any active motor is driven at full duty (255) whatever intensity was requested

export type Zone = "front" | "back" | "left" | "right";
export type Mode = "awareness" | "object_nav";
export type HazardLevel = "danger" | "caution";

export type PhoneCommand = { direction: Zone; intensity: number; ttlMs: number; receivedAt: number };
export type Hazard = { sensor: Exclude<Zone, "front">; level: HazardLevel; distanceCm: number };

export type VestInput = { mode: Mode; command: PhoneCommand | null; hazards: Hazard[]; now: number };

export type OutputSource = "danger" | "phone" | "caution" | "idle";

export type VestOutput = {
  source: OutputSource;
  commandLive: boolean;
  requestedIntensity: number | null;
  duty: Record<Zone, number>;
  pattern: "steady" | "fast pulse" | "slow pulse" | "none";
};

export const FULL_DUTY = 255;
export const DANGER_CM = 80;
export const CAUTION_CM = 130;

export function hazardLevel(distanceCm: number): HazardLevel | null {
  if (distanceCm <= DANGER_CM) return "danger";
  if (distanceCm <= CAUTION_CM) return "caution";
  return null;
}

export function isLive(cmd: PhoneCommand | null, now: number): boolean {
  return cmd !== null && now - cmd.receivedAt < cmd.ttlMs;
}

const off = (): Record<Zone, number> => ({ front: 0, back: 0, left: 0, right: 0 });

export function decideOutput(input: VestInput): VestOutput {
  const live = isLive(input.command, input.now);
  const hazards = input.mode === "awareness" ? input.hazards : [];
  const requestedIntensity = live ? input.command!.intensity : null;

  const danger = hazards.filter((h) => h.level === "danger");
  if (danger.length) {
    const duty = off();
    danger.forEach((h) => (duty[h.sensor] = FULL_DUTY));
    return { source: "danger", commandLive: live, requestedIntensity, duty, pattern: "fast pulse" };
  }
  if (live) {
    const duty = off();
    duty[input.command!.direction] = FULL_DUTY;
    return { source: "phone", commandLive: true, requestedIntensity, duty, pattern: "steady" };
  }
  const caution = hazards.filter((h) => h.level === "caution");
  if (caution.length) {
    const duty = off();
    caution.forEach((h) => (duty[h.sensor] = FULL_DUTY));
    return { source: "caution", commandLive: false, requestedIntensity, duty, pattern: "slow pulse" };
  }
  return { source: "idle", commandLive: false, requestedIntensity, duty: off(), pattern: "none" };
}

export type Fixture = { id: string; label: string; note: string; mode: Mode; command: PhoneCommand; hazards: Hazard[] };

export const FIXTURES: Fixture[] = [
  {
    id: "expiry",
    label: "Object navigation, no hazard",
    note: "A front cue with a 300 ms lifetime, never refreshed. Ultrasonic sensing is off in this mode.",
    mode: "object_nav",
    command: { direction: "front", intensity: 150, ttlMs: 300, receivedAt: 0 },
    hazards: [],
  },
  {
    id: "caution",
    label: "Awareness, caution on the right",
    note: "A left cue while the right sensor reads 110 cm. The caution takes over when the cue expires.",
    mode: "awareness",
    command: { direction: "left", intensity: 150, ttlMs: 300, receivedAt: 0 },
    hazards: [{ sensor: "right", level: "caution", distanceCm: 110 }],
  },
  {
    id: "danger",
    label: "Awareness, obstacle behind",
    note: "The back sensor reads 60 cm. Danger outranks the phone cue, before and after it expires.",
    mode: "awareness",
    command: { direction: "front", intensity: 150, ttlMs: 300, receivedAt: 0 },
    hazards: [{ sensor: "back", level: "danger", distanceCm: 60 }],
  },
];
