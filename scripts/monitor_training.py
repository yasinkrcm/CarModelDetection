#!/usr/bin/env python3
"""
Training Monitor Script
Monitors YOLOv8 training progress and displays metrics.

Usage:
    python scripts/monitor_training.py --runs-dir runs/detect/car_brand_detection_enhanced
"""

import argparse
import json
import time
from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd


def monitor_training_progress(runs_dir: Path):
    """Monitor training progress and display metrics."""
    print(f"📊 Monitoring training progress: {runs_dir}")
    
    results_file = runs_dir / "results.csv"
    if not results_file.exists():
        print(f"❌ Results file not found: {results_file}")
        return
    
    try:
        # Read training results
        df = pd.read_csv(results_file)
        
        if df.empty:
            print("❌ No training data found")
            return
        
        # Display latest metrics
        latest = df.iloc[-1]
        print(f"\n📈 Latest Training Metrics (Epoch {latest.get('epoch', 'N/A')}):")
        print(f"  Train Loss: {latest.get('train/box_loss', 'N/A'):.4f}")
        print(f"  Val Loss: {latest.get('val/box_loss', 'N/A'):.4f}")
        print(f"  mAP50: {latest.get('metrics/mAP50(B)', 'N/A'):.4f}")
        print(f"  mAP50-95: {latest.get('metrics/mAP50-95(B)', 'N/A'):.4f}")
        print(f"  Precision: {latest.get('metrics/precision(B)', 'N/A'):.4f}")
        print(f"  Recall: {latest.get('metrics/recall(B)', 'N/A'):.4f}")
        
        # Plot training curves
        plot_training_curves(df, runs_dir)
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading training data: {e}")
        return False


def plot_training_curves(df: pd.DataFrame, output_dir: Path):
    """Create training curve plots."""
    try:
        fig, axes = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle('Training Progress', fontsize=16)
        
        # Loss curves
        if 'train/box_loss' in df.columns and 'val/box_loss' in df.columns:
            axes[0, 0].plot(df['epoch'], df['train/box_loss'], label='Train Loss', color='blue')
            axes[0, 0].plot(df['epoch'], df['val/box_loss'], label='Val Loss', color='red')
            axes[0, 0].set_title('Box Loss')
            axes[0, 0].set_xlabel('Epoch')
            axes[0, 0].set_ylabel('Loss')
            axes[0, 0].legend()
            axes[0, 0].grid(True)
        
        # mAP curves
        if 'metrics/mAP50(B)' in df.columns:
            axes[0, 1].plot(df['epoch'], df['metrics/mAP50(B)'], label='mAP50', color='green')
            axes[0, 1].set_title('mAP50')
            axes[0, 1].set_xlabel('Epoch')
            axes[0, 1].set_ylabel('mAP50')
            axes[0, 1].legend()
            axes[0, 1].grid(True)
        
        # Precision/Recall
        if 'metrics/precision(B)' in df.columns and 'metrics/recall(B)' in df.columns:
            axes[1, 0].plot(df['epoch'], df['metrics/precision(B)'], label='Precision', color='orange')
            axes[1, 0].plot(df['epoch'], df['metrics/recall(B)'], label='Recall', color='purple')
            axes[1, 0].set_title('Precision & Recall')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('Score')
            axes[1, 0].legend()
            axes[1, 0].grid(True)
        
        # Learning rate
        if 'lr/pg0' in df.columns:
            axes[1, 1].plot(df['epoch'], df['lr/pg0'], label='Learning Rate', color='brown')
            axes[1, 1].set_title('Learning Rate')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('LR')
            axes[1, 1].legend()
            axes[1, 1].grid(True)
        
        plt.tight_layout()
        
        # Save plot
        plot_path = output_dir / "training_curves.png"
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"📊 Training curves saved: {plot_path}")
        
        plt.show()
        
    except Exception as e:
        print(f"⚠️ Error creating plots: {e}")


def check_model_availability(runs_dir: Path):
    """Check if trained model is available."""
    best_model = runs_dir / "weights" / "best.pt"
    last_model = runs_dir / "weights" / "last.pt"
    
    print(f"\n🔍 Model Availability:")
    print(f"  Best model: {'✅' if best_model.exists() else '❌'} {best_model}")
    print(f"  Last model: {'✅' if last_model.exists() else '❌'} {last_model}")
    
    if best_model.exists():
        size_mb = best_model.stat().st_size / (1024 * 1024)
        print(f"  Best model size: {size_mb:.1f} MB")
    
    return best_model.exists()


def main():
    parser = argparse.ArgumentParser(description="Monitor YOLOv8 training progress")
    parser.add_argument("--runs-dir", default="runs/detect/car_brand_detection_enhanced", 
                       help="Training runs directory")
    parser.add_argument("--watch", action="store_true", help="Watch mode - continuously monitor")
    parser.add_argument("--interval", type=int, default=30, help="Watch interval in seconds")
    
    args = parser.parse_args()
    
    runs_dir = Path(args.runs_dir)
    
    if not runs_dir.exists():
        print(f"❌ Runs directory not found: {runs_dir}")
        return
    
    if args.watch:
        print(f"👀 Watching training progress (interval: {args.interval}s)")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                print(f"\n{'='*50}")
                print(f"⏰ {time.strftime('%Y-%m-%d %H:%M:%S')}")
                
                monitor_training_progress(runs_dir)
                check_model_availability(runs_dir)
                
                time.sleep(args.interval)
                
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped")
    else:
        monitor_training_progress(runs_dir)
        check_model_availability(runs_dir)


if __name__ == "__main__":
    main()
