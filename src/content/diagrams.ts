// Architecture drawings as data. Coordinates are SVG user units.
// Tones: primary = main signal/power path (cobalt), secondary = the second path (rust),
// side = configuration/clock/support, planned = not built.

export type Tone = "primary" | "secondary" | "side" | "planned";

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: Tone;
  detail?: string;
};

export type DiagramEdge = {
  from: string;
  to: string;
  tone?: Tone;
  label?: string;
  labelAt?: [number, number];
  labelAnchor?: "start" | "middle" | "end";
  dir?: "h" | "v";
  path?: string;
  noArrow?: boolean;
  both?: boolean;
};

export type Diagram = {
  id: string;
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  regions?: { label: string; x: number; y: number; w: number; h: number }[];
  modes?: { id: string; label: string; nodes: string[] }[];
  initial?: string;
  mobile?: "list" | "svg";
};

const W = 150, H = 72;

export const archerChain: Diagram = {
  id: "archer",
  width: 1160,
  height: 380,
  initial: "mcu",
  nodes: [
    { id: "net", label: "Remote setpoint", sub: "TCP", x: 0, y: 60, w: 140, h: H, tone: "side", detail: "A setpoint and status requests arrive over the stand's network. Per-unit network settings let several controllers share one bench." },
    { id: "eth", label: "Ethernet", sub: "W5500 / WIZ850io", x: 180, y: 60, w: 170, h: H, tone: "primary", detail: "A hardwired TCP/IP controller on SPI gives the MCU a network interface without running a software stack." },
    { id: "mcu", label: "Control loop", sub: "ATmega328P", x: 390, y: 60, w: 160, h: H, tone: "primary", detail: "Parses commands, reads averaged feedback, runs feedback control with integral anti-windup, reports telemetry, and drops a stale command after 5 s without communication." },
    { id: "rc", label: "PWM to analog", sub: "RC low-pass", x: 590, y: 60, w: W, h: H, tone: "primary", detail: "Filters the MCU's PWM into a 0–5 V level. Corner frequency, PWM rate and loop rate have to be chosen together." },
    { id: "amp", label: "Gain stage", sub: "LM358, nominal 2×", x: 780, y: 60, w: 160, h: H, tone: "primary", detail: "A non-inverting op-amp stage scales 0–5 V to the 0–10 V command range of the valve driver." },
    { id: "valve", label: "Valve driver", sub: "external, 0–10 V in", x: 980, y: 60, w: 180, h: H, detail: "An external driver powers the proportional valve. The board only sends the command; the MCU never powers the valve." },
    { id: "sensor", label: "Flow sensor", sub: "0–10 V out", x: 980, y: 210, w: 180, h: H, tone: "secondary" },
    { id: "div", label: "Divider", sub: "into ADC range", x: 590, y: 210, w: W, h: H, tone: "secondary", detail: "Scales the 0–10 V feedback into the ADC's input range." },
    { id: "pwr", label: "24 V stand supply", x: 0, y: 270, w: 160, h: 60, tone: "side" },
    { id: "rails", label: "5 V and 3.3 V", sub: "local rails", x: 200, y: 270, w: 150, h: 60, tone: "side", detail: "Local regulation from the 24 V input supplies the MCU, the Ethernet module and the op-amp." },
  ],
  edges: [
    { from: "net", to: "eth", tone: "side" },
    { from: "eth", to: "mcu", tone: "primary", label: "SPI" },
    { from: "mcu", to: "rc", tone: "primary", label: "PWM" },
    { from: "rc", to: "amp", tone: "primary", label: "0–5 V" },
    { from: "amp", to: "valve", tone: "primary", label: "0–10 V" },
    { from: "valve", to: "sensor", tone: "secondary", label: "flow", labelAnchor: "start" },
    { from: "sensor", to: "div", tone: "secondary" },
    { from: "div", to: "mcu", tone: "secondary", path: "M590,246 H470 V132", labelAt: [478, 200], label: "ADC", labelAnchor: "start" },
    { from: "pwr", to: "rails", tone: "side" },
  ],
};

