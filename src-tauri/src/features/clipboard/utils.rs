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