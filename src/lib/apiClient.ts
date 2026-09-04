import type { AdminSellerSummary, Bank, CatalogImage, CatalogItem, ChannelSummary, FeedHandoff, FeedOrder, NewVariantInput, OnboardingState, SellerProfile, SellerStatus } from './types';

export const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new ApiError(body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}

// No Content-Type header — the browser sets multipart/form-data with the correct boundary itself.
// The backend reads a JSON "payload" field before a "file" field, so callers must append payload first.
async function requestMultipart<T>(token: string, path: string, formData: FormData, method: 'POST' = 'POST'): Promise<T> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new ApiError(body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}

export function getOrders(token: string, status?: string): Promise<{ orders: FeedOrder[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(token, `/feed/orders${query}`);
}

export function getHandoffs(token: string, status?: string): Promise<{ handoffs: FeedHandoff[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(token, `/feed/handoffs${query}`);
}

export function answerHandoff(token: string, handoffId: string, reply: string): Promise<{ outcome: string }> {
  return request(token, `/feed/handoffs/${handoffId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
  });
}

export function takeoverHandoff(token: string, handoffId: string): Promise<{ outcome: string }> {
  return request(token, `/feed/handoffs/${handoffId}/takeover`, { method: 'POST' });
}

export function markSoldOut(token: string, orderId: string): Promise<{ outcome: string }> {
  return request(token, `/feed/orders/${orderId}/sold-out`, { method: 'POST' });
}

export function dispatchOrder(token: string, orderId: string): Promise<{ order: FeedOrder }> {
  return request(token, `/feed/orders/${orderId}/dispatch`, { method: 'POST' });
}

export function deliverOrder(token: string, orderId: string): Promise<{ order: FeedOrder }> {
  return request(token, `/feed/orders/${orderId}/deliver`, { method: 'POST' });
}

// --- Onboarding ---------------------------------------------------------
// signupSeller is the one call a seller makes with no feedToken yet — it hands one out.

export async function signupSeller(
  shopName: string,
): Promise<{ feedToken: string; seller: { id: string; shopName: string; status: SellerStatus } }> {
  const response = await fetch(`${DEFAULT_BASE_URL}/onboarding/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopName }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new ApiError(body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${response.status})`, response.status);
  }

  return response.json();
}

// --- Admin (dev-only, no auth — see backend/src/routes/admin.route.ts) -------

export async function listAdminSellers(): Promise<{ sellers: AdminSellerSummary[] }> {
  const response = await fetch(`${DEFAULT_BASE_URL}/admin/sellers`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new ApiError(body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${response.status})`, response.status);
  }
  return response.json();
}

export function getOnboardingState(token: string): Promise<OnboardingState> {
  return request(token, '/onboarding/state');
}

export function activateSeller(token: string): Promise<{ status: SellerStatus; active: boolean }> {
  return request(token, '/onboarding/activate', { method: 'POST' });
}

export function getMe(token: string): Promise<SellerProfile> {
  return request(token, '/me');
}

export function updateProfile(
  token: string,
  patch: { shopName?: string; shopDescription?: string },
): Promise<{ id: string; shopName: string; shopDescription: string }> {
  return request(token, '/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

export function listChannels(token: string): Promise<{ channels: ChannelSummary[] }> {
  return request(token, '/me/channels');
}

export function connectTelegramChannel(token: string, botToken: string): Promise<{ channel: ChannelSummary }> {
  return request(token, '/me/channels/telegram', { method: 'POST', body: JSON.stringify({ botToken }) });
}

export function disconnectChannel(token: string, routingId: string): Promise<{ deleted: boolean }> {
  return request(token, `/me/channels/${encodeURIComponent(routingId)}`, { method: 'DELETE' });
}

export function listBanks(token: string): Promise<{ banks: Bank[] }> {
  return request(token, '/me/payout/banks');
}

export function createPayout(
  token: string,
  input: { businessName: string; bankCode: string; accountNumber: string; percentageCharge?: number },
): Promise<{ subaccountCode: string }> {
  return request(token, '/me/payout', { method: 'POST', body: JSON.stringify(input) });
}

// --- Catalog -------------------------------------------------------------

export function listCatalogItems(token: string): Promise<{ items: CatalogItem[]; warnings: string[] }> {
  return request(token, '/catalog/items');
}

export interface NewItemInput {
  name: string;
  description: string;
  basePriceMajor: number;
  variants: NewVariantInput[];
  image: File;
}

export function createCatalogItem(
  token: string,
  input: NewItemInput,
): Promise<{ item: CatalogItem; visionReady: boolean; warnings: string[] }> {
  const formData = new FormData();
  formData.append(
    'payload',
    JSON.stringify({ name: input.name, description: input.description, basePriceMajor: input.basePriceMajor, variants: input.variants }),
  );
  formData.append('file', input.image);
  return requestMultipart(token, '/catalog/items', formData);
}

export function updateCatalogItem(
  token: string,
  itemId: string,
  patch: { name?: string; description?: string; basePriceMajor?: number; available?: boolean },
): Promise<{ item: CatalogItem }> {
  return request(token, `/catalog/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function addCatalogVariant(token: string, itemId: string, input: NewVariantInput): Promise<{ item: CatalogItem }> {
  return request(token, `/catalog/items/${itemId}/variants`, { method: 'POST', body: JSON.stringify(input) });
}

export function setVariantStock(
  token: string,
  itemId: string,
  variantId: string,
  input: { delta?: number; set?: number },
): Promise<{ item: CatalogItem }> {
  return request(token, `/catalog/items/${itemId}/variants/${variantId}/stock`, { method: 'POST', body: JSON.stringify(input) });
}

export function depleteVariant(token: string, itemId: string, variantId: string): Promise<{ item: CatalogItem }> {
  return request(token, `/catalog/items/${itemId}/variants/${variantId}`, { method: 'DELETE' });
}

export function addCatalogImage(
  token: string,
  itemId: string,
  file: File,
): Promise<{ image: CatalogImage; visionReady: boolean; warning: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  return requestMultipart(token, `/catalog/items/${itemId}/images`, formData);
}

export function deleteCatalogImage(token: string, itemId: string, r2Key: string): Promise<{ deleted: boolean }> {
  return request(token, `/catalog/items/${itemId}/images/${encodeURIComponent(r2Key)}`, { method: 'DELETE' });
}

export function setPrimaryCatalogImage(token: string, itemId: string, r2Key: string): Promise<{ image: CatalogImage }> {
  return request(token, `/catalog/items/${itemId}/images/${encodeURIComponent(r2Key)}/primary`, { method: 'POST' });
}
