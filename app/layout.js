import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Car Brand Detection AI - Gerçek Zamanlı Araç Markası Tespiti',
  description: 'Yapay Zeka ile gerçek zamanlı araç markası tespiti yapan web uygulaması',
  other: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        {/* WASM için gerekli headers */}
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        
        {/* Model prefetch for faster loading */}
        <link rel="prefetch" href="/models/best_optimized.onnx" />
        
        {/* ONNX Runtime Web CDN - Optimized smaller build */}
        <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js" async></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Configure ONNX Runtime when loaded
              document.addEventListener('DOMContentLoaded', function() {
                if (window.ort) {
                  // Use CDN WASM files (much smaller than local files)
                  window.ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
                  window.ort.env.wasm.simd = true;
                  window.ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4);
                  window.ort.env.wasm.proxy = false;
                  window.ort.env.logLevel = 'warning';
                  
                  console.log('ONNX Runtime optimized configuration loaded from CDN');
                }
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 