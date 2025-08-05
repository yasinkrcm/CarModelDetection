import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="relative container mx-auto px-6 py-20">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Vision
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-blue-400 transition-colors">Özellikler</a>
              <a href="#tech" className="hover:text-blue-400 transition-colors">Teknoloji</a>
              <a href="#demo" className="hover:text-blue-400 transition-colors">Demo</a>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Yapay Zeka
                </span>
                <br />
                <span className="text-white">
                  Araç Markası Tespiti
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Son teknoloji bilgisayar görü sistemi ile 19 farklı araç markasını 
                gerçek zamanlı olarak tespit eden gelişmiş derin öğrenme algoritması
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">%78</div>
                <div className="text-gray-400">mAP Doğruluğu</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">19</div>
                <div className="text-gray-400">Araç Markası</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">30+</div>
                <div className="text-gray-400">FPS Gerçek Zamanlı</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">3MB</div>
                <div className="text-gray-400">Model Boyutu</div>
              </div>
            </div>

            {/* CTA Button */}
            <Link 
              href="/demo" 
              className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center">
                🚀 Canlı Demo'yu Dene
                <svg className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gelişmiş Özellikler
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Gerçek Zamanlı Tespit</h3>
              <p className="text-gray-300">Optimize edilmiş ONNX runtime kullanarak saniye altı yanıt süreleri ile yıldırım hızında araç markası tanımlama.</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Yapay Zeka Destekli</h3>
              <p className="text-gray-300">%78 mAP doğruluğu ile otomotiv marka tanıma için optimize edilmiş özel eğitilmiş YOLOv8 sinir ağı.</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Gizlilik Öncelikli</h3>
              <p className="text-gray-300">Tüm işlemler tarayıcınızda yerel olarak gerçekleşir. Hiçbir veri sunuculara gönderilmez, tam gizlilik koruması sağlanır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Teknoloji Yığını
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h3 className="text-3xl font-bold mb-6 text-blue-400">Makine Öğrenmesi</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-4"></div>
                  <span className="text-lg">YOLOv8 (You Only Look Once) Sinir Ağı</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-4"></div>
                  <span className="text-lg">Optimize Edilmiş Çıkarım için ONNX Runtime</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-400 rounded-full mr-4"></div>
                  <span className="text-lg">19 Araç Markası ile Özel Veri Seti</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-4"></div>
                  <span className="text-lg">Boyut Optimizasyonu için Dinamik Kuantizasyon</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h3 className="text-3xl font-bold mb-6 text-purple-400">Web Teknolojileri</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-4"></div>
                  <span className="text-lg">React 18 ile Next.js 14</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-4"></div>
                  <span className="text-lg">Performans için WebAssembly (WASM)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-400 rounded-full mr-4"></div>
                  <span className="text-lg">Modern UI için Tailwind CSS</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-4"></div>
                  <span className="text-lg">Kamera Erişimi için WebRTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Brands */}
      <section className="py-24 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Desteklenen Araç Markaları
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-6 max-w-6xl mx-auto">
            {[
              "Alfa Romeo", "Audi", "Bentley", "Mercedes", "BMW", "Cadillac", "Dodge",
              "Ferrari", "Ford", "Ford Mustang", "Hyundai", "Kia", "Lamborghini",
              "Lexus", "Maserati", "Porsche", "Rolls-Royce", "Tesla", "Toyota"
            ].map((brand, index) => (
              <div
                key={brand}
                className="group bg-white/5 backdrop-blur-lg rounded-xl p-4 text-center border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-110"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {brand}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Yapay Zeka'yı Canlı Deneyimlemeye Hazır mısınız?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Gerçek zamanlı bilgisayar görü teknolojisinin gücünü görün. 
            Kameranızı herhangi bir araca doğrultun ve yapay zekamızın markayı anında tanımasını izleyin.
          </p>
          
          <Link 
            href="/demo" 
            className="group relative inline-flex items-center justify-center px-16 py-8 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 rounded-3xl blur opacity-30 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="relative flex items-center">
              🎯 Canlı Demo'yu Başlat
              <svg className="ml-4 w-8 h-8 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Vision
          </div>
          <p className="text-gray-400 mb-6">
            Gelişmiş Bilgisayar Görü • Makine Öğrenmesi • Gerçek Zamanlı İşleme
          </p>
          <div className="text-sm text-gray-500">
            Next.js, YOLOv8 ve ONNX Runtime ile geliştirildi
          </div>
        </div>
      </footer>
    </div>
  )
} 