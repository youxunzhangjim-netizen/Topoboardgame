#!/usr/bin/env python3
"""Generate Steam store artwork for Topological Board Game.

Usage:
  python tools/generate_steam_capsules.py

Optional:
  python tools/generate_steam_capsules.py --logo local-app/build-resources/icon-1024.png --out local-app/build-resources/steam-capsules
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


GAME_TITLE = "Topological Board Game"
BACKGROUND = (4, 14, 38)
TEXT_FILL = (245, 250, 255)
SHADOW_FILL = (1, 6, 18, 170)
OUTPUTS = {
    "header_capsule_920x430.png": (920, 430),
    "small_capsule_462x174.png": (462, 174),
    "main_capsule_1232x706.png": (1232, 706),
    "vertical_capsule_748x896.png": (748, 896),
    "page_background_1438x810.png": (1438, 810),
    "library_capsule_600x900.png": (600, 900),
    "library_header_920x430.png": (920, 430),
    "library_hero_1920x620.png": (1920, 620),
    "library_hero_3840x1240.png": (3840, 1240),
    "library_logo_1280x720.png": (1280, 720),
    "library_logo_icon_720x720.png": (720, 720),
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def default_logo_path() -> Path:
    resources = repo_root() / "local-app" / "build-resources"
    for name in ("icon-1024.png", "icon.png", "icon-512.png", "icon-256.png"):
        candidate = resources / name
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No logo PNG found in {resources}")


def font_candidates() -> Iterable[Path]:
    names = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for name in names:
        path = Path(name)
        if path.exists():
            yield path


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in font_candidates():
        try:
            return ImageFont.truetype(str(path), size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_bounds(draw: ImageDraw.ImageDraw, lines: list[str], font: ImageFont.ImageFont, spacing: int) -> tuple[int, int]:
    widths = []
    heights = []
    for line in lines:
        left, top, right, bottom = draw.textbbox((0, 0), line, font=font)
        widths.append(right - left)
        heights.append(bottom - top)
    return max(widths or [0]), sum(heights) + spacing * max(0, len(lines) - 1)


def fit_font(draw: ImageDraw.ImageDraw, lines: list[str], max_width: int, max_height: int, max_size: int, min_size: int = 14) -> ImageFont.ImageFont:
    best = load_font(min_size)
    lo, hi = min_size, max_size
    while lo <= hi:
        mid = (lo + hi) // 2
        font = load_font(mid)
        spacing = max(4, mid // 5)
        width, height = text_bounds(draw, lines, font, spacing)
        if width <= max_width and height <= max_height:
            best = font
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def paste_logo(canvas: Image.Image, logo: Image.Image, box: tuple[int, int, int, int]) -> None:
    x, y, width, height = box
    image = logo.copy()
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    px = x + (width - image.width) // 2
    py = y + (height - image.height) // 2
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    canvas.alpha_composite(image, (px, py))


def add_vignette(canvas: Image.Image, strength: int = 170) -> None:
    width, height = canvas.size
    small = Image.new("L", (160, 90), 0)
    pixels = small.load()
    cx, cy = small.size[0] / 2, small.size[1] / 2
    max_dist = (cx * cx + cy * cy) ** 0.5
    for y in range(small.size[1]):
        for x in range(small.size[0]):
            dx = (x - cx) / cx
            dy = (y - cy) / cy
            dist = min(1.0, ((dx * dx + dy * dy) ** 0.5) / 1.05)
            pixels[x, y] = round((dist ** 2.2) * strength)
    mask = small.resize((width, height), Image.Resampling.BICUBIC)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    canvas.alpha_composite(Image.composite(overlay, Image.new("RGBA", (width, height), (0, 0, 0, 0)), mask))


def add_horizontal_gradient(
    canvas: Image.Image,
    left_rgba: tuple[int, int, int, int],
    right_rgba: tuple[int, int, int, int],
    blur: int = 0,
) -> None:
    width, height = canvas.size
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = overlay.load()
    for x in range(width):
        t = x / max(1, width - 1)
        rgba = tuple(round(left_rgba[i] * (1 - t) + right_rgba[i] * t) for i in range(4))
        for y in range(height):
            pixels[x, y] = rgba
    if blur:
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=blur))
    canvas.alpha_composite(overlay)


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    box: tuple[int, int, int, int],
    font: ImageFont.ImageFont,
    align: str = "center",
) -> None:
    x, y, width, height = box
    spacing = max(4, getattr(font, "size", 24) // 5)
    text_width, text_height = text_bounds(draw, lines, font, spacing)
    top = y + (height - text_height) // 2
    for line in lines:
        left, text_top, right, bottom = draw.textbbox((0, 0), line, font=font)
        line_width = right - left
        line_height = bottom - text_top
        if align == "left":
            tx = x
        else:
            tx = x + (width - line_width) // 2
        draw.text((tx + 3, top + 3), line, font=font, fill=SHADOW_FILL)
        draw.text((tx, top), line, font=font, fill=TEXT_FILL)
        top += line_height + spacing


def draw_centered_plain_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    box: tuple[int, int, int, int],
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int, int] = TEXT_FILL + (255,),
) -> None:
    x, y, width, height = box
    spacing = max(4, getattr(font, "size", 24) // 5)
    _, text_height = text_bounds(draw, lines, font, spacing)
    top = y + (height - text_height) // 2
    for line in lines:
        left, text_top, right, bottom = draw.textbbox((0, 0), line, font=font)
        line_width = right - left
        line_height = bottom - text_top
        draw.text((x + (width - line_width) // 2, top), line, font=font, fill=fill)
        top += line_height + spacing


def choose_landscape_lines(draw: ImageDraw.ImageDraw, max_width: int, max_height: int, max_size: int) -> tuple[list[str], ImageFont.ImageFont]:
    single = [GAME_TITLE]
    single_font = fit_font(draw, single, max_width, max_height, max_size, min_size=16)
    single_width, _ = text_bounds(draw, single, single_font, max(4, getattr(single_font, "size", 24) // 5))
    if single_width >= max_width * 0.82 or getattr(single_font, "size", 16) < max_size * 0.55:
        lines = ["Topological", "Board Game"]
        return lines, fit_font(draw, lines, max_width, max_height, max_size, min_size=16)
    return single, single_font


def create_landscape(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, BACKGROUND + (255,))
    draw = ImageDraw.Draw(canvas)
    margin_x = round(width * 0.055)
    margin_y = round(height * 0.11)
    logo_size = min(round(height * 0.74), round(width * 0.34))
    logo_box = (margin_x, (height - logo_size) // 2, logo_size, logo_size)
    paste_logo(canvas, logo, logo_box)

    text_x = logo_box[0] + logo_box[2] + round(width * 0.055)
    text_box = (text_x, margin_y, width - text_x - margin_x, height - margin_y * 2)
    lines, font = choose_landscape_lines(draw, text_box[2], text_box[3], round(height * 0.18))
    draw_centered_lines(draw, lines, text_box, font, align="left")
    return canvas.convert("RGB")


def create_vertical(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, BACKGROUND + (255,))
    draw = ImageDraw.Draw(canvas)
    logo_size = min(round(width * 0.72), round(height * 0.44))
    paste_logo(canvas, logo, ((width - logo_size) // 2, round(height * 0.075), logo_size, logo_size))

    lines = ["Topological", "Board Game"]
    text_box = (round(width * 0.08), round(height * 0.55), round(width * 0.84), round(height * 0.36))
    font = fit_font(draw, lines, text_box[2], text_box[3], round(width * 0.12), min_size=18)
    draw_centered_lines(draw, lines, text_box, font)
    return canvas.convert("RGB")


def create_logo_stroke_watermark(logo: Image.Image, max_size: tuple[int, int], opacity: float = 0.34) -> Image.Image:
    mark = logo.copy().convert("RGBA")
    mark.thumbnail(max_size, Image.Resampling.LANCZOS)
    source = mark.convert("RGBA")
    pixels = source.load()
    width, height = source.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            brightness = (r * 0.299 + g * 0.587 + b * 0.114)
            blue_signal = max(0, b - 52)
            white_signal = max(0, brightness - 72)
            signal = max(blue_signal, white_signal)
            alpha = int(max(0, min(255, signal * 1.85)) * opacity * (a / 255))
            if alpha <= 4:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (255, 255, 255, alpha)
    soft = source.filter(ImageFilter.GaussianBlur(radius=1.6))
    soft.alpha_composite(source)
    return soft


def create_page_background(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, BACKGROUND + (255,))

    # Steam page backgrounds work best as ambient art. Keep this smooth:
    # no text, no grid, no square logo background, and no sharp rectangles.
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow, "RGBA")
    glows = [
        (0.36, 0.44, 940, (22, 88, 158, 70)),
        (0.88, 0.38, 820, (48, 138, 218, 112)),
        (0.74, 0.44, 640, (30, 104, 188, 82)),
        (0.58, 0.84, 780, (9, 40, 86, 54)),
        (0.18, 0.18, 520, (5, 28, 70, 28)),
    ]
    for cx_ratio, cy_ratio, radius, fill in glows:
        cx = round(width * cx_ratio)
        cy = round(height * cy_ratio)
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=fill)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=95))
    canvas.alpha_composite(glow)

    # Gentle top-left to bottom-right color wash.
    wash = Image.new("RGBA", size, (0, 0, 0, 0))
    wash_pixels = wash.load()
    for y in range(height):
        y_mix = y / max(1, height - 1)
        for x in range(width):
            x_mix = x / max(1, width - 1)
            alpha = round(42 * (1 - x_mix) * (1 - y_mix) + 30 * x_mix * y_mix)
            wash_pixels[x, y] = (12, 67, 128, alpha)
    wash = wash.filter(ImageFilter.GaussianBlur(radius=28))
    canvas.alpha_composite(wash)
    add_horizontal_gradient(canvas, (0, 0, 0, 96), (28, 111, 196, 18), blur=24)

    # Half-visible icon mark: bright strokes only, cropped off the right edge.
    watermark = create_logo_stroke_watermark(
        logo,
        (round(width * 0.72), round(height * 1.12)),
        opacity=0.38,
    )
    x = round(width * 0.66)
    y = round((height - watermark.height) * 0.50)
    canvas.alpha_composite(watermark, (x, y))

    # Keep the left side calmer for page text, without darkening every edge.
    add_horizontal_gradient(canvas, (0, 0, 0, 64), (0, 0, 0, 0), blur=18)
    return canvas.convert("RGB")


def draw_soft_grid(canvas: Image.Image, opacity: int = 34, step: int = 58) -> None:
    width, height = canvas.size
    grid = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid, "RGBA")
    for x in range(-step, width + step, step):
        draw.line((x, 0, x + round(height * 0.18), height), fill=(78, 150, 230, opacity), width=1)
    for y in range(0, height + step, step):
        draw.line((0, y, width, y), fill=(78, 150, 230, opacity), width=1)
    grid = grid.filter(ImageFilter.GaussianBlur(radius=0.35))
    canvas.alpha_composite(grid)


def create_library_capsule(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, BACKGROUND + (255,))
    draw = ImageDraw.Draw(canvas)

    logo_size = round(width * 0.68)
    paste_logo(canvas, logo, ((width - logo_size) // 2, round(height * 0.08), logo_size, logo_size))

    lines = ["Topological", "Board Game"]
    text_box = (round(width * 0.08), round(height * 0.58), round(width * 0.84), round(height * 0.30))
    font = fit_font(draw, lines, text_box[2], text_box[3], round(width * 0.13), min_size=22)
    draw_centered_lines(draw, lines, text_box, font)
    add_vignette(canvas, strength=86)
    return canvas.convert("RGB")


def create_library_header(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    return create_landscape(logo, size)


def create_library_hero(logo: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, BACKGROUND + (255,))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow, "RGBA")
    for cx_ratio, cy_ratio, radius, fill in [
        (0.78, 0.48, round(width * 0.34), (24, 106, 198, 64)),
        (0.94, 0.50, round(width * 0.25), (90, 166, 255, 54)),
    ]:
        cx = round(width * cx_ratio)
        cy = round(height * cy_ratio)
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=fill)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=max(42, round(width * 0.035))))
    canvas.alpha_composite(glow)
    logo_size = round(height * 0.86)
    paste_logo(canvas, logo, (width - logo_size - round(width * 0.04), (height - logo_size) // 2, logo_size, logo_size))
    add_horizontal_gradient(canvas, (0, 0, 0, 66), (0, 0, 0, 0), blur=24)
    return canvas.convert("RGB")


def create_library_logo(logo: Image.Image, size: tuple[int, int], icon_only: bool = False) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    if icon_only:
        logo_size = round(min(width, height) * 0.84)
        paste_logo(canvas, logo, ((width - logo_size) // 2, (height - logo_size) // 2, logo_size, logo_size))
        return canvas

    text_box = (round(width * 0.08), round(height * 0.20), round(width * 0.84), round(height * 0.60))
    lines = [GAME_TITLE]
    font = fit_font(draw, lines, text_box[2], text_box[3], round(height * 0.20), min_size=32)
    draw_centered_plain_lines(draw, lines, text_box, font, fill=TEXT_FILL + (255,))
    return canvas


def generate_capsules(logo_path: Path, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    logo = Image.open(logo_path).convert("RGBA")
    written = []
    for filename, size in OUTPUTS.items():
        if filename.startswith("page_background"):
            image = create_page_background(logo, size)
        elif filename.startswith("library_capsule"):
            image = create_library_capsule(logo, size)
        elif filename.startswith("library_header"):
            image = create_library_header(logo, size)
        elif filename.startswith("library_hero"):
            image = create_library_hero(logo, size)
        elif filename.startswith("library_logo_icon"):
            image = create_library_logo(logo, size, icon_only=True)
        elif filename.startswith("library_logo"):
            image = create_library_logo(logo, size)
        elif "vertical" in filename:
            image = create_vertical(logo, size)
        else:
            image = create_landscape(logo, size)
        output = out_dir / filename
        image.save(output, "PNG", optimize=True)
        written.append(output)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Steam capsule images for Topological Board Game.")
    parser.add_argument("--logo", type=Path, default=default_logo_path(), help="Path to the square logo PNG.")
    parser.add_argument("--out", type=Path, default=repo_root() / "local-app" / "build-resources" / "steam-capsules", help="Output directory.")
    args = parser.parse_args()
    written = generate_capsules(args.logo, args.out)
    print(f"Logo: {args.logo}")
    for path in written:
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
