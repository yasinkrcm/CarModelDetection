#!/usr/bin/env python3
"""
Quick System Test
Test the current system with existing model to verify everything is working.
"""

import requests
import time
import os
from pathlib import Path


def test_backend_connection():
    """Test if backend is responding."""
    print("🔍 Testing backend connection...")
    
    try:
        response = requests.get("http://localhost:8000/api/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is responding")
            return True
        else:
            print(f"⚠️ Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend not responding. Is it running?")
        print("Start with: cd backend && python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ Backend test error: {e}")
        return False


def test_frontend_connection():
    """Test if frontend is responding."""
    print("🔍 Testing frontend connection...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is responding")
            return True
        else:
            print(f"⚠️ Frontend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend not responding. Is it running?")
        print("Start with: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False


def test_api_with_sample():
    """Test API with a sample image."""
    print("🔍 Testing API with sample image...")
    
    # Look for any image in the dataset
    sample_dirs = [
        "scripts/Car-Brand-Detection-3/valid/images",
        "scripts/Car-Brand-Detection-3/train/images",
        "scripts/Car-Brand-Detection-3/test/images"
    ]
    
    sample_image = None
    for dir_path in sample_dirs:
        if Path(dir_path).exists():
            images = list(Path(dir_path).glob("*.jpg"))
            if images:
                sample_image = images[0]
                break
    
    if not sample_image:
        print("❌ No sample images found")
        return False
    
    print(f"📸 Using sample image: {sample_image}")
    
    try:
        with open(sample_image, 'rb') as f:
            files = {'image': f}
            params = {'conf': '0.4', 'imgsz': '640'}
            
            start_time = time.time()
            response = requests.post(
                "http://localhost:8000/api/predict", 
                files=files, 
                params=params, 
                timeout=30
            )
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            print(f"⏱️ Response time: {response_time:.2f} ms")
            
            if response.status_code == 200:
                data = response.json()
                detections = data.get('detections', [])
                
                print(f"✅ API test successful!")
                print(f"🔍 Found {len(detections)} detections:")
                
                for i, detection in enumerate(detections[:5]):  # Show first 5
                    confidence = detection.get('confidence', 0)
                    class_name = detection.get('className', 'unknown')
                    print(f"  {i+1}. {class_name} (confidence: {confidence:.3f})")
                
                return True
            else:
                print(f"❌ API test failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False


def check_training_status():
    """Check if training is running."""
    print("🔍 Checking training status...")
    
    # Check for training processes
    import subprocess
    try:
        result = subprocess.run("tasklist | findstr python", shell=True, capture_output=True, text=True)
        if "python" in result.stdout:
            print("✅ Python processes running (likely training)")
        else:
            print("⚠️ No Python processes found")
    except:
        print("⚠️ Could not check processes")
    
    # Check for training results
    training_dirs = [
        "runs/detect/car_brand_detection_enhanced",
        "runs/detect/car_brand_detection_enhanced3"
    ]
    
    for dir_path in training_dirs:
        if Path(dir_path).exists():
            print(f"✅ Training directory found: {dir_path}")
            
            # Check for results file
            results_file = Path(dir_path) / "results.csv"
            if results_file.exists():
                print(f"✅ Training results found: {results_file}")
            else:
                print(f"⚠️ No results file yet in {dir_path}")
            
            # Check for model files
            weights_dir = Path(dir_path) / "weights"
            if weights_dir.exists():
                best_model = weights_dir / "best.pt"
                last_model = weights_dir / "last.pt"
                
                if best_model.exists():
                    print(f"✅ Best model found: {best_model}")
                if last_model.exists():
                    print(f"✅ Last model found: {last_model}")
            break
    else:
        print("❌ No training directories found")


def main():
    print("🧪 Quick System Test")
    print("=" * 40)
    
    # Test connections
    backend_ok = test_backend_connection()
    frontend_ok = test_frontend_connection()
    
    # Test API if backend is working
    api_ok = False
    if backend_ok:
        api_ok = test_api_with_sample()
    
    # Check training
    check_training_status()
    
    # Summary
    print("\n📊 Test Results:")
    print(f"  Backend: {'✅' if backend_ok else '❌'}")
    print(f"  Frontend: {'✅' if frontend_ok else '❌'}")
    print(f"  API: {'✅' if api_ok else '❌'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 System is running!")
        print("📱 Access URLs:")
        print("  Frontend: http://localhost:3000")
        print("  Demo: http://localhost:3000/demo")
        print("  Backend API: http://localhost:8000/api/predict")
    else:
        print("\n❌ Some services are not running")
        print("\n🔧 To start services:")
        print("  Backend: cd backend && python manage.py runserver")
        print("  Frontend: npm run dev")


if __name__ == "__main__":
    main()
