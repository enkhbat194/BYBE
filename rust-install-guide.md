# Rust + Tauri Setup Guide for Windows 11

## Step 1: Install Visual Studio Build Tools (Required for Rust MSVC)
1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run installer → "C++ build tools" workload
3. Select:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 11 SDK (latest)
4. Install (~3GB, 10-20min)
5. Restart VSCode/Terminal

## Step 2: Install Rust
1. Download: https://win.rustup.rs/ (rustup-init.exe)
2. Run as Administrator: `rustup-init.exe -y`
3. Choose default: `1) Proceed with installation (default)`
4. Restart Terminal
5. Verify:
   ```
   rustc --version  # rustc 1.81.0 (or similar)
   cargo --version  # cargo 1.81.0
   rustup default stable-msvc
   ```

## Step 3: Install Tauri CLI
```
cargo install tauri-cli
cargo tauri --version  # tauri-cli 1.x.x
```

## Common Errors & Fixes
- **link.exe failed**: Install VS Build Tools C++ workload
- **cargo not found**: Add `%USERPROFILE%\.cargo\bin` to PATH (restart terminal/VSCode)
- **Proxy error**: `rustup default stable-msvc` proxy off
- **Antivirus**: Allow rustup-init.exe
- **venv conflict**: Deactivate venv first `deactivate`

## Verify All
```
rustc --version
cargo --version
cargo tauri info
```

Success → Ready for `cargo tauri init` in next step.

**Time: 30-60min**