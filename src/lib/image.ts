// Prepares a seller-picked photo for upload. Sellers shoot on iPhones for the camera quality, so
// this is the highest-stakes flow in the app — two real defects it fixes:
//
// 1. HEIC: iPhones shoot HEIC by default, and the backend (sharp) only accepts JPEG/PNG/WebP.
//    iOS Safari transcodes HEIC -> JPEG on pick, but ONLY when the <input accept> attribute
//    excludes HEIC — see ACCEPT_ATTR below, which is load-bearing, not decoration.
// 2. Size: a 48MP iPhone photo transcoded to JPEG can exceed the backend's 8MB multipart limit,
//    and the backend only ever derives a 1024px match image anyway, so uploading the original is
//    both risky and wasteful on mobile data.
//
// Fix: downscale in-browser to 2048px on the long edge before upload. No new dependency.

export const ACCEPT_ATTR = 'image/png,image/jpeg,image/webp';
export const MAX_DIMENSION = 2048;
export const MAX_BYTES = 8 * 1024 * 1024;
export const JPEG_QUALITY = 0.85;

export class UnsupportedImageError extends Error {}
export class ImageTooLargeError extends Error {}

function looksLikeHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
}

/** Resizes/re-encodes a picked photo to a JPEG File under MAX_BYTES, capped at MAX_DIMENSION on
 * the long edge. Skips re-encoding when the file is already small enough. Throws
 * UnsupportedImageError for an unexpected HEIC file, ImageTooLargeError if the result still
 * exceeds MAX_BYTES (the safety net after downscaling). */
export async function prepareUpload(file: File): Promise<File> {
  if (looksLikeHeic(file)) {
    throw new UnsupportedImageError("That photo format isn't supported — pick it from your Photos library and we'll convert it.");
  }

  if (file.size <= MAX_BYTES) {
    const bitmap = await safeDecode(file);
    if (bitmap && bitmap.width <= MAX_DIMENSION && bitmap.height <= MAX_DIMENSION) {
      bitmap.close?.();
      return file;
    }
    bitmap?.close?.();
  }

  const bitmap = await safeDecode(file);
  if (!bitmap) {
    // Couldn't decode client-side (unusual format, or a browser without createImageBitmap) —
    // fall through and let the server validate; the 8MB check below still applies.
    if (file.size > MAX_BYTES) {
      throw new ImageTooLargeError('That photo is too big. Pick one under 8 MB.');
    }
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close?.();
    if (file.size > MAX_BYTES) throw new ImageTooLargeError('That photo is too big. Pick one under 8 MB.');
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) {
    if (file.size > MAX_BYTES) throw new ImageTooLargeError('That photo is too big. Pick one under 8 MB.');
    return file;
  }
  if (blob.size > MAX_BYTES) {
    throw new ImageTooLargeError('That photo is too big. Pick one under 8 MB.');
  }

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

async function safeDecode(file: File): Promise<ImageBitmap | null> {
  try {
    // imageOrientation: 'from-image' bakes in EXIF rotation — otherwise iPhone portrait photos
    // upload sideways, a classic and very visible bug in a product about photos.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
}
