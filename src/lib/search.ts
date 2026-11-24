import { orderSearchTerms, orderTitle } from './orderLines';
import { formatMoney } from './format';
import { ORDER_STATUS, type Tone } from './labels';
import type { CatalogItem, FeedOrder } from './types';

export interface SearchHit {
  id: string;
  kind: 'order' | 'item';
  title: string;
  subtitle: string;
  badge: { label: string; tone: Tone } | null;
  href: string;
}

const MAX_PER_GROUP = 6;

function matches(haystack: string, terms: string[]): boolean {
  const text = haystack.toLowerCase();
  return terms.every((term) => text.includes(term));
}

/**
 * Searches what the app already holds: the seller's recent orders and their catalog. Every
 * whitespace-separated word has to appear somewhere in the order or item ("efua bag" finds a bag
 * Efua ordered), case-insensitively. Orders come first, newest first, then items; each group is
 * capped so the popover stays short. An empty query finds nothing.
 */
export function searchShop(query: string, orders: FeedOrder[], items: CatalogItem[]): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const orderHits: SearchHit[] = orders
    .filter((o) => o.status !== 'DRAFT')
    .filter((o) =>
      matches(
        [...orderSearchTerms(o), o.delivery.name, o.delivery.area, o.delivery.address, o.delivery.phone, o.buyer.name, o.buyer.phone]
          .filter(Boolean)
          .join(' '),
        terms,
      ),
    )
    .slice(0, MAX_PER_GROUP)
    .map((o) => ({
      id: o._id,
      kind: 'order' as const,
      title: orderTitle(o),
      subtitle: [o.delivery.name || o.buyer.name || 'Buyer', o.delivery.area].filter(Boolean).join(' · '),
      badge: { label: ORDER_STATUS[o.status].label, tone: ORDER_STATUS[o.status].tone },
      href: `/orders?order=${o._id}`,
    }));

  const itemHits: SearchHit[] = items
    .filter((i) => matches([i.name, i.description, ...i.variants.flatMap((v) => [v.color, v.size])].join(' '), terms))
    .slice(0, MAX_PER_GROUP)
    .map((i) => ({
      id: i.id,
      kind: 'item' as const,
      title: i.name,
      subtitle: formatMoney(i.basePrice, i.currency),
      badge: i.available ? null : { label: 'Hidden', tone: 'muted' as const },
      href: `/catalog/${i.id}`,
    }));

  return [...orderHits, ...itemHits];
}
