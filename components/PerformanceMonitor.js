'use client'

import { useEffect, useState, useRef } from 'react'

export default function PerformanceMonitor({ onMetricsUpdate }) {
  const [metrics, setMetrics] = useState({
    modelLoadTime: 0,
    inferenceTime: 0,
    fps: 0,
    memoryUsage: 0,
    wasmMemory: 0,
    sessionMemory: 0
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const metricsRef = useRef(metrics)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  // Performance monitoring
  useEffect(() => {
    const updateMetrics = () => {
      if (typeof window !== 'undefined' && window.ort) {
        const ort = window.ort
        
        // Memory usage
        const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0
        
        // WASM memory
        const wasmMemory = ort.env.wasm ? ort.env.wasm.memorySize || 0 : 0
        
        // Session memory (tahmini)
        const sessionMemory = ort.env.session ? ort.env.session.memoryUsage || 0 : 0
        
        const newMetrics = {
          ...metricsRef.current,
          memoryUsage,
          wasmMemory,
          sessionMemory
        }
        
        setMetrics(newMetrics)
        metricsRef.current = newMetrics
        
        if (onMetricsUpdate) {
          onMetricsUpdate(newMetrics)
        }
      }
    }

    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [onMetricsUpdate])

  // FPS calculation
  useEffect(() => {
    const calculateFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current))
        
        setMetrics(prev => ({
          ...prev,
          fps
        }))
        
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }
      
      requestAnimationFrame(calculateFPS)
    }
    
    requestAnimationFrame(calculateFPS)
  }, [])

  // Model load time tracking
  useEffect(() => {
    const startTime = performance.now()
    
    const checkModelLoaded = () => {
      if (typeof window !== 'undefined' && window.ort) {
        const ort = window.ort
        if (ort.InferenceSession) {
          const loadTime = performance.now() - startTime
          setMetrics(prev => ({
            ...prev,
            modelLoadTime: loadTime
          }))
          return
        }
      }
      setTimeout(checkModelLoaded, 100)
    }
    
    checkModelLoaded()
  }, [])

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-mono hover:bg-blue-700 transition-colors"
      >
        📊 {isVisible ? 'Gizle' : 'Performans'}
      </button>
      
      {/* Performance panel */}
      {isVisible && (
        <div className="mt-2 bg-black bg-opacity-90 text-white p-4 rounded-lg font-mono text-xs min-w-64">
          <h3 className="font-bold mb-2 text-green-400">🚀 Performans Metrikleri</h3>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Model Yükleme:</span>
              <span className={metrics.modelLoadTime > 5000 ? 'text-red-400' : 'text-green-400'}>
                {metrics.modelLoadTime.toFixed(0)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Inference:</span>
              <span className={metrics.inferenceTime > 100 ? 'text-red-400' : 'text-green-400'}>
                {metrics.inferenceTime.toFixed(1)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={metrics.fps < 15 ? 'text-red-400' : metrics.fps < 30 ? 'text-yellow-400' : 'text-green-400'}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>JS Memory:</span>
              <span className={metrics.memoryUsage > 100 ? 'text-red-400' : 'text-green-400'}>
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>WASM Memory:</span>
              <span className={metrics.wasmMemory > 50 ? 'text-red-400' : 'text-green-400'}>
                {metrics.wasmMemory.toFixed(1)}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Session Memory:</span>
              <span className={metrics.sessionMemory > 20 ? 'text-red-400' : 'text-green-400'}>
                {metrics.sessionMemory.toFixed(1)}MB
              </span>
            </div>
          </div>
          
          {/* Performance status */}
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span>Durum:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                metrics.fps >= 30 && metrics.inferenceTime < 50 
                  ? 'bg-green-600 text-white' 
                  : metrics.fps >= 15 && metrics.inferenceTime < 100
                  ? 'bg-yellow-600 text-white'
                  : 'bg-red-600 text-white'
              }`}>
                {metrics.fps >= 30 && metrics.inferenceTime < 50 ? 'Mükemmel' :
                 metrics.fps >= 15 && metrics.inferenceTime < 100 ? 'İyi' : 'Yavaş'}
              </span>
            </div>
          </div>
          
          {/* Recommendations */}
          {metrics.fps < 15 && (
            <div className="mt-2 p-2 bg-yellow-900 border border-yellow-700 rounded text-xs">
              💡 Öneriler:
              <ul className="mt-1 space-y-1">
                <li>• Model quantization kullanın</li>
                <li>• Input boyutunu küçültün</li>
                <li>• WASM SIMD'i etkinleştirin</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 