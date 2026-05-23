"""Generate RosterPro logo assets: light + dark (transparent) full logos and icons."""
from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(r"C:\Users\MD SAIF ALI\.cursor\projects\d-Roster-Website\assets")
OUT_DIR = ROOT / "client" / "public"

LIGHT_SRC_CANDIDATES = list(ASSETS.glob("*Gemini*c1hoh8*.png")) + list(
    ASSETS.glob("*32c12ba0*.png")
)
DARK_SRC_CANDIDATES = list(ASSETS.glob("*00f737f4*.png")) + list(
    ASSETS.glob("*c69e1b25*.png")
)

LIGHT_SRC = (
    LIGHT_SRC_CANDIDATES[0] if LIGHT_SRC_CANDIDATES else OUT_DIR / "rosterpro-logo-source.png"
)
DARK_SRC = DARK_SRC_CANDIDATES[0] if DARK_SRC_CANDIDATES else None


def remove_light_background(im: Image.Image) -> Image.Image:
    """Remove white / light-gray background and faint corner patterns."""
    rgba = im.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    sat = maxc - minc
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    bg = (lum >= 192) & (sat <= 58)
    pale_blue = (lum >= 175) & (b > r + 4) & (b > g) & (sat <= 70)
    arr[bg | pale_blue, 3] = 0

    return Image.fromarray(arr.astype(np.uint8))


def remove_dark_background(im: Image.Image) -> Image.Image:
    """Remove dark navy baked-in background from dark-mode reference art."""
    rgba = im.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    sat = maxc - minc
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    dark_bg = (lum <= 52) & (sat <= 55)
    edge_bg = (lum <= 68) & (sat <= 40) & (b >= r * 0.85) & (b <= g + 25)
    arr[dark_bg | edge_bg, 3] = 0

    return Image.fromarray(arr.astype(np.uint8))


def enhance_dark_logo(im: Image.Image) -> Image.Image:
    """Whiten tagline and lift icon mid-tones for crisp dark UI."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    visible = a > 24
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    sat = maxc - minc

    accent = visible & (b > r + 12) & (b > 130) & (lum > 100)
    tagline = visible & ~accent & (lum >= 120) & (lum < 235) & (sat < 35)
    arr[tagline, 0] = np.minimum(255, arr[tagline, 0] * 0.2 + 245)
    arr[tagline, 1] = np.minimum(255, arr[tagline, 1] * 0.2 + 247)
    arr[tagline, 2] = np.minimum(255, arr[tagline, 2] * 0.2 + 250)

    return Image.fromarray(arr.astype(np.uint8))


def polish_edges(im: Image.Image) -> Image.Image:
    """Soften jagged edges after background removal."""
    alpha = im.split()[3]
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.6))
    alpha_arr = np.array(alpha, dtype=np.float32)
    alpha_arr = np.clip((alpha_arr - 8) * 1.08, 0, 255)
    im.putalpha(Image.fromarray(alpha_arr.astype(np.uint8)))
    return im


def crop_to_content(im: Image.Image, pad: int = 12) -> Image.Image:
    arr = np.array(im)
    mask = arr[:, :, 3] > 24
    if not mask.any():
        return im
    ys, xs = np.where(mask)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width - 1, x1 + pad)
    y1 = min(im.height - 1, y1 + pad)
    return im.crop((x0, y0, x1 + 1, y1 + 1))


def extract_icon(full: Image.Image) -> Image.Image:
    w, h = full.size
    side = h
    left = full.crop((0, 0, min(side, w), h))
    if left.width < side:
        canvas = Image.new("RGBA", (side, h), (0, 0, 0, 0))
        canvas.paste(left, (0, 0))
        return canvas
    return left.crop((0, 0, side, side))


def upscale_if_small(im: Image.Image, min_height: int = 224) -> Image.Image:
    if im.height >= min_height:
        return im
    scale = min_height / im.height
    new_size = (int(im.width * scale), min_height)
    return im.resize(new_size, Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not LIGHT_SRC.exists():
        raise FileNotFoundError(f"Light logo source not found: {LIGHT_SRC}")

    shutil.copy2(LIGHT_SRC, OUT_DIR / "rosterpro-logo-source.png")

    raw_light = Image.open(LIGHT_SRC)
    full_light = polish_edges(crop_to_content(remove_light_background(raw_light)))
    icon_light = polish_edges(crop_to_content(extract_icon(full_light), pad=8))

    full_dark = None
    if DARK_SRC and DARK_SRC.exists():
        shutil.copy2(DARK_SRC, OUT_DIR / "rosterpro-logo-dark-source.png")
        raw_dark = Image.open(DARK_SRC)
        full_dark = polish_edges(
            enhance_dark_logo(
                upscale_if_small(crop_to_content(remove_dark_background(raw_dark)))
            )
        )
        print(f"Dark source: {DARK_SRC}")
    else:
        print("Dark source missing — skipping rosterpro-logo-dark.png")

    paths: dict[str, Image.Image] = {
        "rosterpro-logo.png": full_light,
        "rosterpro-icon.png": icon_light,
    }
    if full_dark is not None:
        icon_dark = polish_edges(crop_to_content(extract_icon(full_dark), pad=8))
        paths["rosterpro-logo-dark.png"] = full_dark
        paths["rosterpro-icon-dark.png"] = icon_dark

    for name, img in paths.items():
        dest = OUT_DIR / name
        img.save(dest, optimize=True)
        print(f"Saved {dest} ({img.size[0]}x{img.size[1]})")

    print(f"Light source: {LIGHT_SRC}")


if __name__ == "__main__":
    main()
