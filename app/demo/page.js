"use client";
import { useEffect, useRef, useState } from 'react';
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
      if (!videoRef.current || !canvasRef.current) return;
      
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
        
        if (runDetection.aiFrameCount % 3 === 0) {
          try {
            // 1. Frame'i yakala ve PNG'ye çevir
            const offscreen = document.createElement('canvas');
            // Smaller size for faster processing
            offscreen.width = 512;
            offscreen.height = 512;
            const offCtx = offscreen.getContext('2d');
            offCtx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
            // Lower quality for smaller size and faster upload
            const blob = await new Promise(resolve => offscreen.toBlob(resolve, 'image/jpeg', 0.2));

            // 2. Backend'e gönder
            // Prevent overlapping requests
            if (!runDetection.inFlight) {
              runDetection.inFlight = true;
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              try {
                const form = new FormData();
                form.append('image', blob, 'frame.jpg');
                const response = await fetch('/api/predict', {
                  method: 'POST',
                  body: form,
                  signal: controller.signal,
                });
                clearTimeout(timeout);
                if (!response.ok) throw new Error('Backend error');
                const json = await response.json();
                const backendDetections = Array.isArray(json.detections) ? json.detections : [];

                // 3. Çizim ve state güncelle
                const ctx = canvasRef.current.getContext('2d');
                const scaleX = canvasRef.current.width / offscreen.width;
                const scaleY = canvasRef.current.height / offscreen.height;

                const colors = [
                  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
                  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
                ];

                const finalDetections = backendDetections.slice(0, 10).map((d, i) => {
                  const color = colors[i % colors.length];
                  const left = d.box?.x1 * scaleX;
                  const top = d.box?.y1 * scaleY;
                  const width = (d.box?.x2 - d.box?.x1) * scaleX;
                  const height = (d.box?.y2 - d.box?.y1) * scaleY;

                  ctx.strokeStyle = color;
                  ctx.lineWidth = 4;
                  ctx.shadowColor = color;
                  ctx.shadowBlur = 8;
                  ctx.strokeRect(left, top, width, height);
                  ctx.shadowBlur = 0;

                  const text = `${d.className || d.classId || 'cls'} ${(d.confidence * 100).toFixed(1)}%`;
                  ctx.font = 'bold 16px Arial';
                  const textWidth = ctx.measureText(text).width;
                  const textHeight = 20;
                  ctx.fillStyle = color;
                  ctx.fillRect(left, top - textHeight - 4, textWidth + 8, textHeight + 4);
                  ctx.fillStyle = 'white';
                  ctx.fillText(text, left + 4, top - 8);

                  return {
                    classLabel: d.className || `cls-${d.classId}`,
                    confidence: d.confidence,
                    bbox: { x: left, y: top, w: width, h: height },
                    color
                  };
                });

                const currentTime2 = Date.now();
                detectionHistoryRef.current.push({ detections: finalDetections, timestamp: currentTime2 });
                detectionHistoryRef.current = detectionHistoryRef.current.filter(
                  entry => currentTime2 - entry.timestamp < 2000
                );

                const stableDetected = [];
                for (const detection of finalDetections) {
                  const recentCount = detectionHistoryRef.current
                    .slice(-3)
                    .filter(entry => 
                      entry.detections.some(d => d.classLabel === detection.classLabel)
                    ).length;
                  if (recentCount >= 1) {
                    stableDetected.push(detection);
                  }
                }

                setDetections(prev => {
                  const prevStr = JSON.stringify(prev);
                  const currStr = JSON.stringify(stableDetected);
                  return prevStr !== currStr ? stableDetected : prev;
                });
              } catch (e) {
                // swallow network/timeout errors per frame
              } finally {
                runDetection.inFlight = false;
              }
            }
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
        🚗 Araç Markası Tespit Sistemi (PyTorch)
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
              <span className="text-gray-200">Django backend ile PyTorch modeli</span>
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
              <span className="text-gray-200">GPU/CPU otomatik seçimi</span>
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
          <div className="text-lg font-semibold">⚡ PyTorch model yükleniyor...</div>
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
              className={`absolute left-0 top-0 rounded pointer-events-none detection-canvas ${currentCamera === 'user' ? 'scale-x-[-1]' : ''}`}
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
            <div className="mt-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-center mb-4 text-white">
                🎯 Tespit Edilen Araç Markaları
              </h3>
              <div className="grid gap-3">
                {displayedDetections.map((det, i) => (
                  <div 
                    key={i} 
                    className="detection-card bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
                    style={{
                      borderLeft: `4px solid ${det.color || '#FF6B6B'}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: det.color || '#FF6B6B' }}
                        ></div>
                        <span className="text-lg font-semibold text-white capitalize">
                          {det.classLabel.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {(det.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-300">güven oranı</div>
                      </div>
                    </div>
                    
                    {/* Confidence bar */}
                    <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="confidence-bar h-2 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: det.color || '#FF6B6B',
                          width: `${Math.min(100, det.confidence * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* İstatistikler */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-lg font-bold text-white">{displayedDetections.length}</div>
                  <div className="text-xs text-gray-300">Tespit Sayısı</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-lg font-bold text-white">
                    {displayedDetections.length > 0 ? 
                      (displayedDetections.reduce((sum, det) => sum + det.confidence, 0) / displayedDetections.length * 100).toFixed(1) + '%' 
                      : '0%'
                    }
                  </div>
                  <div className="text-xs text-gray-300">Ortalama Güven</div>
                </div>
              </div>
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