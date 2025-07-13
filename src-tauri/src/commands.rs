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
        // In development mode, reload all windows instead of restarting the entire process
        // This preserves the CLI dev server
        println!("Reloading application (dev mode)...");
        for (_label, window) in app.webview_windows() {
            let _ = window.eval("window.location.reload()");
        }
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        // In production mode, actually restart the application
        println!("Restarting application (production mode)...");
        app.restart();
        // This line is unreachable but needed for type checking
        #[allow(unreachable_code)]
        Ok(())
    }
}