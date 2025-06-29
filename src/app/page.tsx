'use client';

import React, { useEffect, useState, Suspense } from 'react';
import BlogPostCard from '@/app/components/blog-post-card';
import Header from '@/app/components/header';
import '@/app/globals.css';
import { Poppins } from 'next/font/google';
import { TrendingUp } from 'lucide-react';
import PopularPosts from './components/popular-post';
import AdSenseAd from './components/Ads/AdSenseAd';
import Footer from './components/Footer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BlogPost } from '@/constant/interface';
import { api } from '@/config/apiConfig';

const poppins = Poppins({ subsets: ['latin'], weight: '600', preload: true });

function MainContent() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [popularPost, setPopularPost] = useState<BlogPost[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const postsPerPage = 10;

    const router = useRouter();

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

    const fetchPaginatedPosts = async () => {
        try {
            const res = await fetch(
                `${api.blog.paginateblog}?page=${currentPage}&limit=${postsPerPage}`
            );
            const data = await res.json();
            setPosts(data.data);
            setTotalPages(Math.ceil(data.metadata.total / postsPerPage));
        } catch (error) {
            console.error('Error fetching paginated posts:', error);
        }
    };

    const fetchPopular = async () => {
        try {
            const res = await fetch(api.blog.popularBlogs);
            const data = await res.json();
            setPopularPost(data.data);
        } catch (error) {
            console.error('Error fetching popular posts:', error);
        }
    };

    useEffect(() => {
        fetchPopular();
    }, []);

    useEffect(() => {
        fetchPaginatedPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const handleShare = (post: BlogPost) => {
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handlePostClick = (slug: string) => {
        router.push(`/blog/post/${slug}`);
    };

    return (
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
                            {posts.map((post) => (
                                <BlogPostCard
                                    key={post._id}
                                    // @ts-expect-error fix type later
                                    post={post}
                                    onShare={() => handleShare(post)}
                                    onClick={() => handlePostClick(post.slug)}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className='mt-8 flex justify-center items-center gap-4'>
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                                className='px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50'
                            >
                                Previous
                            </button>
                            <span className='text-gray-700'>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className='px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50'
                            >
                                Next
                            </button>
                        </div>

                        <AdSenseAd adSlot='4650270379' />
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
                        <PopularPosts posts={popularPost} />
                        <AdSenseAd adSlot='4650270379' />
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <>
            <Suspense
                fallback={
                    <div className='w-full h-16 bg-gray-50 border-b border-gray-200 animate-pulse' />
                }
            >
                <Header />
            </Suspense>
            <Suspense
                fallback={
                    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
                    </div>
                }
            >
                <MainContent />
            </Suspense>
            <Footer />
        </>
    );
}
