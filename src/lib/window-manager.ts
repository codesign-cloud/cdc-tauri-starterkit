import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useEffect } from 'react'

// Types matching the Rust backend
export interface WindowInfo {
  label: string
  title: string
  url: string
  is_visible: boolean
  is_focused: boolean
  width: number
  height: number
  x: number
  y: number
}

export interface WindowMessage {
  id: string
  from_window: string
  to_window?: string
  message_type: string
  payload: any
  timestamp: number
}

export interface CreateWindowOptions {
  label: string
  title: string
  url: string
  width?: number
  height?: number
  x?: number
  y?: number
  resizable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  closable?: boolean
  always_on_top?: boolean
  decorations?: boolean
  transparent?: boolean
  visible?: boolean
  center?: boolean
}

export interface WindowResult {
  success: boolean
  message: string
  data?: any
}

// Window Manager Class
export class WindowManager {
  private messageListeners: Map<string, (message: WindowMessage) => void> = new Map()
  private eventListeners: UnlistenFn[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private async setupEventListeners() {
    if (!isTauri()) return
    
    // Get current window label for filtering
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const currentWindow = getCurrentWebviewWindow()
    const currentWindowLabel = currentWindow.label
    
    // Listen for window messages (targeted messages)
    const messageUnlisten = await listen<WindowMessage>('window-message', (event) => {
      const message = event.payload
      // Only process messages intended for this window
      if (message.to_window === currentWindowLabel) {
        this.messageListeners.forEach((listener) => {
          listener(message)
        })
      }
    })

    // Listen for broadcast messages (messages for all windows)
    const broadcastUnlisten = await listen<WindowMessage>('window-broadcast', (event) => {
      const message = event.payload
      // Broadcast messages are for all windows, so always process them
      this.messageListeners.forEach((listener) => {
        listener(message)
      })
    })

    this.eventListeners.push(messageUnlisten, broadcastUnlisten)
  }

  // Create a new window
  async createWindow(options: CreateWindowOptions): Promise<WindowResult> {
    try {
      return await invoke('create_window', { options })
    } catch (error) {
      console.error('Error creating window:', error)
      throw error
    }
  }

  // Close a window
  async closeWindow(label: string): Promise<WindowResult> {
    try {
      return await invoke('close_window', { label })
    } catch (error) {
      console.error('Error closing window:', error)
      throw error
    }
  }

  // Get all windows
  async getAllWindows(): Promise<WindowInfo[]> {
    try {
      return await invoke('get_all_windows')
    } catch (error) {
      console.error('Error getting windows:', error)
      throw error
    }
  }

  // Send message to specific window
  async sendMessage(
    fromWindow: string,
    toWindow: string,
    messageType: string,
    payload: any
  ): Promise<WindowResult> {
    try {
      return await invoke('send_message_to_window', {
        fromWindow,
        toWindow,
        messageType,
        payload,
      })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Broadcast message to all windows
  async broadcastMessage(
    fromWindow: string,
    messageType: string,
    payload: any
  ): Promise<WindowResult> {
    try {
      return await invoke('broadcast_message', {
        fromWindow,
        messageType,
        payload,
      })
    } catch (error) {
      console.error('Error broadcasting message:', error)
      throw error
    }
  }

  // Get message history
  async getMessageHistory(limit?: number): Promise<WindowMessage[]> {
    try {
      return await invoke('get_message_history', { limit })
    } catch (error) {
      console.error('Error getting message history:', error)
      throw error
    }
  }

  // Focus a window
  async focusWindow(label: string): Promise<WindowResult> {
    try {
      return await invoke('focus_window', { label })
    } catch (error) {
      console.error('Error focusing window:', error)
      throw error
    }
  }

  // Toggle window visibility
  async toggleWindowVisibility(label: string): Promise<WindowResult> {
    try {
      return await invoke('toggle_window_visibility', { label })
    } catch (error) {
      console.error('Error toggling window visibility:', error)
      throw error
    }
  }

  // Add message listener
  addMessageListener(id: string, listener: (message: WindowMessage) => void) {
    this.messageListeners.set(id, listener)
  }

  // Remove message listener
  removeMessageListener(id: string) {
    this.messageListeners.delete(id)
  }

  // Clean up listeners
  cleanup() {
    this.eventListeners.forEach((unlisten) => unlisten())
    this.eventListeners = []
    this.messageListeners.clear()
  }
}

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return '__TAURI__' in window ||
         '__TAURI_INTERNALS__' in window ||
         (window as any).__TAURI_INTERNALS__ !== undefined ||
         (window as any).__TAURI__ !== undefined ||
         typeof (window as any).__TAURI_INVOKE__ === 'function'
}

// Global window manager instance
export const windowManager = new WindowManager()

// Utility functions
export const createQuickWindow = async (
  label: string,
  title: string,
  url: string = '/',
  options: Partial<CreateWindowOptions> = {}
): Promise<WindowResult> => {
  return windowManager.createWindow({
    label,
    title,
    url,
    width: 800,
    height: 600,
    center: true,
    ...options,
  })
}

export const sendQuickMessage = async (
  toWindow: string,
  messageType: string,
  payload: any,
  fromWindow: string = 'main'
): Promise<WindowResult> => {
  return windowManager.sendMessage(fromWindow, toWindow, messageType, payload)
}

export const broadcastQuickMessage = async (
  messageType: string,
  payload: any,
  fromWindow: string = 'main'
): Promise<WindowResult> => {
  return windowManager.broadcastMessage(fromWindow, messageType, payload)
}

// React hook for window messages
export const useWindowMessages = (
  onMessage: (message: WindowMessage) => void,
  messageTypes?: string[]
) => {
  useEffect(() => {
    const listenerId = `listener_${Date.now()}_${Math.random()}`
    
    const filteredListener = (message: WindowMessage) => {
      if (!messageTypes || messageTypes.includes(message.message_type)) {
        onMessage(message)
      }
    }

    windowManager.addMessageListener(listenerId, filteredListener)

    return () => {
      windowManager.removeMessageListener(listenerId)
    }
  }, [onMessage, messageTypes])
}
