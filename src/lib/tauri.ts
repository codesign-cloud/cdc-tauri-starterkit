import { invoke } from '@tauri-apps/api/core'

// Tauri command types
export interface TauriCommands {
  greet: (name: string) => Promise<string>
  show_window: () => Promise<void>
  hide_window: () => Promise<void>
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
}

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
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