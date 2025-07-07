use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardFormat {
    pub format_name: String,
    pub format_type: String, // MIME type or format identifier
    pub data_size: usize,
    pub content_preview: String,
    pub is_available: bool,
    pub raw_data: Option<String>, // Base64 encoded raw data for advanced formats
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardHistoryItem {
    pub id: String,
    pub timestamp: String,
    pub formats: Vec<ClipboardFormat>,
    pub primary_content: String,
    pub content_type: String,
    // Text formats
    pub plain_text: Option<String>,
    pub html_content: Option<String>,
    pub rtf_content: Option<String>,
    // Image formats
    pub image_data: Option<String>, // Base64 encoded image data
    pub image_format: Option<String>, // Image format (png, jpg, etc.)
    pub image_dimensions: Option<(u32, u32)>, // Width, Height
    // File formats
    pub file_paths: Option<Vec<String>>, // File paths for file drops
    pub file_list: Option<String>, // File list as text
    // Advanced formats
    pub custom_formats: Option<std::collections::HashMap<String, String>>, // Custom format data
}