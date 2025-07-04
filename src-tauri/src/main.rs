// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::{TrayIconBuilder},
    Manager, WindowEvent,
};

mod commands;
mod tray;

use commands::*;
use tray::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, show_window, hide_window])
        .setup(|app| {
            // Create system tray
            let tray_menu = create_tray_menu(app)?;
            let _tray = TrayIconBuilder::with_id("main")
                .menu(&tray_menu)
                .tooltip("Tauri Next.js Starter Kit")
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