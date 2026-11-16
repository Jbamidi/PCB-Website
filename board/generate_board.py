"""
Generates the portfolio board: a production-style KiCad board whose main parts are Jashwanth's work.

Run with KiCad's bundled Python:
  "C:\\Program Files\\KiCad\\10.0\\bin\\python.exe" board\\generate_board.py

Output: board/portfolio.kicad_pcb, plus board/parts.json (part positions for the website).

The board is laid out the way a real carrier board would be, so it reads as a real product:
  top left     USB-C input, protection, three buck converters and an LDO, power-good LEDs
  left edge    I/O: Ethernet (J1, Archer), CAN / 12 V (J2, Eco Illini), audio (J3, Spatial)
  top          camera FPC and HDMI into the vision FPGA (U2, edge detection)
  core         compute SoC with two DDR chips (U7, CUDA), FPGA with DDR (U5, orderbook),
               an unpopulated FPGA footprint (U1, High Speed FPGA PCB, still planned)
  right        ESP32-S3 module (U3, VisionVest), board controller (U6, RISC-V), debug header
  bottom left  analog front end (U4, guitar tuner)
  bottom right spare footprints for future work, title block and serial label

Every coordinate below is in board-local mm: x right, y down, (0, 0) at the top-left corner.
"""
import json
import math
import os
import random

import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
FP = r"C:\Program Files\KiCad\10.0\share\kicad\footprints"
MODELS = r"C:\Program Files\KiCad\10.0\share\kicad\3dmodels"
OUT = os.path.join(HERE, "portfolio.kicad_pcb")

X0, Y0, W, H = 20.0, 20.0, 160.0, 100.0
board = pcbnew.BOARD()
parts = {}      # part id -> position/size for the website
rects = []      # (x1, y1, x2, y2, ref) occupied by footprints, board-local
segs = []       # (x1, y1, x2, y2, half_width) copper tracks, board-local
vias = []       # (x, y, r)
random.seed(7)


def mm(x, y):
    return pcbnew.VECTOR2I_MM(X0 + x, Y0 + y)


def local(v):
    return pcbnew.ToMM(v.x) - X0, pcbnew.ToMM(v.y) - Y0


# ---------------------------------------------------------------- occupancy
def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def free(x, y, r, ignore=None, tracks=True):
    if x < r + 0.6 or y < r + 0.6 or x > W - r - 0.6 or y > H - r - 0.6:
        return False
    for (x1, y1, x2, y2, ref) in rects:
        if ref != ignore and x1 - r < x < x2 + r and y1 - r < y < y2 + r:
            return False
    for (vx, vy, vr) in vias:
        if math.hypot(x - vx, y - vy) < r + vr + 0.15:
            return False
    if tracks:
        for (ax, ay, bx, by, hw) in segs:
            if seg_dist(x, y, ax, ay, bx, by) < r + hw + 0.15:
                return False
    return True


def rect_free(x1, y1, x2, y2, margin=0.2):
    for (a1, b1, a2, b2, _) in rects:
        if x1 - margin < a2 and x2 + margin > a1 and y1 - margin < b2 and y2 + margin > b1:
            return False
    for (ax, ay, bx, by, hw) in segs:
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        if seg_dist(cx, cy, ax, ay, bx, by) < max(x2 - x1, y2 - y1) / 2 + hw + margin:
            return False
    return True


# ---------------------------------------------------------------- footprints
def lib(name):
    return os.path.join(FP, name + ".pretty")


missing_models = set()
counters = {}


def outline(fp):
    """The part's real extent: its pads and fab-layer body, without courtyard or keepout drawings."""
    xs, ys = [], []
    for p in fp.Pads():
        bb = p.GetBoundingBox()
        xs += [bb.GetX(), bb.GetRight()]
        ys += [bb.GetY(), bb.GetBottom()]
    for g in fp.GraphicalItems():
        if g.GetLayer() == pcbnew.F_Fab:
            bb = g.GetBoundingBox()
            xs += [bb.GetX(), bb.GetRight()]
            ys += [bb.GetY(), bb.GetBottom()]
    if not xs:
        bb = fp.GetBoundingBox(False)
        xs, ys = [bb.GetX(), bb.GetRight()], [bb.GetY(), bb.GetBottom()]
    return (pcbnew.ToMM(min(xs)) - X0, pcbnew.ToMM(min(ys)) - Y0, pcbnew.ToMM(max(xs)) - X0, pcbnew.ToMM(max(ys)) - Y0)


def next_ref(prefix):
    counters[prefix] = counters.get(prefix, 0) + 1
    return f"{prefix}{counters[prefix]}"


def place(ref, footprint, x, y, rot=0.0, value="", dnp=False, part_id=None, show_ref=True, track_rect=True):
    library, name = footprint.split(":")
    fp = pcbnew.FootprintLoad(lib(library), name)
    if fp is None:
        raise RuntimeError(f"footprint not found: {footprint}")
    fp.SetReference(ref)
    fp.SetValue(value or name)
    fp.SetPosition(mm(x, y))
    fp.SetOrientationDegrees(rot)
    fp.Value().SetVisible(False)
    # some connector footprints ship their own panel-edge cutouts; the board outline is the only edge here
    for item in list(fp.GraphicalItems()):
        if item.GetLayer() == pcbnew.Edge_Cuts:
            fp.Remove(item)
    r = fp.Reference()
    r.SetVisible(show_ref)
    r.SetTextSize(pcbnew.VECTOR2I_MM(0.8, 0.8))
    r.SetTextThickness(pcbnew.FromMM(0.13))
    for m in fp.Models():
        path = m.m_Filename.replace("${KICAD10_3DMODEL_DIR}", MODELS).replace("${KICAD9_3DMODEL_DIR}", MODELS)
        stem = os.path.splitext(path)[0]
        if not (os.path.exists(stem + ".step") or os.path.exists(stem + ".wrl")):
            missing_models.add(footprint)
    if dnp:
        fp.Models().clear()
        fp.SetDNP(True)
    board.Add(fp)
    x1, y1, x2, y2 = outline(fp)
    if track_rect:
        rects.append((x1, y1, x2, y2, ref))
    if part_id:
        # the site needs the body centre, which for connectors is not the footprint origin
        parts[part_id] = {"ref": ref, "x": round((x1 + x2) / 2, 2), "y": round((y1 + y2) / 2, 2), "w": round(x2 - x1, 2), "h": round(y2 - y1, 2), "populated": not dnp}
    return fp


