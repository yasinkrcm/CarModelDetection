#!/usr/bin/env python3
"""
Dataset Merger Script
Merges original and augmented datasets into a single training set.
Creates a new data.yaml pointing to the merged dataset.

Usage:
    python scripts/merge_datasets.py --original scripts/Car-Brand-Detection-3/train \
        --augmented scripts/Car-Brand-Detection-3/train_augmented \
        --output scripts/Car-Brand-Detection-3/train_merged
"""

import argparse
import shutil
from pathlib import Path
from typing import List
import yaml


def copy_dataset_split(source_dir: Path, target_dir: Path, prefix: str = ""):
    """Copy images and labels from source to target with optional prefix."""
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy images
    images_source = source_dir / "images"
    images_target = target_dir / "images"
    images_target.mkdir(parents=True, exist_ok=True)
    
    if images_source.exists():
        for img_file in images_source.rglob("*"):
            if img_file.is_file() and img_file.suffix.lower() in {'.jpg', '.jpeg', '.png'}:
                target_file = images_target / f"{prefix}{img_file.name}" if prefix else images_target / img_file.name
                shutil.copy2(img_file, target_file)
    
    # Copy labels
    labels_source = source_dir / "labels"
    labels_target = target_dir / "labels"
    labels_target.mkdir(parents=True, exist_ok=True)
    
    if labels_source.exists():
        for lbl_file in labels_source.rglob("*.txt"):
            target_file = labels_target / f"{prefix}{lbl_file.name}" if prefix else labels_target / lbl_file.name
            shutil.copy2(lbl_file, target_file)


def merge_datasets(original_dir: Path, augmented_dir: Path, output_dir: Path):
    """Merge original and augmented datasets."""
    print(f"Merging datasets:")
    print(f"  Original: {original_dir}")
    print(f"  Augmented: {augmented_dir}")
    print(f"  Output: {output_dir}")
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy original dataset
    print("Copying original dataset...")
    copy_dataset_split(original_dir, output_dir)
    
    # Copy augmented dataset
    print("Copying augmented dataset...")
    copy_dataset_split(augmented_dir, output_dir)
    
    # Count files
    images_count = len(list((output_dir / "images").rglob("*")))
    labels_count = len(list((output_dir / "labels").rglob("*.txt")))
    
    print(f"✅ Merged dataset created:")
    print(f"  Images: {images_count}")
    print(f"  Labels: {labels_count}")


def update_data_yaml(dataset_root: Path, output_yaml: Path):
    """Update data.yaml to point to merged dataset."""
    # Read original data.yaml
    original_yaml = dataset_root / "data.yaml"
    if not original_yaml.exists():
        print(f"❌ Original data.yaml not found: {original_yaml}")
        return False
    
    with open(original_yaml, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    # Update paths to point to merged dataset
    data['train'] = str(dataset_root / "train_merged" / "images")
    data['val'] = str(dataset_root / "valid" / "images")
    data['test'] = str(dataset_root / "test" / "images")
    
    # Write updated data.yaml
    with open(output_yaml, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
    
    print(f"✅ Updated data.yaml saved to: {output_yaml}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Merge original and augmented datasets")
    parser.add_argument("--original", required=True, help="Original dataset path")
    parser.add_argument("--augmented", required=True, help="Augmented dataset path")
    parser.add_argument("--output", required=True, help="Output merged dataset path")
    parser.add_argument("--update-yaml", action="store_true", help="Update data.yaml to use merged dataset")
    
    args = parser.parse_args()
    
    original_dir = Path(args.original)
    augmented_dir = Path(args.augmented)
    output_dir = Path(args.output)
    
    if not original_dir.exists():
        print(f"❌ Original dataset not found: {original_dir}")
        return
    
    if not augmented_dir.exists():
        print(f"❌ Augmented dataset not found: {augmented_dir}")
        return
    
    # Merge datasets
    merge_datasets(original_dir, augmented_dir, output_dir)
    
    # Update data.yaml if requested
    if args.update_yaml:
        dataset_root = original_dir.parent
        output_yaml = dataset_root / "data_merged.yaml"
        update_data_yaml(dataset_root, output_yaml)
        
        print(f"\n📝 To use the merged dataset, update your training script:")
        print(f"   data='{output_yaml}'")


if __name__ == "__main__":
    main()
