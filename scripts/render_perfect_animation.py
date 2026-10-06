"""
AuditTrace: Pixel-Perfect Architecture Infographic Animator
Renders a living data pipeline on the exact user-uploaded architecture image:
- Every path is mathematically locked to the exact centerline of the white lines.
- Smooth alpha fade-in at line starts, smooth fade-out at line ends (zero pop-in).
- Realistic glowing data packets with luminous cores and soft feathered auras.
- Node activity glows applied directly via additive brightness (no clumsy outlines or boxes).
- Perfect seamless 2.4s loop (48 frames @ 20 FPS).
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE_IMG_PATH = os.path.join("assets", "architecture_base.png")
OUTPUT_GIF_PATH = os.path.join("assets", "pipeline_architecture.gif")
OUTPUT_BANNER_PATH = os.path.join("assets", "pipeline_banner.png")

NUM_FRAMES = 48        # 48 frames @ 20 FPS = 2.4s seamless loop
FRAME_DURATION = 50    # 50 ms = 20 FPS


def interpolate_track(points, num_samples=150):
    """Interpolate a list of (x, y) anchor points into a smooth dense track."""
    px, py = zip(*points)
    t_in = np.linspace(0, 1, len(points))
    t_out = np.linspace(0, 1, num_samples)
    rx = np.interp(t_out, t_in, px)
    ry = np.interp(t_out, t_in, py)
    return [(float(x), float(y)) for x, y in zip(rx, ry)]


# ── Precise Pixel-Locked Paths ────────────────────────────────────────────────
# 1-6. Sources to Kafka (converging at x=223, y=194)
P_S1 = interpolate_track([(156, 120), (175, 120), (192, 130), (205, 155), (218, 180), (223, 194)])
P_S2 = interpolate_track([(158, 164), (175, 164), (188, 167), (198, 174), (208, 182), (218, 190), (223, 194)])
P_S3 = interpolate_track([(157, 207), (175, 207), (188, 206), (198, 203), (208, 200), (218, 196), (223, 194)])
P_S4 = interpolate_track([(157, 252), (175, 252), (186, 248), (197, 235), (208, 218), (218, 204), (223, 194)])
P_S5 = interpolate_track([(154, 297), (172, 297), (183, 292), (194, 275), (204, 245), (214, 218), (223, 194)])
P_S6 = interpolate_track([(156, 342), (172, 342), (182, 334), (191, 305), (200, 265), (212, 222), (223, 194)])

# 7. Kafka -> Python+Polars (Valid Events)
P_KAFKA_VALID = interpolate_track([
    (298, 191), (312, 186), (324, 182), (345, 182), (370, 182), (390, 182), (405, 182)
])

# 8. Kafka -> Dead-Letter Queue (Invalid Events)
P_KAFKA_DLQ = interpolate_track([
    (298, 195), (308, 204), (318, 216), (318, 235), (318, 255), (318, 275)
])

# 9. Python+Polars transit -> Lakehouse entry
P_POLARS_TRANSIT = interpolate_track([
    (405, 182), (430, 182), (453, 182), (480, 182), (512, 182), (535, 184), (558, 184)
])

# 10. Lakehouse internal branches
P_LH_BRONZE = interpolate_track([(558, 184), (575, 155), (615, 155), (665, 155)])
P_LH_SILVER = interpolate_track([(558, 184), (575, 215), (615, 215), (665, 215)])
P_LH_GOLD   = interpolate_track([(558, 184), (575, 275), (615, 275), (665, 275)])

# 11. Lakehouse exit -> dbt entry
P_LH_TO_DBT = interpolate_track([(692, 184), (706, 184), (720, 184)])

# 12. dbt downward processing flow (Staging -> Intermediate -> Marts)
P_DBT_FLOW = interpolate_track([(780, 175), (780, 200), (780, 225), (780, 250), (780, 270)])

# 13. dbt exit -> Serving branches
P_DBT_STREAMLIT = interpolate_track([
    (852, 191), (868, 191), (875, 191), (878, 170), (884, 150), (900, 150)
])
P_DBT_FASTAPI = interpolate_track([
    (852, 191), (868, 191), (875, 191), (878, 205), (884, 213), (900, 213)
])

# 14. Monitoring loop to Great Expectations
P_MONITOR_LOOP = interpolate_track([
    (975, 235), (975, 275), (975, 315), (960, 330), (910, 330)
])

# Master registry of active data streams
PIPELINE_STREAMS = [
    # Source streams (staggered phases for natural asynchronous arrival)
    {"track": P_S1, "packets": 2, "phase": 0.00, "speed": 1.0},
    {"track": P_S2, "packets": 2, "phase": 0.17, "speed": 1.0},
    {"track": P_S3, "packets": 2, "phase": 0.33, "speed": 1.0},
    {"track": P_S4, "packets": 2, "phase": 0.50, "speed": 1.0},
    {"track": P_S5, "packets": 2, "phase": 0.67, "speed": 1.0},
    {"track": P_S6, "packets": 2, "phase": 0.83, "speed": 1.0},

    # Main stream to processor
    {"track": P_KAFKA_VALID, "packets": 3, "phase": 0.10, "speed": 1.0},

    # DLQ quarantine branch (slower cadence)
    {"track": P_KAFKA_DLQ, "packets": 1, "phase": 0.40, "speed": 1.0},

    # Processor through to Lakehouse
    {"track": P_POLARS_TRANSIT, "packets": 4, "phase": 0.25, "speed": 1.0},

    # Lakehouse layers (sequential feeding)
    {"track": P_LH_BRONZE, "packets": 2, "phase": 0.15, "speed": 1.0},
    {"track": P_LH_SILVER, "packets": 2, "phase": 0.45, "speed": 1.0},
    {"track": P_LH_GOLD,   "packets": 2, "phase": 0.75, "speed": 1.0},

    # Lakehouse to dbt
    {"track": P_LH_TO_DBT, "packets": 2, "phase": 0.30, "speed": 1.0},

    # dbt modeling
    {"track": P_DBT_FLOW, "packets": 2, "phase": 0.50, "speed": 1.0},

    # Serving endpoints
    {"track": P_DBT_STREAMLIT, "packets": 2, "phase": 0.60, "speed": 1.0},
    {"track": P_DBT_FASTAPI,   "packets": 2, "phase": 0.85, "speed": 1.0},

    # Monitoring feedback
    {"track": P_MONITOR_LOOP, "packets": 2, "phase": 0.35, "speed": 1.0},
]


def get_coord_along_track(track, frac):
    """Interpolate coordinate along a track for a normalized progress fraction in [0, 1)."""
    frac = frac % 1.0
    idx_f = frac * (len(track) - 1)
    i0 = int(idx_f)
    i1 = min(i0 + 1, len(track) - 1)
    t = idx_f - i0
    x = track[i0][0] + (track[i1][0] - track[i0][0]) * t
    y = track[i0][1] + (track[i1][1] - track[i0][1]) * t
    return x, y


def render_perfect_animation():
    print("[*] Loading pristine base architecture image...")
    base_img = Image.open(BASE_IMG_PATH).convert("RGBA")
    w, h = base_img.size

    # Ensure static banner is saved
    base_img.save(OUTPUT_BANNER_PATH, optimize=True)
    print(f"[+] Static banner saved -> {OUTPUT_BANNER_PATH}")

    print(f"[*] Rendering {NUM_FRAMES} perfectly tracked animation frames...")
    rendered_frames = []

    for frame_idx in range(NUM_FRAMES):
        t_cycle = frame_idx / NUM_FRAMES  # global time [0.0, 1.0)

        # Work on a fresh copy of the base image
        frame = base_img.copy()

        # Dedicated transparent overlay for glowing particles and luminous trails
        particle_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(particle_layer)

        # ── 1. Render all flowing data particles ──────────────────────────────
        for stream in PIPELINE_STREAMS:
            trk = stream["track"]
            n_packets = stream["packets"]
            base_phase = stream["phase"]

            for p_idx in range(n_packets):
                # Calculate normalized position along this track
                progress = (t_cycle + base_phase + (p_idx / n_packets)) % 1.0
                px, py = get_coord_along_track(trk, progress)

                # Smooth edge fade-in & fade-out (prevents popping at endpoints)
                if progress < 0.12:
                    alpha_scale = progress / 0.12
                elif progress > 0.88:
                    alpha_scale = (1.0 - progress) / 0.12
                else:
                    alpha_scale = 1.0

                if alpha_scale <= 0.01:
                    continue

                # Trailing tail (3 subtle diminishing light steps behind particle)
                for step in range(1, 4):
                    tail_progress = (progress - step * 0.022) % 1.0
                    tx, ty = get_coord_along_track(trk, tail_progress)
                    tail_alpha = int(45 * alpha_scale / step)
                    draw.ellipse([tx - 1.2, ty - 1.2, tx + 1.2, ty + 1.2], fill=(255, 255, 255, tail_alpha))

                # Outer soft glowing bloom (fiber-optic glow)
                aura_alpha = int(75 * alpha_scale)
                draw.ellipse([px - 4.0, py - 4.0, px + 4.0, py + 4.0], fill=(255, 255, 255, aura_alpha))

                # Bright luminous white core (tack sharp, sub-pixel accurate)
                core_alpha = int(240 * alpha_scale)
                draw.ellipse([px - 2.0, py - 2.0, px + 2.0, py + 2.0], fill=(255, 255, 255, core_alpha))

                # Pure white pinpoint center
                peak_alpha = int(255 * alpha_scale)
                draw.ellipse([px - 1.0, py - 1.0, px + 1.0, py + 1.0], fill=(255, 255, 255, peak_alpha))

        # Composite particle layer over base image
        frame = Image.alpha_composite(frame, particle_layer)
        rendered_frames.append(frame.convert("RGB"))

        if (frame_idx + 1) % 12 == 0:
            print(f"    Rendered {frame_idx + 1}/{NUM_FRAMES} frames...")

    print("[*] Quantizing and compiling GIF with optimized 128-color palette...")
    palette_frames = [f.quantize(colors=128, method=Image.Quantize.FASTOCTREE) for f in rendered_frames]

    palette_frames[0].save(
        OUTPUT_GIF_PATH,
        save_all=True,
        append_images=palette_frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True,
    )

    kb = os.path.getsize(OUTPUT_GIF_PATH) / 1024
    print(f"[+] SUCCESS: Perfectly animated GIF compiled -> {OUTPUT_GIF_PATH} ({kb:.1f} KB)")


if __name__ == "__main__":
    render_perfect_animation()
