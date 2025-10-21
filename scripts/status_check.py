#!/usr/bin/env python3
"""
Status Check Script
Check the current status of all services and processes.
"""

import subprocess
import requests
import time
from pathlib import Path


def check_processes():
    """Check running processes."""
    print("🔍 Checking processes...")
    
    try:
        # Check Python processes
        result = subprocess.run("tasklist | findstr python", shell=True, capture_output=True, text=True)
        python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower()]
        
        if python_processes:
            print(f"✅ Found {len(python_processes)} Python processes:")
            for proc in python_processes[:3]:  # Show first 3
                print(f"  {proc}")
        else:
            print("❌ No Python processes found")
        
        # Check Node processes
        result = subprocess.run("tasklist | findstr node", shell=True, capture_output=True, text=True)
        node_processes = [line for line in result.stdout.split('\n') if 'node' in line.lower()]
        
        if node_processes:
            print(f"✅ Found {len(node_processes)} Node processes:")
            for proc in node_processes[:3]:  # Show first 3
                print(f"  {proc}")
        else:
            print("❌ No Node processes found")
            
    except Exception as e:
        print(f"❌ Error checking processes: {e}")


def check_ports():
    """Check if ports are in use."""
    print("\n🔍 Checking ports...")
    
    ports_to_check = [3000, 8000]
    
    for port in ports_to_check:
        try:
            result = subprocess.run(f"netstat -an | findstr :{port}", shell=True, capture_output=True, text=True)
            if result.stdout.strip():
                print(f"✅ Port {port} is in use")
            else:
                print(f"❌ Port {port} is not in use")
        except Exception as e:
            print(f"⚠️ Could not check port {port}: {e}")


def check_training():
    """Check training status."""
    print("\n🔍 Checking training status...")
    
    training_dirs = [
        "runs/detect/car_brand_detection_enhanced",
        "runs/detect/car_brand_detection_enhanced3"
    ]
    
    for dir_path in training_dirs:
        if Path(dir_path).exists():
            print(f"✅ Training directory: {dir_path}")
            
            # Check for results
            results_file = Path(dir_path) / "results.csv"
            if results_file.exists():
                print(f"✅ Results file exists: {results_file}")
                # Show last few lines
                try:
                    with open(results_file, 'r') as f:
                        lines = f.readlines()
                        if lines:
                            print(f"  Last line: {lines[-1].strip()}")
                except:
                    pass
            else:
                print(f"⚠️ No results file yet")
            
            # Check for models
            weights_dir = Path(dir_path) / "weights"
            if weights_dir.exists():
                best_model = weights_dir / "best.pt"
                last_model = weights_dir / "last.pt"
                
                if best_model.exists():
                    size_mb = best_model.stat().st_size / (1024 * 1024)
                    print(f"✅ Best model: {best_model} ({size_mb:.1f} MB)")
                if last_model.exists():
                    size_mb = last_model.stat().st_size / (1024 * 1024)
                    print(f"✅ Last model: {last_model} ({size_mb:.1f} MB)")
            break
    else:
        print("❌ No training directories found")


def check_services():
    """Check service endpoints."""
    print("\n🔍 Checking service endpoints...")
    
    services = [
        ("Backend", "http://localhost:8000/api/"),
        ("Frontend", "http://localhost:3000"),
    ]
    
    for name, url in services:
        try:
            response = requests.get(url, timeout=3)
            print(f"✅ {name}: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"❌ {name}: Connection refused")
        except requests.exceptions.Timeout:
            print(f"⚠️ {name}: Timeout")
        except Exception as e:
            print(f"❌ {name}: {e}")


def main():
    print("📊 System Status Check")
    print("=" * 50)
    
    check_processes()
    check_ports()
    check_training()
    check_services()
    
    print("\n📋 Summary:")
    print("If services are not running, start them with:")
    print("  Backend: cd backend && python manage.py runserver")
    print("  Frontend: npm run dev")
    print("  Training: python scripts/train_enhanced_model.py --data scripts/Car-Brand-Detection-3/data_merged.yaml")


if __name__ == "__main__":
    main()
