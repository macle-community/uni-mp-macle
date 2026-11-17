# Agent Guide

## Project layout

- `src/` contains the TypeScript Vite plugin, compatibility reporter, rules, and WXML/WXSS/JavaScript transformers.
- `scripts/extract-rules.ts` regenerates `src/rules.ts` from the legacy root `index.js`.
- `hbuilderx-plugin/` contains the HBuilderX extension and its separate TypeScript build.
- `lib/`, `scripts/lib/`, and `hbuilderx-plugin/lib/` are generated build output. Edit their TypeScript sources instead.
- `bin/uni-macle.js` is the published CLI wrapper.

## Development

- Install dependencies with `npm install`.
- Run `npm run build` to type-check and compile the plugin, rules generator, and HBuilderX extension.
- Run `npm run extract-rules` only when intentionally refreshing the compatibility rules from root `index.js`; it overwrites `src/rules.ts`.
- `npm pack --dry-run` checks the main package contents. For the HBuilderX extension, use `npm pack --dry-run ./hbuilderx-plugin`.

## Change guidance

- Keep transformer changes focused and preserve the existing conversion/report behavior unless the task calls for a behavior change.
- When changing package entry points or generated files, verify the corresponding build and package configuration too.
- Do not manually edit generated output under `lib/`.
- The repository does not currently define a test script; for behavior changes, add or run focused checks for the affected transformation or plugin hook.
