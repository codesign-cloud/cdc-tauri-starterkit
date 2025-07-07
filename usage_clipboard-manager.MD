# Clipboard Manager Plugin Usage

The clipboard-manager plugin provides comprehensive clipboard operations for your Tauri application, allowing you to read from and write to the system clipboard with enhanced functionality.

## Configuration

### Tauri Configuration (tauri.conf.json)

```json
{
  "plugins": {
    "clipboard-manager": {
      "all": true
    }
  }
}
```

- **all**: Grants all clipboard permissions (read and write)
- Alternatively, you can specify individual permissions:
  ```json
  {
    "clipboard-manager": {
      "read": true,
      "write": true
    }
  }
  ```

### Rust Dependencies (Cargo.toml)

```toml
[dependencies]
tauri-plugin-clipboard-manager = "2.0"
```

## Implementation

### Backend (Rust)

```rust
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn copy_to_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))
}

#[tauri::command]
pub async fn paste_from_clipboard(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read from clipboard: {}", e))
        .and_then(|opt| opt.ok_or_else(|| "Clipboard is empty".to_string()))
}

#[tauri::command]
pub async fn get_clipboard_history(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    // Note: Basic clipboard plugin doesn't provide history by default
    // This example shows current clipboard content
    match app.clipboard().read_text() {
        Ok(Some(content)) => Ok(vec![content]),
        Ok(None) => Ok(vec![]),
        Err(e) => Err(format!("Failed to get clipboard history: {}", e)),
    }
}

#[tauri::command]
pub async fn clear_clipboard(app: tauri::AppHandle) -> Result<(), String> {
    app.clipboard()
        .write_text("")
        .map_err(|e| format!("Failed to clear clipboard: {}", e))
}
```

### Frontend (JavaScript/TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/core'

// Copy text to clipboard
async function copyToClipboard(text: string): Promise<void> {
  try {
    await invoke('copy_to_clipboard', { text })
    console.log('Text copied to clipboard successfully')
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error)
    throw error
  }
}

// Paste text from clipboard
async function pasteFromClipboard(): Promise<string> {
  try {
    const text = await invoke('paste_from_clipboard')
    console.log('Text pasted from clipboard:', text)
    return text as string
  } catch (error) {
    console.error('Failed to paste from clipboard:', error)
    throw error
  }
}

// Get clipboard content (basic history)
async function getClipboardHistory(): Promise<string[]> {
  try {
    const history = await invoke('get_clipboard_history')
    return history as string[]
  } catch (error) {
    console.error('Failed to get clipboard history:', error)
    throw error
  }
}

// Clear clipboard
async function clearClipboard(): Promise<void> {
  try {
    await invoke('clear_clipboard')
    console.log('Clipboard cleared successfully')
  } catch (error) {
    console.error('Failed to clear clipboard:', error)
    throw error
  }
}
```

## Advanced Usage

### React Hook for Clipboard Operations

```typescript
import { useState, useCallback } from 'react'

interface UseClipboardReturn {
  clipboardText: string
  copyToClipboard: (text: string) => Promise<void>
  pasteFromClipboard: () => Promise<string>
  clearClipboard: () => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useClipboard(): UseClipboardReturn {
  const [clipboardText, setClipboardText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('copy_to_clipboard', { text })
      setClipboardText(text)
    } catch (err) {
      setError(err as string)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const pasteFromClipboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const text = await invoke('paste_from_clipboard') as string
      setClipboardText(text)
      return text
    } catch (err) {
      setError(err as string)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearClipboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await invoke('clear_clipboard')
      setClipboardText('')
    } catch (err) {
      setError(err as string)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    clipboardText,
    copyToClipboard,
    pasteFromClipboard,
    clearClipboard,
    isLoading,
    error
  }
}
```

### Clipboard Monitoring

```typescript
// Monitor clipboard changes (requires periodic polling)
class ClipboardMonitor {
  private lastContent: string = ''
  private intervalId: NodeJS.Timeout | null = null
  private callbacks: Array<(content: string) => void> = []

  start(intervalMs: number = 1000) {
    this.intervalId = setInterval(async () => {
      try {
        const currentContent = await invoke('paste_from_clipboard') as string
        if (currentContent !== this.lastContent) {
          this.lastContent = currentContent
          this.callbacks.forEach(callback => callback(currentContent))
        }
      } catch (error) {
        // Clipboard might be empty or inaccessible
      }
    }, intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  onChange(callback: (content: string) => void) {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }
}

// Usage
const clipboardMonitor = new ClipboardMonitor()
clipboardMonitor.onChange((content) => {
  console.log('Clipboard changed:', content)
})
clipboardMonitor.start(500) // Check every 500ms
```

## Example Use Cases

### Text Editor Integration
```typescript
// Copy selected text
async function copySelection() {
  const selection = window.getSelection()?.toString()
  if (selection) {
    await copyToClipboard(selection)
  }
}

// Paste at cursor position
async function pasteAtCursor(textArea: HTMLTextAreaElement) {
  try {
    const text = await pasteFromClipboard()
    const start = textArea.selectionStart
    const end = textArea.selectionEnd
    const currentValue = textArea.value
    
    textArea.value = currentValue.slice(0, start) + text + currentValue.slice(end)
    textArea.selectionStart = textArea.selectionEnd = start + text.length
  } catch (error) {
    console.error('Failed to paste:', error)
  }
}
```

### Data Transfer Between Components
```typescript
// Copy structured data as JSON
async function copyData(data: any) {
  const jsonString = JSON.stringify(data, null, 2)
  await copyToClipboard(jsonString)
}

// Paste and parse structured data
async function pasteData<T>(): Promise<T> {
  const text = await pasteFromClipboard()
  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new Error('Invalid JSON in clipboard')
  }
}
```

## Security Considerations

- **Sensitive Data**: Be cautious when copying sensitive information like passwords or API keys
- **Data Validation**: Always validate clipboard content before processing
- **User Consent**: Consider asking for user permission before accessing clipboard
- **Rate Limiting**: Implement rate limiting for frequent clipboard operations
- **Privacy**: Avoid logging clipboard content for privacy reasons

## Platform Differences

### Windows
- Supports text, HTML, and image formats
- Rich text formatting is preserved
- Some operations may require elevated permissions

### macOS
- Excellent clipboard integration
- Supports multiple data types simultaneously
- Pasteboard system provides robust functionality

### Linux
- X11 vs Wayland differences
- Multiple clipboard selections (primary, secondary, clipboard)
- May require additional permissions in some distributions

## Troubleshooting

### Permission Denied
- Ensure `clipboard-manager` plugin is properly configured
- Check app permissions on the target platform
- Verify the plugin is included in the build

### Empty Clipboard
- Handle empty clipboard gracefully in your application
- Provide user feedback when clipboard operations fail
- Consider default values for paste operations

### Large Content
- Be aware of clipboard size limitations on different platforms
- Implement chunking for very large content
- Consider alternative data transfer methods for large files

### Cross-Application Issues
- Some applications may not release clipboard properly
- Test clipboard operations with various source applications
- Implement retry logic for failed operations