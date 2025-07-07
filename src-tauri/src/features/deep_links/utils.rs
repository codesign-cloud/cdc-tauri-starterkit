use tauri::{Manager, Emitter};
use super::types::{DeepLinkData, DeepLinkResult};

/// Parse a URL and extract deep link data
pub fn parse_deep_link_url(url: &str) -> Result<DeepLinkData, String> {
    if let Ok(parsed_url) = url::Url::parse(url) {
        Ok(DeepLinkData {
            url: url.to_string(),
            scheme: parsed_url.scheme().to_string(),
            host: parsed_url.host_str().unwrap_or("").to_string(),
            path: parsed_url.path().to_string(),
            query: parsed_url.query().unwrap_or("").to_string(),
        })
    } else {
        Err("Invalid URL format".to_string())
    }
}

/// Emit deep link event to frontend
pub fn emit_deep_link_event(app: &tauri::AppHandle, data: &DeepLinkData) -> Result<(), String> {
    app.emit("deep-link-received", serde_json::json!({
        "url": data.url,
        "scheme": data.scheme,
        "host": data.host,
        "path": data.path,
        "query": data.query
    })).map_err(|e| format!("Failed to emit deep link event: {}", e))
}

/// Focus the main window when a deep link is received
pub fn focus_main_window(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| format!("Failed to show window: {}", e))?;
        window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
    }
    Ok(())
}

/// Handle a deep link URL with full processing
pub fn handle_deep_link_url(app: &tauri::AppHandle, url: &str) -> Result<DeepLinkResult, String> {
    match parse_deep_link_url(url) {
        Ok(data) => {
            // Emit event to frontend
            if let Err(e) = emit_deep_link_event(app, &data) {
                return Ok(DeepLinkResult {
                    success: false,
                    message: e,
                    data: Some(data),
                });
            }

            // Focus main window
            if let Err(e) = focus_main_window(app) {
                return Ok(DeepLinkResult {
                    success: false,
                    message: format!("Deep link processed but failed to focus window: {}", e),
                    data: Some(data),
                });
            }

            Ok(DeepLinkResult {
                success: true,
                message: format!("Deep link handled: {}", url),
                data: Some(data),
            })
        }
        Err(e) => Ok(DeepLinkResult {
            success: false,
            message: e,
            data: None,
        }),
    }
}