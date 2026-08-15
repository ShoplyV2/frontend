import type { FeedHandoff, FeedOrder } from './types';

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
