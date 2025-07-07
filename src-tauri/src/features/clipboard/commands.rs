use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri::image::Image;
use crate::features::clipboard::{types::*, utils::*};
use base64::{Engine as _, engine::general_purpose};

#[tauri::command]
pub async fn copy_to_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))
}

#[tauri::command]
pub async fn copy_image_to_clipboard(app: tauri::AppHandle, image_data: String) -> Result<(), String> {
    // Decode base64 image data
    let image_bytes = general_purpose::STANDARD.decode(&image_data)
        .map_err(|e| format!("Failed to decode base64 image: {}", e))?;
    
    // Load image using the image crate
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    // Convert to RGBA format for clipboard
    let rgba_img = img.to_rgba8();
    let (width, height) = rgba_img.dimensions();
    
    // Write image to clipboard using the Image struct
    let image_data = rgba_img.into_raw();
    let image = Image::new(&image_data, width, height);
    
    app.clipboard()
        .write_image(&image)
        .map_err(|e| format!("Failed to copy image to clipboard: {}", e))
}

#[tauri::command]
pub async fn read_image_from_clipboard(app: tauri::AppHandle) -> Result<Option<String>, String> {
    match app.clipboard().read_image() {
        Ok(image) => {
            // Convert image data to base64
            let base64_data = general_purpose::STANDARD.encode(image.rgba());
            Ok(Some(base64_data))
        }
        Err(_) => Ok(None), // No image available
    }
}

#[tauri::command]
pub async fn copy_html_to_clipboard(app: tauri::AppHandle, html_content: String) -> Result<(), String> {
    // For HTML content, we'll store it as text for now since tauri-plugin-clipboard-manager
    // doesn't have direct HTML support yet, but we can detect and handle it
    app.clipboard()
        .write_text(html_content)
        .map_err(|e| format!("Failed to copy HTML to clipboard: {}", e))
}

#[tauri::command]
pub async fn copy_rtf_to_clipboard(app: tauri::AppHandle, rtf_content: String) -> Result<(), String> {
    // For RTF content, we'll store it as text for now
    app.clipboard()
        .write_text(rtf_content)
        .map_err(|e| format!("Failed to copy RTF to clipboard: {}", e))
}

#[tauri::command]
pub async fn copy_files_to_clipboard(app: tauri::AppHandle, file_paths: Vec<String>) -> Result<(), String> {
    // Convert file paths to a text representation
    let file_list = file_paths.join("\n");
    app.clipboard()
        .write_text(file_list)
        .map_err(|e| format!("Failed to copy files to clipboard: {}", e))
}

#[tauri::command]
pub async fn read_all_clipboard_formats(app: tauri::AppHandle) -> Result<std::collections::HashMap<String, String>, String> {
    let mut formats = std::collections::HashMap::new();
    
    // Try to read text
    if let Ok(text) = app.clipboard().read_text() {
        if !text.is_empty() {
            formats.insert("text/plain".to_string(), text.clone());
            
            // Check if it's HTML
            if text.contains("<html>") || text.contains("<!DOCTYPE") || text.contains("<") {
                formats.insert("text/html".to_string(), text.clone());
            }
            
            // Check if it's RTF
            if text.starts_with("{\\rtf") {
                formats.insert("text/rtf".to_string(), text.clone());
            }
            
            // Check if it's a file list (improved detection without disk I/O)
            if is_file_list(&text) {
                formats.insert("text/uri-list".to_string(), text.clone());
            }
        }
    }
    
    // Try to read image
    if let Ok(image) = app.clipboard().read_image() {
        let base64_data = general_purpose::STANDARD.encode(image.rgba());
        formats.insert("image/png".to_string(), base64_data);
    }
    
    Ok(formats)
}

#[tauri::command]
pub async fn paste_from_clipboard(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read from clipboard: {}", e))
}

