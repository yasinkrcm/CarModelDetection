import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🚗 Araç Markası Tespit Sistemi
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Yapay zeka destekli gerçek zamanlı araç markası tespit sistemi. 
            Kamera ile anında araç markalarını tanıyın ve tespit edin.
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🎯 Özellikler
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Gerçek zamanlı kamera tespiti</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">YOLOv8 tabanlı AI modeli</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Tarayıcıda çalışan ONNX modeli</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">FPS sayacı</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Gizlilik korumalı (sadece tarayıcıda)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Responsive tasarım</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🔒 Gizlilik
            </h3>
            <p className="text-blue-800">
              Kamera verileriniz sadece tarayıcınızda işlenir ve hiçbir zaman sunucuya gönderilmez. 
              Tüm AI işlemleri yerel olarak gerçekleştirilir.
            </p>
          </div>

          <Link 
            href="/demo" 
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg shadow-lg hover:shadow-xl"
          >
            🎥 Canlı Demo'ya Geç
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
} 