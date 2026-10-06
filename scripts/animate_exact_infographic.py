"""
AuditTrace: Exact Infographic Animation Generator
Animates the USER'S EXACT uploaded architecture diagram without modifying
a single pixel of the original text, layout, typography, or icons.
Overlays bright white glowing data particles flowing along existing paths.
"""

import math
import os
import sys
from PIL import Image, ImageDraw

BASE_IMG_PATH = os.path.join("assets", "architecture_base.png")
OUTPUT_GIF_PATH = os.path.join("assets", "pipeline_architecture.gif")
OUTPUT_BANNER_PATH = os.path.join("assets", "pipeline_banner.png")

NUM_FRAMES = 40        # 40 frames @ 20 FPS = 2.0s seamless loop cycle
FRAME_DURATION = 50    # 50 ms = 20 FPS


def cubic_bezier(p0, p1, p2, p3, t):
    """Cubic Bezier curve point at t in [0.0, 1.0]."""
    u = 1.0 - t
    x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
    return x, y


def sample_bezier(p0, p1, p2, p3, num_samples=100):
    pts = []
    for i in range(num_samples + 1):
        t = i / num_samples
        pts.append(cubic_bezier(p0, p1, p2, p3, t))
    return pts


def sample_linear(p0, p1, num_samples=50):
    pts = []
    for i in range(num_samples + 1):
        t = i / num_samples
        x = p0[0] + (p1[0] - p0[0]) * t
        y = p0[1] + (p1[1] - p0[1]) * t
        pts.append((x, y))
    return pts


# Define exact tracks
TRACKS = [
    # 1. Source 1 (POS Payments) -> Kafka
    {"pts": sample_bezier((154, 118), (185, 118), (210, 192), (226, 200)), "packets": 2, "offset": 0.0},
    # 2. Source 2 (Online Payments) -> Kafka
    {"pts": sample_bezier((154, 163), (185, 163), (210, 196), (226, 201)), "packets": 2, "offset": 0.17},
    # 3. Source 3 (ATM Withdrawals) -> Kafka
    {"pts": sample_bezier((154, 208), (180, 208), (210, 203), (226, 203)), "packets": 2, "offset": 0.33},
    # 4. Source 4 (Bank Transfers) -> Kafka
    {"pts": sample_bezier((154, 253), (185, 253), (210, 207), (226, 205)), "packets": 2, "offset": 0.50},
    # 5. Source 5 (Mobile/Web Apps) -> Kafka
    {"pts": sample_bezier((154, 298), (185, 298), (210, 212), (226, 206)), "packets": 2, "offset": 0.67},
    # 6. Source 6 (Batch Files) -> Kafka
    {"pts": sample_bezier((154, 345), (185, 345), (210, 218), (226, 207)), "packets": 2, "offset": 0.83},

    # 7. Kafka -> Python+Polars (Valid Events)
    {"pts": sample_linear((298, 185), (406, 185), 60), "packets": 3, "offset": 0.1},

    # 8. Kafka -> Dead-Letter Queue (Invalid Events branch)
    {"pts": sample_bezier((298, 195), (318, 205), (318, 240), (318, 282), 60), "packets": 2, "offset": 0.4},

    # 9. Through Python+Polars -> Lakehouse
    {"pts": sample_linear((406, 185), (558, 185), 80), "packets": 3, "offset": 0.25},

    # 10. Lakehouse -> dbt
    {"pts": sample_linear((692, 185), (720, 185), 30), "packets": 2, "offset": 0.45},

    # 11. dbt internal downward processing flow (Staging -> Intermediate -> Marts)
    {"pts": sample_linear((780, 175), (780, 265), 50), "packets": 2, "offset": 0.3},

    # 12. dbt -> Streamlit
    {"pts": sample_bezier((852, 189), (875, 189), (875, 150), (898, 150), 40), "packets": 2, "offset": 0.55},

    # 13. dbt -> FastAPI
    {"pts": sample_bezier((852, 189), (875, 189), (875, 213), (898, 213), 40), "packets": 2, "offset": 0.65},

    # 14. Monitoring feedback loop to Great Expectations
    {"pts": sample_bezier((975, 235), (975, 310), (960, 330), (910, 330), 50), "packets": 2, "offset": 0.8},
]


def get_point_along_path(pts, frac):
    frac = frac % 1.0
    idx_float = frac * (len(pts) - 1)
    i = int(idx_float)
    t = idx_float - i
    if i >= len(pts) - 1:
        return pts[-1]
    x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
    y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
    return x, y


