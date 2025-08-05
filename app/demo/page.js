"use client";
import { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';
import Link from 'next/link'

// Class isimleri (data.yaml'dan)
const classNames = [
  "alpha-romeo",
  "audi",
  "bentley",
  "benz",
  "bmw",
  "cadillac",
  "dodge",
  "ferrari",
  "ford",
  "ford-mustang",
  "hyundai",
  "kia",
  "lamborghini",
  "lexus",
  "maserati",
  "porsche",
  "rolls-royce",
  "tesla",
  "toyota"
];

// Basit NMS fonksiyonu
function nms(boxes, scores, iouThreshold = 0.5) {
  const picked = [];
  let indexes = scores
    .map((score, idx) => [score, idx])
    .sort((a, b) => b[0] - a[0])
    .map(item => item[1]);
  while (indexes.length > 0) {
    const current = indexes.shift();
    picked.push(current);
    indexes = indexes.filter(idx => {
      const iou = computeIoU(boxes[current], boxes[idx]);
      return iou < iouThreshold;
    });
  }
  return picked;
}
function computeIoU(box1, box2) {
  const [x1, y1, w1, h1] = box1;
  const [x2, y2, w2, h2] = box2;
  const xi1 = Math.max(x1, x2);
  const yi1 = Math.max(y1, y2);
  const xi2 = Math.min(x1 + w1, x2 + w2);
  const yi2 = Math.min(y1 + h1, y2 + h2);
  const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
  const box1Area = w1 * h1;
  const box2Area = w2 * h2;
  const unionArea = box1Area + box2Area - interArea;
  return unionArea === 0 ? 0 : interArea / unionArea;
}

export default function PostureCam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const sessionRef = useRef(null);
  const inputNameRef = useRef(null);
  const [detections, setDetections] = useState([]);
  const [displayedDetections, setDisplayedDetections] = useState([]);
  const detectionHistoryRef = useRef([]); // Tespit geçmişi
  const stableDetectionsRef = useRef(new Map()); // Kararlı tespitler
  const [showDetections, setShowDetections] = useState(true); // Manuel kontrol - varsayılan açık
  const [fps, setFps] = useState(0); // FPS sayacı
  const [currentCamera, setCurrentCamera] = useState('user'); // Kamera yönü (user: ön, environment: arka)

  useEffect(() => {
    let animationId;
    let isMounted = true;

    async function loadModelAndStart() {
      if (!cameraOn) return;
      setError("");
      try {
        // WASM dosyalarının yolunu ayarla
        ort.env.wasm.wasmPaths = '/models/';
        // ONNX modelini yükle (onnxruntime-web) - optimize edilmiş modeli kullan
        const session = await ort.InferenceSession.create('/models/best_optimized.onnx');
        sessionRef.current = session;
        // Modelin input adını al
        inputNameRef.current = session.inputNames[0];
        setModelLoaded(true);

        // Kamera aç
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Kamera desteği bulunamadı.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: currentCamera,
            width: { ideal: 640 },
            height: { ideal: 640 }
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            runDetection();
          };
        }
      } catch (err) {
        setError('Kamera veya model yüklenemedi: ' + err.message);
      }
    }

    async function runDetection() {
      if (!sessionRef.current || !videoRef.current || !canvasRef.current) return;
      
      // FPS hesaplama için zaman tracking
      if (!runDetection.startTime) runDetection.startTime = performance.now();
      if (!runDetection.frameCount) runDetection.frameCount = 0;
      
      const currentTime = performance.now();
      runDetection.frameCount++;
      
      // Her saniye FPS güncelle
      const elapsed = currentTime - runDetection.startTime;
      if (elapsed >= 1000) {
        const fps = Math.round((runDetection.frameCount * 1000) / elapsed);
        setFps(fps);
        runDetection.frameCount = 0;
        runDetection.startTime = currentTime;
      }
      
      if (videoRef.current.readyState === 4) {
        // Canvas'ı temizle
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Her 5 frame'de bir AI tespiti yap (performans için)
        if (!runDetection.aiFrameCount) runDetection.aiFrameCount = 0;
        runDetection.aiFrameCount++;
        
        if (runDetection.aiFrameCount % 5 === 0) {
          try {
            // 1. Frame'i 640x640'a resize et
            const offscreen = document.createElement('canvas');
            offscreen.width = 640;
            offscreen.height = 640;
            const offCtx = offscreen.getContext('2d');
            offCtx.drawImage(videoRef.current, 0, 0, 640, 640);
            const resizedImageData = offCtx.getImageData(0, 0, 640, 640);

            // 2. RGB ve normalize (0-1 arası)
            const { data } = resizedImageData;
            const float32Data = new Float32Array(1 * 3 * 640 * 640);
            for (let i = 0; i < 640 * 640; i++) {
              float32Data[i] = data[i * 4] / 255; // R
              float32Data[i + 640 * 640] = data[i * 4 + 1] / 255; // G
              float32Data[i + 2 * 640 * 640] = data[i * 4 + 2] / 255; // B
            }

            // 3. Model inputu oluştur
            const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
            const feeds = { [inputNameRef.current]: inputTensor };

            // 4. Modeli çalıştır (async)
            sessionRef.current.run(feeds).then(results => {
              const output = results[Object.keys(results)[0]].data;
              
              // YOLOv8 çıktı formatını analiz et
              const outputLength = output.length;
              console.log('Model output total length:', outputLength);
              
              // YOLOv8 için beklenen format: [1, 84, 8400] = 705600 eleman
              // Bizim model için beklenen: [1, 24, 8400] = 201600 eleman (19 sınıf + 4 bbox + 1 obj)
              let numDetections, numClasses;
              
              if (outputLength === 705600) {
                // Standart YOLOv8 (80 sınıf)
                numDetections = 8400;
                numClasses = 80;
                console.log('Standart YOLOv8 formatı tespit edildi (80 sınıf)');
              } else if (outputLength === 201600) {
                // Bizim custom model (19 sınıf)
                numDetections = 8400;
                numClasses = 19;
                console.log('Custom car brand model formatı tespit edildi (19 sınıf)');
              } else {
                // Format otomatik tespit
                numDetections = 8400;
                numClasses = Math.floor(outputLength / 8400) - 5; // bbox(4) + objectness(1)
                console.log(`Otomatik format tespiti: ${numClasses} sınıf`);
              }

              // 5. Postprocess: YOLOv8 transpose format [batch, features, detections] → [batch, detections, features]
              const boxes = [];
              const scores = [];
              const classes = [];
              const detectedResults = [];
              
              let validDetections = 0;
              
              for (let i = 0; i < numDetections; i++) {
                // YOLOv8 transpose format: [x, y, w, h] ilk 4 feature
                const x = output[i];                    // i-th detection x
                const y = output[i + numDetections];    // i-th detection y  
                const w = output[i + numDetections * 2]; // i-th detection w
                const h = output[i + numDetections * 3]; // i-th detection h
                
                // Class confidences başlangıcı (4. indexten sonra)
                let maxConf = 0;
                let maxCls = 0;
                
                // 19 sınıf için confidence'ları kontrol et
                for (let c = 0; c < Math.min(numClasses, classNames.length); c++) {
                  const confIndex = i + numDetections * (4 + c);
                  const conf = output[confIndex];
                  if (conf > maxConf) {
                    maxConf = conf;
                    maxCls = c;
                  }
                }
                
                // Validasyon ve filtering
                if (
                  maxConf > 0.25 && // Daha düşük threshold
                  Number.isFinite(x) && Number.isFinite(y) &&
                  Number.isFinite(w) && Number.isFinite(h) &&
                  w > 20 && h > 20 && // Minimum boyut
                  w < 620 && h < 620 && // Maximum boyut
                  x > 0 && y > 0 && x < 640 && y < 640 && // Frame sınırları
                  maxCls >= 0 && maxCls < classNames.length &&
                  validDetections < 10 // Daha fazla tespit izni
                ) {
                  console.log(`Valid detection: ${classNames[maxCls]} conf:${maxConf.toFixed(3)} pos:(${x.toFixed(0)},${y.toFixed(0)}) size:${w.toFixed(0)}x${h.toFixed(0)}`);
                  
                  // Convert center format to corner format
                  boxes.push([x - w / 2, y - h / 2, w, h]);
                  scores.push(maxConf);
                  classes.push(maxCls);
                  validDetections++;
                }
              }
              
              console.log('Total detections found:', boxes.length, 'Scores:', scores.slice(0, 5));
              
              // NMS uygula (threshold 0.7)
              const picked = nms(boxes, scores, 0.7);
              
              // En fazla 3 tespit göster ve en yüksek confidence'lıları seç
              const limitedPicked = picked.slice(0, 3);
              
              // Seçilen tespitleri işle
              const finalDetections = [];
              for (const idx of limitedPicked) {
                const [x, y, w, h] = boxes[idx];
                const conf = scores[idx];
                const roundedCls = classes[idx];
                const classLabel = classNames[roundedCls];
                
                const ctx = canvasRef.current.getContext('2d');
                const scaleX = canvasRef.current.width / 640;
                const scaleY = canvasRef.current.height / 640;
                const left = x * scaleX;
                const top = y * scaleY;
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(left, top, w * scaleX, h * scaleY);
                
                // Sınıf adını da çiz
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.fillText(`${classLabel} ${(conf * 100).toFixed(1)}%`, left, top - 5);
                
                finalDetections.push({
                  classLabel,
                  confidence: conf
                });
              }
              
              // Temporal stability kontrolü - sadece kararlı tespitleri göster
              const currentTime = Date.now();
              detectionHistoryRef.current.push({ detections: finalDetections, timestamp: currentTime });
              
              // Son 2 saniyeyi koru
              detectionHistoryRef.current = detectionHistoryRef.current.filter(
                entry => currentTime - entry.timestamp < 2000
              );
              
              // Kararlı tespitleri filtrele (son 3 frame'de en az 1 kez görülenler)
              const stableDetected = [];
              for (const detection of finalDetections) {
                const recentCount = detectionHistoryRef.current
                  .slice(-3)
                  .filter(entry => 
                    entry.detections.some(d => d.classLabel === detection.classLabel)
                  ).length;
                
                if (recentCount >= 1) { // Daha esnek: 1 kez yeterli
                  stableDetected.push(detection);
                }
              }
              
              // Sadece değişiklik varsa state güncelle
              setDetections(prev => {
                const prevStr = JSON.stringify(prev);
                const currStr = JSON.stringify(stableDetected);
                return prevStr !== currStr ? stableDetected : prev;
              });
            }).catch(err => {
              console.error('AI detection error:', err);
            });
          } catch (err) {
            console.error('Processing error:', err);
          }
        }
      }
      
      animationId = requestAnimationFrame(runDetection);
    }

    if (cameraOn) {
      loadModelAndStart();
    }

    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      setModelLoaded(false);
    };
    // eslint-disable-next-line
  }, [cameraOn, currentCamera]); // currentCamera dependency eklendi

  // Keyboard kontrolü - REMOVED
  // useEffect(() => {
  //   const handleKeyPress = (event) => {
  //     if (event.key.toLowerCase() === 'd') {
  //       setShowDetections(prev => !prev);
  //       console.log('Detection display:', !showDetections ? 'ENABLED' : 'DISABLED');
  //     }
  //   };
  //   
  //   window.addEventListener('keydown', handleKeyPress);
  //   return () => window.removeEventListener('keydown', handleKeyPress);
  // }, [showDetections]);

  useEffect(() => {
    if (!cameraOn) return;
    const interval = setInterval(() => {
      setDisplayedDetections(
        detections
          .filter(det => det.confidence > 0.4)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3)
      );
    }, 500);
    return () => clearInterval(interval);
  }, [cameraOn, detections]);

  const handleOpenCamera = () => {
    setCameraOn(true);
    setError("");
  };

  const handleCloseCamera = () => {
    setCameraOn(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  const switchCamera = () => {
    const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
    setCurrentCamera(newCamera);
    if (cameraOn) {
      handleCloseCamera();
      setTimeout(() => {
        setCameraOn(true);
      }, 500);
    }
  };

  return (
    <div className="camera-container min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 text-white">
      {/* Ana Sayfaya Dön Butonu */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          href="/" 
          className="group flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg text-white rounded-lg font-semibold shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Ana Sayfaya Dön
        </Link>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg text-center">
        🚗 Araç Markası Tespit Sistemi (ONNX)
      </h1>
      <p className="text-lg text-gray-300 mb-6 text-center max-w-2xl">
        19 farklı araç markasını gerçek zamanlı olarak tespit eden AI modeli
      </p>
      
      {/* Features Section */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-4xl mx-4 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          <svg className="inline w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          Özellikler
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">Gerçek zamanlı kamera tespiti</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">YOLOv8 tabanlı AI modeli</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">Tarayıcıda çalışan ONNX modeli</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">FPS sayacı</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">Gizlilik korumalı (sadece tarayıcıda)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <span className="text-gray-200">Responsive tasarım</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-400">
          Yapay zeka destekli gerçek zamanlı araç markası tespiti
        </p>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {(!modelLoaded && cameraOn) && (
        <div className="text-blue-600 mb-2 animate-pulse text-center">
          <div className="text-lg font-semibold">⚡ Optimize edilmiş model yükleniyor...</div>
          <div className="text-sm text-gray-400 mt-1">Performans optimizasyonları uygulanıyor</div>
        </div>
      )}
      {cameraOn ? (
        <>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              width={640}
              height={640}
              className={`rounded shadow ${currentCamera === 'user' ? 'scale-x-[-1]' : ''}`}
              style={{ zIndex: 1 }}
            />
            {/* Canvas sadece video açıkken ve model yüklendiğinde gösterilir */}
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              className={`absolute left-0 top-0 rounded pointer-events-none ${currentCamera === 'user' ? 'scale-x-[-1]' : ''}`}
              style={{ zIndex: 2 }}
            />
            
            {/* FPS Sayacı */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-mono" style={{ zIndex: 3 }}>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">●</span>
                <span>FPS: {fps}</span>
              </div>
            </div>
          </div>
          {/* Tespit edilen kutuların class ve confidence değerlerini kameranın altına yazdır */}
          {displayedDetections.length > 0 && (
            <div className="mt-4 w-full flex flex-col items-center">
              {displayedDetections.map((det, i) => (
                <div key={i} className="detection-badge">
                  <span>{det.classLabel}</span>
                  <strong>%{Math.min(100, (det.confidence * 75)).toFixed(1)}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-4">
            <button
              onClick={switchCamera}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {currentCamera === 'user' ? 'Arka Kamera' : 'Ön Kamera'}
            </button>
            <button
              onClick={handleCloseCamera}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold shadow hover:bg-red-700 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Kamerayı Kapat
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={handleOpenCamera}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition"
          >
            Kamerayı Aç
          </button>
          <div className="text-gray-500 mt-8">Kamera kapalı.</div>
        </>
      )}
    </div>
  );
} 