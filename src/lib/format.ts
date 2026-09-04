export function formatMoney(minor: number, currency = 'GHS'): string {
  const major = minor / 100;
  const formatted = major.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${formatted}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// A link the seller taps — never a prefetched embed or auto-loaded map tile. The buyer's address
// shouldn't leave the device unless the seller acts.
export function mapsHref(area: string, address: string): string {
  const query = encodeURIComponent(`${address}, ${area}, Accra, Ghana`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
