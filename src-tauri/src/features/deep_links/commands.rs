use tauri_plugin_deep_link::DeepLinkExt;
use super::types::DeepLinkResult;
use super::utils::handle_deep_link_url;

/// Register a protocol for deep linking
#[tauri::command]
pub async fn register_protocol(app: tauri::AppHandle, protocol: String) -> Result<(), String> {
    app.deep_link()
        .register(&protocol)
        .map_err(|e| format!("Failed to register protocol '{}': {}", protocol, e))
}

/// Handle a deep link event with comprehensive processing
#[tauri::command]
pub async fn handle_deep_link_event(app: tauri::AppHandle, url: String) -> Result<String, String> {
    match handle_deep_link_url(&app, &url) {
        Ok(result) => {
            if result.success {
                Ok(result.message)
            } else {
                Err(result.message)
            }
        }
        Err(e) => Err(e),
    }
}

/// Handle a deep link event and return detailed result
#[tauri::command]
pub async fn handle_deep_link_detailed(app: tauri::AppHandle, url: String) -> Result<DeepLinkResult, String> {
    handle_deep_link_url(&app, &url)
}