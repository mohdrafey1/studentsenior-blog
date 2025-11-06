import React, { Suspense } from 'react';
import Header from '@/app/components/header';
import '@/app/globals.css';
import { Poppins } from 'next/font/google';
import { TrendingUp } from 'lucide-react';
import PopularPosts from './components/popular-post';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { api } from '@/config/apiConfig';
import ClientAd from './components/Ads/AdsClient';
import BlogPostList from './components/blog-list';

const poppins = Poppins({ subsets: ['latin'], weight: '600', preload: true });

export const revalidate = 60;

async function getData(page: number, limit: number) {
    try {
        const [postsRes, popularRes] = await Promise.all([
            fetch(`${api.blog.paginateblog}?page=${page}&limit=${limit}`, {
                next: { revalidate: 60 },
            }),
            fetch(api.blog.popularBlogs, { next: { revalidate: 120 } }),
        ]);

        const postsData = await postsRes.json();
        const popularData = await popularRes.json();

        return {
            posts: postsData.data || [],
            total: postsData.metadata?.total || 0,
            popular: popularData.data || [],
        };
    } catch (error) {
        console.error('Error fetching SSR data:', error);
        return { posts: [], total: 0, popular: [] };
    }
}

export default async function HomePage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const currentPage = Number(searchParams.page) || 1;
    const postsPerPage = 10;

    const { posts, total, popular } = await getData(currentPage, postsPerPage);
    const totalPages = total ? Math.ceil(total / postsPerPage) : 1;

    const category = [
        'nodejs',
        'backend',
        'express',
        'technology',
        'NextJs',
        'React',
        'Earning',
        'Career',
        'web devlopment',
    ];

    return (
        <>
            <Suspense
                fallback={
                    <div className='w-full h-16 bg-gray-50 border-b border-gray-200 animate-pulse' />
                }
            >
                <Header />
            </Suspense>

            <div className='min-h-screen bg-gray-50 py-8 px-4 flex justify-center'>
                <div className='max-w-7xl w-full grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10'>
                    {/* Main Content */}
                    <main className='w-full'>
                        <section className='mb-12'>
                            <h2
                                className={`text-2xl font-semibold mb-4 pl-2 ${poppins.className}`}
                            >
                                Home
                            </h2>

                            <div className='space-y-6'>
                                <BlogPostList
                                    posts={posts}
                                    currentPage={currentPage}
                                />
                            </div>

                            {/* Pagination */}
                            <div className='mt-10 flex items-center justify-center gap-3'>
                                {/* Previous Button */}
                                <Link
                                    href={`?page=${currentPage - 1}`}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        currentPage > 1
                                            ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 shadow-sm'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                    }`}
                                >
                                    ← Previous
                                </Link>

                                {/* Page Indicator */}
                                <div className='px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 shadow-sm text-sm font-medium'>
                                    Page{' '}
                                    <span className='font-semibold'>
                                        {currentPage}
                                    </span>{' '}
                                    of{' '}
                                    <span className='font-semibold'>
                                        {totalPages}
                                    </span>
                                </div>

                                {/* Next Button */}
                                <Link
                                    href={`?page=${currentPage + 1}`}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        currentPage < totalPages
                                            ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 hover:from-indigo-200 hover:to-indigo-300 text-indigo-700 shadow-sm'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                    }`}
                                >
                                    Next →
                                </Link>
                            </div>

                            <ClientAd adSlot='4650270379' />
                        </section>
                    </main>

                    {/* Sidebar */}
                    <aside className='w-full space-y-8'>
                        {/* Categories */}
                        <section>
                            <h3
                                className={`${poppins.className} text-xl font-semibold mb-4`}
                            >
                                Stories from all interests
                            </h3>
                            <div className='flex flex-wrap gap-3 justify-center lg:justify-start'>
                                {category.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={`/blog/search?q=${encodeURIComponent(
                                            item
                                        )}`}
                                        className={`${poppins.className} bg-stone-100 text-gray-800 shadow-md px-4 py-2 rounded-full cursor-pointer capitalize hover:bg-stone-200 transition`}
                                    >
                                        {item}
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Popular Posts */}
                        <section>
                            <div className='flex items-center gap-2 mb-4'>
                                <TrendingUp className='text-gray-700' />
                                <h3
                                    className={`${poppins.className} text-xl font-semibold`}
                                >
                                    Popular
                                </h3>
                            </div>
                            <PopularPosts posts={popular} />
                            <ClientAd adSlot='4650270379' />
                        </section>
                    </aside>
                </div>
            </div>

            <Footer />
        </>
    );
}
