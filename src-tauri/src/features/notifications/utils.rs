use tauri::AppHandle;
use tauri_plugin_notification::{NotificationExt, PermissionState};
use super::types::{NotificationOptions, NotificationResult};

/// Check if notification permissions are granted
pub fn check_permission(app: &AppHandle) -> Result<bool, String> {
    match app.notification().permission_state() {
        Ok(PermissionState::Granted) => Ok(true),
        Ok(_) => Ok(false),
        Err(e) => Err(format!("Failed to check notification permission: {}", e)),
    }
}

/// Request notification permissions
pub fn request_permission(app: &AppHandle) -> Result<bool, String> {
    match app.notification().request_permission() {
        Ok(PermissionState::Granted) => Ok(true),
        Ok(_) => Ok(false),
        Err(e) => Err(format!("Failed to request notification permission: {}", e)),
    }
}

/// Send a notification with the given options
pub fn send_notification_with_options(
    app: &AppHandle,
    options: &NotificationOptions,
) -> Result<NotificationResult, String> {
    // Check permission first
    let permission_granted = match app.notification().permission_state() {
        Ok(PermissionState::Granted) => true,
        Ok(_) => {
            return Ok(NotificationResult {
                success: false,
                message: "Notification permission not granted".to_string(),
                permission_granted: false,
            });
        }
        Err(e) => {
            return Err(format!("Failed to check notification permission: {}", e));
        }
    };

    // Build notification
    let mut builder = app.notification().builder().title(options.title.clone());
    
    if let Some(body) = &options.body {
        builder = builder.body(body.clone());
    }
    
    if let Some(icon) = &options.icon {
        builder = builder.icon(icon.clone());
    }
    
    if let Some(sound) = &options.sound {
        builder = builder.sound(sound.clone());
    }

    // Send notification
    match builder.show() {
        Ok(_) => Ok(NotificationResult {
            success: true,
            message: format!("Notification '{}' sent successfully", options.title),
            permission_granted,
        }),
        Err(e) => Ok(NotificationResult {
            success: false,
            message: format!("Failed to send notification: {}", e),
            permission_granted,
        }),
    }
}

/// Create predefined notification options for different types
pub fn create_demo_options() -> NotificationOptions {
    NotificationOptions {
        title: "🚀 Tauri Notification Demo".to_string(),
        body: Some("This is a demo notification from your Tauri + Next.js app! OS notifications are working perfectly.".to_string()),
        icon: None,
        sound: None,
    }
}

pub fn create_success_options(message: Option<String>) -> NotificationOptions {
    NotificationOptions {
        title: "✅ Success".to_string(),
        body: message.or_else(|| Some("Operation completed successfully!".to_string())),
        icon: None,
        sound: None,
    }
}

pub fn create_error_options(message: Option<String>) -> NotificationOptions {
    NotificationOptions {
        title: "❌ Error".to_string(),
        body: message.or_else(|| Some("An error occurred!".to_string())),
        icon: None,
        sound: None,
    }
}

pub fn create_info_options(message: Option<String>) -> NotificationOptions {
    NotificationOptions {
        title: "ℹ️ Information".to_string(),
        body: message.or_else(|| Some("Here's some information for you!".to_string())),
        icon: None,
        sound: None,
    }
}