"""
Phase 0 look development for the portfolio board.

Imports board/portfolio.glb (exported from KiCad), replaces KiCad's flat colours with
physically based materials, lights the scene, and renders the look-dev stills.

Run headless:
  blender -b --python blender/lookdev.py -- <glb> <out_dir> [--mask green|black|blue] [--views hero,closeup,case] [--samples 96]
The .blend is saved next to the renders so the scene can be opened and tuned by hand.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
GLB, OUT = argv[0], argv[1]
opts = {"mask": "green", "views": "hero,closeup,case", "samples": "96", "scale": "100"}
for i, a in enumerate(argv):
    if a.startswith("--"):
        opts[a[2:]] = argv[i + 1]
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ palette (linear RGB)
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


MASKS = {
    # solder mask colour, and the page background the render sits on
    "green": ("#0D4A2C", "#0C1512"),
    "black": ("#141617", "#0D0F10"),
    "blue": ("#0C1E3D", "#0B1220"),
}
mask_hex, bg_hex = MASKS[opts["mask"]]

LED = {
    "D9": "#5EDC9C", "D10": "#5EDC9C", "D11": "#5EDC9C", "D12": "#5EDC9C",  # power and rails
    "D1": "#FFB648",  # U1 planned
    "D2": "#5EDC9C", "D3": "#5EDC9C", "D4": "#5EDC9C", "D5": "#5EDC9C", "D6": "#5EDC9C", "D7": "#5EDC9C",
}

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scene = bpy.context.scene


def principled(name, color, metallic=0.0, rough=0.5, coat=0.0, alpha=1.0, emission=None, strength=0.0, transmission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.25
    b.inputs["Alpha"].default_value = alpha
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if emission:
        b.inputs["Emission Color"].default_value = emission
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        m.surface_render_method = "BLENDED"
    return m


def noise_bump(mat, scale=900.0, strength=0.06):
    """Fine fibre-weave texture so the mask reads as FR-4 under light, not flat paint."""
    nt = mat.node_tree
    tex = nt.nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = 6
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(tex.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])


M = {
    "mask": principled("mask", srgb(mask_hex), rough=0.32, coat=0.35, alpha=0.5),
    "fr4": principled("fr4_edge", srgb("#1E2416"), rough=0.8),
    "silk": principled("silkscreen", srgb("#E8E6DC"), rough=0.75),
    "copper": principled("enig_pads", srgb("#D4AE62"), metallic=1.0, rough=0.26),
    "gold": principled("enig_gold", srgb("#D9B25F"), metallic=1.0, rough=0.2),
    "epoxy": principled("epoxy", srgb("#151618"), rough=0.58),
    "tin": principled("tin", srgb("#C9CCCF"), metallic=1.0, rough=0.28),
    "ceramic": principled("ceramic", srgb("#B8A27E"), rough=0.6),
    "plastic_white": principled("plastic_white", srgb("#D8D6CE"), rough=0.55),
    "plastic_dark": principled("plastic_dark", srgb("#2A2C2E"), rough=0.5),
    "kapton": principled("kapton", srgb("#B8721E"), rough=0.4, transmission=0.2),
    "shield": principled("rf_shield", srgb("#B9BDC2"), metallic=1.0, rough=0.38),
}
noise_bump(M["mask"])
noise_bump(M["epoxy"], 1400, 0.03)


def classify(mat):
    """Map KiCad's export colours to real materials."""
    b = mat.node_tree.nodes.get("Principled BSDF") if mat and mat.node_tree else None
    if not b:
        return None
    r, g, bl = b.inputs["Base Color"].default_value[:3]
    met = b.inputs["Metallic"].default_value
    lum = (r + g + bl) / 3
    if abs(r - 0.42) < 0.03 and abs(g - 0.45) < 0.03:
        return "fr4"
    if g > r + 0.05 and g > bl and lum < 0.25:
        return "mask"
    if lum > 0.95:
        return "silk"
    if abs(r - 0.5) < 0.02 and abs(g - 0.5) < 0.02 and met > 0.5:
        return "copper"
    if r > 0.6 and bl < 0.1 and met > 0.5:
        return "gold"
    if r > 0.6 and g > 0.5 and bl < 0.3:
        return "gold"
    if lum < 0.06:
        return "epoxy"
    if r > 0.6 and g > 0.4 and bl < 0.3 and r - bl > 0.3:
        return "kapton"
    if met > 0.5 and lum > 0.45:
        return "tin"
    if lum > 0.6:
        return "plastic_white"
    if lum < 0.35:
        return "plastic_dark"
    return "ceramic"


def top_ref(obj):
    p = obj
    while p.parent and p.parent.name != "Node_0":
        p = p.parent
    return p.name.split(".")[0]


for o in list(bpy.data.objects):
    if o.type != "MESH":
        continue
    ref = top_ref(o)
    for i, slot in enumerate(o.material_slots):
        key = classify(slot.material)
        if ref in LED and slot.material and key in ("plastic_white", "ceramic", "tin"):
            # the LED lens: emissive, coloured by status
            led = principled(f"led_{ref}", srgb(LED[ref]), rough=0.2, emission=srgb(LED[ref]), strength=18.0)
            o.material_slots[i].material = led
        elif ref == "U3" and key in ("epoxy", "plastic_dark"):
            # the ESP32 module wears a metal RF shield
            o.material_slots[i].material = M["shield"]
        elif key:
            o.material_slots[i].material = M[key]