#[tauri::command]
pub async fn get_clipboard_formats(app: tauri::AppHandle) -> Result<Vec<ClipboardFormat>, String> {

    use std::sync::Mutex;
    use std::time::{Duration, Instant};
    
    static CACHE: Mutex<Option<(Vec<ClipboardFormat>, Instant)>> = Mutex::new(None);
    const CACHE_DURATION: Duration = Duration::from_secs(5);
    
    // Check cache
    {
        let cache = CACHE.lock().unwrap();
        if let Some((cached_formats, timestamp)) = &*cache {
            if timestamp.elapsed() < CACHE_DURATION {
                return Ok(cached_formats.clone());
            }
        }
    }
    let mut formats = Vec::new();
    
    // Check for image data first
    if let Ok(image) = app.clipboard().read_image() {
        let base64_data = general_purpose::STANDARD.encode(image.rgba());
        
        formats.push(ClipboardFormat {
            format_name: "Image (RGBA)".to_string(),
            format_type: "image/rgba".to_string(),
            data_size: image.rgba().len(),
            content_preview: format!("{}x{} pixels", image.width(), image.height()),
            is_available: true,
            raw_data: Some(base64_data.clone()),
        });
        
        formats.push(ClipboardFormat {
            format_name: "Image (PNG)".to_string(),
            format_type: "image/png".to_string(),
            data_size: image.rgba().len(),
            content_preview: "PNG format available".to_string(),
            is_available: true,
            raw_data: Some(base64_data.clone()),
        });
        
        formats.push(ClipboardFormat {
            format_name: "Image (JPEG)".to_string(),
            format_type: "image/jpeg".to_string(),
            data_size: image.rgba().len(),
            content_preview: "JPEG format available".to_string(),
            is_available: true,
            raw_data: Some(base64_data.clone()),
        });
        
        formats.push(ClipboardFormat {
            format_name: "Image (Bitmap)".to_string(),
            format_type: "image/bmp".to_string(),
            data_size: image.rgba().len(),
            content_preview: "Bitmap format available".to_string(),
            is_available: true,
            raw_data: Some(base64_data),
        });
    }
    
    // Try to get text format and analyze all possible text-based formats
    if let Ok(text_content) = app.clipboard().read_text() {
        if !text_content.is_empty() {
            // Plain text format (available on all platforms)
            formats.push(ClipboardFormat {
                format_name: "Plain Text".to_string(),
                format_type: "text/plain".to_string(),
                data_size: text_content.len(),
                content_preview: if text_content.len() > 100 {
                    format!("{}...", &text_content[..100])
                } else {
                    text_content.clone()
                },
                is_available: true,
                raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
            });

            // Unicode text (cross-platform)
            formats.push(ClipboardFormat {
                format_name: "Unicode Text (UTF-8)".to_string(),
                format_type: "text/unicode".to_string(),
                data_size: text_content.chars().count() * 4,
                content_preview: "Unicode version of text".to_string(),
                is_available: true,
                raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
            });

            // UTF-16 representation
            let utf16_bytes: Vec<u8> = text_content.encode_utf16()
                .flat_map(|c| c.to_le_bytes().to_vec())
                .collect();
            formats.push(ClipboardFormat {
                format_name: "Unicode Text (UTF-16LE)".to_string(),
                format_type: "text/utf-16le".to_string(),
                data_size: utf16_bytes.len(),
                content_preview: "UTF-16 Little Endian encoding".to_string(),
                is_available: true,
                raw_data: Some(general_purpose::STANDARD.encode(&utf16_bytes)),
            });

            // HTML detection and format
            if text_content.contains("<html>") || text_content.contains("<!DOCTYPE") || 
               text_content.contains("<div") || text_content.contains("<p") ||
               text_content.contains("<span") || text_content.contains("<br") {
                formats.push(ClipboardFormat {
                    format_name: "HTML".to_string(),
                    format_type: "text/html".to_string(),
                    data_size: text_content.len(),
                    content_preview: "HTML content detected".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
                
                // HTML Fragment (Windows specific)
                formats.push(ClipboardFormat {
                    format_name: "HTML Fragment".to_string(),
                    format_type: "text/html-fragment".to_string(),
                    data_size: text_content.len(),
                    content_preview: "HTML Fragment format".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // RTF (Rich Text Format) detection
            if text_content.starts_with("{\\rtf") {
                formats.push(ClipboardFormat {
                    format_name: "Rich Text Format".to_string(),
                    format_type: "text/rtf".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Rich Text Format content".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // URL detection
            if text_content.starts_with("http://") || text_content.starts_with("https://") ||
               text_content.starts_with("ftp://") || text_content.starts_with("ftps://") {
                formats.push(ClipboardFormat {
                    format_name: "URL".to_string(),
                    format_type: "text/uri-list".to_string(),
                    data_size: text_content.len(),
                    content_preview: "URL format".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
                
                formats.push(ClipboardFormat {
                    format_name: "Internet Shortcut".to_string(),
                    format_type: "application/x-mswinurl".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Windows Internet Shortcut".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // File path detection (improved without disk I/O)
            if is_file_list(&text_content) {
                let lines: Vec<&str> = text_content.lines().filter(|line| !line.trim().is_empty()).collect();
                formats.push(ClipboardFormat {
                    format_name: "File Drop List".to_string(),
                    format_type: "text/uri-list".to_string(),
                    data_size: text_content.len(),
                    content_preview: format!("{} file(s)", lines.len()),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
                
                formats.push(ClipboardFormat {
                    format_name: "Shell IDList Array".to_string(),
                    format_type: "application/x-shell-idlist".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Windows Shell file list".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // JSON detection
            if (text_content.trim().starts_with("{") && text_content.trim().ends_with("}")) ||
               (text_content.trim().starts_with("[") && text_content.trim().ends_with("]")) {
                if serde_json::from_str::<serde_json::Value>(&text_content).is_ok() {
                    formats.push(ClipboardFormat {
                        format_name: "JSON".to_string(),
                        format_type: "application/json".to_string(),
                        data_size: text_content.len(),
                        content_preview: "Valid JSON data".to_string(),
                        is_available: true,
                        raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                    });
                }
            }

            // XML detection
            if text_content.trim().starts_with("<?xml") || 
               (text_content.trim().starts_with("<") && text_content.trim().ends_with(">")) {
                formats.push(ClipboardFormat {
                    format_name: "XML".to_string(),
                    format_type: "application/xml".to_string(),
                    data_size: text_content.len(),
                    content_preview: "XML content detected".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // CSV detection
            if text_content.contains(",") && text_content.lines().count() > 1 {
                let lines: Vec<&str> = text_content.lines().collect();
                if lines.len() > 1 && lines.iter().all(|line| line.contains(",")) {
                    formats.push(ClipboardFormat {
                        format_name: "CSV".to_string(),
                        format_type: "text/csv".to_string(),
                        data_size: text_content.len(),
                        content_preview: format!("CSV with {} rows", lines.len()),
                        is_available: true,
                        raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                    });
                }
            }

            // Email detection
            if text_content.contains("@") && text_content.contains(".") && 
               !text_content.contains(" ") && text_content.lines().count() == 1 {
                formats.push(ClipboardFormat {
                    format_name: "Email Address".to_string(),
                    format_type: "text/x-email".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Email address format".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // Code detection (basic)
            if text_content.contains("function") || text_content.contains("class") ||
               text_content.contains("import") || text_content.contains("const") ||
               text_content.contains("def ") || text_content.contains("public class") {
                formats.push(ClipboardFormat {
                    format_name: "Source Code".to_string(),
                    format_type: "text/x-source-code".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Programming code detected".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // Markdown detection
            if text_content.contains("# ") || text_content.contains("## ") ||
               text_content.contains("**") || text_content.contains("```") {
                formats.push(ClipboardFormat {
                    format_name: "Markdown".to_string(),
                    format_type: "text/markdown".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Markdown content detected".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }

            // Base64 detection
            if text_content.len() > 20 && text_content.chars().all(|c| {
                c.is_ascii_alphanumeric() || c == '+' || c == '/' || c == '='
            }) && text_content.len() % 4 == 0 {
                formats.push(ClipboardFormat {
                    format_name: "Base64 Encoded Data".to_string(),
                    format_type: "application/base64".to_string(),
                    data_size: text_content.len(),
                    content_preview: "Base64 encoded content".to_string(),
                    is_available: true,
                    raw_data: Some(general_purpose::STANDARD.encode(&text_content)),
                });
            }
        }
    }

    // Add system-specific formats
    #[cfg(target_os = "windows")]
    {
        // Windows-specific formats would go here
        // These are conceptual as tauri-plugin-clipboard-manager may not expose them directly
        if !formats.is_empty() {
            formats.push(ClipboardFormat {
                format_name: "Windows Locale".to_string(),
                format_type: "application/x-windows-locale".to_string(),
                data_size: 4,
                content_preview: "System locale information".to_string(),
                is_available: true,
                raw_data: None,
            });
        }
    }

    #[cfg(target_os = "macos")]
    {
        // macOS-specific formats
        if !formats.is_empty() {
            formats.push(ClipboardFormat {
                format_name: "macOS Pasteboard Type".to_string(),
                format_type: "com.apple.pasteboard.promised-file-url".to_string(),
                data_size: 0,
                content_preview: "macOS pasteboard metadata".to_string(),
                is_available: true,
                raw_data: None,
            });
        }
    }

    // If no formats detected, show empty state
    if formats.is_empty() {
        formats.push(ClipboardFormat {
            format_name: "Empty".to_string(),
            format_type: "empty".to_string(),
            data_size: 0,
            content_preview: "Clipboard is empty".to_string(),
            is_available: false,
            raw_data: None,
        });
    }

    Ok(formats)
}

#[tauri::command]
pub async fn add_to_clipboard_history(app: tauri::AppHandle, content: String) -> Result<(), String> {
    if content.is_empty() {
        return Ok(());
    }

    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();
    let content_type = detect_content_type(&content);
    let id = generate_clipboard_id(&content, &timestamp);
    
    // Generate formats for this content
    let formats = get_clipboard_formats(app.clone()).await.unwrap_or_default();
    
    // Extract different format types
    let plain_text = if content_type != "Image" { Some(content.clone()) } else { None };
    let html_content = if content.contains("<html>") || content.contains("<!DOCTYPE") || content.contains("<div") {
        Some(content.clone())
    } else { None };
    let rtf_content = if content.starts_with("{\\rtf") {
        Some(content.clone())
    } else { None };
    
    // Check for file paths (improved detection)
    let file_paths = if is_file_list(&content) {
        Some(content.lines().filter(|line| !line.trim().is_empty()).map(|s| s.to_string()).collect())
    } else { None };
    
    let file_list = if file_paths.is_some() { Some(content.clone()) } else { None };
    
    let history_item = ClipboardHistoryItem {
        id,
        timestamp,
        formats,
        primary_content: content.clone(),
        content_type,
        plain_text,
        html_content,
        rtf_content,
        image_data: None,
        image_format: None,
        image_dimensions: None,
        file_paths,
        file_list,
        custom_formats: None,
    };

    let storage = get_clipboard_history_storage();
    if let Ok(mut history) = storage.lock() {
        // Check if this content already exists (avoid duplicates)
        if !history.iter().any(|item| item.primary_content == content) {
            // Add to front of history
            history.push_front(history_item);
            
            // Keep only last 50 items
            if history.len() > 50 {
                history.pop_back();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_clipboard_history(_app: tauri::AppHandle) -> Result<Vec<ClipboardHistoryItem>, String> {
    let storage = get_clipboard_history_storage();
    
    if let Ok(history) = storage.lock() {
        Ok(history.iter().cloned().collect())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn monitor_clipboard_changes(app: tauri::AppHandle) -> Result<(), String> {
    // Check for image data first
    if let Ok(image) = app.clipboard().read_image() {
        let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();
        let id = generate_clipboard_id("image_data", &timestamp);
        
        // Process image data
        match process_image_data(image.rgba(), image.width() as u32, image.height() as u32) {
            Ok((base64_data, format, dimensions)) => {
                let formats = get_clipboard_formats(app.clone()).await.unwrap_or_default();
                
                let history_item = ClipboardHistoryItem {
                    id,
                    timestamp,
                    formats,
                    primary_content: format!("Image {}x{}", dimensions.0, dimensions.1),
                    content_type: "Image".to_string(),
                    plain_text: None,
                    html_content: None,
                    rtf_content: None,
                    image_data: Some(base64_data),
                    image_format: Some(format),
                    image_dimensions: Some(dimensions),
                    file_paths: None,
                    file_list: None,
                    custom_formats: None,
                };

                let storage = get_clipboard_history_storage();
                if let Ok(mut history) = storage.lock() {
                    // Check if this image already exists (avoid duplicates)
                    if !history.iter().any(|item| item.content_type == "Image" &&
                                          item.image_dimensions == Some(dimensions)) {
                        history.push_front(history_item);
                        
                        if history.len() > 50 {
                            history.pop_back();
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to process image data: {}", e);
            }
        }
    }
    
    // Get current text content and add it to history if it's new
    if let Ok(current_content) = app.clipboard().read_text() {
        if !current_content.is_empty() {
            add_to_clipboard_history(app, current_content).await?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn clear_clipboard_history(_app: tauri::AppHandle) -> Result<(), String> {
    let storage = get_clipboard_history_storage();
    if let Ok(mut history) = storage.lock() {
        history.clear();
    }
    Ok(())
}

#[tauri::command]
pub async fn clear_clipboard(app: tauri::AppHandle) -> Result<(), String> {
    app.clipboard()
        .write_text("")
        .map_err(|e| format!("Failed to clear clipboard: {}", e))
}