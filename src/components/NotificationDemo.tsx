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
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
        🔔 OS Notification Demo
      </h3>
      
      {/* Status */}
      <div className="mb-6 text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isTauri() 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {isTauri() ? '✅ Running in Tauri' : '⚠️ Running in Browser (Notifications disabled)'}
        </span>
      </div>

      {/* Permission Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="text-lg font-semibold mb-3 text-black dark:text-white">
          Permission Management
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={checkPermission}
            disabled={!isTauri()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 text-sm font-medium"
          >
            Check Permission
          </button>
          <button
            onClick={requestPermission}
            disabled={isLoading || !isTauri()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 text-sm font-medium"
          >
            {isLoading ? 'Requesting...' : 'Request Permission'}
          </button>
        </div>
        {permissionGranted !== null && (
          <p className={`text-sm font-medium ${
            permissionGranted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            Permission Status: {permissionGranted ? '✅ Granted' : '❌ Not Granted'}
          </p>
        )}
      </div>

      {/* Notification Buttons */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-black dark:text-white">
          Try Different Notifications
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={sendDemoNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-400 text-white rounded-md transition-all duration-200 font-medium text-sm"
          >
            🚀 Demo Notification
          </button>
          
          <button
            onClick={sendSuccessNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 font-medium text-sm"
          >
            ✅ Success Notification
          </button>
          
          <button
            onClick={sendErrorNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 font-medium text-sm"
          >
            ❌ Error Notification
          </button>
          
          <button
            onClick={sendInfoNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 font-medium text-sm"
          >
            ℹ️ Info Notification
          </button>
          
          <button
            onClick={sendCustomNotification}
            disabled={isLoading || !isTauri()}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:bg-gray-400 text-white rounded-md transition-all duration-200 font-medium text-sm sm:col-span-2"
          >
            🌟 Custom Notification
          </button>
        </div>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className="mt-6 p-4 rounded-lg border">
          <h5 className="font-semibold mb-2 text-black dark:text-white">Last Result:</h5>
          <div className={`p-3 rounded-md ${
            lastResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm font-medium ${
              lastResult.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {lastResult.success ? '✅' : '❌'} {lastResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
          💡 How to use:
        </h5>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>1. First, check if notification permission is granted</li>
          <li>2. If not granted, click "Request Permission"</li>
          <li>3. Try different notification types to see them in action</li>
          <li>4. Notifications will appear in your system's notification area</li>
        </ul>
      </div>
    </div>
  )
}