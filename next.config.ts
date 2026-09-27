import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async headers() {
        return [{ source: '/sw.js', headers: [
            { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
            { key: 'Service-Worker-Allowed', value: '/' },
            { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ] }];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'example.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'studentsenior.in',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/blog/post/:slug',
                destination: '/:slug',
                permanent: true,
            },
            {
                source: '/blog/search',
                destination: '/search',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
