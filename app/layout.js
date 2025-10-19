import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  icons: {
    icon: '/icon.jpeg',
  },
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
        
        {/* PyTorch Backend Integration */}
        <meta name="description" content="Django + PyTorch backend ile gerçek zamanlı araç markası tespiti" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 