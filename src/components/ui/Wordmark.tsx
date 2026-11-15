import Link from 'next/link';

/**
 * The shoply wordmark: a lowercase name with a small accent dot. Set in Outfit via the
 * `--font-wordmark` variable (see app/layout.tsx); the styles live in components.css.
 * With an `href` it is a link (the shell uses it to go home); without one it is plain text.
 */
export function Wordmark({ size = 'md', href }: { size?: 'sm' | 'md' | 'lg'; href?: string }) {
  const inner = (
    <>
      <span className="wordmark-dot" aria-hidden="true" />
      shoply
    </>
  );
  const className = `wordmark wordmark--${size}`;
  if (href) {
    return (
      <Link href={href} className={className} aria-label="shoply home">
        {inner}
      </Link>
    );
  }
  return <span className={className}>{inner}</span>;
}
