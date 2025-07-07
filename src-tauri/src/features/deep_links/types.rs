use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeepLinkData {
    pub url: String,
    pub scheme: String,
    pub host: String,
    pub path: String,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeepLinkResult {
    pub success: bool,
    pub message: String,
    pub data: Option<DeepLinkData>,
}