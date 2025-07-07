// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::{TrayIconBuilder},
    Manager, WindowEvent,
};

mod commands;
mod notifications;
mod tray;
mod clipboard;
mod deep_link;

use commands::*;
use notifications::*;
use tray::*;
use clipboard::*;
use deep_link::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            show_window,
            hide_window,
            check_notification_permission,
            request_notification_permission,
            send_notification,
            send_custom_notification,
            send_demo_notification,
            send_success_notification,
            send_error_notification,
            send_info_notification,
            // Clipboard commands
            copy_to_clipboard,
            paste_from_clipboard,
            get_clipboard_history,
            clear_clipboard,
            // Deep link commands
            register_protocol,
            handle_deep_link_event
        ])
        .setup(|app| {
            // Create system tray
            let tray_menu = create_tray_menu(app)?;
            let _tray = TrayIconBuilder::with_id("main")
                .menu(&tray_menu)
                .tooltip("Tauri Next.js Starterkit")
                .on_menu_event(handle_tray_menu_event)
                .on_tray_icon_event(handle_tray_icon_event)
                .build(app)?;

            // Handle window events
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Hide window instead of closing when user clicks X
                    window_clone.hide().unwrap();
                    api.prevent_close();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}