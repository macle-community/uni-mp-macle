import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fmtSize, readSignature, analyzeCentralDirectory } from './zip-tools.mjs';

const SIG_LOCAL   = 0x04034b50;
const SIG_SPANNED = 0x08074b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD    = 0x05064b50;
const SIG_ZIP64_EOCD = 0x06064b50;
const SIG_ZIP64_LOC = 0x07064b50;

export function safeJoin(base, name) {
  const cleaned = name.replace(/\\/g, '/').replace(/^\/+/, '');
  const target = path.resolve(base, cleaned);
  const baseResolved = path.resolve(base);
  if (!target.startsWith(baseResolved + path.sep) && target !== baseResolved) {
    return path.join(baseResolved, path.basename(cleaned));
  }
  return target;
}

/** Extract by scanning local file headers sequentially (no central directory needed). */
export function extractByLocalHeaderScan(zipPath, outDir) {
  const fd = fs.openSync(zipPath, 'r');
  const fileSize = fs.fstatSync(fd).size;
  const header = Buffer.alloc(30);
  const results = {
    extracted: 0, skipped: 0, failed: 0,
    unsupported: [], bytes: 0,
    methods: {}, scanPos: 0,
  };

  let pos = 0;
  let nameBuf = Buffer.alloc(1024);

  while (pos + 4 <= fileSize) {
    // Fast-scan: read 4 bytes and check for PK signature
    const window = Buffer.alloc(Math.min(4, fileSize - pos));
    fs.readSync(fd, window, 0, window.length, pos);
    if (window[0] !== 0x50 || window[1] !== 0x4b) { pos++; continue; }
    const sig = window.readUInt32LE(0);

    if (sig === SIG_LOCAL) {
      fs.readSync(fd, header, 0, 30, pos);
      const flags    = header.readUInt16LE(6);
      const method   = header.readUInt16LE(8);
      const crc32    = header.readUInt32LE(14);
      let compSize   = header.readUInt32LE(18);
      let uncompSize = header.readUInt32LE(22);
      const nameLen  = header.readUInt16LE(26);
      const extraLen = header.readUInt16LE(28);
      const hasDataDescriptor = (flags & 0x8) !== 0;

      if (nameLen > nameBuf.length) nameBuf = Buffer.alloc(nameLen * 2);
      const name = nameBuf.slice(0, nameLen);
      fs.readSync(fd, name, 0, nameLen, pos + 30);
      const extra = extraLen > 0 ? Buffer.alloc(extraLen) : Buffer.alloc(0);
      if (extraLen > 0) fs.readSync(fd, extra, 0, extraLen, pos + 30 + nameLen);

      // ZIP64 extra field: sizes may be 0xFFFFFFFF placeholders
      let ep = 0;
      while (ep + 4 <= extra.length) {
        const id   = extra.readUInt16LE(ep);
        const esiz = extra.readUInt16LE(ep + 2);
        if (id === 0x0001) {
          let fp = ep + 4;
          if (uncompSize === 0xffffffff && fp + 8 <= ep + 4 + esiz) {
            uncompSize = Number(extra.readBigUInt64LE(fp)); fp += 8;
          }
          if (compSize === 0xffffffff && fp + 8 <= ep + 4 + esiz) {
            compSize = Number(extra.readBigUInt64LE(fp)); fp += 8;
          }
        }
        ep += 4 + esiz;
      }

      const nameStr = name.toString('utf8');
      results.methods[method] = (results.methods[method] || 0) + 1;

      // --- Directory entry ---
      if (nameStr.endsWith('/') || (uncompSize === 0 && compSize === 0)) {
        fs.mkdirSync(safeJoin(outDir, nameStr), { recursive: true });
        results.skipped++;
        pos = pos + 30 + nameLen + extraLen;
        continue;
      }

      // --- Unsupported compression ---
      if (method !== 0 && method !== 8) {
        results.unsupported.push({ name: nameStr, method, note: 'unsupported compression' });
        results.failed++;
        pos = pos + 30 + nameLen + extraLen + compSize;
        continue;
      }

      // --- Data descriptor (streaming, size unknown from header) ---
      if (hasDataDescriptor && compSize === 0xffffffff) {
        results.unsupported.push({ name: nameStr, method, note: 'data descriptor streaming (unknown size)' });
        results.failed++;
        // Find next local header to continue
        pos = pos + 30 + nameLen + extraLen;
        continue;
      }

      const dataStart = pos + 30 + nameLen + extraLen;
      const payload = Buffer.alloc(compSize);
      fs.readSync(fd, payload, 0, compSize, dataStart);

      const outPath = safeJoin(outDir, nameStr);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      try {
        const out = method === 0 ? payload : zlib.inflateRawSync(payload);
        if (uncompSize !== 0xffffffff && out.length !== uncompSize) {
          // CRC mismatch warning but still extract
        }
        fs.writeFileSync(outPath, out);
        results.extracted++;
        results.bytes += out.length;
      } catch (e) {
        results.failed++;
        results.unsupported.push({ name: nameStr, method, note: String(e).slice(0, 120) });
      }

      pos = dataStart + compSize;

    } else if (sig === SIG_SPANNED || sig === SIG_CENTRAL || sig === SIG_EOCD ||
               sig === SIG_ZIP64_EOCD || sig === SIG_ZIP64_LOC) {
      pos += 4;
    } else {
      pos++;
    }
  }

  try { fs.closeSync(fd); } catch {}
  return results;
}

