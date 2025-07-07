'use client'

import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Copy, Clipboard, Trash2, History, CheckCircle, AlertCircle, ArrowLeft, Eye, Clock, FileText, Image, Upload } from 'lucide-react'
import Link from 'next/link'

interface ClipboardFormat {
  format_name: string
  format_type: string // MIME type or format identifier
  data_size: number
  content_preview: string
  is_available: boolean
  raw_data?: string // Base64 encoded raw data for advanced formats
}

interface ClipboardHistoryItem {
  id: string
  timestamp: string
  formats: ClipboardFormat[]
  primary_content: string
  content_type: string
  // Text formats
  plain_text?: string
  html_content?: string
  rtf_content?: string
  // Image formats
  image_data?: string // Base64 encoded image data
  image_format?: string // Image format (png, jpg, etc.)
  image_dimensions?: [number, number] // Width, Height
  // File formats
  file_paths?: string[] // File paths for file drops
  file_list?: string // File list as text
  // Advanced formats
  custom_formats?: Record<string, string> // Custom format data
}

interface ClipboardEntry {
  id: string
  content: string
  timestamp: Date
  type: 'text' | 'json' | 'url'
}

export default function ClipboardDemo() {
  const [clipboardText, setClipboardText] = useState('')
  const [textToCopy, setTextToCopy] = useState('')
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistoryItem[]>([])
  const [clipboardFormats, setClipboardFormats] = useState<ClipboardFormat[]>([])
  const [localHistory, setLocalHistory] = useState<ClipboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ClipboardHistoryItem | null>(null)
  const [clipboardImage, setClipboardImage] = useState<string | null>(null)
  const [allFormats, setAllFormats] = useState<Record<string, string>>({})
  const [selectedFormat, setSelectedFormat] = useState<string>('')

  // Sample data for demo with more format types
  const sampleTexts = [
    { label: 'Sample URL', content: 'https://tauri.app/v1/guides/getting-started/prerequisites' },
    { label: 'Sample JSON', content: JSON.stringify({ name: 'Tauri App', version: '2.0.0', features: ['clipboard', 'deep-link'] }, null, 2) },
    { label: 'Sample HTML', content: '<div><h1>Hello World</h1><p>This is <strong>HTML</strong> content with <em>formatting</em>.</p></div>' },
    { label: 'Sample RTF', content: '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 Hello \\b World\\b0!}' },
    { label: 'Sample Code', content: 'const result = await invoke("copy_to_clipboard", { text });' },
    { label: 'Sample CSV', content: 'Name,Age,City\nJohn,25,New York\nJane,30,Los Angeles\nBob,35,Chicago' },
    { label: 'Sample XML', content: '<?xml version="1.0"?><root><item id="1">Hello</item><item id="2">World</item></root>' },
    { label: 'Sample Markdown', content: '# Hello World\n\nThis is **bold** and *italic* text.\n\n```javascript\nconsole.log("Hello!");\n```' },
    { label: 'Sample Email', content: 'user@example.com' },
    { label: 'File Paths', content: 'C:\\Users\\Documents\\file1.txt\nC:\\Users\\Documents\\file2.txt' },
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

  // Monitor clipboard changes
  const monitorClipboard = useCallback(async () => {
    try {
      await invoke('monitor_clipboard_changes')
      await loadClipboardHistory()
      await loadClipboardFormats()
    } catch (err) {
      console.error('Failed to monitor clipboard:', err)
    }
  }, [])

  useEffect(() => {
    // Load clipboard history and formats on component mount
    loadClipboardHistory()
    loadClipboardFormats()
    
    // Set up clipboard monitoring interval
    const interval = setInterval(monitorClipboard, 2000) // Check every 2 seconds
    
    return () => clearInterval(interval)
  }, [monitorClipboard])

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

  const loadClipboardHistory = async () => {
    try {
      const history = await invoke('get_clipboard_history') as ClipboardHistoryItem[]
      setClipboardHistory(history)
    } catch (err) {
      console.error('Failed to load clipboard history:', err)
    }
  }

  const loadClipboardFormats = async () => {
    try {
      const formats = await invoke('get_clipboard_formats') as ClipboardFormat[]
      setClipboardFormats(formats)
    } catch (err) {
      console.error('Failed to load clipboard formats:', err)
    }
  }

  const loadAllClipboardFormats = async () => {
    try {
      const formats = await invoke('read_all_clipboard_formats') as Record<string, string>
      setAllFormats(formats)
    } catch (err) {
      console.error('Failed to load all clipboard formats:', err)
    }
  }

  const copyToClipboard = async (text: string) => {
    setIsLoading(true)
    try {
      await invoke('copy_to_clipboard', { text })
      
      // Add to clipboard history tracking
      await invoke('add_to_clipboard_history', { content: text })
      
      // Add to local history for UI
      const newEntry: ClipboardEntry = {
        id: Date.now().toString(),
        content: text,
        timestamp: new Date(),
        type: detectContentType(text)
      }
      setLocalHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10 entries
      
      // Reload clipboard history and formats
      await loadClipboardHistory()
      await loadClipboardFormats()
      
      showMessage('Text copied to clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to copy: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyHtmlToClipboard = async (html: string) => {
    setIsLoading(true)
    try {
      await invoke('copy_html_to_clipboard', { htmlContent: html })
      await loadClipboardHistory()
      await loadClipboardFormats()
      await loadAllClipboardFormats()
      showMessage('HTML copied to clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to copy HTML: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyRtfToClipboard = async (rtf: string) => {
    setIsLoading(true)
    try {
      await invoke('copy_rtf_to_clipboard', { rtfContent: rtf })
      await loadClipboardHistory()
      await loadClipboardFormats()
      await loadAllClipboardFormats()
      showMessage('RTF copied to clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to copy RTF: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyFilesToClipboard = async (filePaths: string[]) => {
    setIsLoading(true)
    try {
      await invoke('copy_files_to_clipboard', { filePaths })
      await loadClipboardHistory()
      await loadClipboardFormats()
      await loadAllClipboardFormats()
      showMessage('Files copied to clipboard successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to copy files: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearClipboardHistory = async () => {
    setIsLoading(true)
    try {
      await invoke('clear_clipboard_history')
      await loadClipboardHistory()
      showMessage('Clipboard history cleared successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to clear history: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const pasteFromClipboard = async () => {
    setIsLoading(true)
    try {
      // Try to get image first
      const imageData = await invoke('read_image_from_clipboard') as string | null
      if (imageData) {
        setClipboardImage(`data:image/png;base64,${imageData}`)
        setClipboardText('')
        showMessage('Image pasted from clipboard successfully!', 'success')
      } else {
        // Fall back to text
        const text = await invoke('paste_from_clipboard') as string
        setClipboardText(text)
        setClipboardImage(null)
        showMessage('Text pasted from clipboard successfully!', 'success')
      }
      await loadClipboardFormats()
      await loadAllClipboardFormats()
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
      setClipboardImage(null)
      await loadClipboardFormats()
      showMessage('Clipboard cleared successfully!', 'success')
    } catch (err) {
      showMessage(`Failed to clear clipboard: ${err}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file', 'error')
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result as string
        const base64Data = result.split(',')[1] // Remove data:image/...;base64, prefix
        
        try {
          await invoke('copy_image_to_clipboard', { imageData: base64Data })
          await loadClipboardHistory()
          await loadClipboardFormats()
          showMessage('Image copied to clipboard successfully!', 'success')
        } catch (err) {
          showMessage(`Failed to copy image: ${err}`, 'error')
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      showMessage(`Failed to process image: ${err}`, 'error')
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        month: 'short',
        day: 'numeric'
      }).format(date)
    } catch {
      return timestamp
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image': return '🖼️'
      case 'json': return '📋'
      case 'url': return '🔗'
      case 'html': return '🌐'
      case 'rtf': return '📝'
      case 'file path': return '📁'
      default: return '📄'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFormatIcon = (formatType: string) => {
    if (formatType.startsWith('image/')) return '🖼️'
    if (formatType.includes('html')) return '🌐'
    if (formatType.includes('rtf')) return '📝'
    if (formatType.includes('json')) return '📋'
    if (formatType.includes('xml')) return '🗂️'
    if (formatType.includes('csv')) return '📊'
    if (formatType.includes('markdown')) return '📄'
    if (formatType.includes('email')) return '📧'
    if (formatType.includes('uri-list') || formatType.includes('file')) return '📁'
    if (formatType.includes('code')) return '💻'
    if (formatType.includes('base64')) return '🔐'
    return '📄'
  }

  const handleSpecialCopy = (sample: any) => {
    if (sample.label.includes('HTML')) {
      copyHtmlToClipboard(sample.content)
    } else if (sample.label.includes('RTF')) {
      copyRtfToClipboard(sample.content)
    } else if (sample.label.includes('File Paths')) {
      const paths = sample.content.split('\n').filter((p: string) => p.trim())
      copyFilesToClipboard(paths)
    } else {
      copyToClipboard(sample.content)
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
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
            Advanced Clipboard Manager
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
            Explore Windows clipboard history with detailed format analysis - just like Win+V but with more insights into how data is stored, including full image support.
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

            {/* Image Upload Section */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Image size={18} />
                Copy Image to Clipboard
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> an image
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
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
                    onClick={() => handleSpecialCopy(sample)}
                    disabled={isLoading}
                  >
                    <div className="font-medium text-black dark:text-white flex items-center gap-2">
                      <span>{getFormatIcon(sample.label.toLowerCase())}</span>
                      {sample.label}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 truncate">
                      {sample.content.substring(0, 60)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Paste & Current Formats Section */}
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <Clipboard size={20} />
                Current Clipboard
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
                
                {clipboardImage ? (
                  <div className="w-full h-32 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                    <img
                      src={clipboardImage}
                      alt="Clipboard content"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <textarea
                    className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                    placeholder="Clipboard content will appear here..."
                    value={clipboardText}
                    readOnly
                  />
                )}
              </div>
            </div>

            {/* Current Clipboard Formats */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-md font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} />
                Available Formats
              </h3>
              
              {clipboardFormats.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No clipboard data available
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clipboardFormats.map((format, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                      onClick={() => setSelectedFormat(format.format_type)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                          <span>{getFormatIcon(format.format_type)}</span>
                          {format.format_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format.format_type} • {formatBytes(format.data_size)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {format.content_preview}
                      </div>
                      {format.raw_data && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Raw data available • Click to view
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Clipboard Formats */}
            {Object.keys(allFormats).length > 0 && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
                <h3 className="text-md font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  All Detected Formats ({Object.keys(allFormats).length})
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(allFormats).map(([formatType, data], index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                      onClick={() => setSelectedFormat(formatType)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                          <span>{getFormatIcon(formatType)}</span>
                          {formatType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(data.length)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {data.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clipboard History */}
        <div className="mt-8 border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <History size={20} />
              Clipboard History (Win+V Style)
            </h3>
            {clipboardHistory.length > 0 && (
              <button
                onClick={clearClipboardHistory}
                disabled={isLoading}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} className="inline mr-1" />
                Clear History
              </button>
            )}
          </div>
          
          {clipboardHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
              No clipboard history available. Copy some text to see it here.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clipboardHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-black transition-colors cursor-pointer group"
                  onClick={() => setSelectedHistoryItem(item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>{getTypeIcon(item.content_type)}</span>
                      {item.content_type}
                      {item.image_dimensions && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {item.image_dimensions[0]}×{item.image_dimensions[1]}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {item.content_type === 'Image' && item.image_data ? (
                    <div className="mb-2 flex items-center justify-center h-20 bg-gray-100 dark:bg-gray-800 rounded border overflow-hidden">
                      <img
                        src={`data:image/${item.image_format || 'png'};base64,${item.image_data}`}
                        alt="Clipboard image"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-black dark:text-white mb-2 line-clamp-3">
                      {item.primary_content.substring(0, 120)}
                      {item.primary_content.length > 120 && '...'}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.formats.length} format{item.formats.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={12} className="text-gray-400" />
                      <Copy
                        size={12}
                        className="text-gray-400 hover:text-black dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.content_type === 'Image' && item.image_data) {
                            // Copy image to clipboard
                            invoke('copy_image_to_clipboard', { imageData: item.image_data })
                              .then(() => showMessage('Image copied to clipboard!', 'success'))
                              .catch((err) => showMessage(`Failed to copy image: ${err}`, 'error'))
                          } else {
                            copyToClipboard(item.primary_content)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected History Item Details Modal */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Clipboard Item Details
                </h3>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="text-gray-500 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Type:</label>
                  <p className="text-black dark:text-white">{selectedHistoryItem.content_type}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp:</label>
                  <p className="text-black dark:text-white">{formatTimestamp(selectedHistoryItem.timestamp)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Formats:</label>
                  <div className="space-y-2 mt-2">
                    {selectedHistoryItem.formats.map((format, index) => (
                      <div key={index} className="p-3 border border-gray-300 dark:border-gray-700 rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-black dark:text-white">{format.format_name}</span>
                          <span className="text-sm text-gray-500">{format.format_type} • {formatBytes(format.data_size)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{format.content_preview}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content:</label>
                  {selectedHistoryItem.content_type === 'Image' && selectedHistoryItem.image_data ? (
                    <div className="mt-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center">
                      <img
                        src={`data:image/${selectedHistoryItem.image_format || 'png'};base64,${selectedHistoryItem.image_data}`}
                        alt="Clipboard image"
                        className="max-w-full max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <textarea
                      className="w-full h-32 mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-black dark:text-white text-sm resize-none"
                      value={selectedHistoryItem.primary_content}
                      readOnly
                    />
                  )}
                </div>
                
                <button
                  onClick={() => {
                    if (selectedHistoryItem.content_type === 'Image' && selectedHistoryItem.image_data) {
                      // Copy image to clipboard
                      invoke('copy_image_to_clipboard', { imageData: selectedHistoryItem.image_data })
                        .then(() => {
                          showMessage('Image copied to clipboard!', 'success')
                          setSelectedHistoryItem(null)
                        })
                        .catch((err) => showMessage(`Failed to copy image: ${err}`, 'error'))
                    } else {
                      copyToClipboard(selectedHistoryItem.primary_content)
                      setSelectedHistoryItem(null)
                    }
                  }}
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  {selectedHistoryItem.content_type === 'Image' ? 'Copy Image to Clipboard' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Format Details Modal */}
        {selectedFormat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <span>{getFormatIcon(selectedFormat)}</span>
                  Format Details: {selectedFormat}
                </h3>
                <button
                  onClick={() => setSelectedFormat('')}
                  className="text-gray-500 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Format Type:</label>
                  <p className="text-black dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedFormat}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Raw Data:</label>
                  {allFormats[selectedFormat] ? (
                    <div className="mt-2">
                      {selectedFormat.startsWith('image/') ? (
                        <div className="border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center">
                          <img
                            src={`data:${selectedFormat};base64,${allFormats[selectedFormat]}`}
                            alt="Clipboard image"
                            className="max-w-full max-h-64 object-contain"
                          />
                        </div>
                      ) : (
                        <textarea
                          className="w-full h-64 mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-black dark:text-white text-sm font-mono resize-none"
                          value={allFormats[selectedFormat]}
                          readOnly
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No raw data available</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedFormat.startsWith('image/')) {
                        invoke('copy_image_to_clipboard', { imageData: allFormats[selectedFormat] })
                          .then(() => {
                            showMessage('Image copied to clipboard!', 'success')
                            setSelectedFormat('')
                          })
                          .catch((err) => showMessage(`Failed to copy image: ${err}`, 'error'))
                      } else {
                        copyToClipboard(allFormats[selectedFormat])
                        setSelectedFormat('')
                      }
                    }}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                  >
                    Copy to Clipboard
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(allFormats[selectedFormat] || '')
                        .then(() => showMessage('Raw data copied to clipboard!', 'success'))
                        .catch(() => showMessage('Failed to copy raw data', 'error'))
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    Copy Raw Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="text-2xl">🔍</div>
            <h3 className="font-semibold text-black dark:text-white">Advanced Format Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detect and analyze 15+ clipboard formats including HTML, RTF, JSON, XML, CSV, Markdown, and more with raw data access.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">🖼️</div>
            <h3 className="font-semibold text-black dark:text-white">Multi-Format Images</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support for RGBA, PNG, JPEG, BMP image formats with thumbnails, drag & drop upload, and format conversion.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">📁</div>
            <h3 className="font-semibold text-black dark:text-white">File & Path Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Handle file paths, file lists, and shell integration with cross-platform path detection and validation.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold text-black dark:text-white">Real-time Monitoring</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Live clipboard monitoring with instant format detection, content analysis, and comprehensive history tracking.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}