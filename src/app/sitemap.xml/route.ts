// app/sitemap.xml/route.ts

export async function GET() {
  const baseUrl = "https://blog.studentsenior.com";

  const posts = await fetch("http://localhost:3001/v1/sitemap").then((res) =>
    res.json()
  );

  const postUrls = posts.data
    .map((post: any) => {
      return `
    <url>
      <loc>${baseUrl}/blog/post/${post}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${postUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
