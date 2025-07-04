'use client'

import { useState } from 'react'
import { tauriCommands, isTauri } from '@/lib/tauri'

export default function TauriDemo() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGreet = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const message = await tauriCommands.greet(name)
      setGreetMsg(message)
    } catch (error) {
      setGreetMsg('Error: Could not connect to Tauri backend')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowWindow = async () => {
    try {
      await tauriCommands.showWindow()
    } catch (error) {
      console.error('Failed to show window:', error)
    }
  }

  const handleHideWindow = async () => {
    try {
      await tauriCommands.hideWindow()
    } catch (error) {
      console.error('Failed to hide window:', error)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Tauri Integration Demo
      </h3>
      
      <div className="space-y-4">
        {/* Greet Command */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Enter your name:
          </label>
          <div className="flex gap-2">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleGreet()}
            />
            <button
              onClick={handleGreet}
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 font-medium"
            >
              {isLoading ? 'Loading...' : 'Greet'}
            </button>
          </div>
          {greetMsg && (
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              {greetMsg}
            </p>
          )}
        </div>

        {/* Window Controls */}
        {isTauri() && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Window Controls:
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleShowWindow}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200 text-sm"
              >
                Show Window
              </button>
              <button
                onClick={handleHideWindow}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 text-sm"
              >
                Hide Window
              </button>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isTauri() 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {isTauri() ? '✅ Running in Tauri' : '⚠️ Running in Browser'}
          </span>
        </div>
      </div>
    </div>
  )
}