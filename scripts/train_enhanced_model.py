#!/usr/bin/env python3
"""
Enhanced Car Brand Detection Training Script
Trains YOLOv8 with expanded dataset (original + augmented) to reduce false positives.
Includes advanced training configurations and validation metrics.

Usage:
    python scripts/train_enhanced_model.py --data scripts/Car-Brand-Detection-3/data_merged.yaml
"""

import argparse
import os
import shutil
from pathlib import Path
import torch
from ultralytics import YOLO


def setup_training_environment():
    """Setup training environment and check dependencies."""
    print("🔧 Setting up training environment...")
    
    # Check CUDA availability
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Device: {device}")
    
    if device == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"CUDA Version: {torch.version.cuda}")
        print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    
    return device


def train_model(data_yaml: str, device: str, epochs: int = 150, imgsz: int = 640):
    """Train YOLOv8 model with enhanced configuration."""
    print(f"🧠 Starting enhanced training...")
    print(f"Data: {data_yaml}")
    print(f"Epochs: {epochs}")
    print(f"Image size: {imgsz}")
    
    # Load YOLOv8 model (using nano for faster training, can switch to s/m/l)
    model = YOLO('yolov8n.pt')
    
    # Enhanced training parameters to reduce false positives
    training_params = {
        'data': data_yaml,
        'epochs': epochs,
        'imgsz': imgsz,
        'batch': 16 if device == 'cuda' else 8,  # Adjust based on GPU memory
        'name': 'car_brand_detection_enhanced',
        'patience': 30,  # Early stopping patience
        'save': True,
        'save_period': 10,  # Save checkpoint every 10 epochs
        'device': device,
        'workers': 4,
        'cache': True,  # Cache images for faster training
        'amp': True,  # Automatic Mixed Precision for faster training
        
        # Advanced parameters to reduce false positives
        'lr0': 0.01,  # Initial learning rate
        'lrf': 0.01,  # Final learning rate
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3,
        'warmup_momentum': 0.8,
        'warmup_bias_lr': 0.1,
        
        # Data augmentation (already done in preprocessing, but keep some for robustness)
        'hsv_h': 0.015,  # HSV-Hue augmentation
        'hsv_s': 0.7,    # HSV-Saturation augmentation
        'hsv_v': 0.4,    # HSV-Value augmentation
        'degrees': 0.0,  # Rotation degrees (keep minimal since we have angle diversity)
        'translate': 0.1,  # Translation
        'scale': 0.5,   # Scaling
        'shear': 0.0,   # Shear (keep minimal)
        'perspective': 0.0,  # Perspective (keep minimal)
        'flipud': 0.0,  # Vertical flip
        'fliplr': 0.5,  # Horizontal flip
        'mosaic': 1.0,  # Mosaic augmentation
        'mixup': 0.0,  # Mixup augmentation
        'copy_paste': 0.0,  # Copy-paste augmentation
        
        # Validation parameters
        'val': True,
        'plots': True,  # Generate training plots
        'save_json': True,  # Save validation results as JSON
    }
    
    print("Training parameters:")
    for key, value in training_params.items():
        print(f"  {key}: {value}")
    
    # Start training
    results = model.train(**training_params)
    
    print("✅ Training completed!")
    return results


def evaluate_model(model_path: str, data_yaml: str, device: str):
    """Evaluate the trained model."""
    print(f"📊 Evaluating model: {model_path}")
    
    try:
        model = YOLO(model_path)
        
        # Run validation
        metrics = model.val(
            data=data_yaml,
            device=device,
            plots=True,
            save_json=True,
            conf=0.35,  # Use same confidence as inference
            iou=0.45,   # Use same IoU as inference
        )
        
        print("📈 Model Performance Metrics:")
        print(f"  mAP50: {metrics.box.map50:.3f}")
        print(f"  mAP50-95: {metrics.box.map:.3f}")
        print(f"  Precision: {metrics.box.p:.3f}")
        print(f"  Recall: {metrics.box.r:.3f}")
        print(f"  F1: {metrics.box.f1:.3f}")
        
        return metrics
        
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
        return None


def export_optimized_model(model_path: str, output_dir: Path):
    """Export model to ONNX and other optimized formats."""
    print(f"🔄 Exporting optimized models...")
    
    try:
        model = YOLO(model_path)
        
        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Export to ONNX
        onnx_path = model.export(
            format="onnx",
            dynamic=True,
            simplify=True,
            opset=11,
        )
        
        # Copy to output directory
        onnx_output = output_dir / "best.onnx"
        shutil.copy2(onnx_path, onnx_output)
        print(f"✅ ONNX model saved: {onnx_output}")
        
        # Export to TensorRT (if available)
        try:
            trt_path = model.export(
                format="engine",
                device=0,  # GPU 0
            )
            trt_output = output_dir / "best.engine"
            shutil.copy2(trt_path, trt_output)
            print(f"✅ TensorRT model saved: {trt_output}")
        except Exception as e:
            print(f"⚠️ TensorRT export failed (optional): {e}")
        
        # Copy PyTorch model
        pt_output = output_dir / "best.pt"
        shutil.copy2(model_path, pt_output)
        print(f"✅ PyTorch model saved: {pt_output}")
        
        return onnx_output
        
    except Exception as e:
        print(f"❌ Export error: {e}")
        return None


def copy_to_public(onnx_path: Path):
    """Copy optimized model to public directory for deployment."""
    print("📁 Copying model to public directory...")
    
    try:
        public_models_dir = Path("public/models")
        public_models_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy ONNX model
        public_onnx = public_models_dir / "best.onnx"
        shutil.copy2(onnx_path, public_onnx)
        print(f"✅ Model copied to: {public_onnx}")
        
        return True
        
    except Exception as e:
        print(f"❌ Copy error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Enhanced Car Brand Detection Training")
    parser.add_argument("--data", required=True, help="Path to data.yaml file")
    parser.add_argument("--epochs", type=int, default=150, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size for training")
    parser.add_argument("--model-size", choices=['n', 's', 'm', 'l', 'x'], default='n', 
                       help="YOLOv8 model size (n=nano, s=small, m=medium, l=large, x=xlarge)")
    parser.add_argument("--export", action="store_true", help="Export optimized models")
    parser.add_argument("--copy-public", action="store_true", help="Copy model to public directory")
    
    args = parser.parse_args()
    
    if not Path(args.data).exists():
        print(f"❌ Data file not found: {args.data}")
        return
    
    print("🚗 Enhanced Car Brand Detection Training")
    print("=" * 50)
    
    # Setup environment
    device = setup_training_environment()
    
    # Train model
    results = train_model(args.data, device, args.epochs, args.imgsz)
    
    if not results:
        print("❌ Training failed")
        return
    
    # Find the best model
    runs_dir = Path("runs/detect/car_brand_detection_enhanced")
    best_model = runs_dir / "weights" / "best.pt"
    
    if not best_model.exists():
        print(f"❌ Best model not found: {best_model}")
        return
    
    # Evaluate model
    evaluate_model(str(best_model), args.data, device)
    
    # Export optimized models
    if args.export:
        onnx_path = export_optimized_model(str(best_model), runs_dir / "exported")
        
        if onnx_path and args.copy_public:
            copy_to_public(onnx_path)
    
    print("\n" + "=" * 50)
    print("🎉 Enhanced training completed!")
    print(f"📁 Best model: {best_model}")
    print(f"📊 Training logs: {runs_dir}")
    
    if args.export:
        print(f"📦 Exported models: {runs_dir / 'exported'}")


if __name__ == "__main__":
    main()
