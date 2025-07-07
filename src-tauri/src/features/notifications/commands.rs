use tauri::AppHandle;
use super::types::{NotificationOptions, NotificationResult};
use super::utils::{
    check_permission, request_permission, send_notification_with_options,
    create_demo_options, create_success_options, create_error_options, create_info_options
};

/// Check if notification permissions are granted
#[tauri::command]
pub async fn check_notification_permission(app: AppHandle) -> Result<bool, String> {
    check_permission(&app)
}

/// Request notification permissions
#[tauri::command]
pub async fn request_notification_permission(app: AppHandle) -> Result<bool, String> {
    request_permission(&app)
}

/// Send a basic notification
#[tauri::command]
pub async fn send_notification(
    app: AppHandle,
    title: String,
    body: Option<String>,
) -> Result<NotificationResult, String> {
    let options = NotificationOptions {
        title,
        body,
        icon: None,
        sound: None,
    };
    
    send_notification_with_options(&app, &options)
}

/// Send a notification with custom options
#[tauri::command]
pub async fn send_custom_notification(
    app: AppHandle,
    options: NotificationOptions,
) -> Result<NotificationResult, String> {
    send_notification_with_options(&app, &options)
}

/// Send a demo notification with predefined content
#[tauri::command]
pub async fn send_demo_notification(app: AppHandle) -> Result<NotificationResult, String> {
    let demo_options = create_demo_options();
    send_notification_with_options(&app, &demo_options)
}

/// Send a success notification
#[tauri::command]
pub async fn send_success_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let success_options = create_success_options(message);
    send_notification_with_options(&app, &success_options)
}

/// Send an error notification
#[tauri::command]
pub async fn send_error_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let error_options = create_error_options(message);
    send_notification_with_options(&app, &error_options)
}

/// Send an info notification
#[tauri::command]
pub async fn send_info_notification(
    app: AppHandle,
    message: Option<String>,
) -> Result<NotificationResult, String> {
    let info_options = create_info_options(message);
    send_notification_with_options(&app, &info_options)
}