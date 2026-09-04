// Small time-formatting helpers — no date library, per the redesign's no-new-dependency rule.

export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((now - then) / 1000));

  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 2) return `Yesterday ${clockTime(iso)}`;
  return `${dayLabel(iso)}, ${clockTime(iso)}`;
}

export function timeLeft(iso: string, now: number = Date.now()): { text: string; urgent: boolean; expired: boolean } {
  const then = new Date(iso).getTime();
  const seconds = Math.round((then - now) / 1000);

  if (seconds <= 0) return { text: "Time's up", urgent: true, expired: true };
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return { text: 'under a minute left', urgent: true, expired: false };
  const urgent = minutes < 5;
  return { text: `${minutes} min left`, urgent, expired: false };
}

export function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

export function dayLabel(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const today = new Date(now);
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short' }).format(date);
}
