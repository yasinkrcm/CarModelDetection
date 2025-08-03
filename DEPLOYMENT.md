# 🚀 Deployment Rehberi

Bu rehber, Araç Markası Tespit Sistemi'ni farklı platformlara deploy etme adımlarını içerir.

## 📋 Ön Gereksinimler

1. **Model Eğitimi**: ONNX model dosyasının hazır olması
2. **Git Repository**: Projenin Git'te olması
3. **Node.js 18+**: Geliştirme ortamında kurulu olması

## 🎯 Vercel Deployment (Önerilen)

### 1. Vercel CLI Kurulumu

```bash
npm install -g vercel
```

### 2. Vercel'e Giriş

```bash
vercel login
```

### 3. Proje Deploy Etme

```bash
# Proje dizininde
vercel

# Veya production için
vercel --prod
```

### 4. Environment Variables (Gerekirse)

Vercel dashboard'da:
- `NEXT_PUBLIC_MODEL_URL`: Model dosyasının URL'i
- `NEXT_PUBLIC_API_KEY`: API anahtarları

### 5. Custom Domain (İsteğe Bağlı)

Vercel dashboard'da domain ayarlarından özel domain ekleyebilirsiniz.

## 🌐 Netlify Deployment

### 1. Build Komutu

```bash
npm run build
```

### 2. Deploy Settings

Netlify'da:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18.x

### 3. Environment Variables

Netlify dashboard'da gerekli environment variable'ları ekleyin.

## ☁️ AWS S3 + CloudFront

### 1. S3 Bucket Oluşturma

```bash
aws s3 mb s3://car-detection-app
```

### 2. Static Website Hosting

```bash
# Build
npm run build

# Upload to S3
aws s3 sync .next s3://car-detection-app --delete
```

### 3. CloudFront Distribution

AWS Console'da CloudFront distribution oluşturun.

## 🔧 GitHub Pages

### 1. Next.js Export

```bash
# next.config.js'de export ayarı
module.exports = {
  output: 'export',
  trailingSlash: true,
}

# Build
npm run build
```

### 2. GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

## 📱 Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
version: '3.8'
services:
  car-detection:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

### 3. Deploy

```bash
docker build -t car-detection .
docker run -p 3000:3000 car-detection
```

## 🔒 HTTPS ve Güvenlik

### 1. SSL Sertifikası

- **Vercel/Netlify**: Otomatik SSL
- **AWS**: ACM sertifikası
- **Self-hosted**: Let's Encrypt

### 2. Security Headers

`next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  }
}
```

## 📊 Performance Optimizasyonu

### 1. Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  }
}
```

### 2. Bundle Analysis

```bash
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})
```

### 3. Caching

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  }
}
```

## 🐛 Troubleshooting

### Yaygın Sorunlar

1. **Build Hatası**:
   ```bash
   npm run build
   # Hata mesajlarını kontrol edin
   ```

2. **Model Yüklenmiyor**:
   - Model dosyasının doğru konumda olduğunu kontrol edin
   - CORS ayarlarını kontrol edin

3. **Kamera Erişimi**:
   - HTTPS kullandığınızdan emin olun
   - Tarayıcı izinlerini kontrol edin

4. **Memory Issues**:
   - Model boyutunu küçültün
   - Görüntü çözünürlüğünü düşürün

### Debug Komutları

```bash
# Build analizi
npm run build -- --debug

# Bundle analizi
ANALYZE=true npm run build

# Performance test
npm run lighthouse
```

## 📈 Monitoring

### 1. Vercel Analytics

```bash
npm install @vercel/analytics
```

### 2. Error Tracking

```bash
npm install @sentry/nextjs
```

### 3. Performance Monitoring

```bash
npm install web-vitals
```

## 🔄 CI/CD Pipeline

### GitHub Actions Örneği

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run lint
    - run: npm run build
    - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Destek

Deployment sorunları için:
- GitHub Issues
- Vercel Support
- Netlify Support
- AWS Documentation

---

**Not**: Production deployment öncesi güvenlik testleri yapmayı unutmayın. 