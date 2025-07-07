//! Deep Links Module
//! 
//! This module provides deep link functionality including:
//! - Protocol registration
//! - URL parsing and handling
//! - Event emission to frontend

#[cfg(feature = "deep-links")]
pub mod commands;
#[cfg(feature = "deep-links")]
pub mod types;
#[cfg(feature = "deep-links")]
pub mod utils;

// Re-export all commands for easy access
#[cfg(feature = "deep-links")]
pub use commands::*;
// Re-export types and utils when needed
// #[cfg(feature = "deep-links")]
// pub use types::*;
// #[cfg(feature = "deep-links")]
// pub use utils::*;