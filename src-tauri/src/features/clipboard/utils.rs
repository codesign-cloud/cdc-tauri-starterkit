use crate::features::clipboard::types::ClipboardHistoryItem;
use image::ImageFormat;
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::collections::VecDeque;
use base64::{Engine as _, engine::general_purpose};

// Global clipboard history storage
static CLIPBOARD_HISTORY: std::sync::OnceLock<Arc<Mutex<VecDeque<ClipboardHistoryItem>>>> = std::sync::OnceLock::new();

pub fn get_clipboard_history_storage() -> &'static Arc<Mutex<VecDeque<ClipboardHistoryItem>>> {
    CLIPBOARD_HISTORY.get_or_init(|| Arc::new(Mutex::new(VecDeque::with_capacity(50))))
}

pub fn detect_content_type(content: &str) -> String {
    if content.starts_with("http://") || content.starts_with("https://") {
        "URL".to_string()
    } else if content.starts_with("ftp://") || content.starts_with("ftps://") {
        "FTP".to_string()
    } else if (content.trim().starts_with("{") && content.trim().ends_with("}")) ||
              (content.trim().starts_with("[") && content.trim().ends_with("]")) {
        "JSON".to_string()
    } else if content.contains("<html>") || content.contains("<!DOCTYPE") || content.contains("<div") {
        "HTML".to_string()
    } else if content.starts_with("{\\rtf") {
        "RTF".to_string()
    } else if content.contains(":\\") || content.starts_with("/") || content.starts_with("~/") {
        "File Path".to_string()
    } else if content.contains("@") && content.contains(".") && !content.contains(" ") {
        "Email".to_string()
    } else if content.lines().count() > 1 {
        "Multiline Text".to_string()
    } else if content.chars().all(|c| c.is_ascii_digit() || c == '.' || c == '-' || c == '+') {
        "Number".to_string()
    } else {
        "Text".to_string()
    }
}

pub fn process_image_data(image_data: &[u8], width: u32, height: u32) -> Result<(String, String, (u32, u32)), String> {
    // Convert RGBA data to PNG format for storage
    let img = image::RgbaImage::from_raw(width, height, image_data.to_vec())
        .ok_or("Failed to create image from raw data")?;
    
    let mut png_data = Vec::new();
    let mut cursor = Cursor::new(&mut png_data);
    
    img.write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image as PNG: {}", e))?;
    
    let base64_data = general_purpose::STANDARD.encode(&png_data);
    let dimensions = (width, height);
    
    Ok((base64_data, "png".to_string(), dimensions))
}

pub fn generate_clipboard_id(content: &str, timestamp: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    timestamp.hash(&mut hasher);
    format!("clip_{:x}", hasher.finish())
}

/// Improved file list detection without disk I/O
/// Uses pattern matching to identify potential file paths
pub fn is_file_list(content: &str) -> bool {
    let lines: Vec<&str> = content.lines().collect();
    
    // Must have at least one line and not be empty
    if lines.is_empty() {
        return false;
    }
    
    // Filter out empty lines for analysis
    let non_empty_lines: Vec<&str> = lines.iter()
        .filter(|line| !line.trim().is_empty())
        .copied()
        .collect();
    
    // Must have at least one non-empty line
    if non_empty_lines.is_empty() {
        return false;
    }
    
    // Check if majority of non-empty lines look like file paths
    let path_like_count = non_empty_lines.iter()
        .filter(|line| is_path_like(line))
        .count();
    
    // At least 80% of non-empty lines should look like paths
    let threshold = (non_empty_lines.len() as f32 * 0.8).ceil() as usize;
    path_like_count >= threshold && path_like_count > 0
}

/// Check if a single line looks like a file path without disk I/O
fn is_path_like(line: &str) -> bool {
    let trimmed = line.trim();
    
    // Empty lines are not paths
    if trimmed.is_empty() {
        return false;
    }
    
    // Windows absolute paths (C:\, D:\, etc.)
    if trimmed.len() >= 3 && trimmed.chars().nth(1) == Some(':') &&
       trimmed.chars().nth(2) == Some('\\') &&
       trimmed.chars().nth(0).map_or(false, |c| c.is_ascii_alphabetic()) {
        return true;
    }
    
    // Windows UNC paths (\\server\share)
    if trimmed.starts_with("\\\\") && trimmed.len() > 2 {
        return true;
    }
    
    // Unix absolute paths
    if trimmed.starts_with('/') && trimmed.len() > 1 {
        return true;
    }
    
    // Home directory paths
    if trimmed.starts_with("~/") {
        return true;
    }
    
    // Relative paths with directory separators
    if trimmed.contains('/') || trimmed.contains('\\') {
        // Check if it has a reasonable file extension or directory structure
        if has_file_extension(trimmed) || has_directory_structure(trimmed) {
            return true;
        }
    }
    
    // Single filename with extension (could be in current directory)
    if !trimmed.contains('/') && !trimmed.contains('\\') && has_file_extension(trimmed) {
        return true;
    }
    
    false
}

/// Check if the path has a common file extension
fn has_file_extension(path: &str) -> bool {
    if let Some(dot_pos) = path.rfind('.') {
        if dot_pos < path.len() - 1 {
            let extension = &path[dot_pos + 1..];
            // Check for common file extensions (1-5 characters)
            extension.len() <= 5 && extension.chars().all(|c| c.is_ascii_alphanumeric())
        } else {
            false
        }
    } else {
        false
    }
}

/// Check if the path has a reasonable directory structure
fn has_directory_structure(path: &str) -> bool {
    let parts: Vec<&str> = path.split(&['/', '\\'][..]).collect();
    
    // Should have at least 2 parts for a directory structure
    if parts.len() < 2 {
        return false;
    }
    
    // Each part should be reasonable (not too long, contains valid characters)
    parts.iter().all(|part| {
        !part.is_empty() &&
        part.len() <= 255 &&
        part.chars().all(|c| {
            c.is_ascii_alphanumeric() ||
            " .-_()[]{}".contains(c)
        })
    })
}