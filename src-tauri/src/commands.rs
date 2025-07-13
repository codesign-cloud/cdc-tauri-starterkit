use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello {}, you've been greeted from Rust!", name)
}

#[tauri::command]
pub fn show_window(app: AppHandle) -> Result<(), String> {
    match app.get_webview_window("main") {
        Some(window) => {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            Ok(())
        }
        None => Err("Window not found".to_string()),
    }
}

#[tauri::command]
pub fn hide_window(app: AppHandle) -> Result<(), String> {
    match app.get_webview_window("main") {
        Some(window) => {
            window.hide().map_err(|e| e.to_string())?;
            Ok(())
        }
        None => Err("Window not found".to_string()),
    }
}

#[tauri::command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        // Only allow restart in debug mode
        app.restart();
        // This line is unreachable but needed for type checking
        #[allow(unreachable_code)]
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        Err("Restart is only available in development mode".to_string())
    }
}