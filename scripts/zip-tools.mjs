#!/usr/bin/env node
/**
 * Diagnostic + resilient extractor for Macle toolkit archives.
 *
 * Usage:
 *   node scripts/extract-simulator.mjs                       # search /sdcard/Download for archives + analyze
 *   node scripts/extract-simulator.mjs <zip> <outdir>        # analyze + extract a specific zip
 *
 * Why: some vendor zips (e.g. Macle_26.6.0-LG0001_DevSuite_Simulator.zip) lack a valid
 * central directory. Standard extractors (extract-zip/yauzl, Info-ZIP unzip) require it
 * and fail with "Invalid file". RAR/7-Zip scan local file headers as a fallback — so do we.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const MB = 1024 * 1024;
export { MB };

export function fmtSize(n) {
  if (n >= MB) return `${(n / MB).toFixed(1)} MB`;
  return `${n} bytes`;
}

export function readSignature(p) {
  try {
    const fd = fs.openSync(p, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf;
  } catch {
    return null;
  }
}

export function findEocd(fd, fileSize) {
  // Scan backwards for EOCD signature PK\x05\x06 (max comment 65535 + 22)
  const scanLen = Math.min(fileSize, 22 + 65535 + 64);
  const start = Math.max(0, fileSize - scanLen);
  const len = fileSize - start;
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, start);
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      return { offset: start + i, buf, index: i };
    }
  }
  return null;
}

export function analyzeCentralDirectory(p) {
  const report = { hasEocd: false, entries: [] };
  let fd;
  try {
    fd = fs.openSync(p, 'r');
    const fileSize = fs.fstatSync(fd).size;
    const eocd = findEocd(fd, fileSize);
    if (!eocd) return report;
    report.hasEocd = true;
    const { buf, index } = eocd;
    let cdSize = buf.readUInt32LE(index + 12);
    let cdOffset = buf.readUInt32LE(index + 16);
    const entryCount = buf.readUInt16LE(index + 10);

    // Check for ZIP64 EOCD locator just before EOCD
    if (eocd.offset >= 20) {
      const loc = Buffer.alloc(20);
      fs.readSync(fd, loc, 0, 20, eocd.offset - 20);
      if (loc.readUInt32LE(0) === 0x07064b50) {
        const z64Offset = Number(loc.readBigUInt64LE(8));
        const z64 = Buffer.alloc(56);
        fs.readSync(fd, z64, 0, 56, z64Offset);
        if (z64.readUInt32LE(0) === 0x06064b50) {
          report.zip64 = true;
          report.entryCount = Number(z64.readBigUInt64LE(32));
          report.cdSize = Number(z64.readBigUInt64LE(40));
          report.cdOffset = Number(z64.readBigUInt64LE(48));
        }
      }
    }
    if (report.entryCount === undefined) {
      report.entryCount = entryCount;
      report.cdSize = cdSize;
      report.cdOffset = cdOffset;
    }
    report.cdWithinFile = report.cdOffset + report.cdSize <= fileSize;
    if (report.cdWithinFile && report.cdSize < 512 * MB) {
      const cd = Buffer.alloc(report.cdSize);
      fs.readSync(fd, cd, 0, report.cdSize, report.cdOffset);
      let pos = 0;
      while (pos + 46 <= cd.length && report.entries.length < 1000) {
        if (cd.readUInt32LE(pos) !== 0x02014b50) break;
        const method = cd.readUInt16LE(pos + 10);
        const compSize = cd.readUInt32LE(pos + 20);
        const uncompSize = cd.readUInt32LE(pos + 24);
        const nameLen = cd.readUInt16LE(pos + 28);
        const extraLen = cd.readUInt16LE(pos + 30);
        const commentLen = cd.readUInt16LE(pos + 32);
        const localOffset = cd.readUInt32LE(pos + 42);
        const name = cd.slice(pos + 46, pos + 46 + nameLen).toString('utf8');
        report.entries.push({ name, method, compSize, uncompSize, localOffset });
        pos += 46 + nameLen + extraLen + commentLen;
      }
    }
  } catch (e) {
    report.error = String(e);
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch {}
  }
  return report;
}
