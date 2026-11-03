// Identifies an image from its actual BYTES (never from its file name or the browser's claimed type) and reads its size.
// Supports JPEG, PNG and WebP only. Anything else (SVG, GIF, HTML renamed to .jpg, executables…) returns null.
export type ImageInfo = { ext: 'jpg' | 'png' | 'webp'; mime: 'image/jpeg' | 'image/png' | 'image/webp'; width: number; height: number };

export const MAX_SIDE = 12000; // pixels
export const MAX_PIXELS = 100_000_000;

function jpeg(b: Buffer): ImageInfo | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1];
    while (marker === 0xff && i + 2 < b.length) { i++; marker = b[i + 1]; } // fill bytes
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { ext: 'jpg', mime: 'image/jpeg', height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

function png(b: Buffer): ImageInfo | null {
  if (b.length < 24 || b.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { ext: 'png', mime: 'image/png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function webp(b: Buffer): ImageInfo | null {
  if (b.length < 30) return null;
  const kind = b.toString('ascii', 12, 16);
  let width = 0, height = 0;
  if (kind === 'VP8 ') { width = b.readUInt16LE(26) & 0x3fff; height = b.readUInt16LE(28) & 0x3fff; }
  else if (kind === 'VP8L') { const v = b.readUInt32LE(21); width = (v & 0x3fff) + 1; height = ((v >> 14) & 0x3fff) + 1; }
  else if (kind === 'VP8X') { width = 1 + b.readUIntLE(24, 3); height = 1 + b.readUIntLE(27, 3); }
  else return null;
  return { ext: 'webp', mime: 'image/webp', width, height };
}

export function inspectImage(b: Buffer): ImageInfo | null {
  let info: ImageInfo | null = null;
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) info = jpeg(b);
  else if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) info = png(b);
  else if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') info = webp(b);
  if (!info) return null;
  if (!(info.width > 0 && info.height > 0) || info.width > MAX_SIDE || info.height > MAX_SIDE || info.width * info.height > MAX_PIXELS) return null;
  return info;
}
