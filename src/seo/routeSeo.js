export const SITE_ORIGIN = 'https://genesisideas.school';

// Public pages with standalone content that should be eligible for search.
export const INDEXABLE_PATHS = [
  '/',
  '/discovery',
  '/academics',
  '/lessons',
  '/admission',
  '/support',
  '/transcript',
  '/calendar',
  '/pathways',
  '/pathways/psychology',
  '/pathways/cs',
  '/pathways/business',
  '/pathways/economics',
  '/pathways/engineering',
  '/pathways/math',
  '/pathways/communications',
  '/pathways/arts',
  '/school-profile',
  '/about',
  '/handbook',
  '/pricing',
  '/transfer-students',
  '/trust-center',
  '/consultation',
  '/graduates',
  '/assessment-proof',
  '/refund-policy',
  '/parent/demo',
  '/apply',
  '/privacy',
  '/terms',
];

const INDEXABLE_SET = new Set(INDEXABLE_PATHS);

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.split('/').filter(Boolean).join('/')}`;
}

export function getRouteSeo(pathname) {
  const normalizedPath = normalizePathname(pathname);
  const indexable = INDEXABLE_SET.has(normalizedPath);

  return {
    indexable,
    canonicalUrl: indexable
      ? `${SITE_ORIGIN}${normalizedPath === '/' ? '/' : normalizedPath}`
      : null,
    robots: indexable ? 'index, follow' : 'noindex, nofollow',
  };
}