def generate_animated_gif():
    print("[*] Loading exact base architecture image...")
    base_img = Image.open(BASE_IMG_PATH).convert("RGBA")
    w, h = base_img.size
    print(f"[*] Base dimensions: {w}x{h}")

    # Save clean static banner
    base_img.save(OUTPUT_BANNER_PATH, optimize=True)
    print(f"[+] Saved static banner -> {OUTPUT_BANNER_PATH}")

    print(f"[*] Rendering {NUM_FRAMES} frames of seamless living data pipeline...")
    frames = []

    for frame_idx in range(NUM_FRAMES):
        t_global = frame_idx / NUM_FRAMES  # 0.0 to 1.0

        # Start with a pristine copy of the original image
        frame = base_img.copy()

        # Transparent overlay for glowing particles and subtle node pulses
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # ── 1. Subtle Node Activity Pulses ──
        # Kafka Pulse (Center ~ 261, 200, Radius ~ 38)
        k_pulse = 0.5 + 0.5 * math.sin(t_global * 2 * math.pi * 2)  # 2 pulses per cycle
        k_alpha = int(18 + 22 * k_pulse)
        draw.ellipse([261 - 42, 200 - 42, 261 + 42, 200 + 42], fill=None, outline=(255, 255, 255, k_alpha), width=2)

        # Python + Polars Pulse (Center ~ 453, 185, Radius ~ 55)
        p_pulse = 0.5 + 0.5 * math.sin((t_global + 0.3) * 2 * math.pi * 2)
        p_alpha = int(14 + 18 * p_pulse)
        draw.ellipse([453 - 57, 185 - 57, 453 + 57, 185 + 57], fill=None, outline=(255, 255, 255, p_alpha), width=2)

        # Lakehouse Sequential Illumination (Bronze -> Silver -> Gold)
        # Cycle highlights between y ~ 155, 215, 275
        lh_phase = (t_global * 3) % 3.0
        active_layer = int(lh_phase)
        active_frac = lh_phase - active_layer
        layer_glow = math.sin(active_frac * math.pi)
        layer_alpha = int(25 * layer_glow)
        y_centers = [155, 215, 275]
        target_y = y_centers[active_layer]
        draw.rounded_rectangle([555, target_y - 22, 675, target_y + 22], radius=8, fill=(255, 255, 255, layer_alpha))

        # Bottom Infrastructure Subtle Synchronized Activity
        infra_pulse = 0.5 + 0.5 * math.sin(t_global * 2 * math.pi)
        infra_alpha = int(8 + 12 * infra_pulse)
        draw.rounded_rectangle([165, 370, 835, 440], radius=14, fill=None, outline=(255, 255, 255, infra_alpha), width=1)

        # ── 2. Tiny Bright White Data Particles along Paths ──
        for trk in TRACKS:
            pts = trk["pts"]
            n_packets = trk["packets"]
            offset = trk["offset"]

            for p_i in range(n_packets):
                local_t = (t_global + offset + (p_i / n_packets)) % 1.0
                px, py = get_point_along_path(pts, local_t)

                # Particle trail (2 subtle ghost steps behind)
                for step in range(1, 4):
                    trail_t = (local_t - step * 0.02) % 1.0
                    tx, ty = get_point_along_path(pts, trail_t)
                    t_alpha = int(70 / (step + 1))
                    draw.ellipse([tx - 1.5, ty - 1.5, tx + 1.5, ty + 1.5], fill=(255, 255, 255, t_alpha))

                # Outer soft aura (subtle, clean, not blinding)
                draw.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(255, 255, 255, 45))
                # Inner bright white core (tack sharp)
                draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=(255, 255, 255, 220))
                # Pinpoint pure white center
                draw.ellipse([px - 1, py - 1, px + 1, py + 1], fill=(255, 255, 255, 255))

        # Composite overlay on top of original image
        frame = Image.alpha_composite(frame, overlay)
        frames.append(frame.convert("RGB"))

    print(f"[*] Compiling {len(frames)} frames into seamless animated GIF...")
    # Quantize to 256 colors for fast rendering & compact size
    palette_frames = [f.quantize(colors=256, method=Image.Quantize.MEDIANCUT) for f in frames]

    palette_frames[0].save(
        OUTPUT_GIF_PATH,
        save_all=True,
        append_images=palette_frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True,
    )
    kb = os.path.getsize(OUTPUT_GIF_PATH) / 1024
    print(f"[+] Successfully generated: {OUTPUT_GIF_PATH} ({kb:.1f} KB)")


if __name__ == "__main__":
    generate_animated_gif()
