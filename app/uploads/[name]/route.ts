// Serves uploaded photos from UPLOAD_DIR at /uploads/<name>. Only exact generated names are served (no path tricks).
import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { uploadDir, diskPathFor, UPLOAD_NAME } from '../../../lib/storage.ts';

export const dynamic = 'force-dynamic';
const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const dir = uploadDir();
  if (!dir || !UPLOAD_NAME.test(name)) return new NextResponse('Not found', { status: 404 });
  try {
    const data = await readFile(diskPathFor(dir, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[name.split('.').pop()!],
        'Cache-Control': 'public, max-age=31536000, immutable', // names are random and never reused
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