export const ecoPower: Diagram = {
  id: "eco",
  width: 1160,
  height: 470,
  modes: [
    { id: "power", label: "Power path (PDU)", nodes: ["batt", "prot", "estop", "buck", "r12", "ldo", "r33", "loads", "temp"] },
    { id: "measure", label: "Measurement (Joule Meter)", nodes: ["batt", "shunt", "ina", "stm", "bus"] },
  ],
  regions: [
    { label: "PDU, personally designed and laid out", x: 160, y: 10, w: 1000, h: 250 },
    { label: "Joule Meter, team board; my firmware", x: 160, y: 290, w: 1000, h: 170 },
  ],
  initial: "prot",
  nodes: [
    { id: "batt", label: "Battery bus", sub: "36 V", x: 0, y: 100, w: 130, h: H, detail: "The vehicle's 36 V battery bus feeds both the distribution board and the measurement path." },
    { id: "prot", label: "Protection", sub: "fuses, reverse polarity", x: 190, y: 100, w: 190, h: H, tone: "primary", detail: "Fusing limits a downstream fault; reverse-polarity protection survives a backwards connection during assembly and testing." },
    { id: "estop", label: "E-STOP path", x: 420, y: 100, w: 140, h: H, tone: "primary", detail: "The E-STOP loop is integrated on the board, so distribution follows the vehicle's stop state." },
    { id: "buck", label: "Buck conversion", sub: "step-down", x: 600, y: 100, w: 160, h: H, tone: "primary", detail: "Switching regulators take the large step down from 36 V efficiently; their ripple is why the rails were checked in LTspice and on the bench." },
    { id: "r12", label: "12 V rail", x: 800, y: 50, w: 130, h: 60, tone: "primary" },
    { id: "ldo", label: "LDO", x: 800, y: 150, w: 130, h: 60, tone: "primary", detail: "A linear regulator produces the low-voltage rail where low noise matters more than efficiency." },
    { id: "r33", label: "3.3 V rail", x: 960, y: 150, w: 130, h: 60, tone: "primary" },
    { id: "loads", label: "Subsystems", x: 960, y: 50, w: 130, h: 60 },
    { id: "temp", label: "Temperature sensing", x: 420, y: 200, w: 200, h: 46, tone: "side", detail: "On-board temperature sensing gives early warning before a thermal problem becomes a failure." },
    { id: "shunt", label: "Shunt", sub: "10 mΩ", x: 190, y: 350, w: 140, h: H, tone: "secondary" },
    { id: "ina", label: "INA228", sub: "current / energy", x: 380, y: 350, w: 170, h: H, tone: "secondary", detail: "A precision power monitor. Its readings only mean something once configuration, scaling and conversion timing are right." },
    { id: "stm", label: "STM32 firmware", sub: "register-level", x: 600, y: 350, w: 180, h: H, tone: "secondary", detail: "I wrote register-level firmware to configure the INA228 and turn its registers into energy, checked against a calibrated supply." },
    { id: "bus", label: "Vehicle telemetry", sub: "CAN · SPI · I2C", x: 830, y: 350, w: 200, h: H, tone: "secondary", detail: "Energy data goes to powertrain subsystems; CAN carries the system telemetry, SPI and I2C serve board-level devices." },
  ],
  edges: [
    { from: "batt", to: "prot", tone: "primary" },
    { from: "prot", to: "estop", tone: "primary" },
    { from: "estop", to: "buck", tone: "primary" },
    { from: "buck", to: "r12", tone: "primary" },
    { from: "buck", to: "ldo", tone: "primary" },
    { from: "ldo", to: "r33", tone: "primary" },
    { from: "r12", to: "loads", tone: "primary" },
    { from: "batt", to: "shunt", tone: "secondary", path: "M65,172 V386 H190" },
    { from: "shunt", to: "ina", tone: "secondary" },
    { from: "ina", to: "stm", tone: "secondary", label: "I2C" },
    { from: "stm", to: "bus", tone: "secondary" },
  ],
};

