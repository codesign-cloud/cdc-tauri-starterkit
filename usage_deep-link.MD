# Deep Link Plugin Usage

The deep-link plugin enables your Tauri application to handle custom URL schemes and deep links, allowing external applications or web browsers to open your app with specific parameters.

## Configuration

### Tauri Configuration (tauri.conf.json)

```json
{
  "plugins": {
    "deep-link": {
      "domains": ["tauri-app.com"],
      "schemes": ["tauri-starterkit"]
    }
  }
}
```

- **domains**: Array of domains that can trigger your app
- **schemes**: Array of custom URL schemes your app will handle

### Rust Dependencies (Cargo.toml)

```toml
[dependencies]
tauri-plugin-deep-link = "2.0"
url = "2.4"
```

## Implementation

### Backend (Rust)

```rust
use tauri_plugin_deep_link::DeepLinkExt;
use tauri::Manager;

#[tauri::command]
pub async fn register_protocol(app: tauri::AppHandle, protocol: String) -> Result<(), String> {
    app.deep_link()
        .register(&protocol)
        .map_err(|e| format!("Failed to register protocol '{}': {}", protocol, e))
}

#[tauri::command]
pub async fn handle_deep_link_event(app: tauri::AppHandle, url: String) -> Result<String, String> {
    // Parse and handle the deep link URL
    if let Ok(parsed_url) = url::Url::parse(&url) {
        // Extract URL components
        let scheme = parsed_url.scheme();
        let host = parsed_url.host_str().unwrap_or("");
        let path = parsed_url.path();
        let query = parsed_url.query().unwrap_or("");
        
        // Emit event to frontend
        app.emit("deep-link-received", serde_json::json!({
            "url": url,
            "scheme": scheme,
            "host": host,
            "path": path,
            "query": query
        })).map_err(|e| format!("Failed to emit deep link event: {}", e))?;

        // Focus window
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }

        Ok(format!("Deep link handled: {}", url))
    } else {
        Err("Invalid URL format".to_string())
    }
}
```

### Frontend (JavaScript/TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// Register a custom protocol
async function registerProtocol(protocol: string) {
  try {
    await invoke('register_protocol', { protocol })
    console.log(`Protocol ${protocol} registered successfully`)
  } catch (error) {
    console.error('Failed to register protocol:', error)
  }
}

// Handle deep link events
async function setupDeepLinkListener() {
  const unlisten = await listen('deep-link-received', (event) => {
    const { url, scheme, host, path, query } = event.payload
    console.log('Deep link received:', { url, scheme, host, path, query })
    
    // Handle the deep link based on your app's needs
    // e.g., navigate to a specific page, open a dialog, etc.
  })
  
  return unlisten
}

// Simulate handling a deep link
async function handleDeepLink(url: string) {
  try {
    const result = await invoke('handle_deep_link_event', { url })
    console.log(result)
  } catch (error) {
    console.error('Failed to handle deep link:', error)
  }
}
```

## Example Usage

### URL Schemes

Once configured, your app can handle URLs like:

- `tauri-starterkit://action/open?file=document.txt`
- `tauri-starterkit://user/profile?id=123`
- `tauri-starterkit://settings/theme?mode=dark`

### Testing Deep Links

1. **Register the protocol in your app**:
   ```typescript
   await registerProtocol('tauri-starterkit')
   ```

2. **Test from command line** (macOS/Linux):
   ```bash
   open "tauri-starterkit://test/action?param=value"
   ```

3. **Test from HTML**:
   ```html
   <a href="tauri-starterkit://demo/page?data=hello">Open in Tauri App</a>
   ```

## Common Use Cases

- **File association**: Open specific files in your app
- **Authentication flows**: Handle OAuth redirects
- **Inter-app communication**: Allow other apps to trigger actions
- **Marketing campaigns**: Direct users from web to app with context
- **Share actions**: Receive shared content from other applications

## Security Considerations

- Validate all incoming URL parameters
- Sanitize data before processing
- Implement proper authentication for sensitive actions
- Consider rate limiting for deep link handling
- Log deep link usage for monitoring

## Troubleshooting

### Protocol Not Registered
- Ensure the protocol is properly configured in `tauri.conf.json`
- Check that the app has necessary permissions on the system
- Verify the protocol name doesn't conflict with existing schemes

### Deep Links Not Working
- Check if the app is properly installed and associated with the protocol
- Verify the URL format matches your configuration
- Test with different URL schemes and parameters
- Check console logs for error messages

### Platform-Specific Issues
- **Windows**: May require administrator privileges for protocol registration
- **macOS**: Protocol association happens during app installation
- **Linux**: Desktop integration may vary by distribution