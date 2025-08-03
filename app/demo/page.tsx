'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import CameraDetection from '@/components/CameraDetection'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-white hover:text-blue-300 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">
            🎥 Canlı Araç Tespiti
          </h1>
        </div>

        {/* Camera Detection Component */}
        <CameraDetection />
      </div>
    </div>
  )
} 