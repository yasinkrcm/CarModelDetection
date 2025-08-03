/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Node.js modülleri için fallback
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    // ONNX Runtime Web için WASM dosyaları
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]'
      }
    })

    // ONNX Runtime dosyalarını tamamen ignore et
    config.module.rules.push({
      test: /ort\.(node|web)\.min\.(js|mjs)$/,
      use: 'null-loader'
    })

    // ONNX Runtime'ı externals olarak tanımla
    config.externals = config.externals || []
    config.externals.push({
      'onnxruntime-web': 'ort',
      'onnxruntime-node': 'ort'
    })

    // Cross-Origin headers for ONNX Runtime Web
    if (!isServer) {
      config.output.crossOriginLoading = 'anonymous'
    }

    return config
  },
  // ONNX Runtime Web için headers
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Performance optimizations
  compress: false,
  poweredByHeader: false,
  generateEtags: false,
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig 