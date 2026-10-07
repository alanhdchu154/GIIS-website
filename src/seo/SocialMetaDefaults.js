import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SEO_DEFAULTS } from '../i18n/siteStrings';
import { getRouteSeo } from './routeSeo';

/** Route-aware search and social defaults (pages can override copy in their own Helmet). */
export default function SocialMetaDefaults() {
  const { pathname } = useLocation();
  const { canonicalUrl, robots } = getRouteSeo(pathname);

  return (
    <Helmet>
      <meta name="robots" content={robots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:url" content={canonicalUrl || SEO_DEFAULTS.siteUrl} />
      <meta property="og:image" content={SEO_DEFAULTS.ogImage} />
      <meta name="twitter:card" content={SEO_DEFAULTS.twitterCard} />
      <meta name="twitter:image" content={SEO_DEFAULTS.ogImage} />
    </Helmet>
  );
}
