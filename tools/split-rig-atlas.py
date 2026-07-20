#!/usr/bin/env python3
"""Split the generated cat cutout atlas into padded Spine attachments."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "hero-rig-atlas-v3.png"
OUTPUT = ROOT / "assets" / "hero-rig-v3"

# Pixel regions are deliberately wider than the painted pieces. Every crop is
# trimmed against alpha afterwards so the output origin remains deterministic.
PARTS = {
    "head": (130, 15, 485, 355),
    "torso": (500, 25, 835, 455),
    "cape": (845, 70, 1415, 355),
    "rear_upper_arm": (120, 370, 315, 650),
    "rear_forearm": (325, 375, 600, 650),
    "front_upper_arm": (590, 400, 810, 650),
    "front_forearm": (795, 385, 1070, 650),
    "tail": (1080, 330, 1425, 665),
    "rear_thigh": (120, 640, 320, 970),
    "rear_shin": (365, 645, 555, 985),
    "front_thigh": (585, 640, 815, 985),
    "front_shin": (835, 640, 1045, 985),
    "dagger": (1040, 625, 1435, 985),
}


def main() -> None:
    atlas = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, box in PARTS.items():
        crop = atlas.crop(box)
        alpha_box = crop.getchannel("A").getbbox()
        if alpha_box is None:
            raise RuntimeError(f"No opaque pixels found for {name}")
        crop = crop.crop(alpha_box)
        padded = Image.new("RGBA", (crop.width + 16, crop.height + 16))
        padded.alpha_composite(crop, (8, 8))
        padded.save(OUTPUT / f"{name}.png", optimize=True)
        print(f"{name}: {padded.width}x{padded.height}")


if __name__ == "__main__":
    main()
