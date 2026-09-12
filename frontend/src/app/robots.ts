import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fzauth.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/docs', '/about', '/contact', '/appeal'],
        disallow: [
          '/dashboard',
          '/admin',
          '/api',
          '/account',
          '/shop',
          '/earn',
          '/team',
          '/users',
          '/licenses',
          '/webhooks',
          '/files',
          '/logs',
          '/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
