'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Link2, Globe, Settings, User, FileText, ExternalLink, CheckCircle, AlertCircle, ArrowLeft, Play } from 'lucide-react'
import Link from 'next/link'

interface DeepLinkEvent {
  url: string
  scheme: string
  host: string
  path: string
  query: string
  timestamp: Date
}

export default function DeepLinkDemo() {
  const [protocolInput, setProtocolInput] = useState('tauri-starterkit')
  const [testUrl, setTestUrl] = useState('tauri-starterkit://demo/page?data=hello&user=123')
  const [deepLinkHistory, setDeepLinkHistory] = useState<DeepLinkEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Sample deep link URLs for testing
  const sampleUrls = [
    { 
      label: 'Open User Profile', 
      url: 'tauri-starterkit://user/profile?id=123&tab=settings',
      description: 'Navigate to user profile with specific tab'
    },
    { 
      label: 'Open Document', 
      url: 'tauri-starterkit://document/open?file=report.pdf&mode=edit',
      description: 'Open a document in edit mode'
    },
    { 
      label: 'App Settings', 
      url: 'tauri-starterkit://settings/theme?mode=dark&language=en',
      description: 'Open settings with specific configuration'
    },
    { 
      label: 'Share Content', 
      url: 'tauri-starterkit://share?text=Hello%20World&type=message',
      description: 'Share content from external application'
    }
  ]

  useEffect(() => {
    setupDeepLinkListener()
    
    // Clear messages after 3 seconds
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error]) // setupDeepLinkListener is intentionally not included as it should only run once

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message)
      setError(null)
    } else {
      setError(message)
      setSuccess(null)
    }
  }

  const setupDeepLinkListener = async () => {
    try {
      const unlisten = await listen('deep-link-received', (event: any) => {
        const { url, scheme, host, path, query } = event.payload
        console.log('Deep link received:', { url, scheme, host, path, query })
        
        const newEvent: DeepLinkEvent = {
          url,
          scheme,
          host,
          path,
          query,
          timestamp: new Date()
        }
        
        setDeepLinkHistory(prev => [newEvent, ...prev.slice(0, 9)]) // Keep last 10 entries
        showMessage(`Deep link received: ${url}`, 'success')
      })
      
      setIsListening(true)
      console.log('Deep link listener setup successful')
      
      return unlisten
    } catch (error) {
      console.error('Failed to setup deep link listener:', error)
      setIsListening(false)
    }
  }

  const registerProtocol = async () => {
    if (!protocolInput.trim()) {
      showMessage('Please enter a protocol name', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      await invoke('register_protocol', { protocol: protocolInput })
      showMessage(`Protocol '${protocolInput}' registered successfully!`, 'success')
    } catch (err) {
      showMessage(`Failed to register protocol: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeepLink = async (url: string) => {
    setIsLoading(true)
    try {
      const result = await invoke('handle_deep_link_event', { url }) as string
      showMessage(result, 'success')
    } catch (err) {
      showMessage(`Failed to handle deep link: ${err}`, 'error')
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

  const parseUrlComponents = (url: string) => {
    try {
      const parsed = new URL(url)
      return {
        scheme: parsed.protocol.replace(':', ''),
        host: parsed.hostname || parsed.pathname.split('/')[0],
        path: parsed.pathname,
        query: parsed.search.replace('?', ''),
        params: Object.fromEntries(parsed.searchParams.entries())
      }
    } catch {
      return null
    }
  }

  const getActionIcon = (path: string) => {
    if (path.includes('user') || path.includes('profile')) return <User size={16} />
    if (path.includes('settings')) return <Settings size={16} />
    if (path.includes('document') || path.includes('file')) return <FileText size={16} />
    return <Globe size={16} />
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
            Deep Link Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Register custom URL schemes and handle deep links to create seamless inter-app communication.
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

        {/* Listener Status */}
        <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-black dark:text-white">
              Deep Link Listener: {isListening ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Protocol Registration */}
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Link2 size={20} />
                Register Protocol
              </h2>
              
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  placeholder="Protocol name (e.g., my-app)"
                  value={protocolInput}
                  onChange={(e) => setProtocolInput(e.target.value)}
                />
                
                <button
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  onClick={registerProtocol}
                  disabled={isLoading || !protocolInput.trim()}
                >
                  {isLoading ? 'Registering...' : 'Register Protocol'}
                </button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>• Protocol names should be unique and descriptive</p>
                  <p>• Avoid common protocols like http, https, file</p>
                  <p>• Use lowercase with hyphens (kebab-case)</p>
                </div>
              </div>
            </div>

            {/* Test Deep Link */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Play size={20} />
                Test Deep Link
              </h2>
              
              <div className="space-y-4">
                <input
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  placeholder="Enter deep link URL to test..."
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                />
                
                <button
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  onClick={() => handleDeepLink(testUrl)}
                  disabled={isLoading || !testUrl.trim()}
                >
                  {isLoading ? 'Testing...' : 'Test Deep Link'}
                </button>
                
                {parseUrlComponents(testUrl) && (
                  <div className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black">
                    <div className="text-xs font-medium text-black dark:text-white mb-2">URL Preview:</div>
                    {(() => {
                      const components = parseUrlComponents(testUrl)!
                      return (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div><span className="font-medium">Scheme:</span> {components.scheme}</div>
                          <div><span className="font-medium">Host:</span> {components.host}</div>
                          <div><span className="font-medium">Path:</span> {components.path}</div>
                          {components.query && <div><span className="font-medium">Query:</span> {components.query}</div>}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sample URLs & History */}
          <div className="space-y-6">
            {/* Sample URLs */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4">
                Sample Deep Links
              </h3>
              <div className="space-y-2">
                {sampleUrls.map((sample, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-black transition-colors"
                    onClick={() => handleDeepLink(sample.url)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getActionIcon(sample.url)}
                      <span className="font-medium text-black dark:text-white">{sample.label}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                      {sample.description}
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 text-xs font-mono truncate">
                      {sample.url}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Deep Link History */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <ExternalLink size={18} />
                Deep Link History
              </h3>
              
              {deepLinkHistory.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                  No deep links received yet. Test a deep link to see it here.
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {deepLinkHistory.map((event, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          {getActionIcon(event.path)}
                        </div>
                      </div>
                      
                      <div className="text-sm font-mono text-black dark:text-white mb-2 break-all">
                        {event.url}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div><span className="font-medium">Scheme:</span> {event.scheme}</div>
                        <div><span className="font-medium">Host:</span> {event.host}</div>
                        <div className="col-span-2"><span className="font-medium">Path:</span> {event.path}</div>
                        {event.query && (
                          <div className="col-span-2"><span className="font-medium">Query:</span> {event.query}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            How to Test Deep Links
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black dark:text-white mb-2">From Command Line</h4>
              <div className="p-3 bg-black dark:bg-gray-900 rounded-md">
                <code className="text-green-400 text-sm">
                  open "tauri-starterkit://demo/test"
                </code>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                macOS/Linux - Replace with your protocol
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-black dark:text-white mb-2">From HTML</h4>
              <div className="p-3 bg-black dark:bg-gray-900 rounded-md">
                <code className="text-green-400 text-sm">
                  {'<a href="tauri-starterkit://...">Link</a>'}
                </code>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Clickable links in web browsers
              </p>
            </div>
          </div>
        </div>

        {/* Feature Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="text-2xl">🔗</div>
            <h3 className="font-semibold text-black dark:text-white">Custom Protocols</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register your own URL schemes for seamless app integration.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">📱</div>
            <h3 className="font-semibold text-black dark:text-white">Cross-Platform</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Works consistently across Windows, macOS, and Linux systems.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold text-black dark:text-white">Real-time Events</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instant handling of deep links with full URL parsing capabilities.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}