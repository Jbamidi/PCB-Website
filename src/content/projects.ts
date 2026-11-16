import type { CaseStudy } from "@/lib/types";

export const projects: CaseStudy[] = [
  {
    slug: "high-speed-fpga-pcb",
    kind: "project",
    title: "High Speed FPGA PCB",
    line: "A planned FPGA and DDR memory board for learning power delivery and signal integrity before fabrication.",
    summary:
      "Planning a custom FPGA board with external DDR memory, several power rails and debug access, to learn how those constraints shape a board before fabrication.",
    questions: [
      "Which FPGA and memory pairing can be routed and assembled?",
      "How should four low-voltage rails start up from 5 V?",
      "What test access will isolate a first-power fault?",
    ],
    categories: ["pcb", "fpga"],
    domain: "PCB & analog",
    status: "In progress · Planning",
    role: "Sole designer",
    tools: ["Altium Designer (planned)", "Vivado / MIG (candidate)"],
    problem: "A planned FPGA board with external DDR memory, for learning what a high-speed memory interface demands before committing to a layout.",
    intro: [
      "Planned: an FPGA with x16 DDR3L memory, four buck rails from 5 V, configuration flash, JTAG and UART debug, test points, and possibly Ethernet.",
      "Spartan-7 is the leading candidate; every part is still a candidate.",
    ],
    introTitle: "What is planned",
    resultTitle: "Current state",
    composition: "plate",
    outcomes: [{ text: "Requirements, interface budget and candidate power tree drafted.", kind: "planned" }],
    limits: [
      "No completed schematic, layout, fabricated board or DDR measurement yet.",
      "Rail values and parts are preliminary.",
    ],
    highlight: {
      label: "Design decision",
      title: "Plan for staged bring-up",
      body: "Each rail gets its own enable, plus test points and debug access, so the first power-up can isolate one fault at a time. It costs parts and board area.",
    },
    details: [
      {
        id: "context",
        title: "Why this board",
        body: [
          "My finished boards are power and control boards. A memory interface adds controlled impedance, byte-lane skew, reference planes, BGA escape and rails that must come up in order.",
        ],
      },
      {
        id: "architecture",
        title: "Planned power and memory",
        body: [
          "A protected 5 V bus, from USB-C or an external supply, feeds core, auxiliary, memory and I/O regulators. ECP5 is the alternative FPGA to evaluate.",
          "Why bucks: an LDO from 5 V to 1 V at 0.5 A would waste 2 W to deliver 0.5 W.",
        ],
      },
      {
        id: "testing",
        title: "Planned bring-up order",
        body: [
          "Inspection and resistance checks, current-limited first power, each rail and its sequencing, clock and reset, JTAG, then walking-bit and address memory tests, and later thermal and signal-integrity measurements.",
        ],
      },
    ],
    decisions: [
      {
        title: "Use proven memory-controller IP",
        choice: "Evaluate vendor or open controller IP.",
        alternative: "writing a controller.",
        tradeoff: "Keeps the project about the board.",
      },
    ],
    links: [],
    related: ["eco-illini", "fpga-edge-detection"],
  },
  {
    slug: "visionvest",
    kind: "project",
    title: "VisionVest",
    line: "A haptic vest that turns phone camera guidance into vibration, and drops commands that go stale.",
    summary:
      "A vest that guides its wearer by touch. A phone camera picks a direction and the vest buzzes front, back, left or right. I built the vest's controller, sensors and motor drive.",
    categories: ["embedded"],
    domain: "Embedded",
    status: "Hackathon prototype",
    role: "Firmware, protocol and hardware integration",
    timeframe: "StarkHacks 2026",
    tools: ["ESP32-S3", "C++", "BLE", "JSON", "Ultrasonic sensors", "PWM", "Core ML", "React"],
    problem: "A vest that guides its wearer with vibration, leaving their ears free. A phone camera decides the direction; the vest delivers it.",
    intro: [
      "I built the vest side: ESP32-S3 firmware, three ultrasonic rangefinders, four motor channels and a Wi-Fi telemetry dashboard.",
      "The firmware checks every phone command and lets it expire after 300 ms.",
    ],
    composition: "plate",
    outcomes: [
      { text: "Demonstrated at StarkHacks 2026, with a live dashboard of commands, motors and hazards.", kind: "reported" },
      { text: "Every command type- and range-checked; duplicates rejected; stale commands expire after 300 ms.", kind: "reported" },
      { text: "Nonblocking three-sensor ultrasonic sensing with five-sample filtering.", kind: "reported" },
    ],
    limits: ["A hackathon prototype: no user study, clinical validation or perception-accuracy figures."],
    highlight: {
      label: "Design decision",
      title: "Commands that expire",
      body: "Each phone command lives for 300 ms after it arrives. If the phone pauses or disconnects, the motor stops instead of buzzing on an old decision.",
    },
    demoIntro: "Pick a case and drag the time slider.",
    details: [
      {
        id: "context",
        title: "Why split the phone and the vest",
        body: [
          "The phone is good at camera perception; a microcontroller is good at sensors and motors. BLE between them carries small decisions, not video, and isn't deterministic.",
        ],
      },
      {
        id: "architecture",
        title: "Firmware and command handling",
        body: [
          "Each BLE write is one JSON command: mode, direction, intensity, pattern, priority, lifetime, confidence, distance and sequence number. The firmware checks each field and stamps the arrival time.",
          "Every loop it expires stale commands, reads the sensors, then arbitrates: local danger alert, live phone command, local caution, idle. Ultrasonic hazards only count in awareness mode.",
          "This firmware version drives every active motor at full duty: a command asking for 150 produces 255. Direction and pulse pattern tell cues apart, and the dashboard shows requested and applied values side by side.",
        ],
      },
    ],
    decisions: [
      {
        title: "A narrow interface",
        choice: "Perception on the phone, sensing and motors on the ESP32, joined by one small JSON command.",
        alternative: "streaming frames or doing everything on the phone.",
        tradeoff: "Easy to log, but the JSON has to fit the BLE write size.",
      },
      {
        title: "Show requested and applied output",
        choice: "Telemetry reports both the command and what the motors do.",
        alternative: "debugging by feel.",
        tradeoff: "Makes overrides and full-duty output visible at a glance.",
      },
    ],
    links: [
      { label: "Devpost write-up", href: "https://devpost.com/software/visionvest" },
      { label: "Prototype video", href: "https://www.youtube.com/watch?v=Fluu49cXkIo" },
    ],
    related: ["fpga-edge-detection", "spatial-audio-research"],
    heroAsset: "visionvest-system-portrait",
  },
  {
    slug: "hardware-guitar-tuner",
    kind: "project",
    title: "Hardware Guitar Tuner",
    line: "An analog circuit that says whether a guitar note is sharp or flat, using two filters around 660 Hz.",
    summary:
      "Tells you whether a guitar note is sharp or flat using only analog circuits. I designed it on a breadboard and used test tones and a scope to find the wiring fault that broke it.",
    categories: ["pcb"],
    domain: "PCB & analog",
    status: "Breadboard build · indicator demonstrated",
    role: "Analog design and bench debugging",
    timeframe: "2025",
    tools: ["Op-amps", "RLC filters", "Peak detectors", "Comparators", "Oscilloscope", "Waveform generator"],
    problem: "An analog circuit that tells you whether a guitar note is sharp or flat. No microcontroller, no software.",
    intro: [
      "I designed the signal chain on a breadboard: microphone front end, gain stages, two band-pass filters near 630 and 690 Hz, peak detectors and a comparator driving an above/below indicator.",
      "I also designed an H-bridge motor stage for peg correction.",
    ],
    composition: "plate",
    outcomes: [
      { text: "Above/below indication working on injected test tones.", kind: "reported" },
      { text: "Each stage characterised with a waveform generator and oscilloscope.", kind: "reported" },
    ],
    limits: [
      "The motor stage was designed, not demonstrated as an auto-tuner.",
      "The curves here are a model with an assumed Q of 12, not measurements.",
    ],
    highlight: {
      label: "Debugging",
      title: "A comparator that failed only when connected",
      body: "Joining the comparator to the decision logic collapsed its output; disconnected, it worked. That pointed at the interface, not the comparator. The cause was a wiring short, and fixing it restored the indicator.",
    },
    demoIntro: "Drag the test tone to read both filter levels.",
    details: [
      {
        id: "context",
        title: "How two filters decide",
        body: [
          "The target is the high E string at the twelfth fret, about 660 Hz. Whichever filter responds more strongly says which way the note is off, and since both scale with pluck strength, volume matters less.",
          "Equal spacing doesn't mean equal response at 660 Hz: even the ideal model crosses near 659.3 Hz, and real tolerances move it further.",
        ],
      },
      {
        id: "architecture",
        title: "Signal chain",
        body: [
          "Each filter feeds a peak detector that turns the AC response into a slow envelope. The comparator sees the difference and the decision logic drives the indicator; the designed motor stage would take that sign as a direction.",
          "Targeting 660 Hz instead of 330 Hz cuts the needed LC product by four, which makes practical component values easier.",
        ],
      },
    ],
    decisions: [
      {
        title: "Compare amplitudes instead of counting cycles",
        choice: "Two resonant paths and an envelope comparison.",
        alternative: "zero-crossing timing or a microcontroller.",
        tradeoff: "Pure analog and mostly volume-independent, but the crossover moves when the two paths don't match.",
      },
      {
        title: "Inject known tones first",
        choice: "Characterise each stage with a waveform generator.",
        alternative: "tuning the whole chain with a guitar.",
        tradeoff: "Separates electronics problems from acoustic ones, at the cost of a second test round with the microphone.",
      },
    ],
    links: [],
    related: ["archer-aviation", "spatial-audio-research"],
    heroAsset: "tuner-analog-detail",
  },
  {
    slug: "fpga-edge-detection",
    kind: "project",
    title: "FPGA Edge Detection",
    line: "Live camera video in, edge outlines out on HDMI, all in FPGA hardware across three clock domains.",
    summary:
      "Live edge detection in hardware: camera video goes into an FPGA and comes out on an HDMI monitor as outlines. I wrote the whole pipeline in SystemVerilog.",
    categories: ["fpga"],
    domain: "FPGA & digital",
    status: "Built and demonstrated",
    role: "Sole designer",
    timeframe: "2026",
    tools: ["SystemVerilog", "Vivado", "XDC constraints", "OV7670", "SCCB / I2C", "HDMI / TMDS"],
    problem: "Live video from a small camera goes into an FPGA and comes out on an HDMI monitor as edge outlines.",
    intro: [
      "I wrote the whole pipeline in SystemVerilog: camera setup, pixel capture, a dual-clock framebuffer, the Sobel core, HDMI output and the timing constraints.",
      "Test patterns and status LEDs let me prove the display path before the camera worked.",
    ],
    composition: "signal",
    outcomes: [
      { text: "Live 640×480 camera-to-HDMI edge detection.", kind: "reported" },
      { text: "An earlier 320×240 capture build used 694 LUTs, 416 registers and 49.5 of 50 block-RAM tiles, and met timing.", kind: "reported" },
    ],
    limits: [
      "No measured frame rate or latency; display timing is nominal.",
      "The resource figures belong to the earlier build only.",
    ],
    highlight: {
      label: "Engineering challenge",
      title: "Keeping control signals with their pixels",
      body: "Every pipeline stage delays the pixel, so data-enable and both syncs are delayed by exactly the same amount. Without that, valid pixels land in blanking or edges shift sideways.",
    },
    demoIntro: "Drag the divider to compare the input with its edges.",
    details: [
      {
        id: "context",
        title: "Three clock domains",
        body: [
          "The OV7670 sends one byte per pixel clock, two bytes per RGB565 pixel. The display wants a steady 640×480 raster on its own clock, and HDMI serialises at five times that.",
          "Camera signals are captured on the camera's clock, and each frame crosses to the display through a dual-clock framebuffer.",
        ],
      },
      {
        id: "architecture",
        title: "Line buffers and the Sobel window",
        body: [
          "Three 640-pixel row memories rotate roles each line: one is written while two supply the rows above. Shift registers hold neighbouring columns to form the 3×3 window.",
          "Edge strength is |Gx| + |Gy|, using shifts for the weight-two taps and an 8-bit threshold.",
        ],
      },
      {
        id: "testing",
        title: "Bring-up",
        body: [
          "Synthetic bars and checkerboards proved display timing and the Sobel window first. SCCB ACK checks told a responding camera apart from one that only saw toggling pins.",
        ],
      },
    ],
    decisions: [
      {
        title: "A dual-clock framebuffer",
        choice: "True dual-port memory between camera and display.",
        alternative: "synchronising the pixel bus or streaming straight through.",
        tradeoff: "Decouples the two rates cleanly, but uses most of the block RAM and doesn't prevent tearing on its own.",
      },
      {
        title: "Three rotating line buffers",
        choice: "Rotate bank roles each line.",
        alternative: "a two-row design with more scheduling logic.",
        tradeoff: "One extra row buys simple bank selection and a window valid every pixel.",
      },
    ],
    links: [],
    related: ["fpga-orderbook", "risc-v-cpu"],
    heroAsset: "fpga-camera-system",
  },
  {
    slug: "risc-v-cpu",
    kind: "project",
    title: "Pipelined RISC-V CPU",
    line: "A five-stage RISC-V processor with forwarding, stalls and branch flushes, grown from a single-cycle design.",
    summary:
      "A five-stage RV32I processor grown from a single-cycle design, with forwarding, load-use stalls and branch flushing.",
    categories: ["fpga"],
    domain: "FPGA & digital",
    status: "Built and simulated",
    role: "Sole designer",
    timeframe: "2025 – 2026",
    tools: ["SystemVerilog", "Vivado", "XSim", "RealDigital Blackboard"],
    problem: "A processor that overlaps five instructions at once without letting any of them read a value too early.",
    intro: [
      "I built a single-cycle RV32I core first, then split it into five pipeline stages and added forwarding, load-use stall detection and branch flushing.",
    ],
    composition: "signal",
    outcomes: [
      { text: "3.8× throughput over the single-cycle baseline at near one instruction per cycle.", kind: "reported" },
      { text: "Passed 100+ directed and randomised tests in Vivado XSim; timing closed on a RealDigital Blackboard FPGA.", kind: "reported" },
    ],
    limits: [
      "No full ISA compliance result is claimed.",
      "The trace below is a teaching model, not a cycle-accurate run of the final RTL.",
    ],
    highlight: {
      label: "Design decision",
      title: "Forward first, stall only when forced",
      body: "Forwarding hands a fresh result straight to the next instruction. Only a load followed by its use costs a one-cycle bubble, which keeps dependent arithmetic near one instruction per cycle.",
    },
    demoIntro: "Step the clock through a short program.",
    details: [
      {
        id: "context",
        title: "Why pipelining needs bookkeeping",
        body: [
          "A single-cycle core does everything in one long clock. Pipelining shortens the clock by overlapping instructions, which breaks whenever one needs a result still in flight.",
        ],
      },
      {
        id: "architecture",
        title: "Pipeline registers and forwarding",
        body: [
          "ID/EX carries operands, immediate, register indices, PC and control; EX/MEM carries the result and destination; MEM/WB carries the value to commit.",
          "Forwarding compares EX source registers with EX/MEM and MEM/WB destinations; EX/MEM wins because it is newer.",
        ],
      },
    ],
    decisions: [
      {
        title: "Resolve branches in EX",
        choice: "Compare forwarded operands in execute and flush two younger instructions on a taken branch.",
        alternative: "resolving in decode.",
        tradeoff: "Simpler operand access, but every taken branch costs two slots.",
      },
    ],
    links: [],
    related: ["fpga-orderbook", "fpga-edge-detection"],
  },
  {
    slug: "fpga-orderbook",
    kind: "project",
    title: "FPGA Orderbook Engine",
    line: "Hardware that parses network packets and keeps a live best bid and ask, fed by software-injected test traffic.",
    summary:
      "Hardware that parses Ethernet, IPv4 and UDP packets, decodes Add, Cancel, Execute and Replace messages, and keeps a live best bid and ask.",
    categories: ["fpga"],
    domain: "FPGA & digital",
    status: "Built · controlled demonstration",
    role: "RTL and SoC integration",
    timeframe: "2026",
    tools: ["SystemVerilog", "Spartan-7", "MicroBlaze", "AXI4-Lite", "Vivado", "Vitis", "Python"],
    problem: "Hardware that reads market-style packets and keeps an up-to-date best bid and ask.",
    intro: [
      "I wrote the Ethernet, IPv4 and UDP parsers, an ITCH-style decoder, the order table and top-of-book logic, and an AXI4-Lite peripheral.",
      "A MicroBlaze program injects test packets, including bad frames, and reports results over UART.",
    ],
    composition: "signal",
    outcomes: [
      { text: "On the board, valid packets update the book and invalid frames increment the drop counter.", kind: "reported" },
      { text: "Timing closed at 100 MHz on Spartan-7; about 13k LUTs and 280 mW for the build.", kind: "reported" },
    ],
    limits: [
      "A controlled demo with software-injected packets, not a live feed or a trading engine.",
      "Power is a build figure, not a bench measurement; no per-packet latency is claimed.",
    ],
    highlight: {
      label: "Design decision",
      title: "Inject packets from software",
      body: "A MicroBlaze program writes packet bytes into a FIFO. Every test is reproducible without a working network MAC, at the cost of a demo rate set by software, not the parser.",
    },
    demoIntro: "Step through the messages and watch the book update.",
    details: [
      {
        id: "context",
        title: "Layered parsing",
        body: [
          "Each header layer is checked and stripped before the message is decoded. A malformed frame is consumed to its end so the parser stays aligned.",
        ],
      },
      {
        id: "architecture",
        title: "Parsers and the order table",
        body: [
          "Each parser accepts a byte only when valid and ready are both high, so backpressure can't corrupt header offsets. The decoder packs big-endian fields into one structure.",
          "Active orders sit in parallel arrays. After each update, logic finds the highest buy and lowest sell and sums the quantity at each. The top of book covers the whole table, not each symbol.",
        ],
      },
      {
        id: "testing",
        title: "Testing",
        body: [
          "Testbenches covered Ethernet accept and drop, each order operation and its errors, register reads and integrated packet injection.",
        ],
      },
    ],
    decisions: [
      {
        title: "Replace in two steps",
        choice: "Remove the old order, then insert the new one in the next state.",
        alternative: "both in one cycle.",
        tradeoff: "Avoids reusing a slot before it is visibly free, for one extra state.",
      },
      {
        title: "UART instead of HDMI",
        choice: "Print results over UART and plot them in Python.",
        alternative: "the HDMI display tried early on.",
        tradeoff: "Dropping a fragile display path kept the focus on the book logic.",
      },
    ],
    links: [],
    related: ["fpga-edge-detection", "risc-v-cpu"],
  },
  {
    slug: "cuda-attention-kernels",
    kind: "project",
    title: "CUDA Attention Kernels",
    line: "GPU kernels that reorder attention tensors between token-major and head-major layouts, written for efficient memory access.",
    summary:
      "CUDA kernels that reorder query, key and value tensors for attention heads and back, written for coalesced memory access.",
    categories: ["dsp"],
    domain: "DSP & GPU",
    status: "Coursework",
    role: "Kernel implementation",
    timeframe: "2026",
    tools: ["CUDA", "C++"],
    problem: "GPU kernels that move attention tensors between layouts. They do almost no arithmetic, so speed comes down to how threads touch memory.",
    intro: [
      "I implemented permute and unpermute kernels for Q, K and V, choosing thread mappings for coalesced access, staging through shared memory and sizing blocks with occupancy in mind.",
    ],
    composition: "research",
    outcomes: [{ text: "Permute and unpermute kernels implemented with coalescing, tiling and warp divergence considered.", kind: "reported" }],
    limits: [
      "No GPU model, tensor shapes, timings or speedup are given, so none are claimed.",
      "Layout work around attention, not a fused or FlashAttention-style kernel; no Tensor Cores.",
    ],
    highlight: {
      label: "Design decision",
      title: "Coalesce the expensive side",
      body: "One side of a permutation is always strided. Mapping threads so a warp's accesses share transactions, and staging through shared memory, keeps both sides contiguous.",
    },
    details: [
      {
        id: "context",
        title: "Why permute",
        body: [
          "Attention splits each token's features into heads. Q, K and V move from token-major to head-major layout for the per-head work, and the output moves back. Values stay the same; addresses change.",
        ],
      },
      {
        id: "architecture",
        title: "Index arithmetic",
        body: [
          "A [sequence][head][feature] array becomes [head][sequence][feature]: input index (s·H + h)·D + d, output index (h·S + s)·D + d.",
        ],
      },
    ],
    decisions: [
      {
        title: "Occupancy is a means",
        choice: "Size blocks against register and shared-memory use.",
        alternative: "maximising threads per block.",
        tradeoff: "More resident warps only help if memory traffic is the bottleneck.",
      },
    ],
    links: [],
    related: ["risc-v-cpu", "spatial-audio-research"],
  },
];

/** Homepage order: three featured stories, then the work index. */
export const featured = ["high-speed-fpga-pcb", "visionvest", "hardware-guitar-tuner"] as const;
