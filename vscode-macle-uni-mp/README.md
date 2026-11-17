# Macle Mini Program Tools for uni-app

VS Code integration for the `@macle/uni-mp` uni-app compatibility plugin.

Use **Macle: Compile & Preview in Macle** or the status-bar button to start a development build and hand it off to the official Macle MiniProgram Tools extension. The extension includes the Macle compiler plugin bundle, live API/component diagnostics with Macle documentation links, Vue built-in and MAUI component/known-attribute IntelliSense, guard-only quick fixes, conditional-compilation snippets and decorations, and a report webview with source-map navigation.

The official `MacleTeam.macle-miniprogram-tools` extension is optional; when installed, compile-and-preview invokes its simulator command after output changes. Generated files are written to `dist/dev/mp-macle`. Simulator project selection is handled by the official extension. The project still needs its normal uni-app dependencies, including the local `uni` CLI.

The first build copies the bundled plugin into `node_modules/.cache/` and adds that relative path to the project's Vite config, so the config does not contain a machine-specific extension path. The extension refreshes the cached core on each build and enables source maps for report navigation. Review the config change; the cached file is regenerated if dependencies are reinstalled. The report opens from **Macle: Open Compatibility Report** after a build.

MAUI completions use the `maui-*` component tags. The MAUI library is distributed separately: copy its `dist` files into the app and register each component in `usingComponents` as described in the linked documentation.

Use **Macle: Configure MAUI UI Library** to select a library folder containing `dist/` (or select `dist/` itself). The extension copies files into the configured project-relative `macle.maui.targetFolder` (default `maui-components`), scans routes in `pages.json` and `src/pages.json` for MAUI tags in page templates, then adds registrations to each matching page's `style.usingComponents`. Existing files and registrations are preserved; conflicts and component entries not found in the selected library are reported instead of being overwritten or guessed.
