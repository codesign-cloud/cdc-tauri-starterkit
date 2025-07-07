import { invoke } from '@tauri-apps/api/core'

// Notification types
export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  sound?: string
}

export interface NotificationResult {
  success: boolean
  message: string
  permission_granted: boolean
}

// Tauri command types
export interface TauriCommands {
  greet: (name: string) => Promise<string>
  show_window: () => Promise<void>
  hide_window: () => Promise<void>
  check_notification_permission: () => Promise<boolean>
  request_notification_permission: () => Promise<boolean>
  send_notification: (title: string, body?: string) => Promise<NotificationResult>
  send_custom_notification: (options: NotificationOptions) => Promise<NotificationResult>
  send_demo_notification: () => Promise<NotificationResult>
  send_success_notification: (message?: string) => Promise<NotificationResult>
  send_error_notification: (message?: string) => Promise<NotificationResult>
  send_info_notification: (message?: string) => Promise<NotificationResult>
}

// Wrapper functions for Tauri commands with error handling
export const tauriCommands = {
  async greet(name: string): Promise<string> {
    try {
      return await invoke('greet', { name })
    } catch (error) {
      console.error('Error calling greet command:', error)
      throw error
    }
  },

  async showWindow(): Promise<void> {
    try {
      await invoke('show_window')
    } catch (error) {
      console.error('Error showing window:', error)
      throw error
    }
  },

  async hideWindow(): Promise<void> {
    try {
      await invoke('hide_window')
    } catch (error) {
      console.error('Error hiding window:', error)
      throw error
    }
  },

  async checkNotificationPermission(): Promise<boolean> {
    try {
      return await invoke('check_notification_permission')
    } catch (error) {
      console.error('Error checking notification permission:', error)
      throw error
    }
  },

  async requestNotificationPermission(): Promise<boolean> {
    try {
      return await invoke('request_notification_permission')
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  },

  async sendNotification(title: string, body?: string): Promise<NotificationResult> {
    try {
      return await invoke('send_notification', { title, body })
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  },

  async sendCustomNotification(options: NotificationOptions): Promise<NotificationResult> {
    try {
      return await invoke('send_custom_notification', { options })
    } catch (error) {
      console.error('Error sending custom notification:', error)
      throw error
    }
  },

  async sendDemoNotification(): Promise<NotificationResult> {
    try {
      return await invoke('send_demo_notification')
    } catch (error) {
      console.error('Error sending demo notification:', error)
      throw error
    }
  },

  async sendSuccessNotification(message?: string): Promise<NotificationResult> {
    try {
      return await invoke('send_success_notification', { message })
    } catch (error) {
      console.error('Error sending success notification:', error)
      throw error
    }
  },

  async sendErrorNotification(message?: string): Promise<NotificationResult> {
    try {
      return await invoke('send_error_notification', { message })
    } catch (error) {
      console.error('Error sending error notification:', error)
      throw error
    }
  },

  async sendInfoNotification(message?: string): Promise<NotificationResult> {
    try {
      return await invoke('send_info_notification', { message })
    } catch (error) {
      console.error('Error sending info notification:', error)
      throw error
    }
  },
}

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for Tauri-specific globals
  return '__TAURI__' in window ||
         '__TAURI_INTERNALS__' in window ||
         (window as any).__TAURI_INTERNALS__ !== undefined ||
         (window as any).__TAURI__ !== undefined ||
         // Additional check for Tauri v2
         typeof (window as any).__TAURI_INVOKE__ === 'function'
}

// Safe invoke that works both in Tauri and browser
export const safeInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> => {
  if (!isTauri()) {
    console.warn(`Tauri command '${command}' called outside of Tauri context`)
    return null
  }

  try {
    return await invoke<T>(command, args)
  } catch (error) {
    console.error(`Error invoking Tauri command '${command}':`, error)
    throw error
  }
}

// Fetch enabled features from Tauri backend
export async function fetchFeatures(): Promise<Set<string>> {
  return new Set(await invoke<string[]>("get_enabled_features"));
}