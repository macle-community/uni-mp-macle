# @macle/uni-mp

Compile **uni-app** (Vue 3 / Vite) projects directly into **Macle Mini Program** format (`.maml`, `.mass`, `.sjs`, `ma.*`) with automatic compatibility reporting.

## 1. Setup

Install the plugin in your uni-app project:

```bash
npm install -D @macle/uni-mp

```

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
