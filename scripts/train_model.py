#!/usr/bin/env python3
"""
Araç Markası Tespit Modeli Eğitimi
Bu script Roboflow'dan veri setini indirir, YOLOv8 modelini eğitir ve ONNX formatına dönüştürür.
"""

import os
import shutil
from pathlib import Path

def install_dependencies():
    """Gerekli kütüphaneleri yükler"""
    print("📦 Gerekli kütüphaneler yükleniyor...")
    os.system("pip install roboflow ultralytics onnx")

def download_dataset():
    """Roboflow'dan veri setini indirir"""
    print("📥 Roboflow'dan veri seti indiriliyor...")
    
    from roboflow import Roboflow
    
    # Roboflow konfigürasyonu
    API_KEY = "your api key"
    WORKSPACE = "datasets-hpoew"
    PROJECT = "car-brand-detection-n6zpw"
    VERSION = 3
    
    try:
        # Roboflow'a bağlan
        rf = Roboflow(api_key=API_KEY)
        
        # Projeyi ve versiyonu belirt
        project = rf.workspace(WORKSPACE).project(PROJECT)
        version = project.version(VERSION)
        
        # Veri setini YOLOv8 formatında indir
        dataset = version.download("yolov8")
        
        print(f"✅ Veri seti başarıyla indirildi: {dataset.location}")
        return dataset.location
        
    except Exception as e:
        print(f"❌ Veri seti indirme hatası: {e}")
        return None

def train_model(dataset_path):
    """YOLOv8 modelini eğitir"""
    print("🧠 Model eğitimi başlıyor...")
    
    from ultralytics import YOLO
    import torch
    
    try:
        # CUDA kontrolü
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Eğitim cihazı: {device}")
        if device == 'cuda':
            print(f"🎮 GPU: {torch.cuda.get_device_name(0)}")
        
        
        model = YOLO('yolov8n.pt')  
        
        training_params = {
            'data': os.path.join(dataset_path, 'data.yaml'),
            'epochs': 100, 
            'imgsz': 640,
            'batch': 16, 
            'name': 'car_brand_detection',
            'patience': 20,
            'save': True,
            'device': device,
            'workers': 4,  
            'cache': True, 
            'amp': True,  
        }
        
        
        results = model.train(**training_params)
        
        print("✅ Model eğitimi tamamlandı!")
        return True
        
    except Exception as e:
        print(f"❌ Model eğitimi hatası: {e}")
        return False

def evaluate_model():
    """Eğitilen modeli değerlendirir"""
    print("📊 Model performansı değerlendiriliyor...")
    
    from ultralytics import YOLO
    
    try:
        # En iyi modeli yükle
        best_model = YOLO('runs/detect/car_brand_detection/weights/best.pt')
        
        # Test veri seti üzerinde değerlendir
        metrics = best_model.val()
        
        print("📈 Model Performans Metrikleri:")
        print(f"   mAP50: {metrics.box.map50:.3f}")
        print(f"   mAP50-95: {metrics.box.map:.3f}")
        print(f"   Precision: {metrics.box.p:.3f}")
        print(f"   Recall: {metrics.box.r:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Model değerlendirme hatası: {e}")
        return False

def export_to_onnx():
    """Modeli ONNX formatına dönüştürür"""
    print("🔄 Model ONNX formatına dönüştürülüyor...")
    
    from ultralytics import YOLO
    
    try:
        # En iyi modeli yükle
        best_model = YOLO('runs/detect/car_brand_detection/weights/best.pt')
        
        # ONNX formatına dönüştür
        onnx_path = best_model.export(format="onnx", dynamic=True)
        
        print(f"✅ Model ONNX formatına dönüştürüldü: {onnx_path}")
        return onnx_path
        
    except Exception as e:
        print(f"❌ ONNX dönüştürme hatası: {e}")
        return None

def test_onnx_model(onnx_path):
    """ONNX modelini test eder"""
    print("🧪 ONNX modeli test ediliyor...")
    
    try:
        import onnxruntime as ort
        import numpy as np
        
        # ONNX modelini yükle
        session = ort.InferenceSession(onnx_path)
        
        # Test görüntüsü oluştur (640x640, RGB)
        test_image = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        test_image = test_image.astype(np.float32) / 255.0
        test_image = np.transpose(test_image, (2, 0, 1))  # HWC to CHW
        test_image = np.expand_dims(test_image, axis=0)  # Add batch dimension
        
        # Inference yap
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        
        result = session.run([output_name], {input_name: test_image})
        
        print(f"✅ ONNX model test başarılı! Çıktı şekli: {result[0].shape}")
        return True
        
    except Exception as e:
        print(f"❌ ONNX model test hatası: {e}")
        return False

def copy_model_to_public(onnx_path):
    """ONNX modelini public klasörüne kopyalar"""
    print("📁 Model dosyası kopyalanıyor...")
    
    try:
        # public/models klasörünü oluştur
        public_models_dir = Path("public/models")
        public_models_dir.mkdir(parents=True, exist_ok=True)
        
        # ONNX modelini kopyala
        destination = public_models_dir / "best.onnx"
        shutil.copy(onnx_path, destination)
        
        print(f"✅ Model dosyası {destination} konumuna kopyalandı!")
        return True
        
    except Exception as e:
        print(f"❌ Model kopyalama hatası: {e}")
        return False

def main():
    """Ana fonksiyon"""
    print("🚗 Araç Markası Tespit Modeli Eğitimi Başlıyor...")
    print("=" * 50)
    
    # 1. Bağımlılıkları yükle
    install_dependencies()
    
    # 2. Veri setini indir
    dataset_path = download_dataset()
    if not dataset_path:
        print("❌ Veri seti indirilemedi. İşlem durduruluyor.")
        return
    
    # 3. Modeli eğit
    if not train_model(dataset_path):
        print("❌ Model eğitimi başarısız. İşlem durduruluyor.")
        return
    
    # 4. Modeli değerlendir
    evaluate_model()
    
    # 5. ONNX formatına dönüştür
    onnx_path = export_to_onnx()
    if not onnx_path:
        print("❌ ONNX dönüştürme başarısız. İşlem durduruluyor.")
        return
    
    # 6. ONNX modelini test et
    test_onnx_model(onnx_path)
    
    # 7. Modeli public klasörüne kopyala
    copy_model_to_public(onnx_path)
    
    print("\n" + "=" * 50)
    print("🎉 Model eğitimi ve dönüştürme işlemi tamamlandı!")
    print("\n📁 Oluşturulan dosyalar:")
    print(f"   - ONNX Model: public/models/best.onnx")
    print(f"   - Eğitim Logları: runs/detect/car_brand_detection/")
    print(f"   - En İyi Model: runs/detect/car_brand_detection/weights/best.pt")
    
    print("\n🚀 Web uygulamasını başlatmak için:")
    print("   npm run dev")

if __name__ == "__main__":
    main() 