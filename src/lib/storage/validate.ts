export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

export type UploadKind = 'product-image' | 'mask' | 'receipt';
export type DetectedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'application/pdf';

const ALLOWED: Record<UploadKind, DetectedType[]> = {
  'product-image': ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  mask: ['image/png', 'image/webp'],
  receipt: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const EXTENSION: Record<DetectedType, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'application/pdf': 'pdf',
};

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

/** Identifies a file by its content, not by the name or type the browser claims. */
export function sniffFileType(bytes: Uint8Array): DetectedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp';
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12))) return 'image/avif';
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

export type UploadCheck =
  | { ok: true; mime: DetectedType; extension: string }
  | { ok: false; error: string };

export function validateUpload(bytes: Uint8Array, kind: UploadKind, declaredType?: string): UploadCheck {
  if (bytes.length === 0) return { ok: false, error: 'The file is empty.' };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: 'The file is too large. The limit is 4 MB.' };
  const detected = sniffFileType(bytes);
  if (!detected || !ALLOWED[kind].includes(detected)) {
    const allowed = ALLOWED[kind].map((type) => type.split('/')[1].toUpperCase()).join(', ');
    return { ok: false, error: `That file type is not allowed. Use ${allowed}.` };
  }
  if (declaredType && declaredType !== detected) return { ok: false, error: 'The file does not match its declared type.' };
  return { ok: true, mime: detected, extension: EXTENSION[detected] };
}
