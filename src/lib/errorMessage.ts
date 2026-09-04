import { ApiError } from './apiClient';

/**
 * Turns any caught error into copy safe to show a seller. A deny-list gate, not trust-by-default:
 * backend VALIDATION_ERROR/CONFLICT messages are usually fine ("This item already has a Black/M
 * variant.") but occasionally leak developer detail (camelCase fields, quoted JSON keys, Mongo
 * ObjectIds, the word "multipart") — isSellerSafe() rejects anything that looks like that and
 * falls back to the caller-supplied copy instead.
 */
export function sellerMessage(err: unknown, fallback: string): string {
  if (err instanceof TypeError || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return "You're offline. Check your connection and try again.";
  }

  if (!(err instanceof ApiError)) {
    if (err instanceof Error) console.warn('[sellerMessage] non-ApiError:', err);
    return fallback;
  }

  switch (err.code) {
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return 'Your sign-in has expired. Enter your shop key again.';
    case 'NOT_FOUND':
      return "That's not there any more. Pull down to refresh.";
    case 'UPSTREAM_ERROR':
      return "That service isn't responding right now. Try again in a minute.";
    case 'INTERNAL_ERROR':
    case 'UNKNOWN':
      return 'Something went wrong on our side. Try again.';
    case 'OUT_OF_STOCK':
      return 'That size is out of stock.';
    case 'VALIDATION_ERROR':
    case 'CONFLICT':
      return isSellerSafe(err.message) ? err.message : fallback;
    default:
      console.warn('[sellerMessage] unhandled ApiError code:', err.code, err.message);
      return fallback;
  }
}

const UNSAFE_PATTERNS = [
  /[a-z][A-Z]/, // camelCase field names, e.g. "basePriceMajor"
  /"[A-Za-z_]+"/, // quoted identifiers, e.g. "payload"
  /\b[0-9a-f]{24}\b/i, // Mongo ObjectId
  /[{}[\]]/, // raw JSON fragments
  /multipart|payload|ObjectId|Mongo|E11000|\bJSON\b|schema|\bfield\b|\bundefined\b|\bnull\b/i,
];

function isSellerSafe(message: string): boolean {
  if (message.length === 0 || message.length > 160) return false;
  if (!/^[A-Z]/.test(message)) return false;
  return !UNSAFE_PATTERNS.some((pattern) => pattern.test(message));
}
