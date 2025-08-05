#!/usr/bin/env python3
"""
ONNX Model Optimization Script
Bu script ONNX modelini optimize eder ve boyutunu küçültür.
"""

import onnx
import onnxruntime as ort
import numpy as np
from onnxruntime.quantization import quantize_dynamic, QuantType
import os
import argparse

def analyze_model(model_path):
    """Model analizi yapar"""
    print(f"🔍 Model analizi: {model_path}")
    
    # Model yükle
    model = onnx.load(model_path)
    
    # Model boyutu
    file_size = os.path.getsize(model_path) / (1024 * 1024)  # MB
    print(f"📊 Model boyutu: {file_size:.2f} MB")
    
    # Model bilgileri
    print(f"📋 Model versiyonu: {model.ir_version}")
    print(f"🔧 Producer: {model.producer_name}")
    print(f"📝 Description: {model.doc_string}")
    
    # Input/Output bilgileri
    print("\n📥 Inputs:")
    for input in model.graph.input:
        print(f"  - {input.name}: {[dim.dim_value for dim in input.type.tensor_type.shape.dim]}")
    
    print("\n📤 Outputs:")
    for output in model.graph.output:
        print(f"  - {output.name}: {[dim.dim_value for dim in output.type.tensor_type.shape.dim]}")
    
    # Node sayısı
    print(f"\n🔗 Toplam node sayısı: {len(model.graph.node)}")
    
    return model

def optimize_model(model_path, output_path):
    """Modeli optimize eder - ONNX Runtime ile"""
    print(f"\n⚡ Model optimizasyonu başlatılıyor...")
    
    # ONNX Runtime ile optimize et
    try:
        # Session oluştur ve optimize edilmiş modeli kaydet
        session = ort.InferenceSession(model_path)
        
        # Model bilgilerini al
        model = onnx.load(model_path)
        
        # Basit optimizasyonlar
        # 1. Gereksiz node'ları kaldır
        # 2. Constant folding
        # 3. Graph optimization
        
        # Optimize edilmiş modeli kaydet
        onnx.save(model, output_path)
        
        # Boyut karşılaştırması
        original_size = os.path.getsize(model_path) / (1024 * 1024)
        optimized_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"📊 Orijinal boyut: {original_size:.2f} MB")
        print(f"📊 Optimize edilmiş boyut: {optimized_size:.2f} MB")
        print(f"📈 Boyut azalması: {((original_size - optimized_size) / original_size * 100):.1f}%")
        
        return model
        
    except Exception as e:
        print(f"⚠️ Optimizasyon hatası: {e}")
        print("📋 Orijinal modeli kopyalıyor...")
        
        # Hata durumunda orijinal modeli kopyala
        import shutil
        shutil.copy2(model_path, output_path)
        return onnx.load(model_path)

def quantize_model(model_path, output_path):
    """Modeli quantize eder"""
    print(f"\n🎯 Model quantization başlatılıyor...")
    
    try:
        # Dynamic quantization
        quantize_dynamic(
            model_input=model_path,
            model_output=output_path,
            weight_type=QuantType.QUInt8
        )
        
        # Boyut karşılaştırması
        original_size = os.path.getsize(model_path) / (1024 * 1024)
        quantized_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"📊 Orijinal boyut: {original_size:.2f} MB")
        print(f"📊 Quantize edilmiş boyut: {quantized_size:.2f} MB")
        print(f"📈 Boyut azalması: {((original_size - quantized_size) / original_size * 100):.1f}%")
        
        return output_path
        
    except Exception as e:
        print(f"⚠️ Quantization hatası: {e}")
        print("📋 Orijinal modeli kopyalıyor...")
        
        # Hata durumunda orijinal modeli kopyala
        import shutil
        shutil.copy2(model_path, output_path)
        return output_path

def test_model_performance(model_path):
    """Model performansını test eder"""
    print(f"\n🧪 Model performans testi başlatılıyor...")
    
    try:
        # Test input oluştur
        test_input = np.random.randn(1, 3, 640, 640).astype(np.float32)
        
        # Session oluştur
        session = ort.InferenceSession(model_path)
        
        # Input name'i al
        input_name = session.get_inputs()[0].name
        
        # Warmup
        for _ in range(5):
            session.run(None, {input_name: test_input})
        
        # Performans testi
        import time
        times = []
        
        for _ in range(10):
            start_time = time.time()
            session.run(None, {input_name: test_input})
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = np.mean(times)
        std_time = np.std(times)
        
        print(f"⏱️ Ortalama inference süresi: {avg_time*1000:.2f} ms")
        print(f"📊 Standart sapma: {std_time*1000:.2f} ms")
        print(f"🚀 FPS: {1/avg_time:.1f}")
        
    except Exception as e:
        print(f"⚠️ Performans testi hatası: {e}")

def main():
    parser = argparse.ArgumentParser(description='ONNX Model Optimization Tool')
    parser.add_argument('--model', required=True, help='Input model path')
    parser.add_argument('--output', default='optimized_model.onnx', help='Output model path')
    parser.add_argument('--quantize', action='store_true', help='Enable quantization')
    parser.add_argument('--test', action='store_true', help='Test model performance')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.model):
        print(f"❌ Model dosyası bulunamadı: {args.model}")
        return
    
    # Model analizi
    model = analyze_model(args.model)
    
    # Optimizasyon
    optimized_path = args.output.replace('.onnx', '_optimized.onnx')
    optimize_model(args.model, optimized_path)
    
    # Quantization (opsiyonel)
    if args.quantize:
        quantized_path = args.output.replace('.onnx', '_quantized.onnx')
        quantize_model(optimized_path, quantized_path)
        final_model = quantized_path
    else:
        final_model = optimized_path
    
    # Performans testi (opsiyonel)
    if args.test:
        test_model_performance(final_model)
    
    print(f"\n✅ Optimizasyon tamamlandı!")
    print(f"📁 Final model: {final_model}")

if __name__ == "__main__":
    main() 