export const spatialPipeline: Diagram = {
  id: "spatial",
  width: 1160,
  height: 300,
  nodes: [
    { id: "imu", label: "Head IMU", sub: "MPU6050, I2C", x: 0, y: 40, w: 150, h: H, tone: "primary" },
    { id: "pose", label: "Orientation", sub: "head yaw", x: 190, y: 40, w: 140, h: H, tone: "primary" },
    { id: "map", label: "Coordinate map", sub: "source − yaw", x: 370, y: 40, w: 170, h: H, tone: "primary" },
    { id: "interp", label: "HRTF blend", sub: "barycentric", x: 580, y: 40, w: 160, h: H, tone: "primary" },
    { id: "conv", label: "FFT convolution", sub: "left and right", x: 780, y: 40, w: 180, h: H, tone: "primary" },
    { id: "out", label: "Headphones", x: 1000, y: 40, w: 160, h: H },
    { id: "pred", label: "Pose predictor", sub: "100 ms horizon", x: 190, y: 190, w: 180, h: H, tone: "secondary" },
    { id: "data", label: "Measured HRIRs", sub: "CIPIC", x: 580, y: 190, w: 160, h: H, tone: "side" },
  ],
  edges: [
    { from: "imu", to: "pose", tone: "primary" },
    { from: "pose", to: "map", tone: "primary" },
    { from: "map", to: "interp", tone: "primary", label: "bearing" },
    { from: "interp", to: "conv", tone: "primary" },
    { from: "conv", to: "out", tone: "primary" },
    { from: "pose", to: "pred", tone: "secondary", path: "M260,112 V190" },
    { from: "pred", to: "map", tone: "secondary", path: "M370,226 H455 V112", label: "predicted pose", labelAt: [465, 160], labelAnchor: "start" },
    { from: "data", to: "interp", tone: "side" },
  ],
};

export const edgePipeline: Diagram = {
  id: "edge",
  width: 1180,
  height: 420,
  initial: "lines",
  regions: [
    { label: "Camera clock", x: 0, y: 120, w: 300, h: 150 },
    { label: "Pixel clock, 25 MHz", x: 316, y: 120, w: 700, h: 150 },
    { label: "5× serial clock", x: 1032, y: 120, w: 148, h: 150 },
  ],
  nodes: [
    { id: "cam", label: "OV7670", sub: "8-bit bus", x: 10, y: 160, w: 120, h: H, tone: "primary", detail: "The camera presents one byte per pixel clock, with line-valid (HREF) and frame-sync (VSYNC) signals." },
    { id: "cap", label: "Capture", sub: "RGB565", x: 160, y: 160, w: 125, h: H, tone: "primary", detail: "Pairs two bytes into one 16-bit RGB565 pixel, resets the pairing at line and frame boundaries, and generates bounded write addresses on the camera's own clock." },
    { id: "fb", label: "Framebuffer", sub: "dual-clock", x: 326, y: 160, w: 130, h: H, tone: "primary", detail: "True dual-port memory: the camera writes one port on its clock, the display reads the other on the pixel clock. This is where the frame crosses domains." },
    { id: "timing", label: "Raster read", sub: "800 × 525", x: 486, y: 160, w: 120, h: H, tone: "primary", detail: "Video timing counters generate coordinates, data-enable and sync for a 640×480 active area inside an 800×525 raster." },
    { id: "lines", label: "Line buffers", sub: "3 × 640 px", x: 636, y: 160, w: 130, h: H, tone: "primary", detail: "Three row memories rotate roles each line: one is written while two supply the rows above, and shift registers hold neighbouring columns to form the 3×3 window." },
    { id: "sobel", label: "Sobel", sub: "|Gx| + |Gy|", x: 796, y: 160, w: 100, h: H, tone: "primary", detail: "Weighted column and row differences, shifts for the weight-two taps, L1 magnitude and an 8-bit threshold. Output is suppressed until the window is valid." },
    { id: "align", label: "Align", sub: "DE, HS, VS", x: 916, y: 160, w: 90, h: H, tone: "secondary", detail: "Sync and data-enable are delayed by exactly the pipeline's latency so each processed pixel lands where it belongs in the raster." },
    { id: "hdmi", label: "HDMI", sub: "TMDS", x: 1046, y: 160, w: 120, h: H, tone: "primary", detail: "Encodes and serialises the video at five times the pixel clock." },
    { id: "sccb", label: "SCCB config", sub: "ACK checked", x: 10, y: 20, w: 150, h: 64, tone: "side", detail: "Writes camera registers over an open-drain two-wire bus; checking ACKs distinguishes a responding sensor from toggling pins." },
    { id: "clk", label: "Clocking", sub: "100 MHz → 25, 125 MHz", x: 486, y: 20, w: 260, h: 64, tone: "side", detail: "The 100 MHz system clock feeds a clock generator for the 25 MHz pixel clock and the 125 MHz serial clock, and drives the camera's input clock." },
    { id: "pat", label: "Test patterns", x: 486, y: 320, w: 160, h: 56, tone: "side", detail: "Synthetic bars and checkerboards prove display timing and the Sobel window before the camera works." },
  ],
  edges: [
    { from: "cam", to: "cap", tone: "primary" },
    { from: "cap", to: "fb", tone: "primary" },
    { from: "fb", to: "timing", tone: "primary" },
    { from: "timing", to: "lines", tone: "primary" },
    { from: "lines", to: "sobel", tone: "primary" },
    { from: "sobel", to: "align", tone: "primary" },
    { from: "align", to: "hdmi", tone: "primary" },
    { from: "sccb", to: "cam", tone: "side", path: "M70,84 V160" },
    { from: "clk", to: "timing", tone: "side", path: "M546,84 V160" },
    { from: "clk", to: "hdmi", tone: "side", path: "M746,52 H1106 V160" },
    { from: "pat", to: "lines", tone: "side", path: "M646,348 H700 V232" },
    { from: "timing", to: "align", tone: "secondary", path: "M546,232 V290 H961 V232", label: "control delayed with data", labelAt: [760, 284] },
  ],
};