def body(ref):
    for (x1, y1, x2, y2, r) in rects:
        if r == ref:
            return x1, y1, x2, y2
    raise KeyError(ref)


templates = {}


def passive(prefix, footprint, x, y, rot=0.0, check=True):
    """A small part, placed only where it fits. Returns the footprint or None."""
    if footprint not in templates:
        lib_, name = footprint.split(":")
        probe = pcbnew.FootprintLoad(lib(lib_), name)
        probe.SetPosition(mm(0, 0))
        templates[footprint] = outline(probe)
    a1, b1, a2, b2 = templates[footprint]
    if rot % 180:
        a1, b1, a2, b2 = b1, a1, b2, a2
    x1, y1, x2, y2 = x + a1, y + b1, x + a2, y + b2
    if check and not rect_free(x1, y1, x2, y2, 0.25):
        return None
    if x1 < 0.8 or y1 < 0.8 or x2 > W - 0.8 or y2 > H - 0.8:
        return None
    return place(next_ref(prefix), footprint, x, y, rot, show_ref=False)


C0402 = "Capacitor_SMD:C_0402_1005Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
R0402 = "Resistor_SMD:R_0402_1005Metric"
R0603 = "Resistor_SMD:R_0603_1608Metric"
FB0603 = "Inductor_SMD:L_0603_1608Metric"
LED0603 = "LED_SMD:LED_0603_1608Metric"
RN4 = "Resistor_SMD:R_Array_Convex_4x0402"


# ---------------------------------------------------------------- graphics
def silk(text, x, y, size=1.0, bold=False, justify="left", rot=0.0, layer=pcbnew.F_SilkS):
    t = pcbnew.PCB_TEXT(board)
    t.SetText(text)
    t.SetPosition(mm(x, y))
    t.SetLayer(layer)
    t.SetTextSize(pcbnew.VECTOR2I_MM(size, size))
    t.SetTextThickness(pcbnew.FromMM(size * (0.2 if bold else 0.15)))
    t.SetTextAngleDegrees(rot)
    t.SetHorizJustify({"left": pcbnew.GR_TEXT_H_ALIGN_LEFT, "right": pcbnew.GR_TEXT_H_ALIGN_RIGHT, "center": pcbnew.GR_TEXT_H_ALIGN_CENTER}[justify])
    board.Add(t)


def line(x1, y1, x2, y2, layer=pcbnew.F_SilkS, width=0.15):
    s = pcbnew.PCB_SHAPE(board)
    s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(mm(x1, y1))
    s.SetEnd(mm(x2, y2))
    s.SetLayer(layer)
    s.SetWidth(pcbnew.FromMM(width))
    board.Add(s)


def box(x1, y1, x2, y2, layer=pcbnew.F_SilkS, width=0.15, filled=False):
    s = pcbnew.PCB_SHAPE(board)
    s.SetShape(pcbnew.SHAPE_T_RECT)
    s.SetStart(mm(x1, y1))
    s.SetEnd(mm(x2, y2))
    s.SetLayer(layer)
    s.SetWidth(pcbnew.FromMM(width))
    s.SetFilled(filled)
    board.Add(s)


# ---------------------------------------------------------------- copper
def track(points, width=0.2, layer=pcbnew.F_Cu, net=None, record=True):
    for (ax, ay), (bx, by) in zip(points, points[1:]):
        if abs(ax - bx) < 1e-6 and abs(ay - by) < 1e-6:
            continue
        t = pcbnew.PCB_TRACK(board)
        t.SetStart(mm(ax, ay))
        t.SetEnd(mm(bx, by))
        t.SetWidth(pcbnew.FromMM(width))
        t.SetLayer(layer)
        if net:
            t.SetNet(net)
        board.Add(t)
        if record and layer == pcbnew.F_Cu:
            segs.append((ax, ay, bx, by, width / 2))


def via(x, y, size=0.5, drill=0.25, net=None):
    v = pcbnew.PCB_VIA(board)
    v.SetPosition(mm(x, y))
    v.SetWidth(pcbnew.FromMM(size))
    v.SetDrill(pcbnew.FromMM(drill))
    if net:
        v.SetNet(net)
    board.Add(v)
    vias.append((x, y, size / 2))


def chamfer(points, c=0.5):
    """Cut every corner at 45 degrees, the way a router would."""
    if len(points) < 3:
        return points
    out = [points[0]]
    for i in range(1, len(points) - 1):
        (ax, ay), (bx, by), (nx, ny) = points[i - 1], points[i], points[i + 1]
        l1, l2 = math.hypot(bx - ax, by - ay), math.hypot(nx - bx, ny - by)
        d1 = ((bx - ax) / l1, (by - ay) / l1)
        d2 = ((nx - bx) / l2, (ny - by) / l2)
        if abs(d1[0] * d2[1] - d1[1] * d2[0]) < 1e-3:  # straight through
            out.append((bx, by))
            continue
        k = min(c, l1 * 0.45, l2 * 0.45)
        out.append((bx - d1[0] * k, by - d1[1] * k))
        out.append((bx + d2[0] * k, by + d2[1] * k))
    out.append(points[-1])
    return out


def offset(points, off):
    """Offset a polyline sideways with mitred corners, so parallel lanes stay parallel."""
    out = []
    n = len(points)
    for i in range(n):
        x, y = points[i]
        normals = []
        if i > 0:
            ax, ay = points[i - 1]
            L = math.hypot(x - ax, y - ay)
            normals.append((-(y - ay) / L, (x - ax) / L))
        if i < n - 1:
            bx, by = points[i + 1]
            L = math.hypot(bx - x, by - y)
            normals.append((-(by - y) / L, (bx - x) / L))
        mx = sum(v[0] for v in normals)
        my = sum(v[1] for v in normals)
        L = math.hypot(mx, my)
        mx, my = mx / L, my / L
        scale = off / (mx * normals[0][0] + my * normals[0][1])
        out.append((x + mx * scale, y + my * scale))
    return out


