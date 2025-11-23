#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod lib;

use lib::{read_file, write_file, list_dir, ai_chat, init_db, spawn_terminal};
use tauri::{Manager, State};

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      read_file,
      write_file,
      list_dir,
      ai_chat,
      init_db,
      spawn_terminal
    ])
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        use tauri::menu::{MenuBuilder, MenuItemBuilder};
        let menu = MenuBuilder::new(app).items(&[
          &MenuItemBuilder::with_id("Quit", "Quit").build(app)?,
        ]).build(app)?;
        app.get_window("main").unwrap().set_menu(Some(menu))?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}