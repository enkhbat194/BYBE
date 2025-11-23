// src-tauri/src/lib.rs
use tauri::{command, State, AppHandle};
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result as SqlResult};
use uuid::Uuid;
use reqwest;

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
  pub id: String,
  pub name: String,
  pub path: String,
  pub r#type: String, // "file" | "folder"
  pub content: Option<String>,
  pub children: Option<Vec<FileNode>>,
}

#[command]
pub fn read_file(path: String) -> Result<String, String> {
  fs::read_to_string(path).map_err(|e| e.to_string())
}

#[command]
pub fn write_file(path: String, content: String) -> Result<bool, String> {
  fs::write(path, content).map_err(|e| e.to_string())?;
  Ok(true)
}

#[command]
pub fn list_dir(path: String) -> Result<Vec<FileNode>, String> {
  let entries = fs::read_dir(path)?;
  let mut files = vec![];
  for entry in entries {
    let entry = entry?;
    let metadata = entry.metadata()?;
    let name = entry.file_name().to_string_lossy().to_string();
    let full_path = entry.path().to_string_lossy().to_string();
    let node = FileNode {
      id: Uuid::new_v4().to_string(),
      name,
      path: full_path.clone(),
      r#type: if metadata.is_dir() { "folder".to_string() } else { "file".to_string() },
      content: None,
      children: None,
    };
    files.push(node);
  }
  Ok(files)
}

#[command]
pub async fn ai_chat(provider: String, model: String, message: String, api_key: String) -> Result<String, String> {
  let client = reqwest::Client::new();
  let url = match provider.as_str() {
    "openrouter" => "https://openrouter.ai/api/v1/chat/completions",
    "groq" => "https://api.groq.com/openai/v1/chat/completions",
    _ => return Err("Unsupported provider".to_string()),
  };

  let body = serde_json::json!({
    "model": model,
    "messages": [{"role": "user", "content": message}]
  });

  let response = client.post(url)
    .header("Authorization", format!("Bearer {}", api_key))
    .header("Content-Type", "application/json")
    .json(&body)
    .send()
    .await
    .map_err(|e| e.to_string())?;

  let text = response.text().await.map_err(|e| e.to_string())?;
  Ok(text)
}

#[command]
pub fn init_db(path: String) -> SqlResult<()> {
  let conn = Connection::open(path)?;
  conn.execute(
    "CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      path TEXT NOT NULL,
      content TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )",
    [],
  )?;
  Ok(())
}

#[command]
pub fn spawn_terminal(command: String) -> Result<String, String> {
  // Basic spawn, stream via events in future
  let output = std::process::Command::new("cmd")
    .arg("/c")
    .arg(&command)
    .output()
    .map_err(|e| e.to_string())?;
  Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn init(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  // Init DB state or other setup
  Ok(())
}