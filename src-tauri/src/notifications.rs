use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::{NotificationExt, PermissionState};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationOptions {
    pub title: String,
    pub body: Option<String>,
    pub icon: Option<String>,
    pub sound: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationResult {
    pub success: bool,
    pub message: String,
    pub permission_granted: bool,
}

/// Check if notification permissions are granted
#[tauri::command]
pub async fn check_notification_permission(app: AppHandle) -> Result<bool, String> {
    match app.notification().permission_state() {
        Ok(PermissionState::Granted) => Ok(true),
        Ok(_) => Ok(false),
        Err(e) => Err(format!("Failed to check notification permission: {}", e)),
    }
}

/// Request notification permissions
#[tauri::command]
pub async fn request_notification_permission(app: AppHandle) -> Result<bool, String> {
    match app.notification().request_permission() {
        Ok(PermissionState::Granted) => Ok(true),
        Ok(_) => Ok(false),
        Err(e) => Err(format!("Failed to request notification permission: {}", e)),
    }
}

/// Send a basic notification
#[tauri::command]
pub async fn send_notification(
    app: AppHandle,
    title: String,
    body: Option<String>,
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

    // Send notification
    let notification_body = body.unwrap_or_else(|| "".to_string());
    
    match app.notification().builder()
        .title(title.clone())
        .body(notification_body)
        .show() {
        Ok(_) => Ok(NotificationResult {
            success: true,
            message: format!("Notification '{}' sent successfully", title),
            permission_granted,
        }),
        Err(e) => Ok(NotificationResult {
            success: false,
            message: format!("Failed to send notification: {}", e),
            permission_granted,
        }),
    }
}

/// Send a notification with custom options
#[tauri::command]
pub async fn send_custom_notification(
    app: AppHandle,
    options: NotificationOptions,
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
            message: format!("Custom notification '{}' sent successfully", options.title),
            permission_granted,
        }),
        Err(e) => Ok(NotificationResult {
            success: false,
            message: format!("Failed to send custom notification: {}", e),
            permission_granted,
        }),
    }
}

/// Send a demo notification with predefined content
#[tauri::command]
pub async fn send_demo_notification(app: AppHandle) -> Result<NotificationResult, String> {
    let demo_options = NotificationOptions {
        title: "🚀 Tauri Notification Demo".to_string(),
        body: Some("This is a demo notification from your Tauri + Next.js app! OS notifications are working perfectly.".to_string()),
        icon: None,
        sound: None,
    };
    
    send_custom_notification(app, demo_options).await
}

/// Send a success notification
#[tauri::command]
pub async fn send_success_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let success_options = NotificationOptions {
        title: "✅ Success".to_string(),
        body: message.or_else(|| Some("Operation completed successfully!".to_string())),
        icon: None,
        sound: None,
    };
    
    send_custom_notification(app, success_options).await
}

/// Send an error notification
#[tauri::command]
pub async fn send_error_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let error_options = NotificationOptions {
        title: "❌ Error".to_string(),
        body: message.or_else(|| Some("An error occurred!".to_string())),
        icon: None,
        sound: None,
    };
    
    send_custom_notification(app, error_options).await
}

/// Send an info notification
#[tauri::command]
pub async fn send_info_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let info_options = NotificationOptions {
        title: "ℹ️ Information".to_string(),
        body: message.or_else(|| Some("Here's some information for you!".to_string())),
        icon: None,
        sound: None,
    };
    
    send_custom_notification(app, info_options).await
}