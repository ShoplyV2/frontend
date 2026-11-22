import type { AdminSellerSummary, Bank, CatalogImage, CatalogItem, ChannelSummary, FeedHandoff, FeedOrder, NewVariantInput, OnboardingState, SellerProfile, SellerStatus, TranscriptMessage, UsageSummary } from './types';

export const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const SESSION_EXPIRED_EVENT = 'shoply:session-expired';

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
    // A 401 on a seller route means the session is no longer valid (password changed elsewhere,
    // account closed). Tell useFeedToken so every page drops back to the login screen instead of
    // sitting on an error. Admin calls are excluded: they carry a different kind of token and
    // handle their own 401 (see app/admin/page.tsx). Wrong-password errors are 400s, not 401s.
    if (response.status === 401 && !path.startsWith('/admin') && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw await parseError(response);
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

export function getOrders(token: string, status?: string, limit?: number): Promise<{ orders: FeedOrder[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));
  const query = params.size > 0 ? `?${params.toString()}` : '';
  return request(token, `/feed/orders${query}`);
}

export function getConversationMessages(token: string, conversationId: string): Promise<{ messages: TranscriptMessage[] }> {
  return request(token, `/feed/conversations/${encodeURIComponent(conversationId)}/messages`);
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

// --- Accounts ------------------------------------------------------------
// signup and login are the only calls a seller makes with no session yet; both hand back the
// feedToken that is the session from then on.

export interface AuthResult {
  feedToken: string;
  seller: { id: string; shopName: string; status: SellerStatus };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

export function signupSeller(input: { email: string; password: string; shopName: string }): Promise<AuthResult> {
  return postJson('/auth/signup', input);
}

export function loginSeller(input: { email: string; password: string }): Promise<AuthResult> {
  return postJson('/auth/login', input);
}

// --- Onboarding ---------------------------------------------------------

// --- Admin (the Shoply team's side — separate account type, see backend/src/routes/admin.route.ts) ---

async function parseError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
  return new ApiError(body?.error ?? 'UNKNOWN', body?.message ?? `Request failed (${response.status})`, response.status);
}

export async function adminLogin(email: string, password: string): Promise<{ sessionToken: string; email: string }> {
  const response = await fetch(`${DEFAULT_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

// The team connects a seller's WhatsApp number on their behalf; the result carries the link the
// seller opens on their own phone to start receiving alerts there.
export function connectSellerWhatsApp(
  adminToken: string,
  sellerId: string,
  input: { phoneNumberId: string; wabaId: string; accessToken: string },
): Promise<{ routingId: string; displayName: string | null; ownerBindingUrl: string | null }> {
  return request(adminToken, `/admin/sellers/${encodeURIComponent(sellerId)}/channels/whatsapp`, { method: 'POST', body: JSON.stringify(input) });
}

export function listAdminSellers(adminToken: string): Promise<{ sellers: AdminSellerSummary[] }> {
  return request(adminToken, '/admin/sellers');
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
  patch: { shopName?: string; shopDescription?: string; email?: string },
): Promise<{ id: string; shopName: string; email: string | null; shopDescription: string }> {
  return request(token, '/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

// Both return a session token to keep using: changing the password signs every other device out.
export function changePassword(token: string, input: { currentPassword: string; newPassword: string }): Promise<{ feedToken: string }> {
  return request(token, '/me/password', { method: 'POST', body: JSON.stringify(input) });
}

export function deleteAccount(token: string, password: string): Promise<{ deleted: boolean }> {
  return request(token, '/me', { method: 'DELETE', body: JSON.stringify({ password }) });
}

export function listChannels(token: string): Promise<{ channels: ChannelSummary[] }> {
  return request(token, '/me/channels');
}

export function connectTelegramChannel(token: string, botToken: string): Promise<{ channel: ChannelSummary }> {
  return request(token, '/me/channels/telegram', { method: 'POST', body: JSON.stringify({ botToken }) });
}

// Asks the Shoply team to connect the seller's WhatsApp number (team-assisted for now).
export function requestWhatsAppConnection(token: string): Promise<{ whatsappRequestedAt: string }> {
  return request(token, '/me/channels/whatsapp/request', { method: 'POST' });
}

// Sends a message to the seller's own chat on that channel, so they can see alerts will reach them.
export function sendTestAlert(token: string, routingId: string): Promise<{ sent: boolean }> {
  return request(token, `/me/channels/${encodeURIComponent(routingId)}/test`, { method: 'POST' });
}

export function refreshOwnerBinding(token: string, routingId: string): Promise<{ channel: ChannelSummary }> {
  return request(token, `/me/channels/${encodeURIComponent(routingId)}/owner-binding`, { method: 'POST' });
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

// Notifications (web push). The browser needs `publicKey` to subscribe; `enabled` is false when the
// server has no push keys configured, in which case alerts only arrive as chat messages.
export interface PushStatus {
  enabled: boolean;
  publicKey: string | null;
  subscriptions: number;
}

export function getPushStatus(token: string): Promise<PushStatus> {
  return request(token, '/me/push');
}

export function savePushSubscription(token: string, subscription: PushSubscriptionJSON): Promise<{ subscribed: boolean }> {
  return request(token, '/me/push-subscriptions', {
    method: 'POST',
    body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }),
  });
}

export function removePushSubscription(token: string, endpoint: string): Promise<{ unsubscribed: boolean }> {
  return request(token, '/me/push-subscriptions/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) });
}

export function sendTestPush(token: string): Promise<{ delivered: number }> {
  return request(token, '/me/push-subscriptions/test', { method: 'POST' });
}

// This month's orders and buyer chats against the shop's plan. Shown to the seller; nothing is billed from it.
export function getUsage(token: string): Promise<UsageSummary> {
  return request(token, '/me/usage');
}
