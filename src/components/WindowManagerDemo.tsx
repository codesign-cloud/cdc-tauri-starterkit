'use client'

import { useState, useEffect } from 'react'
import { 
  WindowManager, 
  WindowInfo, 
  WindowMessage, 
  CreateWindowOptions,
  windowManager,
  createQuickWindow,
  sendQuickMessage,
  broadcastQuickMessage,
  isTauri 
} from '@/lib/window-manager'
import { 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Focus, 
  MessageSquare, 
  Radio,
  RefreshCw,
  Monitor,
  Send
} from 'lucide-react'

export default function WindowManagerDemo() {
  const [windows, setWindows] = useState<WindowInfo[]>([])
  const [messages, setMessages] = useState<WindowMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newWindowLabel, setNewWindowLabel] = useState('')
  const [newWindowTitle, setNewWindowTitle] = useState('')
  const [messageTarget, setMessageTarget] = useState('')
  const [messageType, setMessageType] = useState('chat')
  const [messageContent, setMessageContent] = useState('')

  // Load windows and messages on component mount
  useEffect(() => {
    if (isTauri()) {
      loadWindows()
      loadMessages()
      
      // Listen for window messages
      const listenerId = `demo_${Date.now()}`
      windowManager.addMessageListener(listenerId, (message) => {
        setMessages(prev => [...prev.slice(-19), message]) // Keep last 20 messages
      })

      return () => {
        windowManager.removeMessageListener(listenerId)
      }
    }
  }, [])

  const loadWindows = async () => {
    try {
      const windowList = await windowManager.getAllWindows()
      setWindows(windowList)
    } catch (error) {
      console.error('Failed to load windows:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const messageHistory = await windowManager.getMessageHistory(20)
      setMessages(messageHistory)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleCreateWindow = async () => {
    if (!newWindowLabel.trim() || !newWindowTitle.trim()) return
    if (isLoading) return // Prevent multiple clicks

    setIsLoading(true)
    try {
      const options: CreateWindowOptions = {
        label: newWindowLabel.trim(),
        title: newWindowTitle.trim(),
        url: '/window-demo',
        width: 600,
        height: 400,
        center: true,
      }

      const result = await windowManager.createWindow(options)
      if (result.success) {
        setNewWindowLabel('')
        setNewWindowTitle('')
        await loadWindows()
      } else {
        alert(`Failed to create window: ${result.message}`)
      }
    } catch (error) {
      console.error('Error creating window:', error)
      alert('Failed to create window')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseWindow = async (label: string) => {
    try {
      const result = await windowManager.closeWindow(label)
      if (result.success) {
        await loadWindows()
      } else {
        alert(`Failed to close window: ${result.message}`)
      }
    } catch (error) {
      console.error('Error closing window:', error)
    }
  }

  const handleToggleVisibility = async (label: string) => {
    try {
      const result = await windowManager.toggleWindowVisibility(label)
      if (result.success) {
        await loadWindows()
      }
    } catch (error) {
      console.error('Error toggling window visibility:', error)
    }
  }

  const handleFocusWindow = async (label: string) => {
    try {
      await windowManager.focusWindow(label)
      await loadWindows()
    } catch (error) {
      console.error('Error focusing window:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageTarget.trim() || !messageContent.trim()) return

    try {
      const result = await sendQuickMessage(
        messageTarget,
        messageType,
        { message: messageContent, timestamp: Date.now() }
      )
      
      if (result.success) {
        setMessageContent('')
      } else {
        alert(`Failed to send message: ${result.message}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleBroadcastMessage = async () => {
    if (!messageContent.trim()) return

    try {
      const result = await broadcastQuickMessage(
        messageType,
        { message: messageContent, timestamp: Date.now() }
      )
      
      if (result.success) {
        setMessageContent('')
      } else {
        alert(`Failed to broadcast message: ${result.message}`)
      }
    } catch (error) {
      console.error('Error broadcasting message:', error)
    }
  }

  if (!isTauri()) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="text-center">
          <Monitor className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Window Manager Demo
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            This feature is only available when running in the Tauri desktop application.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
          Inter-Window Communication Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create multiple windows and send messages between them
        </p>
      </div>

      {/* Create New Window */}
      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Create New Window
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Window label (will be formatted as window-cdc-N-label)"
            value={newWindowLabel}
            onChange={(e) => setNewWindowLabel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Window title"
            value={newWindowTitle}
            onChange={(e) => setNewWindowTitle(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          />
          <button
            onClick={handleCreateWindow}
            disabled={isLoading || !newWindowLabel.trim() || !newWindowTitle.trim()}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            Create Window
          </button>
        </div>
      </div>

      {/* Window List */}
      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <Monitor size={20} />
            Active Windows ({windows.length})
          </h3>
          <button
            onClick={loadWindows}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        
        {windows.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No windows found. Create a new window to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {windows.map((window) => (
              <div
                key={window.label}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-black"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-black dark:text-white">{window.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{window.label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${window.is_visible ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={`w-2 h-2 rounded-full ${window.is_focused ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {window.width}×{window.height} at ({window.x}, {window.y})
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleVisibility(window.label)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    {window.is_visible ? <EyeOff size={12} /> : <Eye size={12} />}
                    {window.is_visible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleFocusWindow(window.label)}
                    className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <Focus size={12} />
                    Focus
                  </button>
                  {window.label !== 'main' && (
                    <button
                      onClick={() => handleCloseWindow(window.label)}
                      className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Communication */}
      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Send Messages
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Send to specific window */}
          <div className="space-y-4">
            <h4 className="font-medium text-black dark:text-white">Send to Specific Window</h4>
            <select
              value={messageTarget}
              onChange={(e) => setMessageTarget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            >
              <option value="">Select target window</option>
              {windows.filter(w => w.label !== 'main').map((window) => (
                <option key={window.label} value={window.label}>
                  {window.title} ({window.label})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Message type (e.g., chat, notification)"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            />
            <textarea
              placeholder="Message content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageTarget || !messageContent.trim()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Message
            </button>
          </div>

          {/* Broadcast to all windows */}
          <div className="space-y-4">
            <h4 className="font-medium text-black dark:text-white">Broadcast to All Windows</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              This will send the message to all open windows
            </div>
            <button
              onClick={handleBroadcastMessage}
              disabled={!messageContent.trim()}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Radio size={16} />
              Broadcast Message
            </button>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <MessageSquare size={20} />
            Message History ({messages.length})
          </h3>
          <button
            onClick={loadMessages}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No messages yet. Send a message to see it here.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-black"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {message.from_window}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {message.to_window || 'All Windows'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                  {message.message_type}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {message.payload?.message ||
                   message.payload?.content ||
                   (typeof message.payload === 'object'
                     ? JSON.stringify(message.payload, null, 2)
                     : message.payload)
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}