export const tunerPath: Diagram = {
  id: "tuner",
  width: 1160,
  height: 380,
  regions: [{ label: "Designed extension, not the demonstrated endpoint", x: 760, y: 250, w: 400, h: 120 }],
  nodes: [
    { id: "mic", label: "Microphone", sub: "biased", x: 0, y: 110, w: 130, h: H, tone: "primary" },
    { id: "amp", label: "Gain stages", sub: "op-amps", x: 160, y: 110, w: 130, h: H, tone: "primary" },
    { id: "lo", label: "Band-pass", sub: "≈ 630 Hz", x: 340, y: 30, w: 130, h: H, tone: "primary" },
    { id: "hi", label: "Band-pass", sub: "≈ 690 Hz", x: 340, y: 190, w: 130, h: H, tone: "secondary" },
    { id: "pdl", label: "Peak detector", x: 510, y: 30, w: 140, h: H, tone: "primary" },
    { id: "pdh", label: "Peak detector", x: 510, y: 190, w: 140, h: H, tone: "secondary" },
    { id: "cmp", label: "Comparator", sub: "which is larger", x: 700, y: 110, w: 150, h: H },
    { id: "logic", label: "Decision logic", x: 880, y: 110, w: 130, h: H },
    { id: "led", label: "Indicator", sub: "above / below", x: 1040, y: 110, w: 120, h: H },
    { id: "hb", label: "H-bridge", x: 800, y: 290, w: 140, h: 60, tone: "planned" },
    { id: "motor", label: "Motor and peg", x: 980, y: 290, w: 160, h: 60, tone: "planned" },
  ],
  edges: [
    { from: "mic", to: "amp", tone: "primary" },
    { from: "amp", to: "lo", tone: "primary" },
    { from: "amp", to: "hi", tone: "secondary" },
    { from: "lo", to: "pdl", tone: "primary" },
    { from: "hi", to: "pdh", tone: "secondary" },
    { from: "pdl", to: "cmp", tone: "primary" },
    { from: "pdh", to: "cmp", tone: "secondary" },
    { from: "cmp", to: "logic" },
    { from: "logic", to: "led" },
    { from: "logic", to: "hb", tone: "planned", path: "M945,182 V230 H870 V290" },
    { from: "hb", to: "motor", tone: "planned" },
  ],
};

