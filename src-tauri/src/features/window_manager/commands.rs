//! Tauri commands for window manager feature

use crate::features::window_manager::types::*;
use crate::features::window_manager::utils::*;
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

/// Create a new window
#[tauri::command]
pub async fn create_window(
    app: AppHandle,
    state: State<'_, WindowStateManager>,
    options: CreateWindowOptions,
) -> Result<WindowResult, String> {
    // Validate user input
    validate_window_label(&options.label)?;
    
    // Generate unique window label with counter
    let final_label = generate_window_label(&state, &options.label)?;
    
    // Check if window already exists (should be rare with counter, but safety check)
    if window_exists(&app, &final_label) {
        return Ok(WindowResult {
            success: false,
            message: format!("Window with label '{}' already exists", final_label),
            data: None,
        });
    }

    // Build the window URL
    let url = if options.url.starts_with("http") {
        WebviewUrl::External(options.url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    } else {
        WebviewUrl::App(options.url.into())
    };

    // Create window builder
    let mut builder = WebviewWindowBuilder::new(&app, &final_label, url)
        .title(&options.title);

    // Apply optional settings
    if let Some(width) = options.width {
        if let Some(height) = options.height {
            builder = builder.inner_size(width as f64, height as f64);
        }
    }

    if let Some(x) = options.x {
        if let Some(y) = options.y {
            builder = builder.position(x as f64, y as f64);
        }
    }

    if let Some(resizable) = options.resizable {
        builder = builder.resizable(resizable);
    }

    if let Some(minimizable) = options.minimizable {
        builder = builder.minimizable(minimizable);
    }

    if let Some(maximizable) = options.maximizable {
        builder = builder.maximizable(maximizable);
    }

    if let Some(closable) = options.closable {
        builder = builder.closable(closable);
    }

    if let Some(always_on_top) = options.always_on_top {
        builder = builder.always_on_top(always_on_top);
    }

    if let Some(decorations) = options.decorations {
        builder = builder.decorations(decorations);
    }

    if let Some(transparent) = options.transparent {
        builder = builder.transparent(transparent);
    }

    if let Some(visible) = options.visible {
        builder = builder.visible(visible);
    }

    if let Some(_center) = options.center {
        builder = builder.center();
    }

    // Build the window
    let window = builder.build().map_err(|e| format!("Failed to create window: {}", e))?;

    // Update window state
    update_window_info(&state, &window)?;

    // Emit window created event
    let window_info = get_window_info(&window)?;
    app.emit("window-created", &window_info)
        .map_err(|e| format!("Failed to emit window-created event: {}", e))?;

    Ok(WindowResult {
        success: true,
        message: format!("Window '{}' created successfully", final_label),
        data: Some(json!(window_info)),
    })
}

/// Close a window
#[tauri::command]
pub async fn close_window(
    app: AppHandle,
    state: State<'_, WindowStateManager>,
    label: String,
) -> Result<WindowResult, String> {
    if let Some(window) = app.get_webview_window(&label) {
        // Remove from state before closing
        remove_window_from_state(&state, &label)?;
        
        // Close the window
        window.close().map_err(|e| format!("Failed to close window: {}", e))?;
        
        // Emit window closed event
        app.emit("window-closed", &label)
            .map_err(|e| format!("Failed to emit window-closed event: {}", e))?;

        Ok(WindowResult {
            success: true,
            message: format!("Window '{}' closed successfully", label),
            data: None,
        })
    } else {
        Ok(WindowResult {
            success: false,
            message: format!("Window '{}' not found", label),
            data: None,
        })
    }
}

/// Get all windows information
#[tauri::command]
pub async fn get_all_windows(
    app: AppHandle,
    state: State<'_, WindowStateManager>,
) -> Result<Vec<WindowInfo>, String> {
    let mut windows = Vec::new();
    
    for (_label, window) in app.webview_windows() {
        let window_info = get_window_info(&window)?;
        windows.push(window_info);
    }
    
    // Update state with current windows
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.windows.clear();
    for window_info in &windows {
        state_guard.windows.insert(window_info.label.clone(), window_info.clone());
    }
    
    Ok(windows)
}

/// Send message to specific window
#[tauri::command]
pub async fn send_message_to_window(
    app: AppHandle,
    state: State<'_, WindowStateManager>,
    from_window: String,
    to_window: String,
    message_type: String,
    payload: serde_json::Value,
) -> Result<WindowResult, String> {
    // Check if target window exists
    if !window_exists(&app, &to_window) {
        return Ok(WindowResult {
            success: false,
            message: format!("Target window '{}' not found", to_window),
            data: None,
        });
    }

    // Create message
    let message = WindowMessage {
        id: generate_message_id(),
        from_window: from_window.clone(),
        to_window: Some(to_window.clone()),
        message_type: message_type.clone(),
        payload: payload.clone(),
        timestamp: get_current_timestamp(),
    };

    // Add to message history
    add_message_to_history(&state, message.clone())?;

    // Emit message to target window
    app.emit_to(&to_window, "window-message", &message)
        .map_err(|e| format!("Failed to send message: {}", e))?;

    Ok(WindowResult {
        success: true,
        message: format!("Message sent from '{}' to '{}'", from_window, to_window),
        data: Some(json!(message)),
    })
}

/// Broadcast message to all windows
#[tauri::command]
pub async fn broadcast_message(
    app: AppHandle,
    state: State<'_, WindowStateManager>,
    from_window: String,
    message_type: String,
    payload: serde_json::Value,
) -> Result<WindowResult, String> {
    // Create message
    let message = WindowMessage {
        id: generate_message_id(),
        from_window: from_window.clone(),
        to_window: None,
        message_type: message_type.clone(),
        payload: payload.clone(),
        timestamp: get_current_timestamp(),
    };

    // Add to message history
    add_message_to_history(&state, message.clone())?;

    // Broadcast to all windows
    app.emit("window-broadcast", &message)
        .map_err(|e| format!("Failed to broadcast message: {}", e))?;

    let window_count = app.webview_windows().len();

    Ok(WindowResult {
        success: true,
        message: format!("Message broadcast from '{}' to {} windows", from_window, window_count),
        data: Some(json!(message)),
    })
}

/// Get message history
#[tauri::command]
pub async fn get_message_history(
    state: State<'_, WindowStateManager>,
    limit: Option<usize>,
) -> Result<Vec<WindowMessage>, String> {
    let state_guard = state.lock().map_err(|e| e.to_string())?;
    let messages = &state_guard.message_history;
    
    if let Some(limit) = limit {
        let start = if messages.len() > limit {
            messages.len() - limit
        } else {
            0
        };
        Ok(messages[start..].to_vec())
    } else {
        Ok(messages.clone())
    }
}

/// Focus a window
#[tauri::command]
pub async fn focus_window(
    app: AppHandle,
    label: String,
) -> Result<WindowResult, String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
        
        Ok(WindowResult {
            success: true,
            message: format!("Window '{}' focused", label),
            data: None,
        })
    } else {
        Ok(WindowResult {
            success: false,
            message: format!("Window '{}' not found", label),
            data: None,
        })
    }
}

/// Show/hide a window
#[tauri::command]
pub async fn toggle_window_visibility(
    app: AppHandle,
    label: String,
) -> Result<WindowResult, String> {
    if let Some(window) = app.get_webview_window(&label) {
        let is_visible = window.is_visible().map_err(|e| format!("Failed to check visibility: {}", e))?;
        
        if is_visible {
            window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
        } else {
            window.show().map_err(|e| format!("Failed to show window: {}", e))?;
        }
        
        Ok(WindowResult {
            success: true,
            message: format!("Window '{}' {}", label, if is_visible { "hidden" } else { "shown" }),
            data: Some(json!({ "visible": !is_visible })),
        })
    } else {
        Ok(WindowResult {
            success: false,
            message: format!("Window '{}' not found", label),
            data: None,
        })
    }
}