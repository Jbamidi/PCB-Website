export const profile = {
  name: "Jashwanth Bamidi",
  first: "Jashwanth",
  last: "Bamidi",
  line: "Computer Engineering / UIUC",
  school: "University of Illinois Urbana-Champaign",
  degree: "BS Computer Engineering",
  graduation: "Expected May 2028",
  gpa: "3.8 / 4.00",
  email: "jassubamidi24@gmail.com",
  github: "https://github.com/Jbamidi",
  linkedin: "https://www.linkedin.com/in/jashwanthbamidi",
  // raw <a>/<object> paths need the GitHub Pages base path; next/link adds it itself
  resumePdf: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/resume/Jashwanth_Bamidi_Resume.pdf`,
  intro:
    "I design circuit boards, bring them up on the bench, and write the firmware and FPGA logic that put them to work. I study Computer Engineering at Illinois.",
  closing:
    "I'm a Computer Engineering student at Illinois, graduating in May 2028. I like owning a board from block diagram to bench, and I'm looking for roles in PCB design, board bring-up and hardware test.",
  coursework: [
    "Electronic Circuits",
    "Digital Signal Processing",
    "Advanced Digital Projects Lab",
    "FPGA Laboratory",
    "Digital Logic Design",
    "Advanced Digital Design",
    "Computer Organization and Design",
    "Computer Architecture",
    "Computer Systems",
    "Data Structures",
  ],
};

export type SkillGroup = { title: string; items: string; evidence: { label: string; href: string }[] };

export const skillGroups: SkillGroup[] = [
  {
    title: "PCB and hardware design",
    items: "Altium Designer, KiCad, schematic capture, layout, power-tree design, buck and LDO regulation, protection circuits, footprints, LTspice, DRC, BOM, Gerber/NC drill outputs",
    evidence: [
      { label: "Eco Illini PDU", href: "/experience/eco-illini" },
      { label: "Archer flow controller", href: "/experience/archer-aviation" },
    ],
  },
  {
    title: "Bring-up and test",
    items: "Board bring-up, failure analysis, load, transient and thermal testing, reliability planning, SCPI automation, oscilloscope, waveform generator, logic analyzer, soldering and rework",
    evidence: [
      { label: "Clearance-units short", href: "/experience/archer-aviation#highlight" },
      { label: "Comparator collapse", href: "/projects/hardware-guitar-tuner#highlight" },
    ],
  },
  {
    title: "Embedded and interfaces",
    items: "Bare-metal C/C++, ATmega328P, STM32, ESP32, CAN and CAN-FD, Ethernet, SPI, I2C, UART, BLE",
    evidence: [
      { label: "VisionVest", href: "/projects/visionvest" },
      { label: "INA228 measurement", href: "/experience/eco-illini#contribution" },
    ],
  },
  {
    title: "Digital design and software",
    items: "SystemVerilog, Verilog, Vivado, Quartus, ModelSim, Python, C, C++, MATLAB, CUDA, Git, Linux",
    evidence: [
      { label: "FPGA Edge Detection", href: "/projects/fpga-edge-detection" },
      { label: "RISC-V pipeline", href: "/projects/risc-v-cpu" },
    ],
  },
];
