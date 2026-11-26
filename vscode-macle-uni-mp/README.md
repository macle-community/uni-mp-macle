# Telebirr miniapp dev kit

All-in-one VS Code extension for building, previewing, debugging, and validating **Telebirr / Macle** mini-programs across **Vue 3 (uni-app)**, **React (Taro)**, and **Pure Macle** projects.

---

## Features

### 1. Project Scaffolding
Open the **Telebirr miniapp dev kit** icon in the Activity Bar and click **New Project** (`macle.createProject`) to scaffold:
- **Vue 3 + uni-app** (with automatic `@macle/uni-mp` Vite plugin integration)
- **React + Taro**
- **Pure Macle** (`maml` / `mass` / `js` / `sjs`)

### 2. Embedded Mobile Simulator
Run **Build & Run with Simulator** (`macle.compileAndPreview`) or click **Macle Preview** in the status bar to compile your project and open it in the built-in **Macle Simulator** Webview inside VS Code:
- **Mobile Device Frame**: Renders inside a responsive smartphone shell with preset sizes (`Mobile 375×812`, `Pro 390×844`, `Android 412×915`, or `Full Width`).
- **Live Reload on Save**: Automatically recompiles changes and refreshes the embedded simulator without opening extra desktop windows.
- **Flexible Launch Targets**: Switch between `vscode` (embedded panel, default), `standalone` (desktop simulator window), or `browser` (`@macle-community/simulator-web` / web simulator) via `macle.simulator.openIn`.

### 3. Compilation & Watch Mode
- **uni-app / Taro**: Automatically injects the bundled `@macle/uni-mp` plugin into `node_modules/.cache/` and updates your Vite config using a portable relative path, builds `dist/dev/mp-macle`, and compiles via `macle-compiler` into `~/.macle/target/compile/<projectName>/app`.
- **Pure Macle**: Compiles directly with `macle-compiler` to `~/.macle/target/compile/<projectName>/app` (or release output) and watches source files for changes (`Macle: Start Watching Changes`).

### 4. Run & Debug Profiles
Use **Macle: Configure Run and Debug** (`macle.configureRunAndDebug`) to generate `.vscode/launch.json` and `.vscode/tasks.json` entries tailored to your project type.

### 5. Compatibility Diagnostics, IntelliSense & Report
- **Live Diagnostics**: Highlights unsupported or guarded WeChat/uni-app APIs and components with links to Macle documentation and guard-only quick fixes.
- **IntelliSense & Snippets**: Autocomplete for Vue built-in components, `maui-*` components, known attributes, and conditional-compilation snippets (`#ifdef` / `#ifndef`) with visual decorations.
- **Compatibility Report**: Run **Macle: Open Compatibility Report** after a build to inspect transformed files and jump directly to source lines.

### 6. MAUI UI Library Integration
Use **Macle: Configure MAUI UI Library** (`macle.configureMauiLibrary`) to select a MAUI `dist/` folder. The extension copies assets into `macle.maui.targetFolder` (default: `maui-components`), scans `pages.json` / `src/pages.json` and page templates for `maui-*` tags, and registers matching components in each page's `style.usingComponents` without overwriting existing entries.

---

## Commands

| Command | Description |
| --- | --- |
| `Macle: New Project` | Create a new Pure Macle, React Taro, or Vue 3 uni-app project. |
| `Macle: Build & Run with Simulator` | Start dev build/watch and open the simulator. |
| `Macle: Start Watching Changes` | Watch project files and auto-recompile on save. |
| `Macle: Compile for Macle` | Run a debug compilation to `~/.macle/target/compile/<projectName>/app`. |
| `Macle: Compile for Macle (Release / Pack)` | Run a release compilation/pack build. |
| `Macle: Open Web Simulator` | Open the standalone/web simulator. |
| `Macle: Open Compatibility Report` | Open the compatibility report Webview for the latest build. |
| `Macle: Configure MAUI UI Library` | Copy MAUI `dist/` assets and register `usingComponents` in `pages.json`. |
| `Macle: Configure Run and Debug` | Generate `.vscode/launch.json` and `.vscode/tasks.json` profiles. |
| `Macle: Show Welcome Page` | Open the Telebirr miniapp dev kit welcome page. |

---

## Extension Settings

| Setting | Default | Description |
| --- | --- | --- |
| `macle.simulator.openIn` | `"vscode"` | Where to open the simulator: `"vscode"`, `"standalone"`, or `"browser"`. |
| `macle.simulator.type` | `"platform"` | Simulator runtime preference: `"platform"`, `"web"`, or `"auto"`. |
| `macle.simulator.path` | `""` | Custom path to a `macle-simulator` executable. |
| `macle.compiler.path` | `""` | Custom path to `macle-compiler` or `engine-compiler/index.js`. |
| `macle.toolkit.localPath` | `""` | Path to a local Macle DevToolkit directory. |
| `macle.toolkit.configFile` | `""` | Optional path to a custom `toolkit-config.json`. |
| `macle.maui.targetFolder` | `"maui-components"` | Project-relative folder where MAUI `dist` files are copied. |
