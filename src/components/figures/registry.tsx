import type { CaseFigures } from "@/components/portfolio/CaseStudy";
import { Figure } from "./Figure";
import { BlockDiagram } from "./BlockDiagram";
import { ClearanceFault } from "./ClearanceFault";
import { Plate } from "./Plate";
import { VestDrawing } from "./VestDrawing";
import {
  archerChain,
  cudaContext,
  ecoPower,
  edgePipeline,
  hspcbPlan,
  orderbookPipeline,
  riscvDatapath,
  spatialPipeline,
  tunerPath,
} from "@/content/diagrams";
import { asset } from "@/content/publicAssets";
import { PduPlate } from "@/components/interactive/PduPlate";
import { SobelDemo } from "@/components/interactive/SobelDemo";
import { TunerResponse } from "@/components/interactive/TunerResponse";
import { OrderbookReplay } from "@/components/interactive/OrderbookReplay";
import { HapticFlow } from "@/components/interactive/HapticFlow";
import { SpatialCoordinates } from "@/components/interactive/SpatialCoordinates";
import { PipelineTrace } from "@/components/interactive/PipelineTrace";
import { TensorLayout } from "@/components/interactive/TensorLayout";

/** Which figure goes where on each case study. Every figure carries its evidence classification. */
export const caseFigures: Record<string, CaseFigures> = {
  "archer-aviation": {
    hero: (
      <Figure
        id="archer-chain"
        title="Flow-controller signal chain"
        kind="illustrative"
        captionPlacement="margin"
        summary="Remote setpoint over Ethernet to an ATmega328P control loop, PWM and RC filter, a 2x gain stage and a 0 to 10 volt valve command; flow feedback returns through a divider to the ADC."
        caption="Generalised functional drawing, not the company schematic. Select a block to see its role."
      >
        <BlockDiagram diagram={archerChain} label="Flow-controller signal chain" />
      </Figure>
    ),
    validationFigure: (
      <Figure
        id="archer-fault"
        title="Why the board measured 0.9 Ω"
        kind="illustrative"
        summary="The intended clearance leaves bare board around the pad; the clearance entered in the wrong units lets the pour touch it."
        caption="Not to scale. The real gap was about 56 times smaller than intended."
      >
        <ClearanceFault />
      </Figure>
    ),
  },
  "eco-illini": {
    hero: <PduPlate idPrefix="eco" />,
    architecture: (
      <Figure
        id="eco-power"
        title="Power path and measurement path"
        kind="illustrative"
        summary="Battery bus through protection and E-STOP to buck and LDO regulation producing 12 V and 3.3 V; a separate shunt, INA228, STM32 and vehicle telemetry branch."
        caption="Functional drawing, not a pinout. Highlight a path or select a block."
      >
        <BlockDiagram diagram={ecoPower} label="PDU power path and Joule Meter measurement path" />
      </Figure>
    ),
  },
  "spatial-audio-research": {
    hero: (
      <Figure
        id="spatial-demo"
        title="A fixed source seen from a turning head"
        kind="illustrative"
        summary="Two dials: the world view with a fixed source and a rotating head, and the head frame showing where the source should be rendered."
        caption="Turn the head with the slider; the fixed source moves the other way. Coordinate illustration, not a measured result."
      >
        <SpatialCoordinates />
      </Figure>
    ),
    architecture: (
      <Figure
        id="spatial-pipeline"
        title="Research pipeline"
        kind="illustrative"
        summary="IMU orientation, coordinate mapping, barycentric HRTF blending and FFT convolution to headphones, with a pose predictor feeding the mapping."
        caption="Main blocks of the research pipeline; no measured timing shown."
      >
        <BlockDiagram diagram={spatialPipeline} label="Spatial audio research pipeline" />
      </Figure>
    ),
  },
  "fpga-edge-detection": {
    hero: (
      <Figure
        id="edge-pipeline"
        title="Camera to HDMI, across three clock domains"
        kind="illustrative"
        summary="OV7670 capture on the camera clock, a dual-clock framebuffer, raster read, line buffers and Sobel on the pixel clock, alignment, and HDMI serialisation on the 5x clock, with SCCB configuration and clocking as side paths."
        caption="Select a stage to see what it does. Block diagram of the design, not a resource report."
      >
        <BlockDiagram diagram={edgePipeline} label="FPGA edge detection signal path" />
      </Figure>
    ),
    demo: (
      <Figure
        id="sobel-demo"
        title="Sobel on an original test image"
        kind="browser"
        summary="An input image and its thresholded Sobel output with a movable divider and threshold control."
        caption="The same arithmetic run in your browser on a generated image; not footage from the FPGA."
      >
        <SobelDemo />
      </Figure>
    ),
  },
  visionvest: {
    hero: (
      <Figure
        id="vest-plate"
        title="A vest that communicates by touch"
        kind={asset("visionvest-system-portrait").src ? "conceptual" : "illustrative"}
        captionPlacement="margin"
        summary="The vest render includes a front-mounted phone, a USB power bank supplying the ESP32, and a separate 9 V battery supplying the motor driver."
        caption="Front-mounted phone, USB power bank for the ESP32 and a separate 9 V motor-driver battery. Illustrative reconstruction; mounting positions are approximated."
      >
        <div style={{ maxWidth: 560 }}>
          <Plate slot="visionvest-system-portrait" fallback={<VestDrawing />} sizes="560px" keepRatioForFallback={false} />
        </div>
      </Figure>
    ),
    demo: (
      <Figure
        id="vest-demo"
        title="Requested versus applied"
        kind="illustrative"
        summary="Choose one of three documented cases and move the time slider to see whether the phone command is live, which source owns the motors, and the duty applied."
        caption="Built from the firmware's documented rules; not a full firmware emulator."
      >
        <HapticFlow />
      </Figure>
    ),
  },
  "hardware-guitar-tuner": {
    heroIsDemo: true,
    hero: (
      <Figure
        id="tuner-chart"
        title="Two filters either side of 660 Hz"
        kind="analytical"
        summary="Idealised band-pass responses at 630 and 690 hertz with a movable test tone."
        caption="Equal Q of 12 is an illustrative assumption; measured filter responses are not shown."
      >
        <TunerResponse />
      </Figure>
    ),
    architecture: (
      <Figure
        id="tuner-path"
        title="Signal chain"
        kind="illustrative"
        summary="Microphone, gain, two band-pass branches, peak detectors, comparator, decision logic and indicator; a separate designed H-bridge and motor extension."
        caption="The dashed region is the designed motor extension, not the demonstrated result."
      >
        <BlockDiagram diagram={tunerPath} label="Analog tuner signal chain" />
      </Figure>
    ),
  },
  "fpga-orderbook": {
    hero: (
      <Figure
        id="orderbook-path"
        title="Packet bytes to top of book"
        kind="illustrative"
        summary="MicroBlaze software injects bytes over AXI4-Lite into a FIFO, through Ethernet, IPv4 and UDP parsers, an ITCH-style decoder, the order table and top-of-book logic, to result registers read over UART."
        caption="Select a block for its role. Input is software packet injection, not a live network feed."
      >
        <BlockDiagram diagram={orderbookPipeline} label="Orderbook engine signal path" />
      </Figure>
    ),
    demo: (
      <Figure
        id="orderbook-demo"
        title="A declared message sequence, replayed"
        kind="illustrative"
        summary="Eleven synthetic messages applied one at a time, with the order table, best bid and ask, depth by price, and best prices by message."
        caption="Synthetic protocol demonstration; not live trading data or a hardware benchmark. Replay speed is unrelated to the 100 MHz clock."
      >
        <OrderbookReplay />
      </Figure>
    ),
  },
  "risc-v-cpu": {
    hero: (
      <Figure
        id="riscv-path"
        title="Five stages and the units that keep them honest"
        kind="illustrative"
        summary="Fetch, decode, execute, memory and writeback separated by pipeline registers, with a forwarding unit feeding execute and a hazard unit that can stall fetch."
        caption="Select a stage or unit for its role."
      >
        <BlockDiagram diagram={riscvDatapath} label="Pipelined datapath" />
      </Figure>
    ),
    demo: (
      <Figure
        id="riscv-trace"
        title="Clock-by-clock trace"
        kind="illustrative"
        summary="Three short programs shown stage by stage per cycle, with forwarding events and one load-use bubble."
        caption="Idealised five-stage model with single-cycle memory; not a cycle-accurate run of the final RTL."
      >
        <PipelineTrace />
      </Figure>
    ),
  },
  "high-speed-fpga-pcb": {
    hero: (
      <Figure
        id="hspcb-plan"
        title="Planned power tree and board blocks"
        kind="proposed"
        captionPlacement="margin"
        summary="Planned: USB-C or external 5 volt input, source selection, a protected 5 volt bus, four buck rails, an FPGA, DDR3L memory and debug access."
        caption="Every block is a proposal; rail values and parts are preliminary."
      >
        <BlockDiagram diagram={hspcbPlan} label="Planned board architecture" />
      </Figure>
    ),
  },
  "cuda-attention-kernels": {
    hero: (
      <Figure
        id="cuda-layout"
        title="Where an element moves"
        kind="illustrative"
        summary="A tiny tensor shown in memory order before and after permutation; selecting a value highlights both positions."
        caption="Select a value to see where it moves. A tiny illustrative tensor, not the real shapes or kernel."
      >
        <TensorLayout />
      </Figure>
    ),
    architecture: (
      <Figure
        id="cuda-context"
        title="Where the kernels sit"
        kind="illustrative"
        summary="Q, K and V are permuted to head-major layout, the per-head attention runs, and the result is unpermuted for the next layer."
        caption="The middle block is context, not part of this work."
      >
        <BlockDiagram diagram={cudaContext} label="Permute and unpermute around attention" />
      </Figure>
    ),
  },
};