export const orderbookPipeline: Diagram = {
  id: "orderbook",
  width: 1160,
  height: 330,
  initial: "book",
  nodes: [
    { id: "mb", label: "MicroBlaze", sub: "C traffic generator", x: 0, y: 30, w: 170, h: H, tone: "side", detail: "Software builds Ethernet/IPv4/UDP frames around ITCH-style messages, tracks live order references, and sends an invalid frame every so often to exercise the drop path." },
    { id: "axi", label: "AXI4-Lite", sub: "byte writes", x: 210, y: 30, w: 140, h: H, tone: "side", detail: "Write address and data are independent channels; the peripheral holds each handshake separately before committing a byte." },
    { id: "fifo", label: "Injector FIFO", sub: "data + last", x: 390, y: 30, w: 150, h: H, tone: "primary", detail: "Turns irregular memory-mapped writes into a stream, with full and overflow flags so software cannot assume a byte was accepted." },
    { id: "eth", label: "Ethernet", sub: "EtherType 0x0800", x: 580, y: 30, w: 160, h: H, tone: "primary", detail: "Strips 14 header bytes and drops anything that is not IPv4, consuming bytes until the frame ends." },
    { id: "ip", label: "IPv4", sub: "protocol UDP", x: 780, y: 30, w: 150, h: H, tone: "primary", detail: "Strips the fixed 20-byte header and checks the protocol field. Not a full IP stack: no options or fragmentation." },
    { id: "udp", label: "UDP", sub: "port filter", x: 970, y: 30, w: 150, h: H, tone: "primary", detail: "Strips 8 bytes and filters on destination port before handing the payload on." },
    { id: "itch", label: "ITCH decoder", sub: "A · X · E · U", x: 970, y: 190, w: 150, h: H, tone: "primary", detail: "Assembles big-endian fields for Add, Cancel, Execute and Replace into one packed structure." },
    { id: "book", label: "Order table", sub: "find, update, free", x: 760, y: 190, w: 170, h: H, tone: "primary", detail: "Parallel arrays with a combinational search for the matching reference and a priority search for a free slot. Reductions saturate at zero and free the slot." },
    { id: "tob", label: "Top of book", sub: "max bid, min ask", x: 560, y: 190, w: 160, h: H, tone: "secondary", detail: "After each update, scans active orders for the highest buy and lowest sell, and sums the quantity at each." },
    { id: "regs", label: "Result registers", sub: "counters, status", x: 340, y: 190, w: 180, h: H, tone: "secondary", detail: "Best prices, quantities, message and drop counters and sticky error flags, readable over AXI4-Lite." },
    { id: "uart", label: "UART", sub: "to Python plot", x: 130, y: 190, w: 170, h: H, tone: "side", detail: "MicroBlaze reads the registers and prints them; a Python script plots bid and ask. UART is for observation, not the data path." },
  ],
  edges: [
    { from: "mb", to: "axi", tone: "side" },
    { from: "axi", to: "fifo", tone: "side" },
    { from: "fifo", to: "eth", tone: "primary" },
    { from: "eth", to: "ip", tone: "primary" },
    { from: "ip", to: "udp", tone: "primary" },
    { from: "udp", to: "itch", tone: "primary" },
    { from: "itch", to: "book", tone: "primary" },
    { from: "book", to: "tob", tone: "secondary" },
    { from: "tob", to: "regs", tone: "secondary" },
    { from: "regs", to: "uart", tone: "side" },
  ],
};

