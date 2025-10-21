#!/usr/bin/env python3
"""
API Test Script
Test the enhanced car brand detection API with various parameters.

Usage:
    python scripts/test_api.py --image test_image.jpg
"""

import argparse
import requests
import time
from pathlib import Path


def test_api(image_path: str, base_url: str = "http://localhost:8000", conf: float = 0.4, imgsz: int = 640):
    """Test the API with a given image."""
    print(f"🧪 Testing API with image: {image_path}")
    print(f"Confidence threshold: {conf}")
    print(f"Image size: {imgsz}")
    
    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        return False
    
    try:
        # Prepare request
        url = f"{base_url}/api/predict"
        params = {
            'conf': conf,
            'imgsz': imgsz
        }
        
        with open(image_path, 'rb') as f:
            files = {'image': f}
            
            print(f"📤 Sending request to: {url}")
            start_time = time.time()
            
            response = requests.post(url, files=files, params=params, timeout=30)
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            print(f"⏱️ Response time: {response_time:.2f} ms")
            print(f"📊 Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                detections = data.get('detections', [])
                
                print(f"✅ API test successful!")
                print(f"🔍 Found {len(detections)} detections:")
                
                for i, detection in enumerate(detections):
                    confidence = detection.get('confidence', 0)
                    class_name = detection.get('className', 'unknown')
                    box = detection.get('box', {})
                    
                    print(f"  {i+1}. {class_name} (confidence: {confidence:.3f})")
                    print(f"     Box: ({box.get('x1', 0):.1f}, {box.get('y1', 0):.1f}) to ({box.get('x2', 0):.1f}, {box.get('y2', 0):.1f})")
                
                return True
            else:
                print(f"❌ API test failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Is the backend running?")
        print("Start backend with: cd backend && python manage.py runserver")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timeout. Backend might be overloaded.")
        return False
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False


def test_with_different_params(image_path: str):
    """Test API with different parameter combinations."""
    print("\n🔬 Testing with different parameters...")
    
    test_cases = [
        {"conf": 0.2, "imgsz": 640, "description": "Low confidence, standard size"},
        {"conf": 0.5, "imgsz": 640, "description": "High confidence, standard size"},
        {"conf": 0.4, "imgsz": 512, "description": "Medium confidence, smaller size"},
        {"conf": 0.4, "imgsz": 800, "description": "Medium confidence, larger size"},
    ]
    
    results = []
    
    for i, params in enumerate(test_cases):
        print(f"\n📋 Test case {i+1}: {params['description']}")
        success = test_api(image_path, conf=params['conf'], imgsz=params['imgsz'])
        results.append(success)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📊 Test results: {sum(results)}/{len(results)} passed ({success_rate:.1f}%)")
    
    return success_rate > 50


def main():
    parser = argparse.ArgumentParser(description="Test Car Brand Detection API")
    parser.add_argument("--image", required=True, help="Path to test image")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend URL")
    parser.add_argument("--conf", type=float, default=0.4, help="Confidence threshold")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--multi-test", action="store_true", help="Test with multiple parameter combinations")
    
    args = parser.parse_args()
    
    print("🧪 Car Brand Detection API Test")
    print("=" * 40)
    
    if args.multi_test:
        success = test_with_different_params(args.image)
    else:
        success = test_api(args.image, args.url, args.conf, args.imgsz)
    
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        exit(1)


if __name__ == "__main__":
    main()
