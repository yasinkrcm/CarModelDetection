# 🚗 Araç Markası Tespit Sistemi

Gerçek zamanlı kamera ile araç markası tespiti yapan AI destekli web uygulaması.

## ✨ Özellikler

- **🎥 Gerçek Zamanlı Kamera Tespiti**: WebRTC ile kamera erişimi
- **🤖 AI Model**: YOLOv8 ile eğitilmiş %93.1 doğruluklu model
- **🌐 Tarayıcı Tabanlı**: Tüm işlemler tarayıcıda gerçekleşir
- **📱 Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **🔒 Gizlilik Korumalı**: Veriler sadece tarayıcıda işlenir
- **⚡ Yüksek Performans**: Optimize edilmiş gerçek zamanlı tespit
- **📷 Kamera Seçenekleri**: Ön/Arka kamera geçişi

## 🏗️ Teknoloji Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **AI Model**: YOLOv8 (PyTorch)
- **Model Format**: ONNX (tarayıcı uyumlu)
- **Kamera API**: WebRTC getUserMedia
- **Deployment**: Vercel (serverless)

## 📊 Model Performansı

- **mAP50**: 93.1% (çok yüksek doğruluk!)
- **mAP50-95**: 91.8%
- **Precision**: 93.8%
- **Recall**: 84.9%
- **Eğitim Süresi**: 37 dakika (GPU ile)
- **Model Boyutu**: 11.6 MB (ONNX)

## 🚗 Desteklenen Araç Markaları

Alpha Romeo, Audi, Bentley, Mercedes, BMW, Cadillac, Dodge, Ferrari, Ford, Ford Mustang, Hyundai, Kia, Lamborghini, Lexus, Maserati, Porsche, Rolls Royce, Tesla, Toyota

## 🚀 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yasinkrcm/CarModelDetection
cd CarModelDetection
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
CarModelDetection/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global stiller
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Ana sayfa
│   └── demo/              # Demo sayfası
│       └── page.tsx       # Kamera tespit sayfası
├── components/            # React bileşenleri
│   └── CameraDetection.tsx # Ana kamera tespit bileşeni
├── public/               # Statik dosyalar
│   └── models/           # AI modelleri
│       └── best.onnx     # Eğitilmiş ONNX modeli
├── scripts/              # Python scriptleri
│   ├── train_model.py    # Model eğitim scripti
│   └── runs/             # Eğitim logları
└── README.md             # Proje dokümantasyonu
```

## 🎯 Kullanım

### Ana Sayfa (`/`)
- Proje açıklaması
- Özellikler listesi
- "Canlı Demo" butonu

### Demo Sayfası (`/demo`)
- Kamera erişimi
- Gerçek zamanlı araç tespiti
- FPS sayacı
- Tespit sonuçları
- **📷/📱 Kamera Geçişi**: Ön/Arka kamera arasında geçiş

## 🔧 Model Eğitimi

### Gereksinimler
- Python 3.8+
- CUDA destekli GPU (önerilen)
- PyTorch 2.5.1+cu121
- Roboflow API anahtarı

### Eğitim Adımları

1. **API Anahtarını Ayarlayın**:
```python
# scripts/train_model.py dosyasında
API_KEY = "your api key"  # Roboflow API anahtarınızı buraya yazın
```

2. **Bağımlılıkları Yükleyin**:
```bash
pip install roboflow ultralytics onnx
```

3. **Modeli Eğitin**:
```bash
cd scripts
python train_model.py
```

### Eğitim Parametreleri
- **Model**: YOLOv8n (nano)
- **Epochs**: 100
- **Batch Size**: 16
- **Image Size**: 640x640
- **Dataset**: Roboflow Car Brand Detection

### Roboflow Konfigürasyonu
- **Workspace**: datasets-hpoew
- **Project**: car-brand-detection-n6zpw
- **Version**: 3
- **API Key**: Kendi API anahtarınızı kullanın

## 🔒 Gizlilik

- Tüm AI işlemleri tarayıcıda gerçekleşir
- Hiçbir veri sunucuya gönderilmez
- Kamera verileri sadece yerel olarak işlenir
- GDPR uyumlu

## 📈 Performans Optimizasyonları

- **Model Boyutu**: 11.6 MB (optimize edilmiş)
- **FPS**: 15-30 FPS (cihaza bağlı)
- **Çözünürlük**: 640x480 (optimize edilmiş)
- **Bellek Kullanımı**: Minimal

## 🐛 Sorun Giderme

### Kamera Erişimi
- HTTPS gereklidir (production)
- Tarayıcı izinlerini kontrol edin
- Kamera başka uygulama tarafından kullanılıyor olabilir

### Model Yükleme
- ONNX dosyası `public/models/` klasöründe olmalı
- Dosya boyutu: ~11.6 MB
- Tarayıcı cache'ini temizleyin

### Performans Sorunları
- Düşük FPS: Çözünürlüğü düşürün
- Yüksek CPU: GPU kullanımını kontrol edin
- Bellek: Tarayıcıyı yeniden başlatın

### API Anahtarı Sorunları
- Roboflow hesabınızda API anahtarı oluşturun
- `scripts/train_model.py` dosyasında API anahtarını güncelleyin
- API anahtarının doğru olduğundan emin olun

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın


## 📞 İletişim

- **Proje Linki**: [GitHub Repository](https://github.com/yasinkrcm/CarModelDetection)
- **Sorunlar**: [GitHub Issues](https://github.com/yasinkrcm/CarModelDetection/issues)

## 🙏 Teşekkürler

- [Ultralytics](https://github.com/ultralytics/ultralytics) - YOLOv8
- [Roboflow](https://roboflow.com) - Dataset
- [Next.js](https://nextjs.org) - React Framework
- [TailwindCSS](https://tailwindcss.com) - CSS Framework

---

**Not**: Bu proje demo amaçlıdır. Production kullanımı için ek güvenlik ve performans optimizasyonları gerekebilir. 
