'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Lightweight client-side Prism integration.
 *
 * Requirements:
 * - Ensure `prismjs` is installed: `npm install prismjs`
 * - We import the theme CSS globally in `app/globals.css`.
 * - This component re-runs Prism highlighting on route changes.
 */
export default function PrismHighlighter() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const Prism = (await import('prismjs')).default;
        await Promise.all([
          import('prismjs/components/prism-sql'),
          import('prismjs/components/prism-json'),
        ]);
        if (!cancelled) {
          Prism.highlightAll();
        }
      } catch (err) {
        // If Prism isn't available, fail silently so the page still works.
        // eslint-disable-next-line no-console
        console.error('Prism highlighting failed:', err);
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}


