//! Utility functions for window manager feature

use crate::features::window_manager::types::*;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, WebviewWindow};

/// Global window state manager
pub type WindowStateManager = Arc<Mutex<WindowState>>;

/// Initialize window state manager
pub fn init_window_state() -> WindowStateManager {
    Arc::new(Mutex::new(WindowState {
        windows: HashMap::new(),
        message_history: Vec::new(),
        window_counter: 0,
    }))
}

/// Get window information from a Tauri window
pub fn get_window_info(window: &WebviewWindow) -> Result<WindowInfo, String> {
    let label = window.label().to_string();
    let title = match window.title() {
        Ok(t) => t,
        Err(_) => "Untitled".to_string(),
    };
    let is_visible = window.is_visible().map_err(|e| e.to_string())?;
    let is_focused = window.is_focused().map_err(|e| e.to_string())?;
    
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let position = window.outer_position().map_err(|e| e.to_string())?;
    
    Ok(WindowInfo {
        label: label.clone(),
        title,
        url: format!("/{}", label), // Simplified URL based on label
        is_visible,
        is_focused,
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
    })
}

/// Update window information in state
pub fn update_window_info(
    state: &WindowStateManager,
    window: &WebviewWindow,
) -> Result<(), String> {
    let window_info = get_window_info(window)?;
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.windows.insert(window_info.label.clone(), window_info);
    Ok(())
}

/// Remove window from state
pub fn remove_window_from_state(
    state: &WindowStateManager,
    label: &str,
) -> Result<(), String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.windows.remove(label);
    Ok(())
}

/// Add message to history
pub fn add_message_to_history(
    state: &WindowStateManager,
    message: WindowMessage,
) -> Result<(), String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.message_history.push(message);
    
    // Keep only last 100 messages to prevent memory bloat
    if state_guard.message_history.len() > 100 {
        state_guard.message_history.remove(0);
    }
    
    Ok(())
}

/// Get all window labels
#[allow(dead_code)]
pub fn get_all_window_labels(app: &AppHandle) -> Vec<String> {
    app.webview_windows()
        .keys()
        .map(|k| k.to_string())
        .collect()
}

/// Check if window exists
pub fn window_exists(app: &AppHandle, label: &str) -> bool {
    app.get_webview_window(label).is_some()
}

/// Generate unique message ID
pub fn generate_message_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    use std::sync::atomic::{AtomicU64, Ordering};
    
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let counter = COUNTER.fetch_add(1, Ordering::SeqCst);
    format!("msg_{}_{}", timestamp, counter)
}

/// Get current timestamp
pub fn get_current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// Validate and sanitize window label
pub fn validate_window_label(label: &str) -> Result<(), String> {
    if label.is_empty() {
        return Err("Window label cannot be empty".to_string());
    }
    
    if label.len() > 50 {
        return Err("Window label too long (max 50 characters)".to_string());
    }
    
    // Check for valid characters (alphanumeric, dash, underscore, space)
    // Spaces will be converted to dashes in sanitize_window_label
    if !label.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == ' ') {
        return Err("Window label can only contain alphanumeric characters, dashes, underscores, and spaces".to_string());
    }
    
    Ok(())
}

/// Sanitize window label by converting spaces to dashes and removing invalid characters
pub fn sanitize_window_label(label: &str) -> String {
    label
        .chars()
        .map(|c| {
            if c == ' ' {
                '-'
            } else if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .to_string()
}

/// Generate a unique window label with the format: window-cdc-{counter}-{user-label}
pub fn generate_window_label(
    state: &WindowStateManager,
    user_label: &str,
) -> Result<String, String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    
    // Increment the counter
    state_guard.window_counter += 1;
    let counter = state_guard.window_counter;
    
    // Sanitize the user label
    let sanitized_user_label = sanitize_window_label(user_label);
    
    // Generate the final label
    let final_label = if sanitized_user_label.is_empty() {
        format!("window-cdc-{}", counter)
    } else {
        format!("window-cdc-{}-{}", counter, sanitized_user_label)
    };
    
    Ok(final_label)
}