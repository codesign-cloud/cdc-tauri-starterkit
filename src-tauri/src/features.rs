//! Feature configuration for the Tauri starter kit
//!
//! This module allows you to enable/disable specific features
//! to keep your application lightweight and only include what you need.

// Feature modules
#[cfg(feature = "clipboard")]
pub mod clipboard;

#[cfg(feature = "notifications")]
pub mod notifications;

#[cfg(feature = "deep-links")]
pub mod deep_links;

/// Feature flags for the application
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Features {
    pub clipboard: bool,
    pub notifications: bool,
    pub deep_links: bool,
    pub system_tray: bool,
}

impl Default for Features {
    fn default() -> Self {
        Self {
            clipboard: true,
            notifications: true,
            deep_links: true,
            system_tray: true,
        }
    }
}

#[allow(dead_code)]
impl Features {
    /// Create a new Features configuration
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Enable clipboard functionality
    pub fn with_clipboard(mut self, enabled: bool) -> Self {
        self.clipboard = enabled;
        self
    }
    
    /// Enable notification functionality
    pub fn with_notifications(mut self, enabled: bool) -> Self {
        self.notifications = enabled;
        self
    }
    
    /// Enable deep link functionality
    pub fn with_deep_links(mut self, enabled: bool) -> Self {
        self.deep_links = enabled;
        self
    }
    
    /// Enable system tray functionality
    pub fn with_system_tray(mut self, enabled: bool) -> Self {
        self.system_tray = enabled;
        self
    }
    
    /// Create a minimal configuration with only basic features
    pub fn minimal() -> Self {
        Self {
            clipboard: false,
            notifications: false,
            deep_links: false,
            system_tray: false,
        }
    }
    
    /// Create a full configuration with all features enabled
    pub fn full() -> Self {
        Self::default()
    }
}

/// Macro to conditionally compile features
#[macro_export]
macro_rules! feature_enabled {
    ($features:expr, $feature:ident) => {
        $features.$feature
    };
}

/// Tauri command to get enabled features at runtime
#[tauri::command]
pub fn get_enabled_features() -> Vec<&'static str> {
    let mut v = Vec::new();
    #[cfg(feature = "notifications")]
    v.push("notifications");
    #[cfg(feature = "deep-links")]
    v.push("deep-links");
    #[cfg(feature = "clipboard")]
    v.push("clipboard");
    #[cfg(feature = "system-tray")]
    v.push("system-tray");
    v
}