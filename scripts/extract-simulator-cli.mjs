#!/usr/bin/env node
/**
 * CLI wrapper: search /sdcard/Download for archives, analyze them, and
 * optionally extract a specific zip with the local-header-scan extractor.
 *
 * Usage:
 *   node scripts/extract-simulator-cli.mjs                       # search + report
 *   node scripts/extract-simulator-cli.mjs <zip> <outdir>        # analyze + extract
 */
import fs from 'node:fs';
import path from 'node:path';
import { runExtract, searchForZips } from './extract-simulator.mjs';
import { fmtSize } from './zip-tools.mjs';

const args = process.argv.slice(2);

if (args.length >= 2) {
  runExtract(args[0], args[1]);
} else {
  const roots = ['/sdcard/Download', '/storage/emulated/0/Download', '/sdcard'];
  console.log('Searching for archives under:', roots.join(', '));
  const found = searchForZips(roots, 1024);
  if (found.length === 0) {
    console.log('\nNo files ≥ 1 KB found under those paths.');
    process.exit(0);
  }
  console.log(`\nFound ${found.length} files (newest first, showing up to 40):`);
  for (const f of found.slice(0, 40)) {
    console.log(`  ${f.isZip ? 'ZIP?' : '    '} ${fmtSize(f.size).padStart(10)}  ${f.path}`);
  }
  console.log(`\nTo analyze/extract one, run:`);
  console.log(`  node scripts/extract-simulator-cli.mjs "<zip path>" "<output dir>"`);
}
