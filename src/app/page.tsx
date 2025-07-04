'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

export default function Home() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')

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