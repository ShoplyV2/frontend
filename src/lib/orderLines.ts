import type { FeedOrder, FeedOrderLine } from './types';

/**
 * An order is one checkout and can hold several items. These words it for the places that show an
 * order as a single row or heading, so every screen describes the same order the same way.
 */
type WithLines = Pick<FeedOrder, 'lines'>;

/** "Black Heeled Sandal" for one item, "Black Heeled Sandal + 2 more" for several. */
export function orderTitle(order: WithLines): string {
  const [first, ...others] = order.lines;
  if (!first) return 'Order';
  return others.length === 0 ? first.item.nameSnapshot : `${first.item.nameSnapshot} + ${others.length} more`;
}

/** "Black, 39 × 1" for one item, "3 items" for several. */
export function orderSummary(order: WithLines): string {
  const [first, ...others] = order.lines;
  if (!first) return '';
  return others.length === 0 ? lineSummary(first) : `${order.lines.length} items`;
}

export function lineSummary(line: FeedOrderLine): string {
  return `${line.variant.color}, ${line.variant.size} × ${line.qty}`;
}

/** The first item's photo, or the first photo any item has. */
export function orderPhoto(order: WithLines): string | null {
  return order.lines.find((l) => l.item.imageUrlSnapshot)?.item.imageUrlSnapshot ?? null;
}

/** Every item name, color and size in the order, for search. */
export function orderSearchTerms(order: WithLines): string[] {
  return order.lines.flatMap((l) => [l.item.nameSnapshot, l.variant.color, l.variant.size]);
}
