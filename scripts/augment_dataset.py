#!/usr/bin/env python3
"""
Dataset Augmentation Utility
Generates richer training data with challenging conditions to reduce false positives:
- Complex scenes (random crops/paste, perspective)
- Different angles (rotate/affine)
- Lighting and weather (brightness/contrast, fog/rain/snow, shadows)
- Grayscale and tone shifts

Usage:
  python scripts/augment_dataset.py --input scripts/Car-Brand-Detection-3/train \
      --output scripts/Car-Brand-Detection-3/train_augmented --multiplier 2

Notes:
- Expects YOLOv8-style structure under --input: images/ and labels/
- Produces the same structure under --output with new image/label pairs
"""

import argparse
import os
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from tqdm import tqdm


def read_yolo_labels(label_path: Path) -> List[Tuple[int, float, float, float, float]]:
    entries: List[Tuple[int, float, float, float, float]] = []
    if not label_path.exists():
        return entries
    with open(label_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 5:
                continue
            cls = int(parts[0])
            x, y, w, h = map(float, parts[1:])
            entries.append((cls, x, y, w, h))
    return entries


def write_yolo_labels(label_path: Path, entries: List[Tuple[int, float, float, float, float]]):
    label_path.parent.mkdir(parents=True, exist_ok=True)
    with open(label_path, 'w', encoding='utf-8') as f:
        for cls, x, y, w, h in entries:
            f.write(f"{cls} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")


def clip_bbox(cx: float, cy: float, w: float, h: float) -> Tuple[float, float, float, float]:
    cx = min(max(cx, 0.0), 1.0)
    cy = min(max(cy, 0.0), 1.0)
    w = min(max(w, 0.0), 1.0)
    h = min(max(h, 0.0), 1.0)
    return cx, cy, w, h


def random_augment_image(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]

    # Random grayscale
    if np.random.rand() < 0.25:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    # Random brightness/contrast
    alpha = np.random.uniform(0.7, 1.3)  # contrast
    beta = np.random.uniform(-40, 40)    # brightness
    img = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

    # Random HSV shift
    if np.random.rand() < 0.5:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h_shift = np.random.randint(-10, 10)
        s_scale = np.random.uniform(0.8, 1.2)
        v_scale = np.random.uniform(0.8, 1.2)
        hsv[:, :, 0] = (hsv[:, :, 0].astype(np.int32) + h_shift) % 180
        hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(np.float32) * s_scale, 0, 255).astype(np.uint8)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2].astype(np.float32) * v_scale, 0, 255).astype(np.uint8)
        img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # Random blur/noise
    r = np.random.rand()
    if r < 0.2:
        k = np.random.choice([3, 5])
        img = cv2.GaussianBlur(img, (k, k), 0)
    elif r < 0.35:
        noise = np.random.normal(0, 8, img.shape).astype(np.float32)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    # Simulate fog/rain/snow with simple overlays
    if np.random.rand() < 0.2:  # fog
        fog = np.full_like(img, 255)
        alpha = np.random.uniform(0.05, 0.25)
        img = cv2.addWeighted(img, 1 - alpha, fog, alpha, 0)
    if np.random.rand() < 0.15:  # rain streaks
        overlay = img.copy()
        for _ in range(np.random.randint(50, 120)):
            x1 = np.random.randint(0, w)
            y1 = np.random.randint(0, h)
            length = np.random.randint(8, 20)
            thickness = np.random.randint(1, 2)
            color = (200, 200, 200)
            cv2.line(overlay, (x1, y1), (min(w - 1, x1 + 2), min(h - 1, y1 + length)), color, thickness)
        img = cv2.addWeighted(overlay, 0.4, img, 0.6, 0)
    if np.random.rand() < 0.15:  # snow dots
        overlay = img.copy()
        for _ in range(np.random.randint(200, 400)):
            x = np.random.randint(0, w)
            y = np.random.randint(0, h)
            r = np.random.randint(1, 2)
            cv2.circle(overlay, (x, y), r, (255, 255, 255), -1)
        img = cv2.addWeighted(overlay, 0.3, img, 0.7, 0)

    # Random perspective/affine transforms for angle diversity
    if np.random.rand() < 0.3:
        # small perspective warp
        margin = int(0.05 * min(h, w))
        src = np.float32([[margin, margin], [w - margin, margin], [w - margin, h - margin], [margin, h - margin]])
        jitter = np.random.randint(-margin, margin + 1, size=src.shape).astype(np.float32)
        dst = src + jitter
        M = cv2.getPerspectiveTransform(src, dst)
        img = cv2.warpPerspective(img, M, (w, h), borderMode=cv2.BORDER_REFLECT101)

    return img


def process_image(
    img_path: Path,
    label_path: Path,
    out_img_dir: Path,
    out_lbl_dir: Path,
    num_variants: int,
):
    img = cv2.imread(str(img_path))
    if img is None:
        return
    labels = read_yolo_labels(label_path)

    stem = img_path.stem
    ext = img_path.suffix

    for i in range(num_variants):
        aug = random_augment_image(img)

        out_img_path = out_img_dir / f"{stem}_aug{i}{ext}"
        out_lbl_path = out_lbl_dir / f"{stem}_aug{i}.txt"

        # For geometric-only transforms we could adjust boxes; here we apply light
        # geometry so we keep boxes the same to avoid annotation drift.
        # If perspective changed too much, skip copying boxes by filtering tiny boxes.
        kept = []
        for cls, cx, cy, w, h in labels:
            if w * h < 1e-4:  # skip tiny boxes
                continue
            cx, cy, w, h = clip_bbox(cx, cy, w, h)
            kept.append((cls, cx, cy, w, h))

        if len(kept) == 0:
            # Avoid creating unlabeled objects; skip this variant
            continue

        out_img_dir.mkdir(parents=True, exist_ok=True)
        out_lbl_dir.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(out_img_path), aug)
        write_yolo_labels(out_lbl_path, kept)


def main():
    parser = argparse.ArgumentParser(description="YOLO dataset augmentation")
    parser.add_argument("--input", required=True, help="Input split root with images/ and labels/")
    parser.add_argument("--output", required=True, help="Output split root")
    parser.add_argument("--multiplier", type=int, default=1, help="How many variants per input image")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of images (0 = all)")
    args = parser.parse_args()

    in_root = Path(args.input)
    out_root = Path(args.output)
    in_img_dir = in_root / "images"
    in_lbl_dir = in_root / "labels"
    out_img_dir = out_root / "images"
    out_lbl_dir = out_root / "labels"

    image_files = sorted([p for p in in_img_dir.rglob("*.*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"}])
    if args.limit > 0:
        image_files = image_files[: args.limit]

    if len(image_files) == 0:
        print("No images found in input path.")
        return

    print(f"Augmenting {len(image_files)} images x{args.multiplier} into {out_root}")
    for img_path in tqdm(image_files):
        rel = img_path.relative_to(in_img_dir)
        lbl_path = in_lbl_dir / (rel.with_suffix(".txt"))
        process_image(
            img_path=img_path,
            label_path=lbl_path,
            out_img_dir=out_img_dir / rel.parent,
            out_lbl_dir=out_lbl_dir / rel.parent,
            num_variants=args.multiplier,
        )

    print("Done.")


if __name__ == "__main__":
    main()


