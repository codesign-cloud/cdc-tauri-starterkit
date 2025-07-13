use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
    App, AppHandle, Manager, Result,
};

pub fn create_tray_menu(app: &App) -> Result<Menu<tauri::Wry>> {
    #[cfg(debug_assertions)]
    {
        Menu::with_items(
            app,
            &[
                &MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?,
                &MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &MenuItem::with_id(app, "about_tray", "About", true, None::<&str>)?,
                &MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &MenuItem::with_id(app, "restart_app_tray", "Reload App (Dev)", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::quit(app, Some("Quit"))?,
            ],
        )
    }
    #[cfg(not(debug_assertions))]
    {
        Menu::with_items(
            app,
            &[
                &MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?,
                &MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &MenuItem::with_id(app, "about_tray", "About", true, None::<&str>)?,
                &MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::quit(app, Some("Quit"))?,
            ],
        )
    }
}

pub fn handle_tray_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "hide" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
        }
        "about_tray" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // You could show an about dialog here
                println!("About clicked from tray");
            }
        }
        "settings" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // You could navigate to settings page here
                println!("Settings clicked from tray");
            }
        }
        "restart_app_tray" => {
            #[cfg(debug_assertions)]
            {
                // In development mode, reload all windows instead of restarting the entire process
                // This preserves the CLI dev server
                println!("Reloading application from tray (dev mode)...");
                for (_label, window) in app.webview_windows() {
                    let _ = window.eval("window.location.reload()");
                }
            }
            #[cfg(not(debug_assertions))]
            {
                // In production mode, actually restart the application
                println!("Restarting application from tray (production mode)...");
                app.restart();
            }
        }
        _ => {}
    }
}

pub fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    match event {
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } => {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        TrayIconEvent::DoubleClick {
            button: MouseButton::Left,
            ..
        } => {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        _ => {}
    }
}