import type { CaseStudy } from "@/lib/types";

export const experiences: CaseStudy[] = [
  {
    slug: "archer-aviation",
    kind: "experience",
    title: "Archer Aviation",
    line: "Test-stand flow-controller board and firmware, plus HV stand wiring, instrument automation and reliability planning.",
    summary:
      "Designed the board and firmware for a network-controlled cooling-flow controller on inverter test stands. Also wired a 1000 V reliability stand and automated its setup.",
    categories: ["pcb", "embedded"],
    domain: "PCB design, bring-up and test",
    status: "Internship · completed",
    role: "Electrical Engineering Intern",
    timeframe: "May – August 2026 · San Jose, California",
    tools: ["Altium Designer", "ATmega328P", "W5500", "LM358", "C++", "Python", "SCPI", "CAN-FD"],
    problem:
      "Cooling flow on an inverter test stand was set by hand. I built the board that sets it over the network and closes the loop on measured flow.",
    intro: [
      "I owned the board end to end: architecture, Altium schematic and two-layer layout, fabrication outputs, sourcing, assembly, firmware and bring-up.",
      "I also wired a 1000 V reliability stand for three inverters, automated instrument and CAN-FD gateway setup, and corrected a reliability test plan.",
    ],
    composition: "plate",
    outcomes: [
      { text: "Validated the 0–10 V command and feedback paths with injected voltages and ADC readback; three boards went onto inverter test stands.", kind: "reported" },
      { text: "Replaced a four-stage manual CAN-FD gateway setup with one Python script, checked against reference configurations.", kind: "reported" },
      { text: "Corrected a Coffin-Manson acceleration factor from 12.7 to 7.7 and derived a roughly 43-day chamber schedule.", kind: "reported" },
    ],
    limits: [
      "The 43-day schedule is a plan, not a completed qualification campaign.",
      "Diagrams are generalised; no internal schematics or bench details are shown.",
    ],
    highlight: {
      label: "Debugging",
      title: "A 0.9 Ω short across the 24 V input",
      body: "The first board measured 0.9 Ω from 24 V to ground. A copper-clearance rule had been entered in the wrong units, so the ground pour reached through-hole pads. I traced it from the measurement to the rule and specified the corrected revision.",
    },
    details: [
      {
        id: "context",
        title: "Why the stand needed it",
        body: [
          "The old controller was a potentiometer and a local display. The new board runs from the 24 V stand supply and drives an external valve driver; it never powers the valve itself.",
          "A hardwired E-STOP stops the stand. The firmware only decides what happens when the network goes quiet.",
        ],
      },
      {
        id: "architecture",
        title: "Signal chain and firmware",
        body: [
          "A W5500 Ethernet controller passes setpoints to an ATmega328P. PWM through an RC filter gives 0–5 V, and an LM358 stage with a gain of two makes the 0–10 V valve command.",
          "Flow feedback is divided into the ADC range. The firmware runs feedback control with anti-windup, reports telemetry and drops a stale command after 5 s without communication. Loop tuning was not finished as a response optimisation.",
        ],
      },
      {
        id: "testing",
        title: "Other bring-up and test work",
        body: [
          "Firmware review caught a revision written for a different Arduino MCU family, with a different SPI map and watchdog behaviour.",
          "Supply control wrote, read back and verified every channel before enabling outputs.",
          "The reliability plan had applied the worst-case temperature swing to every service cycle and used a board that was not the worst thermal case. Fixing both changed the acceleration factor.",
        ],
      },
    ],
    decisions: [
      {
        title: "PWM and an RC filter instead of a DAC",
        choice: "Filter an MCU timer output into an analog level.",
        alternative: "a separate DAC.",
        tradeoff: "Fewer parts, but ripple and settling time tie the PWM rate, filter corner and loop rate together.",
      },
      {
        title: "A gain stage between MCU and valve",
        choice: "A nominal 2× op-amp stage from 0–5 V to 0–10 V.",
        alternative: "rescaling at the driver.",
        tradeoff: "Matches the driver's range, but full scale depends on amplifier headroom and loading.",
      },
      {
        title: "A communication fail-safe",
        choice: "Drop the setpoint after 5 s of silence.",
        alternative: "holding the last value.",
        tradeoff: "A stale command can't hold a valve open; it complements the hardwired interlocks rather than replacing them.",
      },
    ],
    links: [],
    related: ["eco-illini", "hardware-guitar-tuner"],
  },
  {
    slug: "eco-illini",
    kind: "experience",
    title: "Eco Illini",
    line: "A four-layer power distribution board I designed for a student energy-efficiency car, plus Joule Meter team leadership.",
    summary:
      "Designed and laid out the car's four-layer power distribution board, then assembled and validated it in the vehicle. I also lead the PDU and Joule Meter teams.",
    categories: ["pcb", "embedded"],
    domain: "Power distribution and measurement",
    status: "Ongoing · board fabricated and in the vehicle",
    role: "Power Distribution Unit Lead",
    timeframe: "August 2025 – present · Champaign, Illinois",
    tools: ["KiCad", "LTspice", "Oscilloscope", "STM32", "INA228", "CAN", "SPI", "I2C"],
    problem:
      "One 36 V battery powers every subsystem on the car. The power distribution board turns it into protected 12 V and 3.3 V supplies.",
    intro: [
      "I designed the schematic, chose the parts and laid out the four-layer board in KiCad. I assembled the fabricated board and validated it on the bench and in the car.",
      "I also lead the PDU and Joule Meter teams. On the Joule Meter I wrote the STM32 measurement firmware; its board layout was a team effort.",
    ],
    composition: "plate",
    outcomes: [
      { text: "Both rails held under 50 mV peak-to-peak ripple, in LTspice and on the bench.", kind: "reported" },
      { text: "Joule Meter energy readings within 1% of a calibrated supply, using an INA228 on a 10 mΩ shunt.", kind: "reported" },
      { text: "30% fewer prototype iteration cycles year over year across both teams.", kind: "reported" },
    ],
    limits: ["These are summary figures; scope captures and calibration logs aren't shown yet."],
    highlight: {
      label: "Design decision",
      title: "Protection on the board itself",
      body: "Fusing, reverse-polarity protection and the E-STOP path live on the PDU. A reversed connector or a downstream short during student assembly stays a contained failure instead of reaching the whole car.",
    },
    details: [
      {
        id: "context",
        title: "Constraints",
        body: [
          "Several teams build boards on different schedules, and the PDU is where they all meet. It is fabricated outside and hand-assembled by students, so parts and layout had to suit rework.",
        ],
      },
      {
        id: "architecture",
        title: "Power and protection",
        body: [
          "Power enters through fusing, reverse-polarity protection and the E-STOP path. Buck converters and LDO regulators produce the 12 V and 3.3 V rails, and the board carries temperature sensing.",
          "Measurement is a separate branch: the INA228 reads the shunt, the STM32 turns its registers into energy, and the result goes out over CAN, SPI and I2C.",
        ],
      },
      {
        id: "testing",
        title: "Bring-up and testing",
        body: [
          "Validation covered load regulation, transient response, thermal behaviour and in-vehicle integration. Ripple was checked in LTspice first, then with an oscilloscope.",
          "Regulator part numbers, board dimensions and rail currents are left off this page.",
        ],
      },
    ],
    decisions: [
      {
        title: "Buck conversion first, LDO where it helps",
        choice: "Switching regulators for the big step down from 36 V.",
        alternative: "linear regulation throughout.",
        tradeoff: "A linear drop from 36 V turns most of the power into heat; bucks fix that but add ripple and layout sensitivity.",
      },
      {
        title: "Four layers",
        choice: "A four-layer stack.",
        alternative: "a cheaper two-layer board.",
        tradeoff: "Costs more, but solid reference planes keep return paths and regulator loops tight.",
      },
    ],
    links: [],
    related: ["archer-aviation", "high-speed-fpga-pcb"],
    heroAsset: "pdu-editorial-plate",
  },
  {
    slug: "spatial-audio-research",
    kind: "experience",
    title: "Spatial Audio Research",
    shortTitle: "Spatial Audio",
    line: "Headphone audio that stays fixed in the room while the listener turns, with head-pose prediction.",
    summary:
      "Research with Prof. Yu-Lin Wei on headphone audio that stays fixed in the room as you turn. I built the head-tracking and rendering pipeline and a head-pose predictor.",
    categories: ["dsp", "embedded"],
    domain: "Signal processing research",
    status: "Ongoing · undergraduate research",
    role: "Undergraduate Researcher, advised by Prof. Yu-Lin Wei",
    timeframe: "August 2025 – present · UIUC",
    tools: ["Python", "SciPy", "MPU6050", "I2C", "CIPIC HRTF data"],
    problem:
      "Sound in headphones should stay put in the room when you turn your head. That means updating its direction as fast as you move.",
    intro: [
      "I built a real-time pipeline that reads an MPU6050 head tracker and renders binaural audio with FFT convolution in Python.",
      "I also trained a sequence model on inertial and audio features to predict head pose 100 ms ahead.",
    ],
    composition: "research",
    outcomes: [
      { text: "Sources stay world-locked under live head motion.", kind: "reported" },
      { text: "Interpolating between measured ear responses replaced nearest-neighbour lookup, so filters change smoothly.", kind: "reported" },
      { text: "Head pose predicted 100 ms ahead from inertial and audio features.", kind: "reported" },
    ],
    limits: [
      "100 ms is how far ahead the model predicts, not a measured latency reduction.",
      "Model details, accuracy and listening tests aren't published yet.",
    ],
    highlight: {
      label: "Design decision",
      title: "Blend, don't snap",
      body: "Using the nearest measured direction makes the sound jump as you turn. Blending the three nearest directions with barycentric weights keeps it smooth, at the cost of more computation per update.",
    },
    details: [
      {
        id: "context",
        title: "How world-locked audio works",
        body: [
          "Binaural rendering filters a sound with one impulse response per ear, chosen for the direction it should come from. If the filters don't follow the head, the sound turns with you.",
          "So the renderer needs head orientation, the source's direction relative to the head, ear filters for that direction, and convolution fast enough to still match the head when heard.",
        ],
      },
      {
        id: "architecture",
        title: "Pipeline",
        body: [
          "The coordinate step subtracts head yaw from the source's world bearing; a predicted pose can stand in for the measured one. The result picks a blend of measured HRIR directions from CIPIC data, applied block by block.",
        ],
      },
    ],
    decisions: [
      {
        title: "Predict the pose",
        choice: "A learned predictor with a 100 ms horizon.",
        alternative: "rendering with the latest measured pose.",
        tradeoff: "Can offset pipeline delay, but prediction error becomes its own source of misplacement and has to be evaluated separately.",
      },
    ],
    links: [],
    related: ["hardware-guitar-tuner", "visionvest"],
    heroAsset: "spatial-audio-concept",
  },
];