# ------------------------------------------------------------------ world, ground and light
world = bpy.data.worlds.new("bench")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb(bg_hex)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.06

bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0, 0, -0.0018))
ground = bpy.context.object
ground.name = "ground"
gm = principled("ground", tuple(c * 0.55 for c in srgb(bg_hex)[:3]) + (1.0,), rough=0.95)
ground.data.materials.append(gm)
ground.is_shadow_catcher = False


def area(name, loc, target, size, energy, color="#FFFFFF", spread=55):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.name = name
    L.data.size = size
    L.data.energy = energy
    L.data.color = srgb(color)[:3]
    d = Vector(target) - Vector(loc)
    L.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    L.data.spread = math.radians(spread)
    return L


area("key", (-0.17, -0.06, 0.3), (0, 0, 0), 0.22, 1.6, "#F4F6FF", 45)    # soft key: above, front left, neutral so the mask reads true
area("fill", (0.22, -0.18, 0.1), (0, 0, 0), 0.3, 0.3, "#CFE0FF")         # dim cool fill, front right
area("rim", (0.05, 0.26, 0.05), (0, 0, 0.0), 0.35, 1.0, "#E6ECFF")       # cool rim from behind, picks out edges

# ------------------------------------------------------------------ render settings
scene.render.engine = "CYCLES"
scene.cycles.samples = int(opts["samples"])
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.cycles.transparent_max_bounces = 16
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = float(opts.get("exposure", "-1.4"))
scene.render.resolution_percentage = int(opts["scale"])
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            if any(d.type != "CPU" for d in prefs.devices):
                for d in prefs.devices:
                    d.use = True
                scene.cycles.device = "GPU"
                print("render device", backend)
                break
        except TypeError:
            continue
except Exception as e:  # noqa: BLE001
    print("GPU setup skipped:", e)


def part_center(ref):
    o = bpy.data.objects.get(ref)
    if not o:
        return Vector((0, 0, 0))
    pts = []
    for c in [c for c in o.children_recursive if c.type == "MESH"] or [o]:
        pts += [c.matrix_world @ Vector(v) for v in c.bound_box]
    return sum(pts, Vector()) / len(pts)


def camera(name, loc, target, lens, dof_target=None, fstop=None, shift_x=0.0, shift_y=0.0):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.name = name
    cam.data.lens = lens
    cam.data.clip_start = 0.001
    # lens shift slides the board within the frame without changing its perspective
    cam.data.shift_x = shift_x
    cam.data.shift_y = shift_y
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if dof_target is not None:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = (Vector(dof_target) - Vector(loc)).length
        cam.data.dof.aperture_fstop = fstop
    return cam


def top_mark(ref, image, aspect):
    """A company mark printed in black gloss on a part's top face (matches topMark() in the web
    scene). image is white on transparent; its alpha cuts the print out of a flat plane."""
    o = bpy.data.objects.get(ref)
    if not o or not os.path.exists(image):
        return
    pts = [c.matrix_world @ Vector(v) for c in o.children_recursive if c.type == "MESH" for v in c.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    h = min((hi.y - lo.y) * 0.5, (hi.x - lo.x) * 0.5 / aspect)
    bpy.ops.mesh.primitive_plane_add(size=1, location=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z + 0.00003))
    plane = bpy.context.object
    plane.name = f"mark_{ref}"
    plane.scale = (h * aspect, h, 1)
    m = principled(f"mark_{ref}", srgb("#030303"), rough=0.12, coat=1.0)
    nt = m.node_tree
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(image)
    nt.links.new(tex.outputs["Alpha"], nt.nodes["Principled BSDF"].inputs["Alpha"])
    plane.data.materials.append(m)


# Archer Aviation's mark on J1, the Ethernet jack that stands for the role
top_mark("J1", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "board", "web", "archer-mark.png"), 200 / 212)

u3 = part_center("U3")
u4 = part_center("U4")
views = {
    # hero: board at about 28 degrees, slightly off centre, room on the left for the name
    "hero": (camera("cam_hero", (0.0, -0.265, 0.165), (0.0, 0.0, 0.0), 40, shift_x=-0.17, shift_y=0.02), (1920, 1080)),
    # close-up on the ESP32 module (VisionVest), shallow focus
    "closeup": (camera("cam_closeup", (u3.x - 0.07, u3.y - 0.1, 0.075), (u3.x - 0.004, u3.y, 0.002), 70, (u3.x, u3.y, 0.003), 8.0), (1600, 1200)),
    # case-study header: near top-down on the analog section (guitar tuner)
    "case": (camera("cam_case", (u4.x + 0.012, u4.y - 0.03, 0.085), (u4.x + 0.006, u4.y + 0.004, 0.0), 60, (u4.x + 0.006, u4.y + 0.004, 0.002), 4.0), (2400, 1000)),
}

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f"lookdev-{opts['mask']}.blend"))
for v in opts["views"].split(","):
    cam, (w, h) = views[v]
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.filepath = os.path.join(OUT, f"{v}-{opts['mask']}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", scene.render.filepath)
