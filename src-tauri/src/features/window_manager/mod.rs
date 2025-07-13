//! Window Manager Feature
//!
//! This module provides inter-window communication capabilities,
//! allowing multiple windows to communicate with each other through
//! events and shared state.

pub mod commands;
pub mod types;
pub mod utils;

// Re-export only what's needed to avoid unused import warnings
// pub use commands::*; // Commands are imported directly in main.rs
// pub use types::*; // Types are used internally
// pub use utils::*; // Utils are used internally