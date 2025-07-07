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
        let scheme = parsed_url.scheme();
        let host = parsed_url.host_str().unwrap_or("");
        let path = parsed_url.path();
        let query = parsed_url.query().unwrap_or("");
        
        // Emit an event to the frontend with the deep link data
        app.emit("deep-link-received", serde_json::json!({
            "url": url,
            "scheme": scheme,
            "host": host,
            "path": path,
            "query": query
        })).map_err(|e| format!("Failed to emit deep link event: {}", e))?;

        // Focus the main window when a deep link is received
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }

        Ok(format!("Deep link handled: {}", url))
    } else {
        Err("Invalid URL format".to_string())
    }
}