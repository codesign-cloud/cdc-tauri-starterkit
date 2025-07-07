// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowEvent};

#[cfg(feature = "system-tray")]
use tauri::tray::TrayIconBuilder;

mod commands;
mod features;

// Conditional module imports based on features
#[cfg(feature = "system-tray")]
mod tray;

use commands::*;
use features::get_enabled_features;

#[cfg(feature = "notifications")]
use features::notifications::commands::*;
#[cfg(feature = "system-tray")]
use tray::*;
#[cfg(feature = "clipboard")]
use features::clipboard::commands::*;
#[cfg(feature = "deep-links")]
use features::deep_links::commands::*;

fn main() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init());

    // Conditionally add plugins based on features
    #[cfg(feature = "notifications")]
    {
        builder = builder.plugin(tauri_plugin_notification::init());
    }

    #[cfg(feature = "deep-links")]
    {
        builder = builder.plugin(tauri_plugin_deep_link::init());
    }

    #[cfg(feature = "clipboard")]
    {
        builder = builder.plugin(tauri_plugin_clipboard_manager::init());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            greet,
            show_window,
            hide_window,
            get_enabled_features,
            #[cfg(feature = "notifications")]
            check_notification_permission,
            #[cfg(feature = "notifications")]
            request_notification_permission,
            #[cfg(feature = "notifications")]
            send_notification,
            #[cfg(feature = "notifications")]
            send_custom_notification,
            #[cfg(feature = "notifications")]
            send_demo_notification,
            #[cfg(feature = "notifications")]
            send_success_notification,
            #[cfg(feature = "notifications")]
            send_error_notification,
            #[cfg(feature = "notifications")]
            send_info_notification,
            #[cfg(feature = "clipboard")]
            copy_to_clipboard,
            #[cfg(feature = "clipboard")]
            copy_image_to_clipboard,
            #[cfg(feature = "clipboard")]
            copy_html_to_clipboard,
            #[cfg(feature = "clipboard")]
            copy_rtf_to_clipboard,
            #[cfg(feature = "clipboard")]
            copy_files_to_clipboard,
            #[cfg(feature = "clipboard")]
            paste_from_clipboard,
            #[cfg(feature = "clipboard")]
            read_image_from_clipboard,
            #[cfg(feature = "clipboard")]
            read_all_clipboard_formats,
            #[cfg(feature = "clipboard")]
            get_clipboard_history,
            #[cfg(feature = "clipboard")]
            get_clipboard_formats,
            #[cfg(feature = "clipboard")]
            clear_clipboard,
            #[cfg(feature = "clipboard")]
            add_to_clipboard_history,
            #[cfg(feature = "clipboard")]
            monitor_clipboard_changes,
            #[cfg(feature = "clipboard")]
            clear_clipboard_history,
            #[cfg(feature = "deep-links")]
            register_protocol,
            #[cfg(feature = "deep-links")]
            handle_deep_link_event,
            #[cfg(feature = "deep-links")]
            handle_deep_link_detailed
        ])
        .setup(|app| {
            #[cfg(feature = "system-tray")]
            {
                // Create system tray
                let tray_menu = create_tray_menu(app)?;
                let _tray = TrayIconBuilder::with_id("main")
                    .menu(&tray_menu)
                    .tooltip("Tauri Next.js Starterkit")
                    .on_menu_event(handle_tray_menu_event)
                    .on_tray_icon_event(handle_tray_icon_event)
                    .build(app)?;
            }

            // Handle window events
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    #[cfg(feature = "system-tray")]
                    {
                        // Hide window instead of closing when user clicks X (only if tray is enabled)
                        window_clone.hide().unwrap();
                        api.prevent_close();
                    }
                    #[cfg(not(feature = "system-tray"))]
                    {
                        // Close normally if no system tray
                        std::process::exit(0);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}