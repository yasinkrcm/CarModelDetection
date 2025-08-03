import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Car Brand Detection AI - Gerçek Zamanlı Araç Markası Tespiti',
  description: 'Yapay Zeka ile gerçek zamanlı araç markası tespiti yapan web uygulaması',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        {/* ONNX Runtime CDN */}
        <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js"></script>
        
        {/* Security headers */}
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 