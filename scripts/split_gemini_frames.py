import numpy as np
from PIL import Image
from pathlib import Path
from scipy import ndimage

SOURCE_DIR = Path("frames/gemini")
OUTPUT_DIR = Path("frames/gemini_perfect_slices")
INDEX_FILE = Path("frames/geminiSlices.js")


def split_banners():
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source directory not found: {SOURCE_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for child in OUTPUT_DIR.iterdir():
        if child.is_file():
            child.unlink()

    img_sources = sorted(SOURCE_DIR.glob("*.png"))
    if not img_sources:
        raise FileNotFoundError(f"No PNG sources found in {SOURCE_DIR}")

    slice_entries = []

    for src in img_sources:
        img = Image.open(src).convert("RGB")
        img_np = np.array(img)

        mask = np.any(img_np < 240, axis=2)

        labeled, num_features = ndimage.label(mask)
        objects = ndimage.find_objects(labeled)

        banners = []

        for slc in objects:
            y0, y1 = slc[0].start, slc[0].stop
            x0, x1 = slc[1].start, slc[1].stop

            if (y1 - y0) < 50:
                continue

            banners.append((y0, y1, x0, x1))

        banners.sort()

        for i, (y0, y1, x0, x1) in enumerate(banners, 1):
            cropped = img.crop((x0, y0, x1, y1))
            save_path = OUTPUT_DIR / f"{src.stem}_banner_{i:02d}.png"
            cropped.save(save_path)
            slice_entries.append(save_path.relative_to("frames").as_posix())
            print(f"Saved {save_path}")

    with INDEX_FILE.open("w", encoding="utf-8") as fh:
        fh.write("module.exports = [\n")
        for rel in sorted(slice_entries):
            fh.write(f"  require('./{rel}'),\n")
        fh.write("];\n")

    print(f"Split {len(img_sources)} images into {len(slice_entries)} slices.")


split_banners()
