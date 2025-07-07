//! Notifications Module
//! 
//! This module provides system notification functionality including:
//! - Permission handling
//! - Custom notification types
//! - Cross-platform notification support

#[cfg(feature = "notifications")]
pub mod commands;
#[cfg(feature = "notifications")]
pub mod types;
#[cfg(feature = "notifications")]
pub mod utils;

// Re-export all commands for easy access
#[cfg(feature = "notifications")]
pub use commands::*;
// Re-export types and utils when needed
// #[cfg(feature = "notifications")]
// pub use types::*;
// #[cfg(feature = "notifications")]
// pub use utils::*;