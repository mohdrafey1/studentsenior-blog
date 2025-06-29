export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export const api = {
    blog: {
        allBlogs: `${API_BASE_URL}/blogs`,
        popularBlogs: `${API_BASE_URL}/blogsPopular`,
        paginateblog: `${API_BASE_URL}/blogsPage`,
    },
};
