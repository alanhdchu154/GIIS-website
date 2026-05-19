import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls on client-side navigation (SPA).
 * - If URL has a `#hash`, scrolls to the matching element ID (with a small
 *   delay so lazy-loaded content has time to mount).
 * - Otherwise scrolls to the top.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait one frame, then a short delay, so the destination page can render.
      const tryScroll = (attempt = 0) => {
        const id = hash.startsWith('#') ? hash.slice(1) : hash;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempt < 8) {
          setTimeout(() => tryScroll(attempt + 1), 80);
        }
      };
      requestAnimationFrame(() => tryScroll());
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