/** Search for zip files ≥ minSize under directories, newest first. */
export function searchForZips(rootDirs, minSize = 1) {
  const found = [];
  const visit = (dir, depth) => {
    if (depth > 8) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full, depth + 1);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(full);
          if (stat.size >= minSize) {
            const sig = readSignature(full);
            found.push({
              path: full, size: stat.size, mtime: stat.mtime,
              isZip: sig && sig[0] === 0x50 && sig[1] === 0x4b,
            });
          }
        } catch {}
      }
    }
  };
  for (const root of rootDirs) visit(root, 0);
  // Sort newest first
  found.sort((a, b) => b.mtime - a.mtime);
  return found;
}

export function runExtract(zipPath, outDir) {
  console.log(`\n=== Analyzing: ${zipPath} ===`);
  const stat = fs.statSync(zipPath);
  console.log(`Size: ${fmtSize(stat.size)} (${stat.size} bytes)`);
  const sig = readSignature(zipPath);
  const isZip = sig && sig[0] === 0x50 && sig[1] === 0x4b;
  console.log(`PK signature: ${sig ? sig.toString('hex') : 'unreadable'} ${isZip ? '(zip ✓)' : '(NOT zip!)'}`);

  const cd = analyzeCentralDirectory(zipPath);
  console.log(`Central directory: ${cd.hasEocd ? 'found ✓' : 'MISSING ✗'}`);
  if (cd.hasEocd) {
    console.log(`  Entries: ${cd.entryCount}, CD offset: ${cd.cdOffset}, CD size: ${fmtSize(cd.cdSize)}`);
    console.log(`  CD within file bounds: ${cd.cdWithinFile ? 'yes ✓' : 'NO — truncated or offset wrong ✗'}`);
    if (cd.zip64) console.log(`  ZIP64 format: yes`);
    if (cd.entries.length > 0) {
      console.log(`  First 5 entries:`);
      for (const e of cd.entries.slice(0, 5)) {
        console.log(`    ${e.name} (method ${e.method}, ${fmtSize(e.compSize)} → ${fmtSize(e.uncompSize)})`);
      }
    }
  } else {
    console.log(`  No EOCD found — this is a streaming/truncated zip`);
    console.log(`  The 'Invalid file' error from standard unzip is expected here.`);
    console.log(`  RAR works because it falls back to local header scanning.`);
  }

  // Attempt extraction with local header scan
  console.log(`\n=== Extracting via local header scan (no central directory needed) ===`);
  const out = extractByLocalHeaderScan(zipPath, outDir);
  console.log(`Extracted: ${out.extracted}, Skipped (dirs): ${out.skipped}, Failed: ${out.failed}`);
  console.log(`Bytes written: ${fmtSize(out.bytes)}`);
  const methodNames = { 0: 'stored', 1: 'shrunk', 2: 'reduced1', 3: 'reduced2', 4: 'reduced3', 5: 'reduced4', 6: 'imploded', 7: 'reserved', 8: 'deflated', 9: 'deflate64', 12: 'bzip2', 14: 'lzma', 93: 'zstd', 95: 'xz' };
  console.log(`Methods seen: ${JSON.stringify(Object.fromEntries(Object.entries(out.methods).map(([k,v]) => [k, `${methodNames[k]||'?'} ×${v}`])))}`);
  if (out.unsupported.length > 0) {
    console.log(`Unsupported/failed entries:`);
    for (const u of out.unsupported) {
      console.log(`  ${u.name}: method=${u.method} (${methodNames[u.method]||'?'}) — ${u.note}`);
    }
  }
  return out;
}
