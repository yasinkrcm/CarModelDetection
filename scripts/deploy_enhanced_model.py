#!/usr/bin/env python3
"""
Enhanced Model Deployment Script
Complete pipeline: augmentation -> training -> optimization -> deployment

Usage:
    python scripts/deploy_enhanced_model.py --full-pipeline
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
import time


def run_command(cmd, description, check=True):
    """Run a command and handle errors."""
    print(f"\n🔄 {description}")
    print(f"Command: {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print("Output:", result.stdout)
        if result.stderr and result.returncode != 0:
            print("Error:", result.stderr)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        if e.stdout:
            print("Output:", e.stdout)
        if e.stderr:
            print("Error:", e.stderr)
        return False


def check_dependencies():
    """Check if all required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'ultralytics', 'torch', 'torchvision', 'opencv-python', 
        'Pillow', 'numpy', 'tqdm', 'PyYAML'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {missing}")
        print("Installing missing packages...")
        install_cmd = f"pip install {' '.join(missing)}"
        return run_command(install_cmd, "Installing dependencies")
    
    print("✅ All dependencies available")
    return True


def run_augmentation():
    """Run dataset augmentation."""
    print("\n📈 Running dataset augmentation...")
    
    # Check if augmented dataset already exists
    augmented_dir = Path("scripts/Car-Brand-Detection-3/train_augmented")
    if augmented_dir.exists() and len(list(augmented_dir.rglob("*.jpg"))) > 0:
        print("✅ Augmented dataset already exists, skipping...")
        return True
    
    cmd = "python scripts/augment_dataset.py --input scripts/Car-Brand-Detection-3/train --output scripts/Car-Brand-Detection-3/train_augmented --multiplier 2"
    return run_command(cmd, "Augmenting dataset")


def merge_datasets():
    """Merge original and augmented datasets."""
    print("\n🔗 Merging datasets...")
    
    # Check if merged dataset already exists
    merged_dir = Path("scripts/Car-Brand-Detection-3/train_merged")
    if merged_dir.exists() and len(list(merged_dir.rglob("*.jpg"))) > 0:
        print("✅ Merged dataset already exists, skipping...")
        return True
    
    cmd = "python scripts/merge_datasets.py --original scripts/Car-Brand-Detection-3/train --augmented scripts/Car-Brand-Detection-3/train_augmented --output scripts/Car-Brand-Detection-3/train_merged --update-yaml"
    return run_command(cmd, "Merging datasets")


def run_training():
    """Run enhanced training."""
    print("\n🧠 Starting enhanced training...")
    
    # Check if training is already complete
    best_model = Path("runs/detect/car_brand_detection_enhanced/weights/best.pt")
    if best_model.exists():
        print("✅ Training already completed, skipping...")
        return True
    
    cmd = "python scripts/train_enhanced_model.py --data scripts/Car-Brand-Detection-3/data_merged.yaml --epochs 100 --export --copy-public"
    print("⚠️ Training will take significant time. Starting in background...")
    
    # Start training in background
    try:
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"Training process started with PID: {process.pid}")
        print("Monitor progress with: python scripts/monitor_training.py --watch")
        return True
    except Exception as e:
        print(f"❌ Failed to start training: {e}")
        return False


def optimize_model():
    """Optimize the trained model."""
    print("\n⚡ Optimizing model...")
    
    best_model = Path("runs/detect/car_brand_detection_enhanced/weights/best.pt")
    if not best_model.exists():
        print("❌ Trained model not found. Please complete training first.")
        return False
    
    # Check if ONNX model already exists
    onnx_model = Path("public/models/best.onnx")
    if onnx_model.exists():
        print("✅ Optimized model already exists, skipping...")
        return True
    
    cmd = f"python scripts/optimize-model.py --model {best_model} --output public/models/best.onnx --quantize --test"
    return run_command(cmd, "Optimizing model")


def setup_backend():
    """Setup and configure backend."""
    print("\n🔧 Setting up backend...")
    
    # Install backend dependencies
    cmd = "cd backend && pip install -r requirements.txt"
    if not run_command(cmd, "Installing backend dependencies"):
        return False
    
    # Check if Django is properly configured
    cmd = "cd backend && python manage.py check"
    if not run_command(cmd, "Checking Django configuration"):
        return False
    
    print("✅ Backend setup complete")
    return True


def start_backend():
    """Start the Django backend server."""
    print("\n🚀 Starting backend server...")
    
    cmd = "cd backend && python manage.py runserver 0.0.0.0:8000"
    print("Starting Django server...")
    print("Backend will be available at: http://localhost:8000")
    print("API endpoint: http://localhost:8000/api/predict")
    
    # Start in background
    try:
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"Backend process started with PID: {process.pid}")
        return True
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False


def start_frontend():
    """Start the Next.js frontend."""
    print("\n🎨 Starting frontend...")
    
    # Install frontend dependencies
    cmd = "npm install"
    if not run_command(cmd, "Installing frontend dependencies"):
        return False
    
    # Start Next.js dev server
    cmd = "npm run dev"
    print("Starting Next.js development server...")
    print("Frontend will be available at: http://localhost:3000")
    
    # Start in background
    try:
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"Frontend process started with PID: {process.pid}")
        return True
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return False


def test_deployment():
    """Test the deployed system."""
    print("\n🧪 Testing deployment...")
    
    import requests
    import time
    
    # Wait for services to start
    print("Waiting for services to start...")
    time.sleep(10)
    
    # Test backend
    try:
        response = requests.get("http://localhost:8000/api/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is responding")
        else:
            print(f"⚠️ Backend responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
    
    # Test frontend
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is responding")
        else:
            print(f"⚠️ Frontend responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")


def main():
    parser = argparse.ArgumentParser(description="Enhanced Model Deployment Pipeline")
    parser.add_argument("--full-pipeline", action="store_true", help="Run complete pipeline")
    parser.add_argument("--augment-only", action="store_true", help="Run augmentation only")
    parser.add_argument("--train-only", action="store_true", help="Run training only")
    parser.add_argument("--deploy-only", action="store_true", help="Deploy only (skip training)")
    parser.add_argument("--test", action="store_true", help="Test deployment")
    
    args = parser.parse_args()
    
    print("🚗 Enhanced Car Brand Detection Deployment")
    print("=" * 50)
    
    success = True
    
    if args.full_pipeline or args.augment_only:
        success &= check_dependencies()
        success &= run_augmentation()
        success &= merge_datasets()
    
    if args.full_pipeline or args.train_only:
        success &= run_training()
    
    if args.full_pipeline or args.deploy_only:
        success &= optimize_model()
        success &= setup_backend()
        success &= start_backend()
        success &= start_frontend()
    
    if args.test:
        test_deployment()
    
    if success:
        print("\n🎉 Deployment completed successfully!")
        print("\n📋 Next steps:")
        print("1. Monitor training: python scripts/monitor_training.py --watch")
        print("2. Test API: curl -X POST http://localhost:8000/api/predict -F 'image=@test.jpg'")
        print("3. Open browser: http://localhost:3000/demo")
    else:
        print("\n❌ Deployment failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