def lanes(points, offsets, width=0.15, ch=0.6, end_vias=False):
    for off in offsets:
        p = chamfer(offset(points, off), ch)
        track(p, width)
        if end_vias:
            via(*p[-1])


def bus(points, n, pitch=0.5, width=0.15, ch=0.8):
    lanes(points, [(k - (n - 1) / 2) * pitch for k in range(n)], width, ch)


def pairs(points, n, gap=0.3, pitch=1.1, width=0.15, ch=0.8):
    offs = []
    for k in range(n):
        c = (k - (n - 1) / 2) * pitch
        offs += [c - gap / 2, c + gap / 2]
    lanes(points, offs, width, ch)


def meander(start, end, amp, pitch, vertical=True):
    """An accordion between two points on a straight line: length tuning, as on DDR strobes and clocks."""
    (x1, y1), (x2, y2) = start, end
    pts = [start]
    if vertical:
        n = int(abs(y2 - y1) // pitch)
        s = 1 if y2 > y1 else -1
        for i in range(n):
            side = amp if i % 2 == 0 else -amp
            y = y1 + s * i * pitch
            pts += [(x1 + side, y), (x1 + side, y + s * pitch)]
        pts.append((x1, y1 + s * n * pitch))
    else:
        n = int(abs(x2 - x1) // pitch)
        s = 1 if x2 > x1 else -1
        for i in range(n):
            side = amp if i % 2 == 0 else -amp
            x = x1 + s * i * pitch
            pts += [(x, y1 + side), (x + s * pitch, y1 + side)]
        pts.append((x1 + s * n * pitch, y1))
    pts.append(end)
    return pts


def pad_points(fp, max_size=1.6):
    """Positions and outward directions of a footprint's signal pads (no exposed pads)."""
    cx, cy = local(fp.GetPosition())
    out = []
    for p in fp.Pads():
        bb = p.GetBoundingBox()
        w, h = pcbnew.ToMM(bb.GetWidth()), pcbnew.ToMM(bb.GetHeight())
        if max(w, h) > max_size:
            continue
        x, y = local(p.GetPosition())
        dx, dy = x - cx, y - cy
        if abs(dx) < 0.05 and abs(dy) < 0.05:
            continue
        # leads run along the long side of the pad
        d = (math.copysign(1, dx), 0) if w > h else (0, math.copysign(1, dy))
        out.append((x, y, d, p.GetNumber()))
    return out


def fanout(fp, short=0.9, long=1.7, width=0.15, every=1, skip=None, via_size=0.45):
    """Escape each pad outward to a via, staggering on fine pitch. Skips pads where a via will not fit."""
    ref = fp.GetReference()
    pts = pad_points(fp)
    for i, (x, y, (dx, dy), num) in enumerate(pts):
        if i % every:
            continue
        if skip and skip(x, y):
            continue
        L = long if i % 2 else short
        vx, vy = x + dx * L, y + dy * L
        hw = width / 2
        if not free(vx, vy, via_size / 2 + 0.05, ignore=ref):
            continue
        # the stub must not cross another track
        if any(seg_dist((x + vx) / 2, (y + vy) / 2, a, b, c, d) < hw + w + 0.12 for (a, b, c, d, w) in segs):
            continue
        track([(x, y), (vx, vy)], width)
        via(vx, vy, via_size, 0.2)


def bga_escape(ref, sides="nesw", depth=(1.2, 2.2), pitch=1.0, width=0.13, skip=None):
    """Escape traces leaving the outer ball rows of a BGA, each ending in a via outside the package."""
    x1, y1, x2, y2 = body(ref)
    span = {"n": (x1, x2), "s": (x1, x2), "w": (y1, y2), "e": (y1, y2)}
    for side in sides:
        a, b = span[side]
        k = 0
        t = a + pitch
        while t < b - pitch * 0.5:
            L = depth[k % 2]
            k += 1
            if side == "n":
                p0, p1 = (t, y1 + 0.6), (t, y1 - L)
            elif side == "s":
                p0, p1 = (t, y2 - 0.6), (t, y2 + L)
            elif side == "w":
                p0, p1 = (x1 + 0.6, t), (x1 - L, t)
            else:
                p0, p1 = (x2 - 0.6, t), (x2 + L, t)
            t += pitch
            if skip and skip(*p1):
                continue
            if not free(p1[0], p1[1], 0.3, ignore=ref):
                continue
            if any(seg_dist(*p1, a_, b_, c_, d_) < w_ + 0.5 for (a_, b_, c_, d_, w_) in segs):
                continue
            track([p0, p1], width)
            via(p1[0], p1[1], 0.45, 0.2)


def decap_ring(ref, fp=C0402, gap=0.9, step=1.6, sides="nesw", corner=2.5):
    """Decoupling capacitors along a package's sides, wherever routing leaves room."""
    x1, y1, x2, y2 = body(ref)
    for side in sides:
        if side in "ns":
            y = y1 - gap if side == "n" else y2 + gap
            t = x1 + corner
            while t < x2 - corner:
                passive("C", fp, t, y, 90)
                t += step
        else:
            x = x1 - gap if side == "w" else x2 + gap
            t = y1 + corner
            while t < y2 - corner:
                passive("C", fp, x, t, 0)
                t += step


def zone(net, pts, layer=pcbnew.F_Cu, clearance=0.25, priority=1):
    z = pcbnew.ZONE(board)
    z.SetLayer(layer)
    z.SetNet(net)
    z.SetLocalClearance(pcbnew.FromMM(clearance))
    z.SetMinThickness(pcbnew.FromMM(0.2))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    z.SetAssignedPriority(priority)
    ol = z.Outline()
    ol.NewOutline()
    for px, py in pts:
        ol.Append(pcbnew.FromMM(X0 + px), pcbnew.FromMM(Y0 + py))
    board.Add(z)
    return z


def net(name):
    n = pcbnew.NETINFO_ITEM(board, name)
    board.Add(n)
    return n


GND, VIN, V33, V18, V10, V33A = net("GND"), net("VIN"), net("+3V3"), net("+1V8"), net("+1V0"), net("+3V3A")
SW = [net(f"SW{i}") for i in range(3)]

# ---------------------------------------------------------------- outline (rounded rectangle) and mounting
R = 3.0
edge = pcbnew.Edge_Cuts
line(R, 0, W - R, 0, edge, 0.1)
line(W, R, W, H - R, edge, 0.1)
line(W - R, H, R, H, edge, 0.1)
line(0, H - R, 0, R, edge, 0.1)
k = R * (1 - math.sqrt(0.5))
for start, mid, end in [
    ((0, R), (k, k), (R, 0)),
    ((W - R, 0), (W - k, k), (W, R)),
    ((W, H - R), (W - k, H - k), (W - R, H)),
    ((R, H), (k, H - k), (0, H - R)),
]:
    a = pcbnew.PCB_SHAPE(board)
    a.SetShape(pcbnew.SHAPE_T_ARC)
    a.SetLayer(edge)
    a.SetWidth(pcbnew.FromMM(0.1))
    a.SetArcGeometry(mm(*start), mm(*mid), mm(*end))
    board.Add(a)

for i, (hx, hy) in enumerate([(4.5, 4.5), (W - 4.5, 4.5), (4.5, H - 4.5), (W - 4.5, H - 4.5)]):
    place(f"H{i + 1}", "MountingHole:MountingHole_3.2mm_M3_Pad_Via", hx, hy, show_ref=False)
for i, (fx, fy) in enumerate([(10.5, 2.4), (W - 12, H - 2.4), (2.4, H - 12)]):
    place(f"FID{i + 1}", "Fiducial:Fiducial_1mm_Mask2mm", fx, fy, show_ref=False)

# ================================================================ main parts (placed first, routing follows)
# ---- power entry
place("J0", "Connector_USB:USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal", 17, 3.6, 180, "USB-C 5V", part_id="usb-in")
place("F1", "Fuse:Fuse_1206_3216Metric", 17, 11.4, 0, "2A")
place("D20", "Diode_SMD:D_SMA", 10.2, 14.6, 90, "SMBJ5.0A")
place("C1", "Capacitor_Tantalum_SMD:CP_EIA-3528-21_Kemet-B", 23.6, 12.6, 90, "100uF")

BUCK_X = [32, 47, 62]
RAILS = [("3V3", V33), ("1V8", V18), ("1V0", V10)]
for i, bx in enumerate(BUCK_X):
    place(f"U1{i}", "Package_TO_SOT_SMD:SOT-563", bx, 8, 0, "TPS62A02", show_ref=True)
    place(f"L1{i}", "Inductor_SMD:L_Coilcraft_XAL4020-XXX", bx + 5.4, 8, 0, "1uH")
    place(f"C1{i}0", C0805, bx - 3.0, 6.2, 90, "10uF", show_ref=False)
    place(f"C1{i}1", C0805, bx - 3.0, 10.0, 90, "10uF", show_ref=False)
    for j, cy in enumerate((4.8, 7.4, 10.0)):
        place(f"C1{i}{j + 2}", C0805, bx + 10.0, cy, 0, "22uF", show_ref=False)
    place(f"R1{i}0", R0402, bx - 0.6, 11.6, 90, show_ref=False)
    place(f"R1{i}1", R0402, bx + 0.8, 11.6, 90, show_ref=False)
    place(f"C1{i}5", C0402, bx + 1.4, 5.0, 0, show_ref=False)
    place(f"D1{i}", LED0603, bx + 2.6, 15.0, 0, "PG", show_ref=False, part_id=f"led-{RAILS[i][0].lower()}")
    place(f"R1{i}2", R0402, bx + 5.0, 15.0, 0, show_ref=False)
    silk(RAILS[i][0], bx - 4.0, 15.0, 0.8)
place("U14", "Package_TO_SOT_SMD:SOT-23-5", 74, 8, 0, "LDO 3V3A")
place("C150", C0603, 74, 4.4, 0, show_ref=False)
place("C151", C0603, 74, 11.6, 0, show_ref=False)
place("D9", LED0603, 23.6, 17.6, 0, "PWR", show_ref=False, part_id="led-pwr")
place("R9", R0402, 26.2, 17.6, 0, show_ref=False)
silk("PWR", 18.8, 17.6, 0.8)

# ---- I/O on the left edge (experience)
# rotated so the plug opening faces out over the board edge (pins inboard); the origin moves so the body keeps its place
place("J1", "Connector_RJ:RJ45_Amphenol_RJHSE538X", 9.25, 44.12, 90, "ETH", part_id="archer-aviation")
place("U20", "Package_DFN_QFN:QFN-48-1EP_7x7mm_P0.5mm_EP5.15x5.15mm", 27.5, 37.5, 0, "GBE PHY")
place("Y20", "Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm", 27.5, 28.6, 0, "25MHz")

place("J2", "Connector_Phoenix_MC:PhoenixContact_MC_1,5_4-G-3.5_1x04_P3.50mm_Horizontal", 7.6, 55.0, 270, "CAN 12V", part_id="eco-illini")
place("U21", "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 22.5, 55.5, 90, "CAN XCVR")
place("D21", "Package_TO_SOT_SMD:SOT-23", 16.5, 62.0, 0, "PESD2CAN")
place("U23", "Package_TO_SOT_SMD:SOT-23-5", 23.0, 64.2, 90, "EFUSE")
place("C2", "Capacitor_Tantalum_SMD:CP_EIA-3528-21_Kemet-B", 29.4, 63.0, 90, "47uF")

place("J3", "Connector_Audio:Jack_3.5mm_CUI_SJ1-3523N_Horizontal", 6.5, 82.5, 270, "AUDIO", part_id="spatial-audio-research")
place("U22", "Package_DFN_QFN:QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm", 24.0, 82.0, 0, "CODEC")
place("FB1", FB0603, 16.5, 79.6, 0, show_ref=False)
place("FB2", FB0603, 16.5, 84.6, 0, show_ref=False)

# ---- vision FPGA with camera and HDMI (U2, FPGA edge detection)
place("J21", "Connector_FFC-FPC:Hirose_FH12-24S-0.5SH_1x24-1MP_P0.50mm_Horizontal", 87.0, 3.4, 180, "CAM", part_id="camera")
place("J22", "Connector_Video:HDMI_A_Amphenol_10029449-x01xLF_Horizontal", 110.0, 5.5, 180, "HDMI")
place("U2", "Package_BGA:BGA-256_17.0x17.0mm_Layout16x16_P1.0mm_Ball0.5mm_Pad0.4mm_NSMD", 99.0, 31.0, 0, "FPGA", part_id="fpga-edge-detection")
place("Y21", "Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm", 112.5, 24.6, 0, "100MHz")
place("U24", "Package_SON:WSON-8-1EP_6x5mm_P1.27mm_EP3.4x4.3mm", 113.0, 37.6, 0, "QSPI")

# ---- compute SoC with two DDR chips (U7, CUDA attention kernels)
place("U7", "Package_BGA:BGA-484_23.0x23.0mm_Layout22x22_P1.0mm", 53.0, 45.0, 0, "SOC", part_id="cuda-attention-kernels")
place("U71", "Package_BGA:BGA-96_9.0x13.0mm_Layout2x3x16_P0.8mm", 45.5, 71.0, 90, "DDR4")
place("U72", "Package_BGA:BGA-96_9.0x13.0mm_Layout2x3x16_P0.8mm", 61.0, 71.0, 90, "DDR4")

# ---- trading FPGA with its DDR (U5, FPGA orderbook)
place("U5", "Package_BGA:BGA-324_19.0x19.0mm_Layout18x18_P1.0mm_Ball0.5mm_Pad0.4mm_NSMD", 89.0, 59.0, 0, "FPGA", part_id="fpga-orderbook")
place("U51", "Package_BGA:BGA-96_9.0x13.0mm_Layout2x3x16_P0.8mm", 89.0, 82.0, 90, "DDR4")

# ---- planned board: the FPGA footprint is there, the part is not (U1, High Speed FPGA PCB)
place("U1", "Package_BGA:BGA-324_15.0x15.0mm_Layout18x18_P0.8mm_Ball0.5mm_Pad0.4mm_NSMD", 121.0, 55.0, 0, "DNP", dnp=True, part_id="high-speed-fpga-pcb")

# ---- ESP32-S3 module, antenna over the right edge (U3, VisionVest)
place("U3", "RF_Module:ESP32-S3-WROOM-1", 143.0, 24.0, 270, "ESP32-S3", part_id="visionvest")
place("SW1", "Button_Switch_SMD:SW_SPST_TL3342", 124.5, 10.0, 0, "BOOT")

# ---- board controller (U6, RISC-V CPU)
place("U6", "Package_QFP:LQFP-100_14x14mm_P0.5mm", 120.0, 82.0, 0, "MCU", part_id="risc-v-cpu")
place("Y60", "Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm", 131.0, 75.0, 90, "24MHz")

# ---- analog front end (U4, hardware guitar tuner)
place("U4", "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 40.0, 88.5, 0, "OPA1642", part_id="hardware-guitar-tuner")
place("U41", "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 49.0, 88.5, 0, "OPA1642")
place("U42", "Package_SO:MSOP-8_3x3mm_P0.65mm", 57.5, 88.5, 0, "ADC")

# ---- debug and future work
place("P1", "Connector_JST:JST_GH_SM04B-GHS-TB_1x04-1MP_P1.25mm_Horizontal", 155.6, 46.0, 90, "UART", part_id="contact")
place("J4", "Connector:Tag-Connect_TC2050-IDC-NL_2x05_P1.27mm_Vertical", 108.0, 45.0, 0, "JTAG")
for i, (cx, cy) in enumerate([(146.0, 68.0), (146.0, 81.0)]):
    place(f"U9{i}", "Package_DFN_QFN:QFN-48-1EP_7x7mm_P0.5mm_EP5.15x5.15mm", cx, cy, 0, "DNP", dnp=True, part_id=f"spare-{i}")

# ---- support parts: clock generator, IMU for the ESP32, reset supervisor, power test points
place("U25", "Package_DFN_QFN:QFN-24-1EP_4x4mm_P0.5mm_EP2.6x2.6mm", 79.0, 26.0, 0, "CLKGEN")
place("U30", "Package_LGA:Bosch_LGA-14_3x2.5mm_P0.5mm", 147.0, 57.0, 0, "IMU")
place("U61", "Package_TO_SOT_SMD:SOT-23", 107.0, 86.0, 90, "RESET")
for i, (lbl, x) in enumerate([("VIN", 40.0), ("3V3", 44.0), ("1V8", 48.0), ("1V0", 52.0), ("3V3A", 56.0), ("GND", 60.0)]):
    place(f"TP{i + 1}", "TestPoint:TestPoint_Pad_D1.0mm", x, 23.8, 0, lbl, show_ref=False)
    silk(lbl, x + 1.0, 23.8, 0.55)
for i, x in enumerate([70.0, 74.0, 78.0, 82.0, 86.0, 90.0]):
    place(f"TP{i + 11}", "TestPoint:TestPoint_Pad_D1.0mm", x, 96.0, 0, show_ref=False)
    silk(f"TP{i + 11}", x, 97.9, 0.5, justify="center")

# SoC core regulator: a two-phase buck beside the DDR, the way core rails sit next to big chips
place("U73", "Package_DFN_QFN:QFN-24-1EP_4x4mm_P0.5mm_EP2.6x2.6mm", 72.5, 61.5, 0, "VCORE")
place("L71", "Inductor_SMD:L_Coilcraft_XAL4020-XXX", 72.5, 67.6, 0, "0.47uH")
place("L72", "Inductor_SMD:L_Coilcraft_XAL4020-XXX", 72.5, 73.4, 0, "0.47uH")
for i, cy in enumerate((65.6, 67.6, 69.6, 71.6, 73.6, 75.6)):
    place(f"C7{i}", C0805, 76.6, cy, 0, "47uF", show_ref=False)
# USB-UART bridge for the debug header, and a config EEPROM for the board controller
place("U31", "Package_DFN_QFN:QFN-24-1EP_4x4mm_P0.5mm_EP2.6x2.6mm", 141.0, 45.0, 0, "UART")
place("U62", "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm", 135.5, 88.0, 90, "EEPROM")

# ---- status LEDs, one beside each project part
LEDS = [("D1", 130.2, 47.0, "led-u1"), ("D2", 109.6, 21.0, "led-u2"), ("D3", 128.6, 31.0, "led-u3"),
        ("D4", 62.5, 84.6, "led-u4"), ("D5", 100.4, 49.2, "led-u5"), ("D6", 129.0, 89.6, "led-u6"),
        ("D7", 66.4, 33.4, "led-u7")]
for ref, x, y, pid in LEDS:
    place(ref, LED0603, x, y, 0, "STATUS", show_ref=False, part_id=pid)
    place("R" + ref[1:] + "0", R0402, x + 2.3, y, 0, show_ref=False)

# ================================================================ routing (top layer; inner layers are planes)
# Ethernet: magjack to PHY (four pairs), PHY to SoC (RGMII)
j1 = body("J1")
u20 = body("U20")
pairs([(j1[2], 37.5), (u20[0] - 0.2, 37.5)], 4, gap=0.3, pitch=1.4, width=0.15)
bus([(u20[2] + 0.2, 37.5), (33.5, 37.5), (36.5, 40.5), (body("U7")[0] + 1.0, 40.5)], 12, 0.42, 0.13)
track([(27.5, 30.0), (27.5, 33.8)], 0.15)

# CAN: connector to transceiver to SoC; 12 V in through the eFuse
j2 = body("J2")
pairs([(j2[2], 53.0), (19.0, 53.0), (20.5, 54.5)], 1, gap=0.35, width=0.2)
track([(j2[2], 58.5), (15.0, 58.5), (18.0, 61.5), (20.8, 64.2)], 1.0)
track([(j2[2], 61.5), (12.5, 61.5), (12.5, 66.0), (27.0, 66.0), (29.4, 63.6)], 1.0)
bus([(25.0, 55.5), (32.0, 55.5), (35.0, 52.5), (body("U7")[0] + 1.0, 52.5)], 3, 0.5, 0.15)

# Audio: jack through ferrites to the codec; codec I2S to the SoC
j3 = body("J3")
track([(j3[2], 79.6), (15.7, 79.6)], 0.3)
track([(j3[2], 84.6), (15.7, 84.6)], 0.3)
track([(17.3, 79.6), (19.5, 79.6), (21.0, 81.0)], 0.3)
track([(17.3, 84.6), (19.5, 84.6), (21.0, 83.0)], 0.3)
bus([(24.0, 79.0), (24.0, 74.0), (28.0, 70.0), (34.0, 70.0), (37.0, 67.0), (37.0, 60.0), (body("U7")[0] + 1.0, 56.0)], 4, 0.5, 0.15)

# Camera (MIPI CSI-2: 4 lanes + clock) and HDMI (TMDS: 3 lanes + clock) into the vision FPGA
u2 = body("U2")
pairs([(85.0, body("J21")[3]), (85.0, 12.0), (91.0, 18.0), (93.0, u2[1] + 1.0)], 5, gap=0.25, pitch=0.95, width=0.13)
pairs([(110.0, body("J22")[3]), (110.0, 14.0), (104.5, 19.5), (104.5, u2[1] + 1.0)], 4, gap=0.25, pitch=1.0, width=0.13)
# FPGA to the QSPI flash and the oscillator
bus([(u2[2] - 1.0, 37.0), (body("U24")[0], 37.0)], 4, 0.55, 0.13)
track([(u2[2] - 1.0, 24.6), (body("Y21")[0], 24.6)], 0.15)
# FPGA to the ESP32 (SPI / UART) between the oscillator and the flash
bus([(u2[2] - 1.0, 30.5), (124.0, 30.5), (126.0, 28.5), (body("U3")[0] + 0.5, 28.5)], 4, 0.55, 0.15)

# SoC to FPGA (chip-to-chip link)
u7 = body("U7")
u5 = body("U5")
bus([(u7[2] - 1.0, 48.0), (68.0, 48.0), (72.0, 52.0), (u5[0] + 1.0, 52.0)], 16, 0.42, 0.13)
# vision FPGA to trading FPGA
bus([(94.0, u2[3] - 1.0), (94.0, 44.0), (89.0, 49.0), (89.0, u5[1] + 1.0)], 10, 0.45, 0.13)

# DDR: SoC to its two chips, data lanes straight, strobes length-tuned in between
for cx in (45.5, 61.0):
    bus([(cx, u7[3] - 1.0), (cx, 68.0)], 16, 0.42, 0.13)
dqs = [(53.2, u7[3] - 1.0), (53.2, 59.5)] + meander((53.2, 59.5), (53.2, 65.5), 1.6, 0.9)[1:] + [(53.2, 66.0), (52.4, 67.0)]
lanes(dqs, [-0.16, 0.16], 0.13, 0.2)
# FPGA to its DDR, strobe tuned on the right
u51 = body("U51")
bus([(88.0, u5[3] - 1.0), (88.0, u51[1] + 1.0)], 16, 0.42, 0.13)
dqs2 = [(96.2, u5[3] - 1.0), (96.2, 70.8)] + meander((96.2, 70.8), (96.2, 76.2), 1.1, 0.8)[1:] + [(96.2, 77.0), (u51[2] - 1.0, 80.0)]
lanes(dqs2, [-0.16, 0.16], 0.13, 0.2)

# trading FPGA to the planned board (the footprint is wired, waiting for the part)
u1 = body("U1")
bus([(u5[2] - 1.0, 57.0), (u1[0] + 1.0, 57.0)], 10, 0.4, 0.13)
# board controller: to the trading FPGA, to the ESP32, to the debug header
u6 = body("U6")
bus([(u6[0] + 1.0, 78.0), (104.5, 78.0), (100.5, 74.0), (100.5, 66.5), (98.5, 64.5), (u5[2] - 1.0, 64.5)], 8, 0.5, 0.13)
bus([(124.0, u6[1] + 1.0), (124.0, 70.0), (131.5, 62.5), (131.5, 40.0), (137.0, 34.5), (137.0, body("U3")[3] - 0.5)], 6, 0.55, 0.15)
bus([(150.0, body("U3")[3] - 0.5), (150.0, 43.0), (153.0, 46.0), (body("P1")[0] + 0.3, 46.0)], 4, 0.6, 0.2)
track([(u6[2] - 1.0, 76.0), (129.0, 76.0), (131.0, 75.0)], 0.15)
# analog front end: op-amp chain into the ADC, ADC SPI to the board controller
track([(42.0, 86.6), (44.5, 86.6), (46.0, 87.2)], 0.3)
track([(51.0, 86.6), (53.5, 86.6), (55.5, 87.6)], 0.3)
bus([(59.5, 89.2), (62.0, 91.7), (110.0, 91.7), (113.0, 88.7), (u6[0] + 1.0, 88.7)], 4, 0.5, 0.15)
# spare footprints are routed in advance
for i, cy in enumerate((68.0, 81.0)):
    bus([(u6[2] - 1.0, cy + (-3 if i == 0 else 3)), (136.0, cy + (-3 if i == 0 else 3)), (138.0, cy + (-1 if i == 0 else 1)), (body(f"U9{i}")[0] + 0.5, cy + (-1 if i == 0 else 1))], 6, 0.5, 0.13)

# ---- power: wide feeds and via arrays into the inner planes
track([(17, 7.6), (17, 10.0)], 1.2, net=VIN)
track([(18.6, 11.4), (21.0, 11.4), (23.6, 11.0)], 1.2, net=VIN)
zone(VIN, [(9.0, 17.0), (71.0, 17.0), (71.0, 19.4), (9.0, 19.4)])
for bx in BUCK_X:
    track([(bx - 3.0, 11.0), (bx - 3.0, 17.4)], 0.8, net=VIN)
for i, bx in enumerate(BUCK_X):
    zone(SW[i], [(bx + 0.9, 6.6), (bx + 4.0, 6.6), (bx + 4.0, 9.4), (bx + 0.9, 9.4)], priority=2)
    zone(RAILS[i][1], [(bx + 7.5, 3.4), (bx + 11.6, 3.4), (bx + 11.6, 12.6), (bx + 7.5, 12.6)], priority=2)
    for vy in (3.9, 12.2):
        for vx in (bx + 8.2, bx + 9.4, bx + 10.6):
            via(vx, vy, 0.6, 0.3, RAILS[i][1])
zone(V33A, [(71.5, 3.2), (76.8, 3.2), (76.8, 12.8), (71.5, 12.8)], priority=2)
# the analog rail drops down the left of the SoC to the codec and the op-amps
track([(76.6, 13.0), (76.6, 22.0), (36.0, 22.0), (36.0, 30.0)], 0.6, net=V33A)

# ================================================================ passives that fill in around the routing
for ref in ("U7", "U5", "U2"):
    decap_ring(ref, gap=1.15, step=1.3)
    decap_ring(ref, gap=3.0, step=1.3)
    decap_ring(ref, C0603, gap=5.3, step=2.0, corner=0.5)
for ref in ("U20", "U22", "U6", "U71", "U72", "U51"):
    decap_ring(ref, gap=1.1, step=1.4, corner=1.2)
# bulk capacitors at the BGA corners
for ref in ("U7", "U5", "U2"):
    x1, y1, x2, y2 = body(ref)
    for (cx, cy) in [(x1 - 1.6, y1 - 1.4), (x2 + 1.6, y1 - 1.4), (x1 - 1.6, y2 + 1.4), (x2 + 1.6, y2 + 1.4)]:
        passive("C", C0805, cx, cy, 90)
# termination and pull-ups near the Ethernet PHY, CAN and codec
for (x, y, r) in [(31.5, 33.0, 0), (31.5, 43.0, 0), (19.5, 47.0, 90), (16.5, 52.8, 90), (14.6, 56.6, 0),
                  (28.0, 86.5, 0), (20.0, 88.0, 90), (28.5, 77.5, 0)]:
    passive("RN", RN4, x, y, r)
for (x, y) in [(36.0, 84.0), (36.0, 93.0), (44.5, 93.0), (53.0, 93.0), (44.5, 84.0), (53.0, 84.0), (61.0, 88.5)]:
    for k in range(3):
        passive("C" if k % 2 else "R", C0603 if k % 2 else R0603, x + k * 1.9, y, 90)
# filler 0402s near every IC, the way real boards look
for ref in ("U21", "U23", "U24", "U14", "U42", "U4", "U41", "J4", "SW1", "Y20", "Y21", "Y60", "U25", "U30", "U61", "U20", "U22", "U73", "U31", "U62"):
    x1, y1, x2, y2 = body(ref)
    for (cx, cy, r) in [(x1 - 1.0, (y1 + y2) / 2 - 0.8, 0), (x1 - 1.0, (y1 + y2) / 2 + 0.8, 0),
                        (x2 + 1.0, (y1 + y2) / 2 - 0.8, 0), (x2 + 1.0, (y1 + y2) / 2 + 0.8, 0),
                        ((x1 + x2) / 2 - 1.0, y2 + 0.8, 90), ((x1 + x2) / 2 + 1.0, y2 + 0.8, 90)]:
        passive("C" if random.random() < 0.6 else "R", C0402 if random.random() < 0.7 else R0402, cx, cy, r)

# ================================================================ fanout: every fine-pitch pin escapes to a via
by_ref = {f.GetReference(): f for f in board.GetFootprints()}
for ref in ("U20", "U22", "U6", "U90", "U91"):
    fanout(by_ref[ref], 0.9, 1.75)
zone(V10, [(69.6, 64.6), (78.0, 64.6), (78.0, 76.8), (69.6, 76.8)], priority=2)
for ref in ("U25", "U30", "U73", "U31"):
    fanout(by_ref[ref], 0.8, 1.5)
for ref in ("U21", "U4", "U41", "U42", "U24", "U23", "U14", "D21", "U61", "U62"):
    fanout(by_ref[ref], 1.0, 1.0, 0.2, via_size=0.55)
for ref in ("U7", "U5", "U2"):
    bga_escape(ref)
bga_escape("U71", "we", (1.0, 1.8), 0.8)
bga_escape("U72", "we", (1.0, 1.8), 0.8)
bga_escape("U51", "we", (1.0, 1.8), 0.8)

# the unpopulated FPGA shows its dog-bone fanout: one via between every four balls, inner rings
u1fp = by_ref["U1"]
ux, uy = local(u1fp.GetPosition())
P = 0.8
for r_ in range(18):
    for c_ in range(18):
        ring = min(r_, c_, 17 - r_, 17 - c_)
        if ring < 1:
            continue
        bx_, by_ = ux + (c_ - 8.5) * P, uy + (r_ - 8.5) * P
        sx = 1 if c_ >= 9 else -1
        sy = 1 if r_ >= 9 else -1
        vx, vy = bx_ + sx * P / 2, by_ + sy * P / 2
        if ring == 1 and (r_ + c_) % 2:
            continue
        track([(bx_, by_), (vx, vy)], 0.12)
        v = pcbnew.PCB_VIA(board)
        v.SetPosition(mm(vx, vy))
        v.SetWidth(pcbnew.FromMM(0.4))
        v.SetDrill(pcbnew.FromMM(0.2))
        board.Add(v)
# outer two rows escape straight out, like the routed parts
bga_escape("U1", "nesw", (1.0, 1.9), 0.8)

# ================================================================ ground stitching along the edges and around RF
edge_pts = []
t = 3.0
while t < W - 3.0:
    edge_pts += [(t, 1.3), (t, H - 1.3)]
    t += 2.0
t = 3.0
while t < H - 3.0:
    edge_pts += [(1.3, t), (W - 1.3, t)]
    t += 2.0
for (x, y) in edge_pts:
    if free(x, y, 0.3):
        via(x, y, 0.5, 0.25, GND)
# a sparse field of ground vias in open space ties the planes together
for gx in [i * 3.2 + 2.0 for i in range(50)]:
    for gy in [j * 3.2 + 2.0 for j in range(31)]:
        x, y = gx + (0.8 if int(gy / 3.2) % 2 else 0), gy
        if free(x, y, 0.9):
            via(x, y, 0.5, 0.25, GND)

# ================================================================ silkscreen
silk("ETH", j1[2] + 0.6, j1[1] + 1.0, 0.8, bold=True)
silk("CAN / 12V", 1.6, j2[1] - 1.6, 0.8, bold=True)
silk("LINE", 1.6, j3[1] - 1.6, 0.8, bold=True)
silk("JTAG", 108.0, 49.2, 0.7, justify="center")
silk("UART", W - 2.0, 50.6, 0.7, justify="right")
silk("BOOT", 124.5, 13.8, 0.7, justify="center")
silk("DNP", 121.0, 64.0, 0.8, justify="center")
silk("SPARE", 146.0, 87.6, 0.7, justify="center")
silk("+", 23.6, 9.4, 1.0, justify="center")
silk("+", 29.4, 59.8, 1.0, justify="center")
# U1 is unpopulated: a dashed assembly outline around the empty footprint, like a DNP option
x1, y1, x2, y2 = u1
for (ax, ay, bx_, by_) in [(x1, y1, x2, y1), (x2, y1, x2, y2), (x2, y2, x1, y2), (x1, y2, x1, y1)]:
    L = math.hypot(bx_ - ax, by_ - ay)
    n = int(L // 1.6)
    for i in range(n + 1):
        t0, t1 = i * 1.6 / L, min(1, (i * 1.6 + 0.9) / L)
        if t0 < 1:
            line(ax + (bx_ - ax) * t0, ay + (by_ - ay) * t0, ax + (bx_ - ax) * t1, ay + (by_ - ay) * t1)

# title block, serial label and a 2D code, bottom right
silk("JB-PB01", 112.0, 94.6, 1.5, bold=True)
silk("REV A", 124.6, 94.6, 1.0, bold=True)
silk("J. BAMIDI  2026", 112.0, 97.0, 0.8)
silk("4L  1.6MM  ENIG  1OZ", 124.6, 97.0, 0.6)
box(143.4, 91.6, 150.4, 96.0, filled=True)  # white label area for the assembly serial sticker
cx0, cy0, cell = 136.6, 90.6, 0.4
for r_ in range(14):
    for c_ in range(14):
        on = (c_ == 0 or r_ == 13) or (r_ == 0 and c_ % 2 == 0) or (c_ == 13 and r_ % 2 == 1) or random.random() < 0.45
        if on:
            box(cx0 + c_ * cell, cy0 + r_ * cell, cx0 + (c_ + 1) * cell, cy0 + (r_ + 1) * cell, width=0.0, filled=True)
box(143.4, 96.8, 150.4, 98.2, width=0.1)  # date code box

# ================================================================ ground pour (bottom), finish
z = zone(GND, [(0.5, 0.5), (W - 0.5, 0.5), (W - 0.5, H - 0.5), (0.5, H - 0.5)], layer=pcbnew.B_Cu, clearance=0.3, priority=0)
pcbnew.ZONE_FILLER(board).Fill(board.Zones())

ds = board.GetDesignSettings()
ds.SetCopperLayerCount(4)
pcbnew.SaveBoard(OUT, board)

overlaps = []
big = [r for r in rects if not r[4].startswith(("C", "R", "RN", "FB", "FID", "H")) or r[4] in ("C1", "C2")]
for i, a in enumerate(big):
    for b in big[i + 1:]:
        if a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]:
            overlaps.append(f"{a[4]}/{b[4]}")
with open(os.path.join(HERE, "parts.json"), "w") as f:
    json.dump({"board": {"w": W, "h": H}, "parts": parts}, f, indent=2)
print(f"wrote {OUT}: {len(board.GetFootprints())} footprints, {len(board.GetTracks())} tracks/vias")
print("overlaps:", ", ".join(overlaps) or "none")
print("missing 3D models:", ", ".join(sorted(missing_models)) or "none")
