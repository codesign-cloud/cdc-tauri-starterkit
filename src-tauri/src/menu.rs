use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    App, AppHandle, Manager, Result,
};

pub fn create_app_menu(app: &App) -> Result<Menu<tauri::Wry>> {
    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new", "New", true, None::<&str>)?,
            &MenuItem::with_id(app, "open", "Open", true, Some("CmdOrCtrl+O"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(app, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quit"))?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, Some("Undo"))?,
            &PredefinedMenuItem::redo(app, Some("Redo"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, Some("Cut"))?,
            &PredefinedMenuItem::copy(app, Some("Copy"))?,
            &PredefinedMenuItem::paste(app, Some("Paste"))?,
            &PredefinedMenuItem::select_all(app, Some("Select All"))?,
        ],
    )?;

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?,
            &MenuItem::with_id(app, "toggle_devtools", "Toggle Developer Tools", true, Some("F12"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+Plus"))?,
            &MenuItem::with_id(app, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
            &MenuItem::with_id(app, "zoom_reset", "Reset Zoom", true, Some("CmdOrCtrl+0"))?,
        ],
    )?;

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, Some("Minimize"))?,
            &MenuItem::with_id(app, "hide_window", "Hide Window", true, Some("CmdOrCtrl+H"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, Some("Close Window"))?,
        ],
    )?;

    let help_menu = Submenu::with_items(
        app,
        "Help",
        true,
        &[
            &MenuItem::with_id(app, "about", "About", true, None::<&str>)?,
            &MenuItem::with_id(app, "documentation", "Documentation", true, None::<&str>)?,
        ],
    )?;

    // Developer menu (only in debug mode)
    #[cfg(debug_assertions)]
    let developer_menu = Submenu::with_items(
        app,
        "Developer",
        true,
        &[
            &MenuItem::with_id(app, "restart_app", "Reload App (Dev)", true, Some("CmdOrCtrl+Shift+R"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "reload_all", "Reload All Windows", true, Some("CmdOrCtrl+Shift+F5"))?,
        ],
    )?;

    #[cfg(debug_assertions)]
    {
        Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &window_menu, &developer_menu, &help_menu])
    }
    #[cfg(not(debug_assertions))]
    {
        Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &window_menu, &help_menu])
    }
}

pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "restart_app" => {
            #[cfg(debug_assertions)]
            {
                // In development mode, reload all windows instead of restarting the entire process
                // This preserves the CLI dev server
                println!("Reloading application (dev mode)...");
                for (_label, window) in app.webview_windows() {
                    let _ = window.eval("window.location.reload()");
                }
            }
            #[cfg(not(debug_assertions))]
            {
                // In production mode, actually restart the application
                println!("Restarting application (production mode)...");
                app.restart();
            }
        }
        "reload_all" => {
            #[cfg(debug_assertions)]
            {
                println!("Reloading all windows...");
                for (_label, window) in app.webview_windows() {
                    let _ = window.eval("window.location.reload()");
                }
            }
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.reload()");
            }
        }
        "toggle_devtools" => {
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                // In Tauri v2, devtools are handled differently
                // For now, we'll just focus the window
                let _ = window.set_focus();
                println!("DevTools toggle requested (not implemented in Tauri v2)");
            }
        }
        "about" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // You could show an about dialog here
                println!("About clicked from menu");
            }
        }
        "documentation" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // You could navigate to documentation page here
                println!("Documentation clicked from menu");
            }
        }
        _ => {}
    }
}