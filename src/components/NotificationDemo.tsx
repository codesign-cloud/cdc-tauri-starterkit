'use client'

import { useState } from 'react'
import { tauriCommands, isTauri, NotificationResult } from '@/lib/tauri'

export default function NotificationDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<NotificationResult | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)

  const checkPermission = async () => {
    if (!isTauri()) {
      setLastResult({
        success: false,
        message: 'Notifications only work in Tauri app',
        permission_granted: false
      })
      return
    }

    try {
      const granted = await tauriCommands.checkNotificationPermission()
      setPermissionGranted(granted)
      setLastResult({
        success: true,
        message: granted ? 'Permission already granted' : 'Permission not granted',
        permission_granted: granted
      })
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error checking permission: ${error}`,
        permission_granted: false
      })
    }
  }

  const requestPermission = async () => {
    if (!isTauri()) {
      setLastResult({
        success: false,
        message: 'Notifications only work in Tauri app',
        permission_granted: false
      })
      return
    }

    setIsLoading(true)
    try {
      const granted = await tauriCommands.requestNotificationPermission()
      setPermissionGranted(granted)
      setLastResult({
        success: granted,
        message: granted ? 'Permission granted!' : 'Permission denied',
        permission_granted: granted
      })
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error requesting permission: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendDemoNotification = async () => {
    if (!isTauri()) {
      setLastResult({
        success: false,
        message: 'Notifications only work in Tauri app',
        permission_granted: false
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await tauriCommands.sendDemoNotification()
      setLastResult(result)
      setPermissionGranted(result.permission_granted)
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error sending demo notification: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendSuccessNotification = async () => {
    if (!isTauri()) return

    setIsLoading(true)
    try {
      const result = await tauriCommands.sendSuccessNotification(
        'Your task has been completed successfully! 🎉'
      )
      setLastResult(result)
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendErrorNotification = async () => {
    if (!isTauri()) return

    setIsLoading(true)
    try {
      const result = await tauriCommands.sendErrorNotification(
        'Something went wrong! Please try again.'
      )
      setLastResult(result)
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendInfoNotification = async () => {
    if (!isTauri()) return

    setIsLoading(true)
    try {
      const result = await tauriCommands.sendInfoNotification(
        'Here\'s some useful information for you! 💡'
      )
      setLastResult(result)
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendCustomNotification = async () => {
    if (!isTauri()) return

    setIsLoading(true)
    try {
      const result = await tauriCommands.sendCustomNotification({
        title: '🌟 Custom Notification',
        body: 'This is a custom notification with your own title and message. You can customize everything!',
      })
      setLastResult(result)
    } catch (error) {
      setLastResult({
        success: false,
        message: `Error: ${error}`,
        permission_granted: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
      <h2 className="text-lg font-semibold text-black dark:text-white mb-6 text-center">
        🔔 OS Notification Demo
      </h2>
      
      {/* Status */}
      <div className="mb-6 text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isTauri()
            ? 'bg-black dark:bg-white text-white dark:text-black'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {isTauri() ? '✅ Running in Tauri' : '⚠️ Running in Browser (Notifications disabled)'}
        </span>
      </div>

      {/* Permission Section */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black">
        <h3 className="text-md font-semibold mb-3 text-black dark:text-white">
          Permission Management
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={checkPermission}
            disabled={!isTauri()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors font-medium text-sm"
          >
            Check Permission
          </button>
          <button
            onClick={requestPermission}
            disabled={isLoading || !isTauri()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-colors font-medium text-sm"
          >
            {isLoading ? 'Requesting...' : 'Request Permission'}
          </button>
        </div>
        {permissionGranted !== null && (
          <p className={`text-sm font-medium ${
            permissionGranted
              ? 'text-black dark:text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            Permission Status: {permissionGranted ? '✅ Granted' : '❌ Not Granted'}
          </p>
        )}
      </div>

      {/* Notification Buttons */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-black dark:text-white">
          Try Different Notifications
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={sendDemoNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors font-medium text-sm"
          >
            🚀 Demo Notification
          </button>
          
          <button
            onClick={sendSuccessNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-colors font-medium text-sm"
          >
            ✅ Success Notification
          </button>
          
          <button
            onClick={sendErrorNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-colors font-medium text-sm"
          >
            ❌ Error Notification
          </button>
          
          <button
            onClick={sendInfoNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-colors font-medium text-sm"
          >
            ℹ️ Info Notification
          </button>
          
          <button
            onClick={sendCustomNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors font-medium text-sm sm:col-span-2"
          >
            🌟 Custom Notification
          </button>
        </div>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black">
          <h4 className="font-semibold mb-2 text-black dark:text-white">Last Result:</h4>
          <div className={`p-3 rounded-md border ${
            lastResult.success
              ? 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
              : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
          }`}>
            <p className={`text-sm font-medium ${
              lastResult.success
                ? 'text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {lastResult.success ? '✅' : '❌'} {lastResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black">
        <h4 className="font-semibold mb-2 text-black dark:text-white">
          💡 How to use:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>1. First, check if notification permission is granted</li>
          <li>2. If not granted, click "Request Permission"</li>
          <li>3. Try different notification types to see them in action</li>
          <li>4. Notifications will appear in your system's notification area</li>
        </ul>
      </div>
    </div>
  )
}