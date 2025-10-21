#!/usr/bin/env python3
"""
Fix Paths and Start Services
Ensures all paths are correct and starts backend/frontend services.
"""

import os
import subprocess
import sys
from pathlib import Path


def fix_yaml_paths():
    """Fix YAML file paths to be relative to the correct directory."""
    yaml_file = Path("scripts/Car-Brand-Detection-3/data_merged.yaml")
    
    if not yaml_file.exists():
        print(f"❌ YAML file not found: {yaml_file}")
        return False
    
    # Read current content
    with open(yaml_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix paths to be relative to the YAML file location
    fixed_content = content.replace(
        "test: ../test/images",
        "test: test/images"
    ).replace(
        "train: ../train_merged/images", 
        "train: train_merged/images"
    ).replace(
        "val: ../valid/images",
        "val: valid/images"
    )
    
    # Write fixed content
    with open(yaml_file, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("✅ Fixed YAML paths")
    return True


def check_directories():
    """Check if all required directories exist."""
    base_dir = Path("scripts/Car-Brand-Detection-3")
    
    required_dirs = [
        "train_merged/images",
        "valid/images", 
        "test/images"
    ]
    
    for dir_path in required_dirs:
        full_path = base_dir / dir_path
        if not full_path.exists():
            print(f"❌ Missing directory: {full_path}")
            return False
        else:
            file_count = len(list(full_path.rglob("*")))
            print(f"✅ {dir_path}: {file_count} files")
    
    return True


def start_backend():
    """Start the Django backend."""
    print("\n🚀 Starting backend...")
    
    try:
        # Change to backend directory and start server
        cmd = "cd backend && python manage.py runserver 0.0.0.0:8000"
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"✅ Backend started with PID: {process.pid}")
        print("Backend URL: http://localhost:8000")
        return True
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False


def start_frontend():
    """Start the Next.js frontend."""
    print("\n🎨 Starting frontend...")
    
    try:
        # Start Next.js dev server
        cmd = "npm run dev"
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"✅ Frontend started with PID: {process.pid}")
        print("Frontend URL: http://localhost:3000")
        return True
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return False


def main():
    print("🔧 Fixing paths and starting services...")
    
    # Fix YAML paths
    if not fix_yaml_paths():
        return False
    
    # Check directories
    if not check_directories():
        return False
    
    # Start services
    backend_ok = start_backend()
    frontend_ok = start_frontend()
    
    if backend_ok and frontend_ok:
        print("\n🎉 Services started successfully!")
        print("\n📋 Access URLs:")
        print("  Frontend: http://localhost:3000")
        print("  Backend API: http://localhost:8000/api/predict")
        print("  Demo: http://localhost:3000/demo")
        
        print("\n🔍 Monitor training:")
        print("  python scripts/monitor_training.py --watch")
        
        print("\n🧪 Test API:")
        print("  python scripts/test_api.py --image test_image.jpg")
    else:
        print("\n❌ Some services failed to start")
        return False


if __name__ == "__main__":
    main()
