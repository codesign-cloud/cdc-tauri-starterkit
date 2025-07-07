//! Clipboard Management Module
//! 
//! This module provides advanced clipboard functionality including:
//! - Multi-format clipboard support (text, HTML, RTF, images, files)
//! - Clipboard history tracking
//! - Format detection and analysis
//! - Cross-platform compatibility

pub mod commands;
pub mod types;
pub mod utils;

// Re-export all commands for easy access
pub use commands::*;
// Re-export types and utils when needed
// pub use types::*;
// pub use utils::*;