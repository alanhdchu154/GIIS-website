import fs from 'fs';
import path from 'path';
import { getRouteSeo, INDEXABLE_PATHS, normalizePathname } from './routeSeo';

describe('route-aware search metadata', () => {
  test('gives each public content page its own canonical URL', () => {
    expect(getRouteSeo('/academics')).toEqual({
      indexable: true,
      canonicalUrl: 'https://genesisideas.school/academics',
      robots: 'index, follow',
    });
    expect(getRouteSeo('/academics/').canonicalUrl).toBe(
      'https://genesisideas.school/academics'
    );
    expect(getRouteSeo('/').canonicalUrl).toBe('https://genesisideas.school/');
  });

  test('keeps private and unknown routes out of the index without inventing canonicals', () => {
    for (const route of ['/admin', '/learn/algebra-i', '/parent/dashboard', '/not-real']) {
      expect(getRouteSeo(route)).toEqual({
        indexable: false,
        canonicalUrl: null,
        robots: 'noindex, nofollow',
      });
    }
  });

  test('normalizes duplicate slashes and trailing slashes', () => {
    expect(normalizePathname('//pathways//math///')).toBe('/pathways/math');
  });

  test('sitemap and Netlify rewrites cover every canonical public path', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    const redirects = fs.readFileSync(path.join(publicDir, '_redirects'), 'utf8');

    for (const route of INDEXABLE_PATHS) {
      const canonical = `https://genesisideas.school${route}`;
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(redirects).toMatch(
        new RegExp(`^${escapedRoute}\\s+/index\\.html\\s+200$`, 'm')
      );
    }
    expect(redirects).not.toContain('/*    /index.html   200');
    expect(redirects).toMatch(/^\/\*\s+\/404\.html\s+404$/m);
  });

  test('every declared React route has an edge rewrite or redirect', () => {
    const appSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'App.js'),
      'utf8'
    );
    const redirects = fs.readFileSync(
      path.resolve(process.cwd(), 'public', '_redirects'),
      'utf8'
    );
    const declaredRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((route) => route !== '*');

    for (const route of declaredRoutes) {
      const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(redirects).toMatch(new RegExp(`^${escapedRoute}\\s+`, 'm'));
    }

    const handledRoutes = redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/))
      .filter(
        ([source, destination, status]) =>
          source !== '/api/*' &&
          source !== '/*' &&
          ((destination === '/index.html' && status === '200') || status === '301!')
      )
      .map(([source]) => source);

    expect(handledRoutes.sort()).toEqual(declaredRoutes.sort());
  });
});
