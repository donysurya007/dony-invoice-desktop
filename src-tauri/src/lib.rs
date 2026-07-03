#[tauri::command]
fn save_document_pdf(default_file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let selected_path = rfd::FileDialog::new()
        .add_filter("PDF", &["pdf"])
        .set_file_name(&default_file_name)
        .save_file();

    let Some(mut path) = selected_path else {
        return Err("Dibatalkan".to_string());
    };

    if path.extension().and_then(|value| value.to_str()) != Some("pdf") {
        path.set_extension("pdf");
    }

    std::fs::write(&path, bytes).map_err(|error| error.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![save_document_pdf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
