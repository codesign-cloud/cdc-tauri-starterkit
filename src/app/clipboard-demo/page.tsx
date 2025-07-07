'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Copy, Clipboard, Trash2, History, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ClipboardEntry {
  id: string
  content: string
  timestamp: Date
  type: 'text' | 'json' | 'url'
}

export default function ClipboardDemo() {
  const [clipboardText, setClipboardText] = useState('')
  const [textToCopy, setTextToCopy] = useState('')
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sample data for demo
  const sampleTexts = [
    { label: 'Sample URL', content: 'https://tauri.app/v1/guides/getting-started/prerequisites' },
    { label: 'Sample JSON', content: JSON.stringify({ name: 'Tauri App', version: '2.0.0', features: ['clipboard', 'deep-link'] }, null, 2) },
    { label: 'Sample Code', content: 'const result = await invoke("copy_to_clipboard", { text });' },
    { label: 'Lorem Ipsum', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
  ]

  useEffect(() => {
    // Clear messages after 3 seconds
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message)
      setError(null)
    } else {
      setError(message)
      setSuccess(null)
    }
  }

  const detectContentType = (content: string): 'text' | 'json' | 'url' => {
    try {
      JSON.parse(content)
      return 'json'
    } catch {
      if (content.match(/^https?:\/\/.+/)) {
        return 'url'
      }
      return 'text'
    }
  }

  const copyToClipboard = async (text: string) => {
    setIsLoading(true)
    try {
      await invoke('copy_to_clipboard', { text })
      
      // Add to history
      const newEntry: ClipboardEntry = {
        id: Date.now().toString(),
        content: text,
        timestamp: new Date(),
        type: detectContentType(text)
      }
      setClipboardHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10 entries
      
      showMessage('Text copied to clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to copy: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const pasteFromClipboard = async () => {
    setIsLoading(true)
    try {
      const text = await invoke('paste_from_clipboard') as string
      setClipboardText(text)
      showMessage('Text pasted from clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to paste: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearClipboard = async () => {
    setIsLoading(true)
    try {
      await invoke('clear_clipboard')
      setClipboardText('')
      showMessage('Clipboard cleared successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to clear clipboard: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'json': return '📋'
      case 'url': return '🔗'
      default: return '📝'
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white mb-4">
            Clipboard Manager Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Explore advanced clipboard operations with real-time monitoring and history tracking.
          </p>
        </div>

        {/* Status Messages */}
        {(success || error) && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            success 
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{success || error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Copy Section */}
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Copy size={20} />
                Copy to Clipboard
              </h2>
              
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                  placeholder="Enter text to copy to clipboard..."
                  value={textToCopy}
                  onChange={(e) => setTextToCopy(e.target.value)}
                />
                
                <button
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  onClick={() => copyToClipboard(textToCopy)}
                  disabled={isLoading || !textToCopy.trim()}
                >
                  {isLoading ? 'Copying...' : 'Copy Text'}
                </button>
              </div>
            </div>

            {/* Sample Texts */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4">
                Quick Copy Samples
              </h3>
              <div className="space-y-2">
                {sampleTexts.map((sample, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-black transition-colors"
                    onClick={() => copyToClipboard(sample.content)}
                    disabled={isLoading}
                  >
                    <div className="font-medium text-black dark:text-white">{sample.label}</div>
                    <div className="text-gray-600 dark:text-gray-400 truncate">
                      {sample.content.substring(0, 60)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Paste & History Section */}
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Clipboard size={20} />
                Paste from Clipboard
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                    onClick={pasteFromClipboard}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Pasting...' : 'Paste'}
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                    onClick={clearClipboard}
                    disabled={isLoading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                  placeholder="Clipboard content will appear here..."
                  value={clipboardText}
                  readOnly
                />
              </div>
            </div>

            {/* Clipboard History */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <History size={18} />
                Clipboard History
              </h3>
              
              {clipboardHistory.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                  No clipboard history yet. Copy some text to see it here.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clipboardHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
                      onClick={() => copyToClipboard(entry.content)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span>{getTypeIcon(entry.type)}</span>
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <Copy size={12} className="text-gray-400" />
                      </div>
                      <div className="text-sm text-black dark:text-white truncate">
                        {entry.content.substring(0, 80)}
                        {entry.content.length > 80 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="text-2xl">📋</div>
            <h3 className="font-semibold text-black dark:text-white">Smart Detection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically detects content type (text, JSON, URLs) for better organization.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold text-black dark:text-white">Real-time Sync</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instantly sync clipboard operations between your app and system clipboard.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">🔒</div>
            <h3 className="font-semibold text-black dark:text-white">Secure Handling</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Secure clipboard operations with proper error handling and validation.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}