export const riscvDatapath: Diagram = {
  id: "riscv",
  width: 1160,
  height: 330,
  initial: "fwd",
  nodes: [
    { id: "if", label: "Fetch", sub: "IF", x: 0, y: 90, w: 140, h: 80, tone: "primary", detail: "The PC addresses instruction memory. On a taken branch or jump, the PC is redirected and the younger instructions are flushed." },
    { id: "r1", label: "IF/ID", x: 160, y: 70, w: 44, h: 120, tone: "side" },
    { id: "id", label: "Decode", sub: "ID", x: 224, y: 90, w: 140, h: 80, tone: "primary", detail: "Control decode, immediate generation and two register-file reads. x0 always reads zero." },
    { id: "r2", label: "ID/EX", x: 384, y: 70, w: 44, h: 120, tone: "side" },
    { id: "ex", label: "Execute", sub: "EX", x: 448, y: 90, w: 140, h: 80, tone: "primary", detail: "The ALU, operand muxes fed by the forwarding unit, and branch comparison on forwarded operands." },
    { id: "r3", label: "EX/MEM", x: 608, y: 70, w: 44, h: 120, tone: "side" },
    { id: "mem", label: "Memory", sub: "MEM", x: 672, y: 90, w: 140, h: 80, tone: "primary", detail: "Word-addressed data memory for loads and stores." },
    { id: "r4", label: "MEM/WB", x: 832, y: 70, w: 44, h: 120, tone: "side" },
    { id: "wb", label: "Write back", sub: "WB", x: 896, y: 90, w: 140, h: 80, tone: "primary", detail: "Selects the ALU result or loaded data and writes the destination register." },
    { id: "fwd", label: "Forwarding unit", x: 448, y: 240, w: 300, h: 56, tone: "secondary", detail: "Compares EX source registers with EX/MEM and MEM/WB destinations and picks the newest in-flight value; EX/MEM wins if both match. x0 is never forwarded." },
    { id: "haz", label: "Hazard unit", x: 160, y: 240, w: 240, h: 56, tone: "secondary", detail: "If the instruction in EX is a load whose destination is a source of the instruction in ID, hold PC and IF/ID and turn ID/EX into a bubble for one cycle." },
  ],
  edges: [
    { from: "if", to: "r1", tone: "primary", noArrow: true },
    { from: "r1", to: "id", tone: "primary" },
    { from: "id", to: "r2", tone: "primary", noArrow: true },
    { from: "r2", to: "ex", tone: "primary" },
    { from: "ex", to: "r3", tone: "primary", noArrow: true },
    { from: "r3", to: "mem", tone: "primary" },
    { from: "mem", to: "r4", tone: "primary", noArrow: true },
    { from: "r4", to: "wb", tone: "primary" },
    { from: "r3", to: "fwd", tone: "secondary", path: "M630,190 V268 H748" , noArrow: true },
    { from: "r4", to: "fwd", tone: "secondary", path: "M854,190 V268 H748", noArrow: true },
    { from: "fwd", to: "ex", tone: "secondary", path: "M518,240 V170" },
    { from: "haz", to: "if", tone: "secondary", path: "M160,268 H70 V170", label: "stall", labelAt: [78, 214], labelAnchor: "start" },
    { from: "wb", to: "id", tone: "side", path: "M966,90 V30 H294 V90", label: "register write", labelAt: [630, 24] },
  ],
};

