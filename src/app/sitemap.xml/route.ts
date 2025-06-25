// app/sitemap.xml/route.ts
import { Slug } from '@/constant/interface';

export async function GET() {
    const baseUrl = 'https://blog.studentsenior.com';

    const posts = await fetch(
        'https://stagingblogapi.studentsenior.com/v1/sitemap'
    )
        .then((res) => res.json())
        .catch(() => ({ data: [] })); // fallback

    const postUrls = (posts?.data || [])
        .map(
            (post: Slug) => `
  <url>
    <loc>${baseUrl}/blog/post/${post}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
        )
        .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${postUrls}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
