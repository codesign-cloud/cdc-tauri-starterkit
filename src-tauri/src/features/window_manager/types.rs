//! Type definitions for window manager feature

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Window information structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub label: String,
    pub title: String,
    pub url: String,
    pub is_visible: bool,
    pub is_focused: bool,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

/// Message structure for inter-window communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowMessage {
    pub id: String,
    pub from_window: String,
    pub to_window: Option<String>, // None means broadcast to all windows
    pub message_type: String,
    pub payload: serde_json::Value,
    pub timestamp: i64,
}

/// Window creation options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWindowOptions {
    pub label: String,
    pub title: String,
    pub url: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub resizable: Option<bool>,
    pub minimizable: Option<bool>,
    pub maximizable: Option<bool>,
    pub closable: Option<bool>,
    pub always_on_top: Option<bool>,
    pub decorations: Option<bool>,
    pub transparent: Option<bool>,
    pub visible: Option<bool>,
    pub center: Option<bool>,
}

/// Window state for tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub windows: HashMap<String, WindowInfo>,
    pub message_history: Vec<WindowMessage>,
    pub window_counter: u32,
}

/// Event types for window communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WindowEventType {
    WindowCreated,
    WindowClosed,
    WindowFocused,
    WindowBlurred,
    WindowMoved,
    WindowResized,
    MessageReceived,
    BroadcastMessage,
}

/// Window communication result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl Default for CreateWindowOptions {
    fn default() -> Self {
        Self {
            label: "new-window".to_string(),
            title: "New Window".to_string(),
            url: "/".to_string(),
            width: Some(800),
            height: Some(600),
            x: None,
            y: None,
            resizable: Some(true),
            minimizable: Some(true),
            maximizable: Some(true),
            closable: Some(true),
            always_on_top: Some(false),
            decorations: Some(true),
            transparent: Some(false),
            visible: Some(true),
            center: Some(true),
        }
    }
}