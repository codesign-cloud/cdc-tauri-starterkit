'use client'

import { useState, useEffect } from 'react'
import { 
  windowManager, 
  WindowMessage, 
  sendQuickMessage, 
  broadcastQuickMessage,
  isTauri 
} from '@/lib/window-manager'
import { 
  MessageSquare, 
  Send, 
  Radio, 
  Monitor, 
  X,
  RefreshCw
} from 'lucide-react'

export default function WindowDemoPage() {
  const [messages, setMessages] = useState<WindowMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [windowLabel, setWindowLabel] = useState('')

  useEffect(() => {
    if (isTauri()) {
      const initializeWindow = async () => {
        let currentLabel = ''
        
        // Get current window label from URL hash or from Tauri
        const hashLabel = window.location.hash.replace('#', '')
        if (hashLabel) {
          currentLabel = hashLabel
        } else {
          // Get the actual window label from Tauri
          const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
          const currentWindow = getCurrentWebviewWindow()
          currentLabel = currentWindow.label
        }
        
        setWindowLabel(currentLabel)

        // Listen for messages
        const listenerId = `window_demo_${currentLabel}`
        windowManager.addMessageListener(listenerId, (message) => {
          setMessages(prev => [...prev, message])
        })

        // Send a welcome message
        setTimeout(() => {
          broadcastQuickMessage(
            'window-joined',
            {
              message: `Window "${currentLabel}" has joined the conversation!`,
              windowLabel: currentLabel
            },
            currentLabel
          )
        }, 1000)

        return () => {
          windowManager.removeMessageListener(listenerId)
        }
      }

      initializeWindow()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await broadcastQuickMessage(
        'chat',
        { 
          message: newMessage,
          windowLabel,
          timestamp: Date.now()
        },
        windowLabel
      )
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleCloseWindow = () => {
    if (windowLabel !== 'main') {
      windowManager.closeWindow(windowLabel)
    }
  }

  if (!isTauri()) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Monitor className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            Window Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page is designed to work within Tauri windows for inter-window communication.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Window Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Window: {windowLabel}
            </p>
          </div>
          {windowLabel !== 'main' && (
            <button
              onClick={handleCloseWindow}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Close Window"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Inter-Window Chat
          </h2>

          {/* Messages */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.id}-${index}`}
                    className={`p-3 rounded-lg ${
                      message.from_window === windowLabel
                        ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                        : 'bg-gray-100 dark:bg-gray-800 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {message.from_window}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(message.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-black dark:text-white">
                      {message.message_type === 'chat' && message.payload?.message}
                      {message.message_type === 'window-joined' && (
                        <span className="italic text-green-600 dark:text-green-400">
                          {message.payload?.message}
                        </span>
                      )}
                      {message.message_type !== 'chat' && message.message_type !== 'window-joined' && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {message.message_type}: {JSON.stringify(message.payload)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>

        {/* Window Info */}
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <Monitor size={20} />
            Window Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Label:</span>
              <span className="ml-2 text-black dark:text-white font-mono">{windowLabel}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Messages:</span>
              <span className="ml-2 text-black dark:text-white">{messages.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">URL:</span>
              <span className="ml-2 text-black dark:text-white font-mono">{window.location.pathname}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
              <span className="ml-2 text-black dark:text-white">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            This window can communicate with other windows. Create more windows from the main window 
            to see inter-window communication in action!
          </p>
        </div>
      </div>
    </div>
  )
}