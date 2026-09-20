/**
 * Blog endpoints on studentsenior-api.
 *
 * These used to live on a separate service (studentsenior-backend2, on Lambda)
 * under a /v1 prefix. They are now part of the main API under /api/v2/blogs.
 *
 * NEXT_PUBLIC_API_URL must point at the API origin plus /api/v2.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v2';

export const api = {
    blog: {
        /** Published posts, newest first. Paginated: ?page=&limit= */
        list: `${API_BASE_URL}/blogs`,
        /** A single published post. */
        bySlug: (slug: string) => `${API_BASE_URL}/blogs/${slug}`,
        popular: `${API_BASE_URL}/blogs/popular`,
        latest: `${API_BASE_URL}/blogs/latest`,
        search: `${API_BASE_URL}/blogs/search`,
        sitemap: `${API_BASE_URL}/blogs/sitemap`,
        /** Records one read. The only thing that moves total_reads. */
        incrementView: (slug: string) => `${API_BASE_URL}/blogs/${slug}/view`,
    },
};
