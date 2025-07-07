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
    // Note: clipboard-manager plugin doesn't provide history by default
    // This is a placeholder that could be extended with custom implementation
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