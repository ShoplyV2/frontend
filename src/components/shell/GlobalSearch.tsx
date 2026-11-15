'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCatalogItems } from '@/lib/apiClient';
import { searchShop } from '@/lib/search';
import type { CatalogItem } from '@/lib/types';
import { useShop } from './ShopProvider';

/**
 * The top-bar search box. Searches the orders the shell already holds plus the catalog, which is
 * fetched the first time the box is focused. Press / or ⌘K to jump to it, arrows + Enter to pick,
 * Escape to close. On phones the box sits behind a search button (see `.search` in layout.css).
 */
export function GlobalSearch() {
  const router = useRouter();
  const { token, orders } = useShop();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false); // popover
  const [expanded, setExpanded] = useState(false); // phone: box shown
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const itemsLoaded = useRef(false);

  const hits = useMemo(() => searchShop(query, orders, items), [query, orders, items]);

  function loadItems() {
    if (itemsLoaded.current) return;
    itemsLoaded.current = true;
    listCatalogItems(token)
      .then((res) => setItems(res.items))
      .catch(() => {
        itemsLoaded.current = false; // try again on the next focus
      });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));
      const isShortcut = (event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing);
      if (!isShortcut) return;
      event.preventDefault();
      setExpanded(true);
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function close() {
    setOpen(false);
    setExpanded(false);
  }

  function choose(index: number) {
    const hit = hits[index];
    if (!hit) return;
    close();
    setQuery('');
    router.push(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape') {
      close();
      inputRef.current?.blur();
    }
  }

  const showPopover = open && query.trim().length > 0;
  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <div className={`search${expanded ? ' search--expanded' : ''}`}>
      <button
        type="button"
        className="btn btn--ghost btn--icon search-toggle"
        aria-label="Search"
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      </button>

      <div className="search-box">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          className="input search-input"
          type="search"
          role="combobox"
          aria-expanded={showPopover}
          aria-controls={listId}
          aria-activedescendant={showPopover && hits.length > 0 ? optionId(active) : undefined}
          aria-label="Search orders and items"
          placeholder="Search orders and items"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            loadItems();
            setOpen(true);
          }}
          onBlur={() => {
            // Let a click on a result land first.
            setTimeout(close, 120);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className="search-kbd" aria-hidden="true">
          ⌘K
        </kbd>

        {showPopover && (
          <ul id={listId} role="listbox" className="search-results">
            {hits.length === 0 && <li className="search-empty">Nothing matches &ldquo;{query.trim()}&rdquo;.</li>}
            {hits.map((hit, i) => (
              <li
                key={`${hit.kind}-${hit.id}`}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className="search-result"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(i);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="search-result-kind">{hit.kind === 'order' ? 'Order' : 'Item'}</span>
                <span className="search-result-text">
                  <span className="truncate search-result-title">{hit.title}</span>
                  <span className="truncate text-xs text-muted">{hit.subtitle}</span>
                </span>
                {hit.badge && <span className={`badge badge--${hit.badge.tone}`}>{hit.badge.label}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