export const hspcbPlan: Diagram = {
  id: "hspcb",
  width: 1160,
  height: 440,
  nodes: [
    { id: "usb", label: "USB-C, 5 V", sub: "source detect", x: 0, y: 40, w: 160, h: H, tone: "planned" },
    { id: "ext", label: "External 5 V", x: 0, y: 160, w: 160, h: H, tone: "planned" },
    { id: "sel", label: "Source select", sub: "priority, no back-feed", x: 210, y: 100, w: 190, h: H, tone: "planned" },
    { id: "bus", label: "Protected 5 V bus", x: 450, y: 100, w: 170, h: H, tone: "planned" },
    { id: "core", label: "Core", sub: "≈ 1.0 V buck", x: 680, y: 10, w: 150, h: 60, tone: "planned" },
    { id: "aux", label: "Auxiliary", sub: "≈ 1.8 V buck", x: 680, y: 85, w: 150, h: 60, tone: "planned" },
    { id: "ddr", label: "Memory", sub: "≈ 1.35 V buck", x: 680, y: 160, w: 150, h: 60, tone: "planned" },
    { id: "io", label: "I/O", sub: "≈ 3.3 V buck", x: 680, y: 235, w: 150, h: 60, tone: "planned" },
    { id: "fpga", label: "FPGA", sub: "Spartan-7 candidate", x: 890, y: 85, w: 190, h: 135, tone: "planned" },
    { id: "mem", label: "DDR3L x16", sub: "candidate", x: 890, y: 330, w: 190, h: 64, tone: "planned" },
    { id: "dbg", label: "Flash, JTAG, UART,\ntest points", x: 450, y: 330, w: 260, h: 64, tone: "planned" },
  ],
  edges: [
    { from: "usb", to: "sel", tone: "planned" },
    { from: "ext", to: "sel", tone: "planned" },
    { from: "sel", to: "bus", tone: "planned" },
    { from: "bus", to: "core", tone: "planned" },
    { from: "bus", to: "aux", tone: "planned" },
    { from: "bus", to: "ddr", tone: "planned" },
    { from: "bus", to: "io", tone: "planned" },
    { from: "core", to: "fpga", tone: "planned", path: "M830,40 H985 V85" },
    { from: "aux", to: "fpga", tone: "planned" },
    { from: "ddr", to: "fpga", tone: "planned", path: "M830,190 H890" },
    { from: "io", to: "fpga", tone: "planned", path: "M830,265 H985 V220" },
    { from: "fpga", to: "mem", tone: "planned", path: "M985,220 V330", label: "x16 DDR", labelAt: [995, 300], labelAnchor: "start", both: true },
    { from: "dbg", to: "fpga", tone: "planned", path: "M710,362 H860 V200 H890" },
  ],
};

export const cudaContext: Diagram = {
  id: "cuda",
  width: 1160,
  height: 180,
  nodes: [
    { id: "in", label: "Q, K, V", sub: "[seq][head][feat]", x: 0, y: 50, w: 180, h: H },
    { id: "perm", label: "Permute", sub: "my kernel", x: 230, y: 50, w: 160, h: H, tone: "primary" },
    { id: "attn", label: "Per-head attention", sub: "not part of this work", x: 440, y: 50, w: 250, h: H, tone: "side" },
    { id: "unperm", label: "Unpermute", sub: "my kernel", x: 740, y: 50, w: 170, h: H, tone: "primary" },
    { id: "out", label: "Next layer", sub: "[seq][head][feat]", x: 960, y: 50, w: 200, h: H },
  ],
  edges: [
    { from: "in", to: "perm", tone: "primary" },
    { from: "perm", to: "attn", tone: "side", label: "[head][seq][feat]" },
    { from: "attn", to: "unperm", tone: "side" },
    { from: "unperm", to: "out", tone: "primary" },
  ],
};

export const vestFlow: Diagram = {
  id: "vestflow",
  width: 340,
  height: 560,
  mobile: "svg",
  nodes: [
    { id: "phone", label: "iPhone perception", sub: "Core ML, direction", x: 20, y: 0, w: 230, h: 62, tone: "side" },
    { id: "ble", label: "One JSON command", sub: "BLE write", x: 20, y: 96, w: 230, h: 62, tone: "primary" },
    { id: "val", label: "Validate fields", sub: "type, range, duplicate", x: 20, y: 192, w: 230, h: 62, tone: "primary" },
    { id: "ttl", label: "Expire after 300 ms", x: 20, y: 288, w: 230, h: 52, tone: "primary" },
    { id: "arb", label: "Arbitrate", sub: "danger > phone > caution", x: 20, y: 374, w: 230, h: 62, tone: "primary" },
    { id: "mot", label: "Motors at full duty", x: 20, y: 486, w: 230, h: 56 },
  ],
  edges: [
    { from: "phone", to: "ble", tone: "side" },
    { from: "ble", to: "val", tone: "primary" },
    { from: "val", to: "ttl", tone: "primary" },
    { from: "ttl", to: "arb", tone: "primary" },
    { from: "arb", to: "mot", tone: "primary" },
  ],
};
