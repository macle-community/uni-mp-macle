# @macle/uni-mp

Compile **uni-app** (Vue 3 / Vite) projects directly into **Macle Mini Program** format (`.maml`, `.mass`, `.sjs`, `ma.*`) with automatic compatibility reporting.

## 1. Setup
hhahs

Install the plugin in your uni-app project:

```bash
npm install -D @macle/uni-mp
```

The TypeScript sources in `src/`, `scripts/`, and `hbuilderx-plugin/` compile to CommonJS JavaScript with `npm run build`. The main package outputs JavaScript and declaration files to `lib/`; packaging either package runs its build automatically.

Register it in `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import uniMacle from '@macle/uni-mp';

export default defineConfig({
  plugins: [
    uni(),
    uniMacle({
      isAutoOpenReport: true, // Opens HTML compatibility report after build
    }),
  ],
});
```

## 2. Usage for CLI / VS Code Users

Run via the included CLI wrapper (automatically sets `UNI_CUSTOM_PLATFORM=mp-macle` and outputs to `dist/dev/mp-macle` or `dist/build/mp-macle`):

```bash
# Watch mode
npx uni-macle

# Production build
npx uni-macle build
```

## 3. Usage for HBuilderX Users

Add the following `uni-app.scripts` block to your project's `package.json`:

```json
{
  "uni-app": {
    "scripts": {
      "mp-macle": {
        "title": "Macle MiniProgram",
        "env": {
          "UNI_PLATFORM": "mp-weixin",
          "UNI_CUSTOM_PLATFORM": "mp-macle"
        },
        "define": {
          "MP-MACLE": true
        }
      }
    }
  }
}
```

Then click **Run -> Run to Mini Program Simulator -> Macle MiniProgram** inside HBuilderX. You can also use `// #ifdef MP-MACLE` in your `.vue`, `.js`, and `.scss` files.

## 4. VS Code Extension

The standalone extension in [`vscode-macle-uni-mp/`](./vscode-macle-uni-mp/) bundles the Macle compiler and adds an **Macle** Activity Bar view with quick-action links, plus:

- **Macle: Compile & Preview in Macle** and a status-bar button; this starts the project's local uni CLI, writes to `dist/dev/mp-macle`, and invokes the official Macle simulator command when `MacleTeam.macle-miniprogram-tools` is installed.
- Live warnings for unsupported APIs and Vue template components, with conditional-compilation quick fixes and Macle documentation links. Vue templates also get built-in and MAUI component/known-attribute IntelliSense.
- **Macle: Configure MAUI UI Library** selects the separately downloaded MAUI library folder, copies its `dist` files to the project, and registers detected MAUI tags on matching pages without replacing existing files or component registrations.
- `ifdef-macle` / `ifndef-macle` snippets and conditional block highlighting.
- A compatibility report webview with source-map jumps for script findings and direct Vue-template component locations where available.

Run `npm run build`, then package `vscode-macle-uni-mp/` with VSCE to install it. The target uni-app project still needs its dependencies installed and a local `uni` CLI. The extension copies its bundled core to `node_modules/.cache/` and adds that relative import to the project's Vite config when you first build; review that config change as you would any project edit. Existing HBuilderX workflows are unchanged.
