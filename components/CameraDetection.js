'use client'

import { useEffect, useRef, useState } from 'react'
import * as ort from 'onnxruntime-web';

const CAR_BRANDS = [
  'alpha-romeo',
  'audi', 
  'bentley',
  'benz',
  'bmw',
  'cadillac',
  'dodge',
  'ferrari',
  'ford',
  'ford-mustang',
  'hyundai',
  'kia',
  'lamborghini',
  'lexus',
  'maserati',
  'porsche',
  'rolls-royce',
  'tesla'
]

// Görüntüleme için daha güzel isimler
const DISPLAY_NAMES = {
  'alpha-romeo': 'Alfa Romeo',
  'audi': 'Audi',
  'bentley': 'Bentley',
  'benz': 'Mercedes-Benz',
  'bmw': 'BMW',
  'cadillac': 'Cadillac',
  'dodge': 'Dodge',
  'ferrari': 'Ferrari',
  'ford': 'Ford',
  'ford-mustang': 'Ford Mustang',
  'hyundai': 'Hyundai',
  'kia': 'Kia',
  'lamborghini': 'Lamborghini',
  'lexus': 'Lexus',
  'maserati': 'Maserati',
  'porsche': 'Porsche',
  'rolls-royce': 'Rolls-Royce',
  'tesla': 'Tesla'
}

// Sigmoid fonksiyonu - raw logitleri 0-1 arasına normalize eder
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

// Alternatif normalizasyon - çok yüksek değerler için
function normalizeConfidence(x) {
  // Eğer değer çok yüksekse (>10), farklı bir yaklaşım kullan
  if (x > 10) {
    return Math.tanh(x / 10) // tanh kullanarak 0-1 arası normalize et
  }
  return sigmoid(x)
}

// Basit NMS fonksiyonu
function nms(boxes, scores, iouThreshold = 0.5) {
  const picked = []
  let indexes = scores
    .map((score, idx) => [score, idx])
    .sort((a, b) => b[0] - a[0])
    .map(item => item[1])
  
  while (indexes.length > 0) {
    const current = indexes.shift()
    picked.push(current)
    indexes = indexes.filter(idx => {
      const iou = computeIoU(boxes[current], boxes[idx])
      return iou < iouThreshold
    })
  }
  return picked
}

function computeIoU(box1, box2) {
  const [x1, y1, w1, h1] = box1
  const [x2, y2, w2, h2] = box2
  const xi1 = Math.max(x1, x2)
  const yi1 = Math.max(y1, y2)
  const xi2 = Math.min(x1 + w1, x2 + w2)
  const yi2 = Math.min(y1 + h1, y2 + h2)
  const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1)
  const box1Area = w1 * h1
  const box2Area = w2 * h2
  const unionArea = box1Area + box2Area - interArea
  return unionArea === 0 ? 0 : interArea / unionArea
}

// Global session cache to avoid reloading model
let globalSession = null
let globalInputName = null
let modelLoadPromise = null

// Optimized ONNX Runtime configuration
const initializeOnnxRuntime = async () => {
  try {
    // Use imported ort object
    // This path is configured in next.config.js to serve wasm files
    ort.env.wasm.wasmPaths = '/_next/static/wasm/';
    ort.env.wasm.numThreads = 1; // Keep single thread for faster startup
    ort.env.wasm.simd = true;
    ort.env.wasm.proxy = false;
    ort.env.logLevel = 'error';
    
    console.log('ONNX Runtime initialized with local WASM files (optimized)');
    return ort;
  } catch (error) {
    console.error('Error initializing ONNX Runtime:', error);
    throw error;
  }
};

