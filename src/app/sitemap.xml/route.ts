import { Slug } from '@/constant/interface';

export const dynamic = 'force-dynamic'; // ensures it runs every time
export const revalidate = 0; // disable ISR caching (optional but good practice)

export async function GET() {
    const baseUrl = 'https://blog.studentsenior.com';

    try {
        const res = await fetch(
            'https://blogapi.studentsenior.com/v1/sitemap',
            {
                cache: 'no-store', // 🔥 ensures fetch is not cached
            }
        );

        const posts = await res.json();

        const postUrls = (posts?.data || [])
            .map(
                (post: Slug) => `
      <url>
        <loc>${baseUrl}/${post}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`
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
                'Cache-Control': 'no-store, no-cache, must-revalidate', // prevent browser/proxy cache
            },
        });
    } catch (error) {
        console.error('Sitemap generation failed:', error);

        return new Response(
            '<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>',
            {
                headers: {
                    'Content-Type': 'application/xml',
                },
                status: 500,
            }
        );
    }
}
