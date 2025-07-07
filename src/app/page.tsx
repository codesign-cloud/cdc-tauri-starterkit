'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Copy, Link2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import NotificationDemo from '@/components/NotificationDemo'
import { fetchFeatures } from '@/lib/tauri'

export default function Home() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')
  
  // Fetch enabled features using SWR
  const { data: features } = useSWR('tauri-features', fetchFeatures)

  async function greet() {
    try {
      // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
      setGreetMsg(await invoke('greet', { name }))
    } catch (error) {
      console.error('Error calling greet command:', error)
      setGreetMsg('Hello from Tauri + Next.js!')
    }
  }

  useEffect(() => {
    // Set default greeting on component mount
    setGreetMsg('Welcome to Tauri + Next.js 15 Startekit!')
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white mb-4">
            CDC Tauri + Next.js Starterkit
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A modern desktop application starterkit built with Tauri, Next.js 15, and TypeScript.
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="mb-20">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 bg-gray-50 dark:bg-gray-950">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-6 text-center">
              Test Tauri Integration
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Enter your name"
                value={name}
              />
              <button
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                onClick={() => greet()}
              >
                Greet
              </button>
            </div>
            {greetMsg && (
              <p className="mt-6 text-center text-black dark:text-white font-medium">
                {greetMsg}
              </p>
            )}
          </div>
        </div>

        {/* Feature Demos */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
            Explore Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clipboard Demo Link - Only show if clipboard feature is enabled */}
            {features?.has('clipboard') && (
              <Link href="/clipboard-demo" className="group">
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950 hover:bg-white dark:hover:bg-black transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Copy size={24} className="text-black dark:text-white" />
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      Clipboard Manager
                    </h3>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Advanced clipboard operations with history tracking, smart content detection, and seamless system integration.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">Copy/Paste</span>
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">History</span>
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">Auto-detect</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Deep Link Demo Link - Only show if deep-links feature is enabled */}
            {features?.has('deep-links') && (
              <Link href="/deep-link-demo" className="group">
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950 hover:bg-white dark:hover:bg-black transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Link2 size={24} className="text-black dark:text-white" />
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      Deep Link Handler
                    </h3>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Register custom URL schemes and handle deep links for seamless inter-app communication and external integrations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">Custom Protocols</span>
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">URL Parsing</span>
                    <span className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black rounded">Events</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
          
          {/* Show message when no features are enabled */}
          {features && features.size === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No optional features are currently enabled.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Run with <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">--features clipboard,notifications,deep-links</code> to see feature demos.
              </p>
            </div>
          )}
        </div>

        {/* Notification Demo - Only show if notifications feature is enabled */}
        {features?.has('notifications') && (
          <div className="mb-20">
            <NotificationDemo />
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Modern Stack
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Built with Next.js 15, React 19, and TypeScript for a robust development experience.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Native Desktop
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Cross-platform desktop application with system tray and native menu integration.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Type Safety
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Full TypeScript integration across frontend and backend for reliable code.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Fast Development
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Hot reload, modern tooling, and optimized build process for rapid iteration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Right-click the system tray icon to access native features
          </p>
        </div>
      </div>
    </main>
  )
}