export default function CameraDetection() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [error, setError] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [detections, setDetections] = useState([])
  const [displayedDetections, setDisplayedDetections] = useState([])
  const [fps, setFps] = useState(0)
  const [currentCamera, setCurrentCamera] = useState('user')
  const [deviceList, setDeviceList] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')

  // Canvas cache for better performance
  const canvasCache = useRef({
    offscreen: null,
    offCtx: null,
    offscreenCanvas: null, // OffscreenCanvas for better performance
    initialized: false
  })

  // Initialize canvas cache
  useEffect(() => {
    if (!canvasCache.current.initialized) {
      // Try OffscreenCanvas first (better performance)
      if ('OffscreenCanvas' in window) {
        canvasCache.current.offscreenCanvas = new OffscreenCanvas(640, 640)
        canvasCache.current.offCtx = canvasCache.current.offscreenCanvas.getContext('2d', {
          willReadFrequently: true,
          alpha: false,
          desynchronized: true
        })
        console.log('Using OffscreenCanvas for better performance')
      } else {
        // Fallback to regular canvas
        canvasCache.current.offscreen = document.createElement('canvas')
        canvasCache.current.offscreen.width = 640
        canvasCache.current.offscreen.height = 640
        canvasCache.current.offCtx = canvasCache.current.offscreen.getContext('2d', { 
          willReadFrequently: true,
          alpha: false,
          desynchronized: true
        })
        console.log('Using regular Canvas (OffscreenCanvas not supported)')
      }
      canvasCache.current.initialized = true
    }
  }, [])

  useEffect(() => {
    let animationId
    let isMounted = true

    async function loadModelAndStart() {
      if (!cameraOn) return
      setError("")
      
      try {
        // Initialize ONNX Runtime with optimized settings
        const ort = await initializeOnnxRuntime()
        
        // Use cached session if available
        if (globalSession && globalInputName) {
          setModelLoaded(true)
          console.log('Model zaten yüklü (cache\'den)')
        } else {
          // Load model only once and cache it
          if (!modelLoadPromise) {
            console.log('Model yükleniyor...')
            modelLoadPromise = loadModelWithOptimization(ort)
          }
          
          await modelLoadPromise
          setModelLoaded(true)
          console.log('Model başarıyla yüklendi!')
        }

        // Start camera
        await startCamera()
        
        if (isMounted) {
          runDetection()
        }
      } catch (err) {
        console.error('Model yükleme hatası:', err)
        setError('Model yüklenemedi: ' + err.message)
      }
    }

    async function loadModelWithOptimization(ort) {
      try {
        // Use optimized model
        const modelPath = '/models/best_optimized.onnx'
        
        // Create session with optimized providers
        const session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
          enableCpuMemArena: true,
          enableMemPattern: true,
          logSeverityLevel: 3, // Only errors
          extra: {
            session: {
              use_ort_model_bytes_directly: true,
              use_ort_model_bytes_for_initializers: true,
            }
          }
        })
        
        globalSession = session
        globalInputName = session.inputNames[0]
        
        console.log('Model metadata:', {
          inputNames: session.inputNames,
          outputNames: session.outputNames
        })
        
        // DEBUG: Model detaylarını logla
        console.log('=== MODEL LOADING DEBUG ===')
        console.log('Session created successfully')
        console.log('Input names:', session.inputNames)
        console.log('Output names:', session.outputNames)
        
        // Input metadata kontrolü
        try {
          const inputMetadata = session.inputNames.map(name => {
            // ONNX Runtime web'de metadata erişimi sınırlı olabilir
            return { name, available: true }
          })
          console.log('Input metadata:', inputMetadata)
        } catch (e) {
          console.log('Input metadata not available:', e.message)
        }
        console.log('============================')
        
        return session
      } catch (error) {
        console.error('Model yükleme detaylı hata:', error)
        throw error
      }
    }

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera desteği bulunamadı.")
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: currentCamera
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth
              canvasRef.current.height = videoRef.current.videoHeight
            }
            resolve()
          }
        })
      }
    }

    let lastTime = performance.now()
    let frameCount = 0
    
    async function runDetection() {
      if (!globalSession || !videoRef.current || !canvasRef.current) return
      
      // FPS throttling - daha hızlı tespit için azalttık
      if (!runDetection.lastInference) runDetection.lastInference = 0
      const now = performance.now()
      if (now - runDetection.lastInference < 100) { // 30 FPS'ten 10 FPS'e düşürdük (daha az CPU)
        animationId = requestAnimationFrame(() => runDetection())
        return
      }
      runDetection.lastInference = now

      if (videoRef.current.readyState === 4) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        try {
          // Ultra-optimized image processing with multiple fallbacks
          let imageData
          
          if ('createImageBitmap' in window) {
            // Method 1: ImageBitmap API - en hızlı
            const imageBitmap = await createImageBitmap(videoRef.current, {
              resizeWidth: 640,
              resizeHeight: 640,
              resizeQuality: 'low'
            })
            
            const { offCtx } = canvasCache.current
            offCtx.clearRect(0, 0, 640, 640)
            offCtx.drawImage(imageBitmap, 0, 0)
            imageData = offCtx.getImageData(0, 0, 640, 640)
            imageBitmap.close()
            
          } else if (canvasCache.current.offscreenCanvas) {
            // Method 2: OffscreenCanvas - iyi performans
            const { offCtx } = canvasCache.current
            offCtx.clearRect(0, 0, 640, 640)
            offCtx.drawImage(videoRef.current, 0, 0, 640, 640)
            imageData = offCtx.getImageData(0, 0, 640, 640)
            
          } else {
            // Method 3: Regular canvas - fallback
            const { offscreen, offCtx } = canvasCache.current
            offCtx.clearRect(0, 0, 640, 640)
            offCtx.drawImage(videoRef.current, 0, 0, 640, 640)
            imageData = offCtx.getImageData(0, 0, 640, 640)
          }

          // Ultra-optimized RGB normalization
          const { data } = imageData
          const float32Data = new Float32Array(1 * 3 * 640 * 640)
          const pixelCount = 640 * 640
          const normFactor = 1 / 255 // Pre-calculate division
          
          // Batch processing for better CPU cache usage
          const batchSize = 1024
          for (let batch = 0; batch < pixelCount; batch += batchSize) {
            const end = Math.min(batch + batchSize, pixelCount)
            for (let i = batch; i < end; i++) {
              const srcIdx = i * 4
              float32Data[i] = data[srcIdx] * normFactor
              float32Data[i + pixelCount] = data[srcIdx + 1] * normFactor
              float32Data[i + 2 * pixelCount] = data[srcIdx + 2] * normFactor
            }
          }

          // Create tensor and run inference
          const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640])
          
          // DEBUG: Input tensor doğrulaması (sadece ilk çalıştırmada)
          if (!runDetection.debugLogged) {
            console.log('=== INPUT TENSOR DEBUG (ONCE) ===')
            console.log('Tensor shape:', inputTensor.dims)
            console.log('Tensor type:', inputTensor.type)
            console.log('Data range check:', {
              min: Math.min(...float32Data.slice(0, 1000)),
              max: Math.max(...float32Data.slice(0, 1000)),
              hasNaN: float32Data.slice(0, 1000).some(x => isNaN(x)),
              hasInfinity: float32Data.slice(0, 1000).some(x => !isFinite(x))
            })
            console.log('Global session input name:', globalInputName)
            console.log('==========================')
            runDetection.debugLogged = true
          }
          
          const feeds = { [globalInputName]: inputTensor }

          const results = await globalSession.run(feeds)
          const output = results[Object.keys(results)[0]].data

          // DEBUG: Prediction çıktısını sadece ilk kez logla
          if (!runDetection.predictionLogged) {
            console.log('=== PREDICTION DEBUG (ONCE) ===')
            console.log('Results object:', results)
            console.log('Output keys:', Object.keys(results))
            console.log('Output shape info:', {
              totalLength: output.length,
              outputDim: output.length / 8400,
              sampleFirst10: Array.from(output.slice(0, 10)),
              sampleLast10: Array.from(output.slice(-10))
            })
            console.log('========================')
            runDetection.predictionLogged = true
          }

          // Process detections
          const processedDetections = processDetections(output)
          setDetections(processedDetections)
          
          // Draw detections on canvas
          drawDetections(ctx, processedDetections)

          // Clean up tensor to prevent memory leaks
          inputTensor.dispose?.()
          
          // Update FPS
          frameCount++
          if (now - lastTime >= 1000) {
            setFps(Math.round((frameCount * 1000) / (now - lastTime)))
            frameCount = 0
            lastTime = now
          }
          
        } catch (err) {
          console.error('Detection hatası:', err)
          setError('Detection hatası: ' + err.message)
        }
      }
      
      if (isMounted) {
        animationId = requestAnimationFrame(() => runDetection())
      }
    }

    function processDetections(output) {
      const boxes = []
      const scores = []
      const detected = []
      
      const numDetections = 8400
      const outputDim = output.length / numDetections
      
      // DEBUG: Processing bilgilerini sadece ilk kez logla
      if (!processDetections.debugLogged) {
        console.log('=== DETECTION PROCESSING DEBUG (ONCE) ===')
        console.log('Output length:', output.length)
        console.log('Num detections:', numDetections)
        console.log('Output dimension per detection:', outputDim)
        console.log('Expected format: 23 (4 bbox + 19 car classes)')
        processDetections.debugLogged = true
      }
      
      let totalValidDetections = 0
      let maxConfidenceFound = 0
      
      for (let i = 0; i < numDetections; i++) {
        let conf, cls
        
        // Handle custom car model output format (23 dimensions)
        if (outputDim === 23) {
          const baseIndex = i * 23
          const x = output[baseIndex]
          const y = output[baseIndex + 1]
          const w = output[baseIndex + 2]
          const h = output[baseIndex + 3]
          
          // Find max confidence among 19 car classes (indices 4-22)
          let maxConf = 0
          let maxCls = 0
          for (let j = 4; j < 23; j++) {
            if (output[baseIndex + j] > maxConf) {
              maxConf = output[baseIndex + j]
              maxCls = j - 4 // Convert to 0-18 range for CAR_BRANDS array
            }
          }
          
          // DEBUG: İlk birkaç detection için raw değerleri sadece ilk kez logla
          if (i < 3 && !processDetections.rawLogged) {
            console.log(`Detection ${i}:`, {
              rawMaxConf: maxConf,
              afterNormalization: normalizeConfidence(maxConf),
              class: maxCls,
              bbox: [x, y, w, h]
            })
            if (i === 2) processDetections.rawLogged = true
          }
          
          conf = normalizeConfidence(maxConf) // Apply sigmoid
          cls = maxCls
          
          // Track max confidence found
          if (conf > maxConfidenceFound) {
            maxConfidenceFound = conf
          }
          
          // Much higher threshold - sigmoid sonrası hala çok yüksek değerler geliyor
          if (conf > 0.95) { // 0.5'ten 0.95'e çıkarttık
            totalValidDetections++
            boxes.push([x - w/2, y - h/2, w, h])
            scores.push(conf)
            detected.push({ 
              class: cls, 
              brand: DISPLAY_NAMES[CAR_BRANDS[cls]] || CAR_BRANDS[cls] || `Class ${cls}`,
              confidence: conf,
              box: [x - w/2, y - h/2, w, h]
            })
          }
        } else if (outputDim === 84) {
          // Original YOLOv8 format handling (kept for compatibility)
          const baseIndex = i * 84
          const x = output[baseIndex]
          const y = output[baseIndex + 1]
          const w = output[baseIndex + 2]
          const h = output[baseIndex + 3]
          
          // Find max confidence
          let maxConf = 0
          let maxCls = 0
          for (let j = 4; j < 84; j++) {
            if (output[baseIndex + j] > maxConf) {
              maxConf = output[baseIndex + j]
              maxCls = j - 4
            }
          }
          
          conf = normalizeConfidence(maxConf) // Apply sigmoid
          cls = maxCls
          
          // Track max confidence found
          if (conf > maxConfidenceFound) {
            maxConfidenceFound = conf
          }
          
          if (conf > 0.3) {
            totalValidDetections++
            boxes.push([x - w/2, y - h/2, w, h])
            scores.push(conf)
            detected.push({ 
              class: cls, 
              brand: DISPLAY_NAMES[CAR_BRANDS[cls]] || CAR_BRANDS[cls] || `Class ${cls}`,
              confidence: conf,
              box: [x - w/2, y - h/2, w, h]
            })
          }
        } else {
          // Farklı output formatı için debug
          if (i === 0) {
            console.log('UNEXPECTED OUTPUT FORMAT!')
            console.log('OutputDim:', outputDim)
            console.log('First detection sample:', Array.from(output.slice(0, Math.min(20, outputDim))))
          }
        }
      }
      
      // Sadece 10 frame'de bir detaylı log
      if (!processDetections.frameCount) processDetections.frameCount = 0
      processDetections.frameCount++
      
      if (processDetections.frameCount % 10 === 0) {
        console.log('Processing results (every 10 frames):')
        console.log('- Total valid detections (>0.95):', totalValidDetections)
        console.log('- Max confidence found:', maxConfidenceFound.toFixed(3))
        console.log('- Detections before NMS:', detected.length)
      }
      
      // Apply NMS
      if (boxes.length > 0) {
        const nmsIndices = nms(boxes, scores, 0.5)
        const finalDetections = nmsIndices.map(idx => detected[idx])
        
        if (processDetections.frameCount % 10 === 0) {
          console.log('- Final detections after NMS:', finalDetections.length)
        }
        
        return finalDetections
      }
      
      return []
    }

    function drawDetections(ctx, detections) {
      const scaleX = canvasRef.current.width / 640
      const scaleY = canvasRef.current.height / 640
      
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.font = '16px Arial'
      ctx.fillStyle = '#00ff00'
      
      detections.forEach((detection) => {
        const [x, y, w, h] = detection.box
        const scaledX = x * scaleX
        const scaledY = y * scaleY
        const scaledW = w * scaleX
        const scaledH = h * scaleY
        
        // Draw bounding box
        ctx.strokeRect(scaledX, scaledY, scaledW, scaledH)
        
        // Draw label
        const label = `${detection.brand} (${(detection.confidence * 100).toFixed(1)}%)`
        const textY = scaledY > 20 ? scaledY - 5 : scaledY + 20
        ctx.fillText(label, scaledX, textY)
      })
    }

    if (cameraOn) {
      loadModelAndStart()
    }

    return () => {
      isMounted = false
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraOn, currentCamera])

  useEffect(() => {
    if (!cameraOn) return
    const interval = setInterval(() => {
      setDisplayedDetections(
        detections
          .filter(det => det.confidence > 0.95) // 0.5'ten 0.95'e çıkarttık
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3) // En yüksek 3 tespit
      )
    }, 500)
    return () => clearInterval(interval)
  }, [cameraOn, detections])

  const handleOpenCamera = () => {
    setCameraOn(true)
    setError("")
  }

  const handleCloseCamera = () => {
    setCameraOn(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
  }

  const switchCamera = () => {
    const newCamera = currentCamera === 'environment' ? 'user' : 'environment'
    setCurrentCamera(newCamera)
    if (cameraOn) {
      handleCloseCamera()
      setTimeout(() => {
        setCameraOn(true)
      }, 500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-extrabold mb-8 text-center">🚗 Araç Markası Tespiti</h1>
      
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      
      {(!modelLoaded && cameraOn) && (
        <div className="text-blue-600 mb-4 animate-pulse text-center text-xl">
          Model yükleniyor, lütfen bekleyin...
        </div>
      )}
      
      {cameraOn ? (
        <>
          <div className="relative mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full rounded shadow ${currentCamera === 'user' ? 'scale-x-[-1]' : ''}`}
              style={{ zIndex: 1 }}
            />
            <canvas
              ref={canvasRef}
              className={`absolute left-0 top-0 w-full h-full rounded pointer-events-none ${currentCamera === 'user' ? 'scale-x-[-1]' : ''}`}
              style={{ zIndex: 2 }}
            />
            
            {/* FPS ve Status Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-mono" style={{ zIndex: 3 }}>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">●</span>
                  <span>FPS: {fps}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={modelLoaded ? "text-green-400" : "text-yellow-400"}>●</span>
                  <span>{modelLoaded ? 'Model Yüklü' : 'Model Yükleniyor'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">●</span>
                  <span>Tespit: {detections.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tespit edilen araçları göster */}
          {displayedDetections.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-xl mb-4 flex items-center">
                🎯 Tespit Edilen Araçlar
                <span className="ml-2 bg-green-500 text-xs px-2 py-1 rounded-full">
                  {displayedDetections.length}
                </span>
              </h3>
              <div className="grid gap-3">
                {displayedDetections.map((det, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {i + 1}
                      </div>
                      <span className="font-bold text-lg">{det.brand}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${det.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-green-400 font-mono text-sm min-w-[50px]">
                        {(det.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-6 justify-center">
            <button
              onClick={switchCamera}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center space-x-2"
            >
              <span>{currentCamera === 'environment' ? '📱' : '📷'}</span>
              <span>{currentCamera === 'environment' ? 'Ön Kamera' : 'Arka Kamera'}</span>
            </button>
            <button
              onClick={handleCloseCamera}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2"
            >
              <span>⏹️</span>
              <span>Kamerayı Kapat</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center">
            <div className="text-8xl mb-6">📷</div>
            <button
              onClick={handleOpenCamera}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
            >
              <span>🎥</span>
              <span>Kamerayı Başlat</span>
            </button>
            <div className="text-gray-500 mt-6 text-lg">
              Kamera kapalı - Araç tespiti için kamerayı açın
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Desteklenen markalar: {Object.values(DISPLAY_NAMES).slice(0, 6).join(', ')} ve daha fazlası...
            </div>
          </div>
        </>
      )}
    </div>
  )
}